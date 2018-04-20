package com.eatme.eatmeserver.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@SuppressWarnings("unused")
@Configuration
public class RestConfig {

    private static final Logger log = LoggerFactory.getLogger(RestConfig.class);

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        RestTemplate template = builder.build();
        log.info("Creating bean \'restTemplate\'");
        return template;
    }

}
