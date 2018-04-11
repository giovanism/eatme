package com.eatme.eatmeserver.business.entity;

public class Player {

    private String id;
    private PlayerState state;
    private PlayerAction action;

    public Player(String id, PlayerState state) {
        this(id, state, PlayerAction.NO_ACTION);
    }

    public Player(String id, String rawState, String rawAction) {
        this(id, PlayerState.values()[Integer.parseInt(rawState)],
            PlayerAction.values()[Integer.parseInt(rawAction)]);
    }

    public Player(String id, PlayerState state, PlayerAction action) {
        this.id = id;
        this.state = state;
        this.action = action;
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

}
