package com.eatme.eatmeserver.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@SuppressWarnings("unused")
@ConfigurationProperties(value = "eatme", ignoreUnknownFields = false)
public class EatMeProperty {

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

    public static class WaitingQueue {
        private long capacity;

        public long getCapacity() {
            return capacity;
        }

        public void setCapacity(long capacity) {
            this.capacity = capacity;
        }
    }

    public static class Schedule {

        public static class Freq {
            private long info;    // ms
            private long battle;  // ms
            private long action;  // ms

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
    private WaitingQueue waitingQueue;
    private Schedule schedule;

    public Debug getDebug() {
        return debug;
    }

    public void setDebug(Debug debug) {
        this.debug = debug;
    }

    public WaitingQueue getWaitingQueue() {
        return waitingQueue;
    }

    public void setWaitingQueue(WaitingQueue waitingQueue) {
        this.waitingQueue = waitingQueue;
    }

    public Schedule getSchedule() {
        return schedule;
    }

    public void setSchedule(Schedule schedule) {
        this.schedule = schedule;
    }

}
