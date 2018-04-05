"use strict";

let eatme = (function () {

    // Manage websocket connection
    const sktMgr = (function () {
        
        let stompClient = null;

        const connect = function (connDest, sucCb, errCb, subscribeDest, subscribeCb) {
            stompClient = Stomp.over(new SockJS(connDest));
            stompClient.connect({}, function (frame) {
                console.log("[WebSocketManager] connect suc:\n" + frame);
                stompClient.subscribe(subscribeDest, subscribeCb);
                if (sucCb) sucCb(frame);
            }, function (err) {
                console.log("[WebSocketManager] connect fail:\n" + err);
                stompClient = null;
                if (errCb) errCb(err);
            });
        }

        const disconnect = function () {
            if (stompClient) {
                stompClient.disconnect();
            }
            console.log("[WebSocketManager] disconnected");
        }

        const isConnected = function () {
            return !!stompClient;
        }

        const send = function (dest, obj) {
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

    const DEST_ENDPOINT = "/wbskt/ep";
    const DEST_SUBSCRIBE = "/wbskt/sb";
    const DEST_BATTLE_WAIT = "/battle/wait";
    const DEST_BATTLE_QUIT_WAIT = "/battle/quit-wait";
    const DEST_BATTLE_QUIT_BATTLE = "/battle/quit-battle";

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

    const connect = function (sucCb, errCb, subscribeCb) {
        sktMgr.connect(
            DEST_ENDPOINT,
            sucCb,
            errCb,
            DEST_SUBSCRIBE + "/" + playerId,
            function (msg) {
                handleMsg(msg);
                if (subscribeCb) subscribeCb(msg);
            }
        );
    }

    const disconnect = function () {
        sktMgr.disconnect();
    }

    const isConnected = function () {
        return sktMgr.isConnected();
    }

    const send = function (dest, obj) {
        sktMgr.send(dest, obj);
    }

    const wait = function () {
        if (playerState === STATE_OFFLINE) {
            send(DEST_BATTLE_WAIT, {playerId: playerId});
            setPlayerState(STATE_WAITING);
        }
    }

    const quitWait = function () {
        if (playerState === STATE_WAITING) {
            send(DEST_BATTLE_QUIT_WAIT, {playerId: playerId});
            setPlayerState(STATE_OFFLINE);
        }
    }

    const quitBattle = function () {
        if (playerState !== STATE_OFFLINE && playerState !== STATE_WAITING) {
            send(DEST_BATTLE_QUIT_BATTLE, {playerId: playerId, battleId: battleId});
            setPlayerState(STATE_OFFLINE);
            battleId = null;
        }
    }

    const genPlayerId = function () {
        playerId = UUID.generate().replace(/-/g, "");
    }

    const getPlayerId = function () {
        return playerId;
    }

    const getPlayerState = function () {
        return playerState;
    }

    const setPlayerState = function (state) {
        playerState = state;
        console.log("state: " + state);
    }

    const handleMsg = function (msg) {
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
