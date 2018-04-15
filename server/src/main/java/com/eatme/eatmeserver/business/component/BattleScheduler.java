package com.eatme.eatmeserver.business.component;

import com.eatme.eatmeserver.business.entity.Battle;
import com.eatme.eatmeserver.business.entity.Player;
import com.eatme.eatmeserver.business.entity.PlayerAction;
import com.eatme.eatmeserver.business.entity.PlayerState;
import com.eatme.eatmeserver.business.repository.BattleRepository;
import com.eatme.eatmeserver.business.repository.PlayerRepository;
import com.eatme.eatmeserver.business.repository.WaitingQueueRepository;
import com.eatme.eatmeserver.util.WebSocketMessenger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.UUID;

@SuppressWarnings("unused")
@Component
public class BattleScheduler {

    private static final Logger log = LoggerFactory.getLogger(BattleScheduler.class);

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

    @EventListener(ApplicationReadyEvent.class)
    private void clearWaitingQueue() {
        waitingQueueRepo.clear();
        log.info("clearWaitingQueue() | waiting queue flushed");
    }

    @Scheduled(fixedRateString = "${eatme.schedule.freq.battle}")
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
