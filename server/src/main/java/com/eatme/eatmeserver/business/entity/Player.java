package com.eatme.eatmeserver.business.entity;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

public class Player {

    private static final Logger log = LoggerFactory.getLogger(Player.class);

    private String id;
    private PlayerState state = PlayerState.OFFLINE;
    private PlayerAction action = PlayerAction.NO_ACTION;
    private String serverIp = "";
    private int serverPort = 0;

    public Player(String id, List<String> raw) {
        this.id = id;
        if (raw == null) {
            log.error("Player() | null param \'raw\'");
            return;
        }

        String rawState = raw.get(0);
        String rawAction = raw.get(1);
        String serverIp = raw.get(2);
        String rawServerPort = raw.get(3);
        if (rawState != null && rawAction != null && serverIp != null && rawServerPort != null) {
            this.state = PlayerState.values()[Integer.parseInt(rawState)];
            this.action = PlayerAction.values()[Integer.parseInt(rawAction)];
            this.serverIp = serverIp;
            this.serverPort = Integer.parseInt(rawServerPort);
        }
    }

    public boolean isPlaying() {
        return state == PlayerState.ATTACKING || state == PlayerState.DEFENDING;
    }

    @Override
    public String toString() {
        return "playerId=" + id + "&state=" + state.ordinal() + "&action=" + action.ordinal();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public PlayerState getState() {
        return state;
    }

    public void setState(PlayerState state) {
        this.state = state;
    }

    public PlayerAction getAction() {
        return action;
    }

    public void setAction(PlayerAction action) {
        this.action = action;
    }

    public String getServerIp() {
        return serverIp;
    }

    public void setServerIp(String serverIp) {
        this.serverIp = serverIp;
    }

    public int getServerPort() {
        return serverPort;
    }

    public void setServerPort(int serverPort) {
        this.serverPort = serverPort;
    }

}
