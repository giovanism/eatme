package com.eatme.eatmeserver.web.message;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

public class BattleMsg {

    @NotNull
    @Size(min=32, max=32)
    private String playerId;

    @NotNull
    @Size(min=32, max=32)
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
