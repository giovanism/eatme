package com.eatme.eatmeserver.web.message;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

public class PlayerMsg {

    @NotNull
    @Size(min=32, max=32)
    private String playerId;

    @Override
    public String toString() {
        return "playerId=" + playerId;
    }

    public String getPlayerId() {
        return playerId;
    }

    public void setPlayerId(String playerId) {
        this.playerId = playerId;
    }

}
