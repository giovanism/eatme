package com.eatme.eatmeserver.config;

import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.StringRedisTemplate;

@SuppressWarnings("unused")
@Configuration
public class RedisConfig {

    private static final Logger log = LoggerFactory.getLogger(RedisConfig.class);

    @Value("${redis.database}")
    private int database;

    @Value("${redis.host}")
    private String host;

    @Value("${redis.port}")
    private int port;

    @Value("${redis.pool.max-total}")
    private int maxTotal;

    @Value("${redis.pool.max-idle}")
    private int maxIdle;

    @Value("${redis.pool.min-idle}")
    private int minIdle;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        GenericObjectPoolConfig objPoolConfig = new GenericObjectPoolConfig();
        objPoolConfig.setMaxTotal(maxTotal);
        objPoolConfig.setMaxIdle(maxIdle);
        objPoolConfig.setMinIdle(minIdle);

        LettucePoolingClientConfiguration poolClientConfig =
            LettucePoolingClientConfiguration.builder().poolConfig(objPoolConfig).build();

        RedisStandaloneConfiguration standaloneConfig = new RedisStandaloneConfiguration();
        standaloneConfig.setDatabase(database);
        standaloneConfig.setHostName(host);
        standaloneConfig.setPort(port);

        LettuceConnectionFactory factory = new LettuceConnectionFactory(standaloneConfig, poolClientConfig);
        factory.setShareNativeConnection(true);

        log.info("Creating bean \'redisConnectionFactory\'");
        return factory;
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate() {
        StringRedisTemplate template = new StringRedisTemplate(redisConnectionFactory());
        template.setEnableTransactionSupport(true);
        log.info("Creating bean \'stringRedisTemplate\'");
        return template;
    }

}
