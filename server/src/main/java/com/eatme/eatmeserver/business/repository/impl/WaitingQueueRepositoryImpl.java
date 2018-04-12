package com.eatme.eatmeserver.business.repository.impl;

import com.eatme.eatmeserver.business.repository.WaitingQueueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import javax.annotation.PostConstruct;

@SuppressWarnings("unused")
@Repository
public class WaitingQueueRepositoryImpl implements WaitingQueueRepository {

    private static final Logger log = LoggerFactory.getLogger(WaitingQueueRepositoryImpl.class);

    private static final String KEY = "eatme:wq";

    @Autowired
    private StringRedisTemplate redisTemplate;
    private ListOperations<String, String> listOps;

    @PostConstruct
    private void init() {
        listOps = redisTemplate.opsForList();
    }

    @Override
    public long size() {
        return listOps.size(KEY);
    }

    @EventListener(ApplicationReadyEvent.class)
    @Override
    public void clear() {
        redisTemplate.delete(KEY);
        log.info("clear() | waiting queue flushed");
    }

    @Override
    public void push(String playerId) {
        listOps.leftPush(KEY, playerId);
    }

    @Override
    public @Nullable String pop() {
        return listOps.rightPop(KEY);
    }

    @Override
    public void del(String playerId) {
       listOps.remove(KEY, 0, playerId);
    }

}
