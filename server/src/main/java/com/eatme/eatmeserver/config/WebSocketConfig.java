package com.eatme.eatmeserver.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final String BASE = "/ws";
    private static final String ENDPOINT = BASE + "/ep";
    public static final String PREFIX_SUBSCRIBE = BASE + "/sb";
    private static final String CLIENT_SOCKJS_URL = "//cdn.jsdelivr.net/sockjs/1.1.4/sockjs.min.js";

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(ENDPOINT)
            .setAllowedOrigins("*")
            .withSockJS()
            .setClientLibraryUrl(CLIENT_SOCKJS_URL);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker(PREFIX_SUBSCRIBE);
    }

}
