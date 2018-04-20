package com.eatme.eatmeserver.web.controller;

import com.eatme.eatmeserver.component.WebSocketMessenger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;

@SuppressWarnings("unused")
@RestController
public class APIController {

    private static final Logger log = LoggerFactory.getLogger(APIController.class);
    private static final String URL_BASE = "/api";
    public static final String URL_SEND_MSG = URL_BASE + "/send-msg";

    @Value("${debug}")
    private boolean debug;

    @Autowired
    private WebSocketMessenger messenger;

    @PostMapping(value = URL_SEND_MSG, consumes = "text/plain")
    public String sendMsg(@RequestBody String body, HttpServletResponse response) {
        if (debug) log.debug("sendMsg() | body=" + body);

        String[] results = body.split(WebSocketMessenger.SEPARATOR_BODY);
        if (results.length != 2) {
            response.setStatus(HttpStatus.BAD_REQUEST.value());
            return "";
        }

        String playerId = results[0];
        if (playerId.length() != 32) {
            response.setStatus(HttpStatus.BAD_REQUEST.value());
            return "";
        }

        String msg = results[1];
        messenger.send(playerId, msg);
        if (debug) log.debug("sendMsg() | playerId=" + playerId + " | msg=" + msg);

        return "";
    }

}
