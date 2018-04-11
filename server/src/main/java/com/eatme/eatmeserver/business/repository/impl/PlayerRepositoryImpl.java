package com.eatme.eatmeserver.business.repository.impl;

import com.eatme.eatmeserver.business.entity.Player;
import com.eatme.eatmeserver.business.entity.PlayerAction;
import com.eatme.eatmeserver.business.entity.PlayerState;
import com.eatme.eatmeserver.business.repository.PlayerRepository;
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

@SuppressWarnings("unused")
@Repository
public class PlayerRepositoryImpl implements PlayerRepository {

    private static final Logger LOG = LoggerFactory.getLogger(PlayerRepositoryImpl.class);

    private static final String KEY_PREFIX = "eatme:plyr:";
    private static final String KEY_HASH_STATE = "state";
    private static final String KEY_HASH_ACTION = "action";

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
        hashOps.putAll(key(player.getId()), m);
    }

    @Override
    public @NonNull Player findById(String playerId) {
        List<String> res = hashOps.multiGet(key(playerId),
            Arrays.asList(KEY_HASH_STATE, KEY_HASH_ACTION));
        String rawState = res.get(0);
        String rawAction = res.get(1);
        if (rawState == null || rawAction == null) {
            return new Player(playerId, PlayerState.OFFLINE);
        }
        return new Player(playerId, rawState, rawAction);
    }

    @Override
    public void delById(String playerId) {
        redisTemplate.delete(key(playerId));
    }

    @Override
    public String findRawStateById(String playerId) {
        return hashOps.get(key(playerId), KEY_HASH_STATE);
    }

    @Override
    public @Nullable String findRawActionById(String playerId) {
        return hashOps.get(key(playerId), KEY_HASH_ACTION);
    }

    private String key(String playerId) {
        return KEY_PREFIX + playerId;
    }

}
