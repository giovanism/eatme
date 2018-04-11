package com.eatme.eatmeserver.business.repository;

import org.springframework.lang.Nullable;

public interface WaitingQueueRepository {

    long size();

    void clear();

    void push(String playerId);

    @Nullable String pop();

    void del(String playerId);

}
