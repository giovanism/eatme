package com.eatme.eatmeserver.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

@SuppressWarnings("unused")
@Configuration
public class RedisConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory();
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate() {
        StringRedisTemplate template = new StringRedisTemplate(redisConnectionFactory());
        template.setEnableTransactionSupport(true);
        return template;
    }

}
