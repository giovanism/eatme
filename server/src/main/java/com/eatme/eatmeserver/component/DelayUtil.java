package com.eatme.eatmeserver.component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;

@SuppressWarnings("unused")
@Component
public class DelayUtil {

    private static final Logger log = LoggerFactory.getLogger(DelayUtil.class);
    private static final long DELAY_MIN = 0;     // ms
    private static final long DELAY_MAX = 1000;  // ms

    /**
     * 50% probability: sleep current thread.
     * 50% probability: do nothing.
     *
     * @return Slept milliseconds
     */
    public long randDelay() {
        if (ThreadLocalRandom.current().nextInt(10000) < 5000) {
            return 0;
        }
        long ms = ThreadLocalRandom.current().nextLong(DELAY_MIN, DELAY_MAX);
        try {
            Thread.sleep(ms);
        } catch (Exception e) {
            log.error(e.toString(), e);
        }
        return ms;
    }

}
