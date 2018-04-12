package com.eatme.eatmeserver.business.repository.impl;

import com.eatme.eatmeserver.business.entity.Battle;
import com.eatme.eatmeserver.business.repository.BattleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import javax.annotation.PostConstruct;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@SuppressWarnings("unused")
@Repository
public class BattleRepositoryImpl implements BattleRepository {

    private static final Logger log = LoggerFactory.getLogger(BattleRepositoryImpl.class);

    private static final String KEY_PREFIX = "eatme:btl:";
    private static final String KEY_HASH_PLAYER1_ID = "p1id";
    private static final String KEY_HASH_PLAYER2_ID = "p2id";
    private static final String KEY_HASH_RAND_SEED = "seed";

    @Autowired
    private StringRedisTemplate redisTemplate;
    private HashOperations<String, String, String> hashOps;

    @PostConstruct
    private void init() {
        hashOps = redisTemplate.opsForHash();
    }

    @Override
    public void createOrUpdate(Battle battle) {
        Map<String, String> m = new HashMap<>();
        m.put(KEY_HASH_PLAYER1_ID, battle.getPlayer1Id());
        m.put(KEY_HASH_PLAYER2_ID, battle.getPlayer2Id());
        m.put(KEY_HASH_RAND_SEED, String.valueOf(battle.getRandSeed()));
        hashOps.putAll(key(battle.getId()), m);
    }

    @Override
    public @Nullable Battle findById(String battleId) {
        List<String> res = hashOps.multiGet(key(battleId),
            Arrays.asList(KEY_HASH_PLAYER1_ID, KEY_HASH_PLAYER2_ID, KEY_HASH_RAND_SEED));
        String player1Id = res.get(0);
        String player2Id = res.get(1);
        String rawSeed = res.get(2);
        if (player1Id == null || player2Id == null || rawSeed == null) {
            return null;
        }
        return new Battle(battleId, player1Id, player2Id, rawSeed);
    }

    @Override
    public void delById(String battleId) {
        redisTemplate.delete(key(battleId));
    }

    private String key(String battleId) {
        return KEY_PREFIX + battleId;
    }

}
