package com.eatme.eatmeserver.business.service;

public interface BattleService {

    void startActionBroadcast(String battleId, String player1Id, String player2Id);

    void stopActionBroadcast(String battleId);

}
