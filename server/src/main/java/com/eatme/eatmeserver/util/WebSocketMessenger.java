package com.eatme.eatmeserver.util;

import com.eatme.eatmeserver.config.EatMeProperty;
import com.eatme.eatmeserver.config.WebSocketConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@SuppressWarnings("unused")
@Component
public class WebSocketMessenger {

    private static final String SEPARATOR = "|";

    public enum MsgType {
        ERR,
        BID,
        START,
        OPPONENT_ACTION,
    }

    @Autowired
    private EatMeProperty eatMeProp;

    @Autowired
    private DebugUtil debugUtil;

    @Autowired
    private SimpMessagingTemplate template;

    public void sendErr(String playerId, int errCode) {
        send(playerId, MsgType.ERR, errCode);
    }

    @SafeVarargs
    public final <T> void send(String playerId, MsgType type, T... data) {
        if (eatMeProp.getDebug().isDelayResponse()) {
            debugUtil.randDelay();
        }
        String dest = WebSocketConfig.PREFIX_SUBSCRIBE + "/" + playerId;
        StringBuilder body = new StringBuilder();
        body.append(type.ordinal());
        for (T d : data) {
            body.append(SEPARATOR);
            body.append(d);
        }
        template.convertAndSend(dest, body.toString());
    }

}
