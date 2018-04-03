package com.eatme.eatmeserver.web.controller;

import com.eatme.eatmeserver.web.config.WebSocketConfig;
import com.eatme.eatmeserver.web.message.PlayerMsg;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/battle")
@MessageMapping("/battle")
public class BattleController {

    private static final Logger Log = LoggerFactory.getLogger(BattleController.class);

    @Autowired
    private SimpMessagingTemplate template;

    @MessageMapping("/wait")
    public void wait(PlayerMsg msg) throws Exception {
        Log.info("/wait " + msg);
        Thread.sleep(5000);
        Map<String, Object> headers = new HashMap<>();
        headers.put("type", "bid");
        template.convertAndSend(WebSocketConfig.playerDest(msg.getPlayerId()), "battle123", headers);
    }

    @MessageMapping("/quit-wait")
    public void quitWait(PlayerMsg msg) {
        Log.info("/quit-wait " + msg);
    }

}
