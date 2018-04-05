package com.eatme.eatmeserver.business.repository;

import org.springframework.lang.Nullable;

public interface WaitingQueueRepository {

    void push(String playerId);

    @Nullable String pop();

    void del(String playerId);

    long size();

}
