package com.eatme.eatmeserver.business.entity;

import java.util.Random;

public class Battle {

    private String id;
    private String player1Id;
    private String player2Id;
    private long randSeed;

    public Battle(String id, String player1Id, String player2Id) {
        this(id, player1Id, player2Id, new Random().nextLong());
    }

    public Battle(String id, String player1Id, String player2Id, long randSeed) {
        this.id = id;
        this.player1Id = player1Id;
        this.player2Id = player2Id;
        this.randSeed = randSeed;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPlayer1Id() {
        return player1Id;
    }

    public void setPlayer1Id(String player1Id) {
        this.player1Id = player1Id;
    }

    public String getPlayer2Id() {
        return player2Id;
    }

    public void setPlayer2Id(String player2Id) {
        this.player2Id = player2Id;
    }

    public long getRandSeed() {
        return randSeed;
    }

    public void setRandSeed(long randSeed) {
        this.randSeed = randSeed;
    }

}
