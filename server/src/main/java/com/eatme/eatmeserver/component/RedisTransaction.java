package com.eatme.eatmeserver.component;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.SessionCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@SuppressWarnings("unused")
@Component
public class RedisTransaction {

    public interface Callback {
        <K, V> void enqueueOperations(RedisOperations<K, V> operations);
    }

    @Autowired
    private StringRedisTemplate redisTemplate;

    public List<Object> exec(Callback cb) {
        return redisTemplate.execute(new SessionCallback<List<Object>>() {
            @Override
            public <K, V> List<Object> execute(RedisOperations<K, V> operations) throws DataAccessException {
                operations.multi();
                cb.enqueueOperations(operations);
                return operations.exec();
            }
        });
    }

}
