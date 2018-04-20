package com.eatme.eatmeserver.web.controller;

import com.eatme.eatmeserver.business.entity.PlayerAction;
import com.eatme.eatmeserver.business.service.PlayerService;
import com.eatme.eatmeserver.config.EatMeProperty;
import com.eatme.eatmeserver.component.DelayUtil;
import com.eatme.eatmeserver.component.WebSocketMessenger;
import com.eatme.eatmeserver.web.message.ActionMsg;
import com.eatme.eatmeserver.web.message.BattleMsg;
import com.eatme.eatmeserver.web.message.PlayerMsg;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@SuppressWarnings("unused")
@RestController
@MessageMapping("/game")
public class GameController {

    private static final Logger log = LoggerFactory.getLogger(GameController.class);

    @Autowired
    private EatMeProperty eatMeProp;

    @Autowired
    private DelayUtil delayUtil;

    @Autowired
    private WebSocketMessenger messenger;

    @Autowired
    private PlayerService playerService;

    @MessageMapping("/wait")
    public void wait(@Valid PlayerMsg msg) {
        process("/wait " + msg, () -> {
            int ret = playerService.wait(msg.getPlayerId());
            if (ret != 0) {
                messenger.sendErr(msg.getPlayerId(), ret);
            }
            return ret;
        });
    }

    @MessageMapping("/quit-wait")
    public void quitWait(@Valid PlayerMsg msg) {
        process("/quit-wait " + msg, () -> {
            int ret = playerService.quitWait(msg.getPlayerId());
            if (ret != 0) {
                messenger.sendErr(msg.getPlayerId(), ret);
            }
            return ret;
        });
    }

    @MessageMapping("/ready")
    public void ready(@Valid BattleMsg msg) {
        process("/ready " + msg, () -> {
            int ret = playerService.ready(msg.getPlayerId(), msg.getBattleId());
            if (ret != 0) {
                messenger.sendErr(msg.getPlayerId(), ret);
            }
            return ret;
        });
    }

    @MessageMapping("/action")
    public void action(@Valid ActionMsg msg) {
        process("/action " + msg, () -> {
            int ret = playerService.action(msg.getPlayerId(), msg.getBattleId(),
                PlayerAction.values()[msg.getAction()]);
            if (ret != 0) {
                messenger.sendErr(msg.getPlayerId(), ret);
            }
            return ret;
        });
    }

    @MessageMapping("/done")
    public void done(@Valid BattleMsg msg) {
        process("/done " + msg, () -> {
            int ret = playerService.done(msg.getPlayerId(), msg.getBattleId());
            if (ret != 0) {
                messenger.sendErr(msg.getPlayerId(), ret);
            }
            return ret;
        });
    }

    @MessageMapping("/quit-btl")
    public void quitBattle(@Valid BattleMsg msg) {
        process("/quit-btl " + msg, () -> {
            int ret = playerService.quitBattle(msg.getPlayerId(), msg.getBattleId());
            if (ret != 0) {
                messenger.sendErr(msg.getPlayerId(), ret);
            }
            return ret;
        });
    }

    private interface ProcessCallback {
        int process();
    }

    private void process(String msgId, ProcessCallback cb) {
        if (eatMeProp.getDebug().isDelayRequest()) {
            log.debug(msgId + " | delay: " + delayUtil.randDelay() + " ms");
        }
        log.info(msgId);
        long begTime = System.nanoTime();
        int ret = cb.process();
        long endTime = System.nanoTime();
        long elapse = (endTime - begTime) / 1000000;
        log.info(msgId + " | ret: " + ret + " | cost: " + elapse + " ms");
    }

}
