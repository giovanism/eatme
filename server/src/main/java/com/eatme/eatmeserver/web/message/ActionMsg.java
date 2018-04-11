package com.eatme.eatmeserver.web.message;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

public class ActionMsg {

    @NotNull
    @Size(min=32, max=32)
    private String playerId;

    @NotNull
    @Size(min=32, max=32)
    private String battleId;

    @NotNull
    @Min(1)
    @Max(4)
    private Integer action;

    @Override
    public String toString() {
        return "playerId=" + playerId + "&battleId=" + battleId + "&action=" + action;
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

    public Integer getAction() {
        return action;
    }

    public void setAction(Integer action) {
        this.action = action;
    }

}
