package com.eatme.eatmeserver.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final String CLIENT_LIB_URL =
        "https://cdn.jsdelivr.net/npm/sockjs-client@1.1.4/dist/sockjs.min.js";

    private static final String BASE = "/ws";
    private static final String ENDPOINT = BASE + "/ep";
    public static final String PREFIX_SUBSCRIBE = BASE + "/sb";

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(ENDPOINT)
            .setAllowedOrigins("*")
            .withSockJS()
            .setClientLibraryUrl(CLIENT_LIB_URL);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker(PREFIX_SUBSCRIBE);
    }

}
