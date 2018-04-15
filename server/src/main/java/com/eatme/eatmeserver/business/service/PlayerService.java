package com.eatme.eatmeserver.business.service;

import com.eatme.eatmeserver.business.entity.PlayerAction;

public interface PlayerService {

    int wait(String playerId);

    int quitWait(String playerId);

    int ready(String playerId, String battleId);

    int action(String playerId, String battleId, PlayerAction action);

    int done(String playerId, String battleId);

    int quitBattle(String playerId, String battleId);

}
