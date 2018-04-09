let eatme = (() => {
    "use strict";

    // Manage websocket connection
    const sktMgr = (() => {

        let stompClient = null;

        const connect = (connDest, sucCb, errCb, subscribeDest, subscribeCb) => {
            stompClient = Stomp.over(new SockJS(connDest));
            stompClient.connect({},
                (frame) => {
                    console.log("[WebSocketManager] connect suc:\n" + frame);
                    stompClient.subscribe(subscribeDest, subscribeCb);
                    if (sucCb) sucCb(frame);
                },
                (err) => {
                    console.log("[WebSocketManager] connect fail:\n" + err);
                    stompClient = null;
                    if (errCb) errCb(err);
                }
            );
        }

        const disconnect = () => {
            if (stompClient) {
                stompClient.disconnect();
            }
            console.log("[WebSocketManager] disconnected");
        }

        const isConnected = () => {
            return !!stompClient;
        }

        const send = (dest, obj) => {
            if (stompClient) {
                stompClient.send(dest, {}, JSON.stringify(obj));
            }
        }

        return {
            connect: connect,
            disconnect: disconnect,
            isConnected: isConnected,
            send: send
        }

    })();

    // Manage countdown
    const timer = (function () {

        let timerId = null;
        let element = null;
        let oriContent = null;

        const startCountDown = (ele, seconds, cb) => {
            stopCountDown();
            element = ele;
            oriContent = ele.html();
            ele.html(--seconds);
            timerId = setInterval(() => {
                --seconds;
                if (seconds === -1) {
                    stopCountDown();
                    if (cb) cb();
                } else {
                    ele.html(seconds);
                }
            }, 1000);
        }

        const stopCountDown = () => {
            if (timerId) clearInterval(timerId);
            if (element && oriContent) {
                element.html(oriContent);
            }
            timerId = null;
            element = null;
            oriContent = null;
        }

        return {
            startCountDown: startCountDown,
            stopCountDown: stopCountDown
        }

    })();

    const DEST_ENDPOINT = "/ws/ep";
    const DEST_SUBSCRIBE = "/ws/sb";
    const DEST_BATTLE_WAIT = "/btl/wait";
    const DEST_BATTLE_READY = "/btl/ready";
    const DEST_BATTLE_QUIT_WAIT = "/btl/quit-wait";
    const DEST_BATTLE_QUIT_BATTLE = "/btl/quit-battle";

    const STATE_OFFLINE = "0";
    const STATE_WAITING = "1";
    const STATE_NOT_READY = "2";
    const STATE_READY = "3";
    const STATE_ATTACKING = "4";
    const STATE_DEFENDING = "5";

    const MSG_ERR = "0";
    const MSG_BID = "1";
    const MSG_START = "2";

    const ERR_SERVER = "1"; 
    const ERR_INVALID_STATE = "2";
    const ERR_INVALID_BATTLE = "3";
    const ERR_WAITING_QUEUE_PUSH_FULL = "100";
    const ERR_OPPONENT_QUIT = "200";

    let playerId = null;
    let playerState = STATE_OFFLINE;

    let battleId = null;
    let randSeed = null;

    const connect = (sucCb, errCb, subscribeCb) => {
        sktMgr.connect(
            DEST_ENDPOINT,
            sucCb,
            errCb,
            DEST_SUBSCRIBE + "/" + playerId,
            (msg) => {
                const chunks = msg.body.split("|", 3);
                handleMsg(chunks[1], chunks[2], chunks[0], subscribeCb);
            }
        );
    }

    const disconnect = () => {
        sktMgr.disconnect();
    }

    const isConnected = () => {
        return sktMgr.isConnected();
    }

    const send = (dest, obj) => {
        sktMgr.send(dest, obj);
    }

    const wait = () => {
        if (playerState === STATE_OFFLINE) {
            setPlayerState(STATE_WAITING);
            send(DEST_BATTLE_WAIT, {playerId: playerId});
        } else {
            throw new Error("Call wait() in state " + playerState);
        }
    }

    const quitWait = () => {
        if (playerState === STATE_WAITING) {
            setPlayerState(STATE_OFFLINE);
            send(DEST_BATTLE_QUIT_WAIT, {playerId: playerId});
        } else {
            throw new Error("Call quitWait() in state " + playerState);
        }
    }

    const ready = () => {
        if (playerState === STATE_NOT_READY) {
            setPlayerState(STATE_READY);
            send(DEST_BATTLE_READY, {playerId: playerId, battleId: battleId});
        } else {
            throw new Error("Call ready() in state " + playerState);
        }
    }

    const quitBattle = () => {
        if (playerState !== STATE_OFFLINE && playerState !== STATE_WAITING) {
            setPlayerState(STATE_OFFLINE);
            send(DEST_BATTLE_QUIT_BATTLE, {playerId: playerId, battleId: battleId});
            battleId = null;
            randSeed = null;
        } else {
            throw new Error("Call quitBattle() in state " + playerState);
        }
    }

    const genPlayerId = () => {
        playerId = UUID.generate().replace(/-/g, "");
    }

    const getPlayerId = () => {
        return playerId;
    }

    const getPlayerState = () => {
        return playerState;
    }

    const setPlayerState = (state) => {
        playerState = state;
        console.log("state: " + state);
    }

    const handleMsg = (type, data, nextState, cb) => {
        setPlayerState(nextState);
        if (type === MSG_BID) {
            battleId = data;
        } else if (type === MSG_START) {
            randSeed = data;
        }
        if (cb) cb(type, data);
    }

    return {
        connect: connect,
        disconnect: disconnect,
        isConnected: isConnected,

        wait: wait,
        ready: ready,
        quitWait: quitWait,
        quitBattle: quitBattle,

        genPlayerId: genPlayerId,
        getPlayerId: getPlayerId,
        getPlayerState: getPlayerState,

        startCountDown: timer.startCountDown,
        stopCountDown: timer.stopCountDown,

        STATE_OFFLINE: STATE_OFFLINE,
        STATE_WAITING: STATE_WAITING,
        STATE_NOT_READY: STATE_NOT_READY,
        STATE_READY: STATE_READY,
        STATE_ATTACKING: STATE_ATTACKING,
        STATE_DEFENDING: STATE_DEFENDING,

        MSG_ERR: MSG_ERR,
        MSG_BID: MSG_BID,
        MSG_START: MSG_START,

        ERR_SERVER: ERR_SERVER,
        ERR_INVALID_STATE: ERR_INVALID_STATE,
        ERR_INVALID_BATTLE: ERR_INVALID_BATTLE,
        ERR_WAITING_QUEUE_PUSH_FULL: ERR_WAITING_QUEUE_PUSH_FULL,
        ERR_OPPONENT_QUIT: ERR_OPPONENT_QUIT
    }

})();
