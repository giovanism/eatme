"use strict";

let eatme = (() => {

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

    const DEST_ENDPOINT = "/ws/ep";
    const DEST_SUBSCRIBE = "/ws/sb";
    const DEST_BATTLE_WAIT = "/btl/wait";
    const DEST_BATTLE_QUIT_WAIT = "/btl/quit-wait";
    const DEST_BATTLE_QUIT_BATTLE = "/btl/quit-battle";

    const STATE_OFFLINE = "0";
    const STATE_WAITING = "1";
    const STATE_NOT_READY = "2";
    const STATE_READY = "3";
    const STATE_PLAYING = "4";

    const MSG_ERR = "0";
    const MSG_BID = "1";

    const ERR_SERVER = "1"; 
    const ERR_WAITING_QUEUE_PUSH_INVALID = "101";
    const ERR_WAITING_QUEUE_PUSH_FULL = "102";

    let playerId = null;
    let battleId = null;
    let playerState = STATE_OFFLINE;

    const connect = (sucCb, errCb, subscribeCb) => {
        sktMgr.connect(
            DEST_ENDPOINT,
            sucCb,
            errCb,
            DEST_SUBSCRIBE + "/" + playerId,
            (msg) => {
                handleMsg(msg);
                if (subscribeCb) subscribeCb(msg);
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
            send(DEST_BATTLE_WAIT, {playerId: playerId});
            setPlayerState(STATE_WAITING);
        } else {
            throw new Error("Call wait() in state " + playerState);
        }
    }

    const quitWait = () => {
        if (playerState === STATE_WAITING) {
            send(DEST_BATTLE_QUIT_WAIT, {playerId: playerId});
            setPlayerState(STATE_OFFLINE);
        } else {
            throw new Error("Call quitWait() in state " + playerState);
        }
    }

    const quitBattle = () => {
        if (playerState !== STATE_OFFLINE && playerState !== STATE_WAITING) {
            send(DEST_BATTLE_QUIT_BATTLE, {playerId: playerId, battleId: battleId});
            setPlayerState(STATE_OFFLINE);
            battleId = null;
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

    const handleMsg = (msg) => {
        const {headers: {type, state}, body} = msg;
        setPlayerState(state);
        if (type === MSG_BID) {
            battleId = body;
        }
    }

    return {
        connect: connect,
        disconnect: disconnect,
        isConnected: isConnected,
        wait: wait,
        quitWait: quitWait,
        quitBattle: quitBattle,
        genPlayerId: genPlayerId,
        getPlayerId: getPlayerId,
        getPlayerState: getPlayerState,

        STATE_OFFLINE: STATE_OFFLINE,
        STATE_WAITING: STATE_WAITING,
        STATE_NOT_READY: STATE_NOT_READY,
        STATE_READY: STATE_READY,
        STATE_PLAYING: STATE_PLAYING,

        MSG_ERR: MSG_ERR,
        MSG_BID: MSG_BID,

        ERR_SERVER: ERR_SERVER,
        ERR_WAITING_QUEUE_PUSH_INVALID: ERR_WAITING_QUEUE_PUSH_INVALID,
        ERR_WAITING_QUEUE_PUSH_FULL: ERR_WAITING_QUEUE_PUSH_FULL
    }

})();
