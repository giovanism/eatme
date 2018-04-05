package com.eatme.eatmeserver.business.service;

import com.eatme.eatmeserver.ErrCode;
import com.eatme.eatmeserver.business.entity.Player;
import com.eatme.eatmeserver.business.entity.PlayerState;
import com.eatme.eatmeserver.business.repository.PlayerRepository;
import com.eatme.eatmeserver.business.repository.WaitingQueueRepository;
import com.eatme.eatmeserver.config.EatMeProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.SessionCallback;
import org.springframework.stereotype.Service;

@SuppressWarnings("unused")
@Service
public class PlayerService {

    private static final Logger LOG = LoggerFactory.getLogger(PlayerService.class);

    @Autowired
    private EatMeProperty eatMeProp;

    @Autowired
    private PlayerRepository playerRepo;

    @Autowired
    private WaitingQueueRepository waitingQueueRepo;

    public int wait(String playerId) {
        try {
            Player player = playerRepo.findById(playerId);
            if (player.getState() != PlayerState.OFFLINE) {
                return ErrCode.ERR_WAITING_QUEUE_PUSH_INVALID;
            }
            if (waitingQueueRepo.size() >= eatMeProp.getWaitingQueue().getCapacity()) {
                return ErrCode.ERR_WAITING_QUEUE_PUSH_FULL;
            }
            return playerRepo.execute(new SessionCallback<Integer>() {
                @Override
                public <K, V> Integer execute(RedisOperations<K, V> operations) throws DataAccessException {
                    operations.multi();
                    player.setState(PlayerState.WAITING);
                    playerRepo.createOrUpdate(player);
                    waitingQueueRepo.push(player.getId());
                    operations.exec();
                    return 0;
                }
            });
        } catch (Exception e) {
            LOG.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

    public int quitWait(String playerId) {
        try {
            Player player = playerRepo.findById(playerId);
            if (player.getState() != PlayerState.WAITING) {
                return 0;
            }
            return playerRepo.execute(new SessionCallback<Integer>() {
                @Override
                public <K, V> Integer execute(RedisOperations<K, V> operations) throws DataAccessException {
                    operations.multi();
                    playerRepo.delById(playerId);
                    waitingQueueRepo.del(playerId);
                    operations.exec();
                    return 0;
                }
            });
        } catch (Exception e) {
            LOG.error(e.toString(), e);
            return ErrCode.ERR_SERVER;
        }
    }

}
