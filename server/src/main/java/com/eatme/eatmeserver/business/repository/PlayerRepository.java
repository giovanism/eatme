package com.eatme.eatmeserver.business.repository;

import com.eatme.eatmeserver.business.entity.Player;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

public interface PlayerRepository {

    void createOrUpdate(Player player);

    @NonNull Player findById(String playerId);

    void delById(String playerId);

    @Nullable String findRawStateById(String playerId);

    @Nullable String findRawActionById(String playerId);

}
