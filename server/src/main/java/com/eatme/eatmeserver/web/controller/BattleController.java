package com.eatme.eatmeserver.web.controller;

import com.eatme.eatmeserver.business.service.BattleService;
import com.eatme.eatmeserver.business.service.PlayerService;
import com.eatme.eatmeserver.util.WebSocketMessenger;
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
@MessageMapping("/btl")
public class BattleController {

    private static final Logger LOG = LoggerFactory.getLogger(BattleController.class);

    @Autowired
    private PlayerService playerService;

    @Autowired
    private BattleService battleService;

    @Autowired
    private WebSocketMessenger messenger;

    @MessageMapping("/wait")
    public void wait(@Valid PlayerMsg msg) {
        int ret = playerService.wait(msg.getPlayerId());
        if (ret != 0) {
            messenger.sendErr(msg.getPlayerId(), ret);
        }
        LOG.info("/wait " + msg + " | ret: " + ret);
    }

    @MessageMapping("/quit-wait")
    public void quitWait(@Valid PlayerMsg msg) {
        int ret = playerService.quitWait(msg.getPlayerId());
        if (ret != 0) {
            messenger.sendErr(msg.getPlayerId(), ret);
        }
        LOG.info("/quit-wait " + msg + " | ret: " + ret);
    }

    @MessageMapping("/ready")
    public void ready(@Valid BattleMsg msg) {
        int ret = battleService.ready(msg.getPlayerId(), msg.getBattleId());
        if (ret != 0) {
            messenger.sendErr(msg.getPlayerId(), ret);
        }
        LOG.info("/ready " + msg + " | ret: " + ret);
    }

    @MessageMapping("/quit-battle")
    public void quitBattle(@Valid BattleMsg msg) {
        int ret = battleService.quitBattle(msg.getPlayerId(), msg.getBattleId());
        if (ret != 0) {
            messenger.sendErr(msg.getPlayerId(), ret);
        }
        LOG.info("/quit-battle " + msg + " | ret: " + ret);
    }

}
