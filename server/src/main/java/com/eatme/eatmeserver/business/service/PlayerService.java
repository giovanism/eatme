package com.eatme.eatmeserver.business.service;

import com.eatme.eatmeserver.ErrCode;
import com.eatme.eatmeserver.business.entity.Player;
import com.eatme.eatmeserver.business.entity.PlayerState;
import com.eatme.eatmeserver.business.repository.PlayerRepository;
import com.eatme.eatmeserver.business.repository.WaitingQueueRepository;
import com.eatme.eatmeserver.config.EatMeProperty;
import com.eatme.eatmeserver.util.RedisTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.stereotype.Service;

@SuppressWarnings("unused")
@Service
public class PlayerService {

    private static final Logger log = LoggerFactory.getLogger(PlayerService.class);

    @Autowired
    private EatMeProperty eatMeProp;

    @Autowired
    private PlayerRepository playerRepo;

    @Autowired
    private WaitingQueueRepository waitingQueueRepo;

    @Autowired
    private RedisTransaction redisTransaction;

    public int wait(String playerId) {
        final String LOG_HEADER = "wait() | playerId=" + playerId;
        try {
            Player player = playerRepo.findById(playerId);
            log.info(LOG_HEADER + " | found player: " + player.toString());
            if (player.getState() != PlayerState.OFFLINE) {
                return ErrCode.ERR_INVALID_STATE;
            }
            synchronized (PlayerService.class) {  // Ensure queue size consistency
                long size = waitingQueueRepo.size();
                long capacity = eatMeProp.getWaitingQueue().getCapacity();
                log.info(LOG_HEADER + " | queue_size=" + size + " | queue_capacity=" + capacity);
                if (size >= capacity) {
                    return ErrCode.ERR_WAITING_QUEUE_PUSH_FULL;
                }
                redisTransaction.exec(new RedisTransaction.Callback() {
                    @Override
                    public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                        player.setState(PlayerState.WAITING);
                        playerRepo.createOrUpdate(player);
                        waitingQueueRepo.push(player.getId());
                    }
                });
            }
            return 0;
        } catch (Exception e) {
            log.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

    public int quitWait(String playerId) {
        final String LOG_HEADER = "quitWait() | playerId=" + playerId;
        try {
            Player player = playerRepo.findById(playerId);
            log.info(LOG_HEADER + " | found player: " + player.toString());
            if (player.getState() != PlayerState.WAITING) {
                return ErrCode.ERR_INVALID_STATE;
            }
            redisTransaction.exec(new RedisTransaction.Callback() {
                @Override
                public <K, V> void enqueueOperations(RedisOperations<K, V> operations) {
                    playerRepo.delById(playerId);
                    waitingQueueRepo.del(playerId);
                }
            });
            return 0;
        } catch (Exception e) {
            log.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

}
