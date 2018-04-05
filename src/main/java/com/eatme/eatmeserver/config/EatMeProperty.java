package com.eatme.eatmeserver.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(value = "eatme", ignoreUnknownFields = false)
public class EatMeProperty {

    public static class WaitingQueue {

        private long capacity;
        private long scheduleFreq;  // ms

        public long getCapacity() {
            return capacity;
        }

        public void setCapacity(long capacity) {
            this.capacity = capacity;
        }

        public long getScheduleFreq() {
            return scheduleFreq;
        }

        public void setScheduleFreq(long scheduleFreq) {
            this.scheduleFreq = scheduleFreq;
        }

    }

    private WaitingQueue waitingQueue;

    public WaitingQueue getWaitingQueue() {
        return waitingQueue;
    }

    public void setWaitingQueue(WaitingQueue waitingQueue) {
        this.waitingQueue = waitingQueue;
    }

}
