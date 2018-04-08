package com.eatme.eatmeserver.business.repository;

import com.eatme.eatmeserver.business.entity.Player;
import org.springframework.lang.NonNull;

public interface PlayerRepository {

    void createOrUpdate(Player player);

    @NonNull Player findById(String playerId);

    void delById(String playerId);

}
