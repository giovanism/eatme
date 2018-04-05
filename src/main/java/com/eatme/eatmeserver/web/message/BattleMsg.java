package com.eatme.eatmeserver.web.message;

public class BattleMsg {

    private String playerId;
    private String battleId;

    @Override
    public String toString() {
        return "playerId=" + playerId + "&battleId=" + battleId;
    }

    public String getPlayerId() {
        return playerId;
    }

    public void setPlayerId(String playerId) {
        this.playerId = playerId;
    }

    public String getBattleId() {
        return battleId;
    }

    public void setBattleId(String battleId) {
        this.battleId = battleId;
    }

}
