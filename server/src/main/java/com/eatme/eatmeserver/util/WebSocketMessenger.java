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

    private static final String HEADER_TYPE = "type";
    private static final String HEADER_STATE = "state";

    public enum MsgType {
        ERR,
        BID,
    }

    @Autowired
    private SimpMessagingTemplate template;

    public void sendErr(String playerId, PlayerState state, int errCode) {
        send(playerId, state, MsgType.ERR, String.valueOf(errCode));
        LOG.info("Send " + MsgType.ERR.name() + " " + errCode + " to " + playerId);
    }

    public void send(String playerId, PlayerState state, MsgType type, String data) {
        String dest = WebSocketConfig.PREFIX_SUBSCRIBE + "/" + playerId;
        Map<String, Object> headers = new HashMap<>();
        headers.put(HEADER_TYPE, type.ordinal());
        headers.put(HEADER_STATE, state.ordinal());
        template.convertAndSend(dest, data, headers);
    }

}
