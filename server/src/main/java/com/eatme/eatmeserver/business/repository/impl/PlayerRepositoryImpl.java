package com.eatme.eatmeserver.business.repository.impl;

import com.eatme.eatmeserver.business.entity.Player;
import com.eatme.eatmeserver.business.repository.PlayerRepository;
import com.eatme.eatmeserver.config.EatMeProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import javax.annotation.PostConstruct;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@SuppressWarnings("unused")
@Repository
public class PlayerRepositoryImpl implements PlayerRepository {

    private static final Logger log = LoggerFactory.getLogger(PlayerRepositoryImpl.class);

    private static final String KEY_PREFIX = "eatme:plyr:";
    private static final String KEY_HASH_STATE = "state";
    private static final String KEY_HASH_ACTION = "action";
    private static final String KEY_HASH_SERVER_IP = "ip";
    private static final String KEY_HASH_SERVER_PORT = "port";

    @Autowired
    private EatMeProperty eatMeProp;

    @Autowired
    private StringRedisTemplate redisTemplate;
    private HashOperations<String, String, String> hashOps;

    @PostConstruct
    private void init() {
        hashOps = redisTemplate.opsForHash();
    }

    @Override
    public void createOrUpdate(Player player) {
        Map<String, String> m = new HashMap<>();
        m.put(KEY_HASH_STATE, String.valueOf(player.getState().ordinal()));
        m.put(KEY_HASH_ACTION, String.valueOf(player.getAction().ordinal()));
        m.put(KEY_HASH_SERVER_IP, player.getServerIp());
        m.put(KEY_HASH_SERVER_PORT, String.valueOf(player.getServerPort()));

        String k = key(player.getId());
        hashOps.putAll(k, m);
        redisTemplate.expire(k, eatMeProp.getPlayer().getExpire(), TimeUnit.MINUTES);
    }

    @Override
    public @NonNull Player findById(String playerId) {
        return new Player(playerId, findRawById(playerId));
    }

    @Override
    public @Nullable List<String> findRawById(String playerId) {
        return hashOps.multiGet(key(playerId), Arrays.asList(KEY_HASH_STATE,
            KEY_HASH_ACTION, KEY_HASH_SERVER_IP, KEY_HASH_SERVER_PORT));
    }

    @Override
    public void delById(String playerId) {
        redisTemplate.delete(key(playerId));
    }

    private String key(String playerId) {
        return KEY_PREFIX + playerId;
    }

}
