package com.eatme.eatmeserver.util;

import com.eatme.eatmeserver.business.entity.PlayerState;
import com.eatme.eatmeserver.config.WebSocketConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@SuppressWarnings("unused")
@Component
public class WebSocketMessenger {

    private static final Logger LOG = LoggerFactory.getLogger(WebSocketMessenger.class);

    public enum MsgType {
        ERR,
        BID,
    }

    @Autowired
    private SimpMessagingTemplate template;

    public void sendErr(String playerId, PlayerState nextState, int errCode) {
        send(playerId, nextState, MsgType.ERR, String.valueOf(errCode));
        LOG.info("Send " + MsgType.ERR.name() + " " + errCode + " to " + playerId);
    }

    public void send(String playerId, PlayerState nextState, MsgType type, String data) {
        String dest = WebSocketConfig.PREFIX_SUBSCRIBE + "/" + playerId;
        String body = String.valueOf(nextState.ordinal()) + "|" + type.ordinal() + "|" + data;
        template.convertAndSend(dest, body);
    }

}
