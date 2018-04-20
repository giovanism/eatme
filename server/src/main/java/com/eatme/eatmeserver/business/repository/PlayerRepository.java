package com.eatme.eatmeserver.business.repository;

import com.eatme.eatmeserver.business.entity.Player;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.util.List;

public interface PlayerRepository {

    void createOrUpdate(Player player);

    @NonNull Player findById(String playerId);

    @Nullable List<String> findRawById(String playerId);

    void delById(String playerId);

}
