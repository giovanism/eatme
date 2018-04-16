package com.eatme.eatmeserver.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;

@SuppressWarnings("unused")
@Configuration
@EnableScheduling
public class BattleScheduleConfig implements SchedulingConfigurer {

    private static final Logger log = LoggerFactory.getLogger(BattleScheduleConfig.class);

    @Autowired
    private EatMeProperty eatMeProp;

    @Bean
    public TaskScheduler battleTaskScheduler() {  // Schedule actions broadcast
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(eatMeProp.getSchedule().getPoolSize());
        scheduler.setThreadNamePrefix("ActionBrdcst-");
        scheduler.setRemoveOnCancelPolicy(true);
        log.info("Creating bean \'battleTaskScheduler\'");
        return scheduler;
    }

    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {  // Schedule battle
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(Runtime.getRuntime().availableProcessors());
        scheduler.setThreadNamePrefix("BattleSched-");
        scheduler.setRemoveOnCancelPolicy(true);
        scheduler.initialize();
        taskRegistrar.setTaskScheduler(scheduler);
    }

}
