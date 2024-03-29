package com.eatme.eatmeserver.business.entity;

import java.util.Random;

public class Battle {

    private static final Random random = new Random();

    private String id;
    private String player1Id;
    private String player2Id;
    private long randSeed;

    public Battle(String id, String player1Id, String player2Id) {
        this(id, player1Id, player2Id, random.nextLong());
    }

    public Battle(String id, String player1Id, String player2Id, String rawSeed) {
        this(id, player1Id, player2Id, Long.parseLong(rawSeed));
    }

    public Battle(String id, String player1Id, String player2Id, long randSeed) {
        this.id = id;
        this.player1Id = player1Id;
        this.player2Id = player2Id;
        this.randSeed = randSeed;
    }

    @Override
    public String toString() {
        return "battleId=" + id + "&player1Id=" + player1Id
            + "&player2Id=" + player2Id + "randSeed=" + randSeed;
    }

    public void resetSeed() {
        randSeed = random.nextLong();
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
