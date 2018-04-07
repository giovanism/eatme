package com.eatme.eatmeserver.business.service;

import com.eatme.eatmeserver.ErrCode;
import com.eatme.eatmeserver.business.entity.Battle;
import com.eatme.eatmeserver.business.entity.Player;
import com.eatme.eatmeserver.business.entity.PlayerState;
import com.eatme.eatmeserver.business.repository.BattleRepository;
import com.eatme.eatmeserver.business.repository.PlayerRepository;
import com.eatme.eatmeserver.business.repository.WaitingQueueRepository;
import com.eatme.eatmeserver.util.WebSocketMessenger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.SessionCallback;
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

    public int quitBattle(String playerId, String battleId) {
        try {
            Player player = playerRepo.findById(playerId);
            if (player.getState() == PlayerState.OFFLINE
                || player.getState() == PlayerState.WAITING) {
                return 0;
            }

            Battle battle = battleRepo.findById(battleId);
            if (battle == null) {
                return 0;
            }

            String player1Id = battle.getPlayer1Id();
            String player2Id = battle.getPlayer2Id();
            boolean isPlayer1 = playerId.equals(player1Id);
            boolean isPlayer2 = playerId.equals(player2Id);
            if (!isPlayer1 && !isPlayer2) {
                return 0;
            }

            player.setState(PlayerState.OFFLINE);
            playerRepo.createOrUpdate(player);

            String opponentId = isPlayer1 ? player2Id : player1Id;
            Player opponent = playerRepo.findById(opponentId);
            if (opponent.getState() == PlayerState.OFFLINE) {  // Both offline
                // Delete battle and players
                playerRepo.execute(new SessionCallback<Void>() {
                    @Override
                    public <K, V> Void execute(RedisOperations<K, V> operations) throws DataAccessException {
                        operations.multi();
                        battleRepo.delById(battleId);
                        playerRepo.delById(player1Id);
                        playerRepo.delById(player2Id);
                        operations.exec();
                        return null;
                    }
                });
            }

            return 0;
        } catch (Exception e) {
            LOG.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
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
        playerRepo.execute(new SessionCallback<Void>() {
            @Override
            public <K, V> Void execute(RedisOperations<K, V> operations) throws DataAccessException {
                operations.multi();
                battleRepo.createOrUpdate(new Battle(battleId, player1.getId(), player2.getId()));
                player1.setState(PlayerState.NOT_READY);
                playerRepo.createOrUpdate(player1);
                player2.setState(PlayerState.NOT_READY);
                playerRepo.createOrUpdate(player2);
                operations.exec();
                return null;
            }
        });
        messenger.send(player1.getId(), PlayerState.NOT_READY, WebSocketMessenger.MsgType.BID, battleId);
        messenger.send(player2.getId(), PlayerState.NOT_READY, WebSocketMessenger.MsgType.BID, battleId);
        LOG.info("Create battle " + battleId);
    }

}
