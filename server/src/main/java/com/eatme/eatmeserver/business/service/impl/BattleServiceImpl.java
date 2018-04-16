package com.eatme.eatmeserver.business.service.impl;

import com.eatme.eatmeserver.business.entity.Battle;
import com.eatme.eatmeserver.business.entity.Player;
import com.eatme.eatmeserver.business.entity.PlayerAction;
import com.eatme.eatmeserver.business.entity.PlayerState;
import com.eatme.eatmeserver.business.repository.BattleRepository;
import com.eatme.eatmeserver.business.repository.PlayerRepository;
import com.eatme.eatmeserver.business.repository.WaitingQueueRepository;
import com.eatme.eatmeserver.business.service.BattleService;
import com.eatme.eatmeserver.component.RedisTransaction;
import com.eatme.eatmeserver.config.EatMeProperty;
import com.eatme.eatmeserver.component.WebSocketMessenger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ScheduledFuture;

@SuppressWarnings("unused")
@Component
public class BattleServiceImpl implements BattleService {

    private static final Logger log = LoggerFactory.getLogger(BattleServiceImpl.class);

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
    @Qualifier("battleTaskScheduler")
    private TaskScheduler scheduler;

    private Map<String, ScheduledFuture<?>> actionSchedules = new HashMap<>();

    @Override
    public void startActionBroadcast(String battleId, String player1Id, String player2Id) {
        if (actionSchedules.get(battleId) == null) {
            actionSchedules.put(battleId, scheduler.scheduleAtFixedRate(() -> {

//                log.debug("Broadcast actions for battle " + battleId);
                List<Object> results = redisTransaction.exec(new RedisTransaction.Callback() {
                    @Override
                    public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                        playerRepo.findRawActionById(player1Id);
                        playerRepo.findRawActionById(player2Id);
                    }
                });
                String rawAction1 = (String) results.get(0);
                String rawAction2 = (String) results.get(1);
                if (rawAction1 == null || rawAction2 == null) {
                    return;
                }

                PlayerAction action1 = PlayerAction.values()[Integer.parseInt(rawAction1)];
                PlayerAction action2 = PlayerAction.values()[Integer.parseInt(rawAction2)];
                if (action1 != PlayerAction.NO_ACTION && action2 != PlayerAction.NO_ACTION) {
                    messenger.send(player1Id, WebSocketMessenger.MsgType.ACTION,
                        action1.ordinal(), action2.ordinal());
                    messenger.send(player2Id, WebSocketMessenger.MsgType.ACTION,
                        action2.ordinal(), action1.ordinal());
                }

            }, eatMeProp.getSchedule().getFreq().getAction()));
        }
    }

    @Override
    public void stopActionBroadcast(String battleId) {
        ScheduledFuture<?> future = actionSchedules.get(battleId);
        if (future != null) {
            future.cancel(false);
            actionSchedules.remove(battleId);
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    private void clearWaitingQueue() {
        waitingQueueRepo.clear();
        log.info("clearWaitingQueue() | waiting queue flushed");
    }

    @Scheduled(fixedRateString = "${eatme.schedule.freq.info}")
    private void printInfo() {
        log.info("printInfo() | action broadcasts: " + actionSchedules.size());
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
