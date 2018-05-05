package com.eatme.eatmeserver.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.event.EventListener;

@SuppressWarnings("unused")
@ConfigurationProperties(value = "eatme", ignoreUnknownFields = false)
public class EatMeProperty {

    private static final Logger log = LoggerFactory.getLogger(EatMeProperty.class);

    @Override
    public String toString() {
        String res = null;
        try {
            res = new ObjectMapper().writeValueAsString(this);
        } catch (JsonProcessingException e) {
            log.error(e.toString(), e);
        }
        return res;
    }

    @EventListener(ApplicationReadyEvent.class)
    private void printProperties() {
        log.info("printProperties() | " + toString());
    }

    public static class Debug {

        private boolean delayRequest;
        private boolean delayResponse;

        public boolean isDelayRequest() {
            return delayRequest;
        }

        public void setDelayRequest(boolean delayRequest) {
            this.delayRequest = delayRequest;
        }

        public boolean isDelayResponse() {
            return delayResponse;
        }

        public void setDelayResponse(boolean delayResponse) {
            this.delayResponse = delayResponse;
        }
    }

    public static class Player {

        private int expire;

        public int getExpire() {
            return expire;
        }

        public void setExpire(int expire) {
            this.expire = expire;
        }
    }

    public static class Battle {

        private int capacity;
        private int expire;

        public int getCapacity() {
            return capacity;
        }

        public void setCapacity(int capacity) {
            this.capacity = capacity;
        }

        public int getExpire() {
            return expire;
        }

        public void setExpire(int expire) {
            this.expire = expire;
        }
    }

    public static class Schedule {

        public static class Freq {
            private long info;
            private long battle;
            private long action;

            public long getInfo() {
                return info;
            }

            public void setInfo(long info) {
                this.info = info;
            }

            public long getBattle() {
                return battle;
            }

            public void setBattle(long battle) {
                this.battle = battle;
            }

            public long getAction() {
                return action;
            }

            public void setAction(long action) {
                this.action = action;
            }
        }

        private Freq freq;
        private int poolSize;

        public Freq getFreq() {
            return freq;
        }

        public void setFreq(Freq freq) {
            this.freq = freq;
        }

        public int getPoolSize() {
            return poolSize;
        }

        public void setPoolSize(int poolSize) {
            this.poolSize = poolSize;
        }
    }

    private Debug debug;
    private Player player;
    private Battle battle;
    private Schedule schedule;

    public Debug getDebug() {
        return debug;
    }

    public void setDebug(Debug debug) {
        this.debug = debug;
    }

    public Player getPlayer() {
        return player;
    }

    public void setPlayer(Player player) {
        this.player = player;
    }

    public Battle getBattle() {
        return battle;
    }

    public void setBattle(Battle battle) {
        this.battle = battle;
    }

    public Schedule getSchedule() {
        return schedule;
    }

    public void setSchedule(Schedule schedule) {
        this.schedule = schedule;
    }

}
