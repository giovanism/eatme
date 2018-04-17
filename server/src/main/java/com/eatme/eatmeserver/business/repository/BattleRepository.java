package com.eatme.eatmeserver.business.repository;

import com.eatme.eatmeserver.business.entity.Battle;
import org.springframework.lang.Nullable;

public interface BattleRepository {

    void createOrUpdate(Battle battle);

    @Nullable Battle findById(String battleId);

    void delById(String battleId);

    int count();

}
