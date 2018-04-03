package com.eatme.eatmeserver.web.message;

public class PlayerMsg {

    private String playerId;

    public String getPlayerId() {
        return playerId;
    }

    public void setPlayerId(String playerId) {
        this.playerId = playerId;
    }

    @Override
    public String toString() {
        return "playerId=" + playerId;
    }

}
