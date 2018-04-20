package com.eatme.eatmeserver.business.service.impl;

import com.eatme.eatmeserver.ErrCode;
import com.eatme.eatmeserver.business.entity.Battle;
import com.eatme.eatmeserver.business.entity.Player;
import com.eatme.eatmeserver.business.entity.PlayerAction;
import com.eatme.eatmeserver.business.entity.PlayerState;
import com.eatme.eatmeserver.business.repository.BattleRepository;
import com.eatme.eatmeserver.business.repository.PlayerRepository;
import com.eatme.eatmeserver.business.repository.WaitingQueueRepository;
import com.eatme.eatmeserver.business.service.BattleService;
import com.eatme.eatmeserver.business.service.PlayerService;
import com.eatme.eatmeserver.config.EatMeProperty;
import com.eatme.eatmeserver.component.RedisTransaction;
import com.eatme.eatmeserver.component.WebSocketMessenger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;

@SuppressWarnings("unused")
@Service
public class PlayerServiceImpl implements PlayerService {

    private static final Logger log = LoggerFactory.getLogger(PlayerServiceImpl.class);

    @Value("${server.address}")
    private String serverIp;

    @Value("${server.port}")
    private int serverPort;

    @Autowired
    private EatMeProperty eatMeProp;

    @Autowired
    private WebSocketMessenger messenger;

    @Autowired
    private RedisTransaction redisTransaction;

    @Autowired
    private PlayerRepository playerRepo;

    @Autowired
    private WaitingQueueRepository waitingQueueRepo;

    @Autowired
    private BattleRepository battleRepo;

    @Autowired
    private BattleService battleService;

    @Override
    public int wait(String playerId) {
        final String LOG_HEADER = "wait() | playerId=" + playerId;
        try {
            Player player = playerRepo.findById(playerId);
            log.info(LOG_HEADER + " | found player: " + player.toString());
            if (player.getState() != PlayerState.OFFLINE) {
                return ErrCode.ERR_INVALID_STATE;
            }

            long cnt = battleRepo.count();
            long capacity = eatMeProp.getBattle().getCapacity();
            log.info(LOG_HEADER + " | battle_count=" + cnt + " | battle_capacity=" + capacity);
            if (cnt >= capacity) {
                return ErrCode.ERR_BATTLE_FULL;
            }

            // Add to waiting queue
            redisTransaction.exec(new RedisTransaction.Callback() {
                @Override
                public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                    player.setState(PlayerState.WAITING);
                    player.setServerIp(serverIp);
                    player.setServerPort(serverPort);
                    playerRepo.createOrUpdate(player);
                    waitingQueueRepo.push(player.getId());
                }
            });
            return 0;
        } catch (Exception e) {
            log.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

    @Override
    public int quitWait(String playerId) {
        final String LOG_HEADER = "quitWait() | playerId=" + playerId;
        try {
            Player player = playerRepo.findById(playerId);
            log.info(LOG_HEADER + " | found player: " + player.toString());
            if (player.getState() != PlayerState.WAITING) {
                return ErrCode.ERR_INVALID_STATE;
            }

            redisTransaction.exec(new RedisTransaction.Callback() {
                @Override
                public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                    playerRepo.delById(playerId);
                    waitingQueueRepo.del(playerId);
                }
            });
            return 0;
        } catch (Exception e) {
            log.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

    @Override
    public int ready(String playerId, String battleId) {
        final String LOG_HEADER = "ready() | playerId=" + playerId + " | battleId=" + battleId;
        try {
            Player player = playerRepo.findById(playerId);
            log.info(LOG_HEADER + " | found player: " + player.toString());
            if (player.getState() != PlayerState.NOT_READY) {
                return ErrCode.ERR_INVALID_STATE;
            }

            Battle battle = battleRepo.findById(battleId);
            log.info(LOG_HEADER + " | found battle: " + (battle == null ? null : battle.toString()));
            if (battle == null) {
                return ErrCode.ERR_INVALID_BATTLE;
            }

            String opponentId = getOpponentId(playerId, battle);
            log.info(LOG_HEADER + " | found opponent id: " + opponentId);
            if (opponentId == null) {
                return ErrCode.ERR_INVALID_BATTLE;
            }

            List<Object> results = redisTransaction.exec(new RedisTransaction.Callback() {
                @Override
                public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                    player.setState(PlayerState.READY);
                    player.setAction(PlayerAction.NO_ACTION);
                    playerRepo.createOrUpdate(player);
                    playerRepo.findRawById(opponentId);
                }
            });
            Player opponent = new Player(opponentId, (List<String>) results.get(0));
            log.info(LOG_HEADER + " | found opponent: " + opponent.toString());

            // Check both ready
            if (opponent.getState() == PlayerState.READY) {
                log.info(LOG_HEADER + " | both ready");
                redisTransaction.exec(new RedisTransaction.Callback() {
                    @Override
                    public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                        player.setState(PlayerState.DEFENDING);
                        playerRepo.createOrUpdate(player);
                        opponent.setState(PlayerState.ATTACKING);
                        playerRepo.createOrUpdate(opponent);
                    }
                });
                // Broadcast (data: seed|attack?)
                long seed = battle.getRandSeed();
                messenger.send(player, WebSocketMessenger.MsgType.START, seed, 0);
                messenger.send(opponent, WebSocketMessenger.MsgType.START, seed, 1);
                battleService.startActionBroadcast(battleId, battle.getPlayer1Id(), battle.getPlayer2Id());
            }
            return 0;
        } catch (Exception e) {
            log.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

    @Override
    public int action(String playerId, String battleId, PlayerAction action) {
        final String LOG_HEADER = "action() | playerId=" + playerId
            + " | battleId=" + battleId + " | action=" + action.ordinal();
        try {
            Player player = playerRepo.findById(playerId);
            log.info(LOG_HEADER + " | found player: " + player.toString());
            if (player.getState() != PlayerState.ATTACKING
                && player.getState() != PlayerState.DEFENDING) {
                return ErrCode.ERR_INVALID_STATE;
            }

            Battle battle = battleRepo.findById(battleId);
            log.info(LOG_HEADER + " | found battle: " + (battle == null ? null : battle.toString()));
            if (battle == null) {
                return ErrCode.ERR_INVALID_BATTLE;
            }

            String opponentId = getOpponentId(playerId, battle);
            log.info(LOG_HEADER + " | found opponent id: " + opponentId);
            if (opponentId == null) {
                return ErrCode.ERR_INVALID_BATTLE;
            }

            player.setAction(action);
            playerRepo.createOrUpdate(player);
            return 0;
        } catch (Exception e) {
            log.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

    @Override
    public int done(String playerId, String battleId) {
        final String LOG_HEADER = "done() | playerId=" + playerId + " | battleId=" + battleId;
        try {
            Player player = playerRepo.findById(playerId);
            log.info(LOG_HEADER + " | found player: " + player.toString());
            if (!player.isPlaying()) {
                return ErrCode.ERR_INVALID_STATE;
            }

            Battle battle = battleRepo.findById(battleId);
            log.info(LOG_HEADER + " | found battle: " + (battle == null ? null : battle.toString()));
            if (battle == null) {
                return ErrCode.ERR_INVALID_BATTLE;
            }

            String opponentId = getOpponentId(playerId, battle);
            log.info(LOG_HEADER + " | found opponent id: " + opponentId);
            if (opponentId == null) {
                return ErrCode.ERR_INVALID_BATTLE;
            }

            battleService.stopActionBroadcast(battleId);

            List<Object> results = redisTransaction.exec(new RedisTransaction.Callback() {
                @Override
                public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                    player.setState(PlayerState.NOT_READY);
                    player.setAction(PlayerAction.NO_ACTION);
                    playerRepo.createOrUpdate(player);
                    playerRepo.findRawById(opponentId);
                }
            });
            Player opponent = new Player(opponentId, (List<String>) results.get(0));
            log.info(LOG_HEADER + " | found opponent: " + opponent.toString());

            // Check both done
            if (!opponent.isPlaying()) {
                log.info(LOG_HEADER + " | both done");
                // Reset battle
                battle.resetSeed();
                battleRepo.createOrUpdate(battle);
            }
            return 0;
        } catch (Exception e) {
            log.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

    @Override
    public int quitBattle(String playerId, String battleId) {
        final String LOG_HEADER = "quitBattle() | playerId=" + playerId + " | battleId=" + battleId;
        try {
            Player player = playerRepo.findById(playerId);
            log.info(LOG_HEADER + " | found player: " + player.toString());
            if (player.getState() == PlayerState.OFFLINE
                || player.getState() == PlayerState.WAITING) {
                return ErrCode.ERR_INVALID_STATE;
            }

            Battle battle = battleRepo.findById(battleId);
            log.info(LOG_HEADER + " | found battle: " + (battle == null ? null : battle.toString()));
            if (battle == null) {
                return ErrCode.ERR_INVALID_BATTLE;
            }

            String opponentId = getOpponentId(playerId, battle);
            log.info(LOG_HEADER + " | found opponent id: " + opponentId);
            if (opponentId == null) {
                return ErrCode.ERR_INVALID_BATTLE;
            }

            battleService.stopActionBroadcast(battleId);

            List<Object> results = redisTransaction.exec(new RedisTransaction.Callback() {
                @Override
                public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                    player.setState(PlayerState.OFFLINE);
                    player.setAction(PlayerAction.NO_ACTION);
                    playerRepo.createOrUpdate(player);
                    playerRepo.findRawById(opponentId);
                }
            });
            Player opponent = new Player(opponentId, (List<String>) results.get(0));
            log.info(LOG_HEADER + " | found opponent: " + opponent.toString());

            if (opponent.getState() == PlayerState.OFFLINE) {  // Both offline
                log.info(LOG_HEADER + " | both offline");
                // Delete battle and players
                redisTransaction.exec(new RedisTransaction.Callback() {
                    @Override
                    public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                        battleRepo.delById(battleId);
                        playerRepo.delById(playerId);
                        playerRepo.delById(opponentId);
                    }
                });
            } else {
                // Notify opponent quit
                messenger.sendErr(opponent, ErrCode.ERR_OPPONENT_QUIT);
                log.info(LOG_HEADER + " | send opponent quit to player: " + opponentId);
            }
            return 0;
        } catch (Exception e) {
            log.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

    /**
     * Get the id of the player's opponent.
     *
     * @param playerId The id of the player
     * @param battle The battle of the two players
     * @return The id of the opponent, or null if player id not belong to the battle.
     */
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

}
