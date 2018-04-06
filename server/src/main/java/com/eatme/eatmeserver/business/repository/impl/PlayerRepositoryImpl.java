package com.eatme.eatmeserver.business.repository.impl;

import com.eatme.eatmeserver.business.entity.Player;
import com.eatme.eatmeserver.business.entity.PlayerAction;
import com.eatme.eatmeserver.business.entity.PlayerState;
import com.eatme.eatmeserver.business.repository.PlayerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.SessionCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import javax.annotation.PostConstruct;
import java.util.HashMap;
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
    public <T> T execute(SessionCallback<T> callback) {
        return redisTemplate.execute(callback);
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
        Player player = new Player(playerId, PlayerState.OFFLINE);

        String k = key(playerId);
        String stateStr = hashOps.get(k, KEY_HASH_STATE);
        String actionStr = hashOps.get(k, KEY_HASH_ACTION);

        if (stateStr == null || actionStr == null) {
            return player;
        }

        try {
            player.setState(PlayerState.values()[Integer.parseInt(stateStr)]);
            player.setAction(PlayerAction.values()[Integer.parseInt(actionStr)]);
        } catch (NumberFormatException e) {
            LOG.error(e.toString(), e);
        }

        return player;
    }

    @Override
    public void delById(String playerId) {
        redisTemplate.delete(key(playerId));
    }

    private String key(String playerId) {
        return KEY_PREFIX + playerId;
    }

}
