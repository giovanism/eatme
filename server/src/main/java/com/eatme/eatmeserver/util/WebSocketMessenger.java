package com.eatme.eatmeserver.util;

import com.eatme.eatmeserver.business.entity.PlayerState;
import com.eatme.eatmeserver.config.WebSocketConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@SuppressWarnings("unused")
@Component
public class WebSocketMessenger {

    public enum MsgType {
        ERR,
        BID,
        START,
    }

    @Autowired
    private SimpMessagingTemplate template;

    public void sendErr(String playerId, int errCode) {
        sendErr(playerId, errCode, PlayerState.OFFLINE);
    }

    public void sendErr(String playerId, int errCode, PlayerState nextState) {
        send(playerId, nextState, MsgType.ERR, String.valueOf(errCode));
    }

    public void send(String playerId, PlayerState nextState, MsgType type, String data) {
        String dest = WebSocketConfig.PREFIX_SUBSCRIBE + "/" + playerId;
        String body = String.valueOf(nextState.ordinal()) + "|" + type.ordinal() + "|" + data;
        template.convertAndSend(dest, body);
    }

}
