package com.eatme.eatmeserver.business.service;

import com.eatme.eatmeserver.ErrCode;
import com.eatme.eatmeserver.business.entity.Battle;
import com.eatme.eatmeserver.business.entity.Player;
import com.eatme.eatmeserver.business.entity.PlayerState;
import com.eatme.eatmeserver.business.repository.BattleRepository;
import com.eatme.eatmeserver.business.repository.PlayerRepository;
import com.eatme.eatmeserver.business.repository.WaitingQueueRepository;
import com.eatme.eatmeserver.util.RedisTransaction;
import com.eatme.eatmeserver.util.WebSocketMessenger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.lang.Nullable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.UUID;

@SuppressWarnings("unused")
@Service
public class BattleService {

    private static final Logger LOG = LoggerFactory.getLogger(BattleService.class);

    @Autowired
    private PlayerRepository playerRepo;

    @Autowired
    private WaitingQueueRepository waitingQueueRepo;

    @Autowired
    private BattleRepository battleRepo;

    @Autowired
    private WebSocketMessenger messenger;

    @Autowired
    private RedisTransaction redisTransaction;

    public int ready(String playerId, String battleId) {
        try {
            Player player = playerRepo.findById(playerId);
            if (player.getState() != PlayerState.NOT_READY) {
                return ErrCode.ERR_INVALID_STATE;
            }

            Battle battle = battleRepo.findById(battleId);
            if (battle == null) {
                return ErrCode.ERR_INVALID_BATTLE;
            }

            String opponentId = getOpponentId(playerId, battle);
            if (opponentId == null) {
                return ErrCode.ERR_INVALID_BATTLE;
            }

            player.setState(PlayerState.READY);
            playerRepo.createOrUpdate(player);

            Player opponent = playerRepo.findById(opponentId);
            if (opponent.getState() == PlayerState.READY) {  // Both ready
                redisTransaction.execute(new RedisTransaction.Callback() {
                    @Override
                    public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                        player.setState(PlayerState.DEFENDING);
                        playerRepo.createOrUpdate(player);
                        opponent.setState(PlayerState.ATTACKING);
                        playerRepo.createOrUpdate(opponent);
                    }
                });
                // Broadcast
                messenger.send(playerId, PlayerState.DEFENDING,
                    WebSocketMessenger.MsgType.START, String.valueOf(battle.getRandSeed()));
                messenger.send(opponentId, PlayerState.ATTACKING,
                    WebSocketMessenger.MsgType.START, String.valueOf(battle.getRandSeed()));
            }
            return 0;
        } catch (Exception e) {
            LOG.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

    public int quitBattle(String playerId, String battleId) {
        try {
            Player player = playerRepo.findById(playerId);
            if (player.getState() == PlayerState.OFFLINE
                || player.getState() == PlayerState.WAITING) {
                return ErrCode.ERR_INVALID_STATE;
            }

            Battle battle = battleRepo.findById(battleId);
            if (battle == null) {
                return ErrCode.ERR_INVALID_BATTLE;
            }

            String opponentId = getOpponentId(playerId, battle);
            if (opponentId == null) {
                return ErrCode.ERR_INVALID_BATTLE;
            }

            player.setState(PlayerState.OFFLINE);
            playerRepo.createOrUpdate(player);

            Player opponent = playerRepo.findById(opponentId);
            if (opponent.getState() == PlayerState.OFFLINE) {  // Both offline
                // Delete battle and players
                redisTransaction.execute(new RedisTransaction.Callback() {
                    @Override
                    public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                        battleRepo.delById(battleId);
                        playerRepo.delById(playerId);
                        playerRepo.delById(opponentId);
                    }
                });
            } else {
                // Notify opponent quit
                messenger.sendErr(opponentId, ErrCode.ERR_OPPONENT_QUIT, opponent.getState());
            }
            return 0;
        } catch (Exception e) {
            LOG.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

    private @Nullable String getOpponentId(String playerId, Battle battle) {
        String player1Id = battle.getPlayer1Id();
        String player2Id = battle.getPlayer2Id();
        boolean isPlayer1 = playerId.equals(player1Id);
        boolean isPlayer2 = playerId.equals(player2Id);
        if (!isPlayer1 && !isPlayer2) {
            return null;
        }
        return isPlayer1 ? player2Id : player1Id;
    }

    @Scheduled(fixedRateString = "${eatme.waiting-queue.schedule-freq}")
    private void scheduleBattle() {
        if (waitingQueueRepo.size() < 2) {
            return;  // Not enough players
        }
        try {
            Player player1 = playerRepo.findById(waitingQueueRepo.pop());
            Player player2 = playerRepo.findById(waitingQueueRepo.pop());
            if (player1.getState() == PlayerState.WAITING
                && player2.getState() == PlayerState.WAITING) {
                createBattle(player1, player2);
            } else if (player1.getState() == PlayerState.WAITING) {
                waitingQueueRepo.push(player1.getId());
            } else if (player2.getState() == PlayerState.WAITING) {
                waitingQueueRepo.push(player2.getId());
            }
        } catch (Exception e) {
            LOG.error(e.toString(), e);
        }
    }

    private void createBattle(Player player1, Player player2) {
        String battleId = UUID.randomUUID().toString().replaceAll("-", "");
        redisTransaction.execute(new RedisTransaction.Callback() {
            @Override
            public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                battleRepo.createOrUpdate(new Battle(battleId, player1.getId(), player2.getId()));
                player1.setState(PlayerState.NOT_READY);
                playerRepo.createOrUpdate(player1);
                player2.setState(PlayerState.NOT_READY);
                playerRepo.createOrUpdate(player2);
            }
        });
        // Broadcast
        messenger.send(player1.getId(), PlayerState.NOT_READY, WebSocketMessenger.MsgType.BID, battleId);
        messenger.send(player2.getId(), PlayerState.NOT_READY, WebSocketMessenger.MsgType.BID, battleId);
        LOG.info("Create battle " + battleId);
    }

}
