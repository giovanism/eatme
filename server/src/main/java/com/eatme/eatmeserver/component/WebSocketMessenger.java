package com.eatme.eatmeserver.component;

import com.eatme.eatmeserver.business.entity.Player;
import com.eatme.eatmeserver.config.EatMeProperty;
import com.eatme.eatmeserver.config.WebSocketConfig;
import com.eatme.eatmeserver.web.controller.APIController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@SuppressWarnings("unused")
@Component
public class WebSocketMessenger {

    private static final Logger log = LoggerFactory.getLogger(WebSocketMessenger.class);
    private static final String SEPARATOR_MSG = "_";
    public static final String SEPARATOR_BODY = "&";

    public enum MsgType {
        ERR,
        BID,
        START,
        ACTION,
    }

    @Value("${debug}")
    private boolean debug;

    @Value("${server.address}")
    private String serverIp;

    @Value("${server.port}")
    private int serverPort;

    @Autowired
    private EatMeProperty eatMeProp;

    @Autowired
    private DelayUtil delayUtil;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private RestTemplate restTemplate;

    public void sendErr(Player player, int errCode) {
        send(player, MsgType.ERR, errCode);
    }

    public void sendErr(String playerId, int errCode) {
        send(playerId, MsgType.ERR, errCode);
    }

    @SafeVarargs
    public final <T> void send(Player player, MsgType type, T... data) {
        String destIp = player.getServerIp();
        int destPort = player.getServerPort();
        if (destIp.equals(serverIp) && destPort == serverPort) {
            send(player.getId(), type, data);
        } else {
            final String dest = url(destIp, destPort) + APIController.URL_SEND_MSG;
            final String body = player.getId() + SEPARATOR_BODY + stringify(type, data);
            if (debug) {
                log.debug("send() | body=" + body + " | from="
                    + url(serverIp, serverPort) + " | to=" + dest);
            }
            restTemplate.execute(dest, HttpMethod.POST,
                (request) -> {
                    request.getHeaders().setContentType(MediaType.TEXT_PLAIN);
                    request.getBody().write(body.getBytes());
                }, null);
        }
    }

    @SafeVarargs
    public final <T> void send(String playerId, MsgType type, T... data) {
        if (eatMeProp.getDebug().isDelayResponse()) delayUtil.randDelay();
        send(playerId, stringify(type, data));
    }

    public void send(String playerId, String msg) {
        String dest = WebSocketConfig.PREFIX_SUBSCRIBE + "/" + playerId;
        messagingTemplate.convertAndSend(dest, msg);
    }

    @SafeVarargs
    private final <T> String stringify(MsgType type, T... data) {
        StringBuilder sb = new StringBuilder();
        sb.append(type.ordinal());
        for (T d : data) {
            sb.append(SEPARATOR_MSG);
            sb.append(d);
        }
        return sb.toString();
    }

    private String url(String ip, int port) {
        return "http://" + ip + ":" + port;
    }

}
