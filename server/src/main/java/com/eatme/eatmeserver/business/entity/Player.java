package com.eatme.eatmeserver.business.entity;

public class Player {

    private String id;
    private PlayerState state;
    private PlayerAction action;

    public Player(String id, PlayerState state) {
        this(id, state, PlayerAction.NO_ACTION);
    }

    public Player(String id, PlayerState state, PlayerAction action) {
        this.id = id;
        this.state = state;
        this.action = action;
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

}
