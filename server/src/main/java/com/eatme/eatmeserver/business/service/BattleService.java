package com.eatme.eatmeserver.business.service;

import com.eatme.eatmeserver.ErrCode;
import com.eatme.eatmeserver.business.entity.Battle;
import com.eatme.eatmeserver.business.entity.Player;
import com.eatme.eatmeserver.business.entity.PlayerAction;
import com.eatme.eatmeserver.business.entity.PlayerState;
import com.eatme.eatmeserver.business.repository.BattleRepository;
import com.eatme.eatmeserver.business.repository.PlayerRepository;
import com.eatme.eatmeserver.business.repository.WaitingQueueRepository;
import com.eatme.eatmeserver.config.EatMeProperty;
import com.eatme.eatmeserver.util.RedisTransaction;
import com.eatme.eatmeserver.util.WebSocketMessenger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.lang.Nullable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@SuppressWarnings("unused")
@Service
public class BattleService {

    private static final Logger log = LoggerFactory.getLogger(BattleService.class);

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

    public int wait(String playerId) {
        final String LOG_HEADER = "wait() | playerId=" + playerId;
        try {
            Player player = playerRepo.findById(playerId);
            log.info(LOG_HEADER + " | found player: " + player.toString());
            if (player.getState() != PlayerState.OFFLINE) {
                return ErrCode.ERR_INVALID_STATE;
            }
            synchronized (BattleService.class) {  // Ensure queue size consistency
                long size = waitingQueueRepo.size();
                long capacity = eatMeProp.getWaitingQueue().getCapacity();
                log.info(LOG_HEADER + " | queue_size=" + size + " | queue_capacity=" + capacity);
                if (size >= capacity) {
                    return ErrCode.ERR_WAITING_QUEUE_PUSH_FULL;
                }
                redisTransaction.exec(new RedisTransaction.Callback() {
                    @Override
                    public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                        player.setState(PlayerState.WAITING);
                        playerRepo.createOrUpdate(player);
                        waitingQueueRepo.push(player.getId());
                    }
                });
            }
            return 0;
        } catch (Exception e) {
            log.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

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
                    playerRepo.findRawStateById(opponentId);
                    playerRepo.findRawActionById(opponentId);
                }
            });
            log.debug(LOG_HEADER + " | transaction results size: " + results.size());
            String rawState = (String) results.get(0);
            String rawAction = (String) results.get(1);
            Player opponent = new Player(opponentId, rawState, rawAction);
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
                messenger.send(playerId, WebSocketMessenger.MsgType.START, seed, 0);
                messenger.send(opponentId, WebSocketMessenger.MsgType.START, seed, 1);
            }
            return 0;
        } catch (Exception e) {
            log.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

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

            List<Object> results = redisTransaction.exec(new RedisTransaction.Callback() {
                @Override
                public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                    player.setAction(action);
                    playerRepo.createOrUpdate(player);
                    playerRepo.findRawStateById(opponentId);
                    playerRepo.findRawActionById(opponentId);
                }
            });
            log.debug(LOG_HEADER + " | transaction results size: " + results.size());
            String rawState = (String) results.get(0);
            String rawAction = (String) results.get(1);
            Player opponent = new Player(opponentId, rawState, rawAction);
            log.info(LOG_HEADER + " | found opponent: " + opponent.toString());

            // Check both action received
            if (opponent.getAction() != PlayerAction.NO_ACTION) {
                log.info(LOG_HEADER + " | both action received");
                // Clear both actions
                redisTransaction.exec(new RedisTransaction.Callback() {
                    @Override
                    public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                        player.setAction(PlayerAction.NO_ACTION);
                        playerRepo.createOrUpdate(player);
                        opponent.setAction(PlayerAction.NO_ACTION);
                        playerRepo.createOrUpdate(opponent);
                    }
                });
                // Broadcast
                messenger.send(playerId, WebSocketMessenger.MsgType.OPPONENT_ACTION,
                    Integer.parseInt(rawAction));
                messenger.send(opponentId, WebSocketMessenger.MsgType.OPPONENT_ACTION,
                    action.ordinal());
            }
            return 0;
        } catch (Exception e) {
            log.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

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

            List<Object> results = redisTransaction.exec(new RedisTransaction.Callback() {
                @Override
                public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                    player.setState(PlayerState.NOT_READY);
                    player.setAction(PlayerAction.NO_ACTION);
                    playerRepo.createOrUpdate(player);
                    playerRepo.findRawStateById(opponentId);
                    playerRepo.findRawActionById(opponentId);
                }
            });
            log.debug(LOG_HEADER + " | transaction results size: " + results.size());
            String rawState = (String) results.get(0);
            String rawAction = (String) results.get(1);
            Player opponent = new Player(opponentId, rawState, rawAction);
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

            List<Object> results = redisTransaction.exec(new RedisTransaction.Callback() {
                @Override
                public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                    player.setState(PlayerState.OFFLINE);
                    player.setAction(PlayerAction.NO_ACTION);
                    playerRepo.createOrUpdate(player);
                    playerRepo.findRawStateById(opponentId);
                    playerRepo.findRawActionById(opponentId);
                }
            });
            log.debug(LOG_HEADER + " | transaction results size: " + results.size());
            String rawState = (String) results.get(0);
            String rawAction = (String) results.get(1);
            Player opponent = new Player(opponentId, rawState, rawAction);
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
                messenger.sendErr(opponentId, ErrCode.ERR_OPPONENT_QUIT);
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
                String id = player1.getId();
                waitingQueueRepo.push(id);
                log.info("scheduleBattle() | push back player id: " + id);
            } else if (player2.getState() == PlayerState.WAITING) {
                String id = player2.getId();
                waitingQueueRepo.push(id);
                log.info("scheduleBattle() | push back player id: " + id);
            }
        } catch (Exception e) {
            log.error(e.toString(), e);
        }
    }

    private void createBattle(Player player1, Player player2) {
        String battleId = UUID.randomUUID().toString().replaceAll("-", "");
        Battle battle = new Battle(battleId, player1.getId(), player2.getId());
        redisTransaction.exec(new RedisTransaction.Callback() {
            @Override
            public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                battleRepo.createOrUpdate(battle);
                player1.setState(PlayerState.NOT_READY);
                player1.setAction(PlayerAction.NO_ACTION);
                playerRepo.createOrUpdate(player1);
                player2.setState(PlayerState.NOT_READY);
                player2.setAction(PlayerAction.NO_ACTION);
                playerRepo.createOrUpdate(player2);
            }
        });
        log.info("createBattle() | create battle: " + battle.toString());
        // Broadcast
        messenger.send(player1.getId(), WebSocketMessenger.MsgType.BID, battleId);
        messenger.send(player2.getId(), WebSocketMessenger.MsgType.BID, battleId);
    }

}
