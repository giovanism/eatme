"use strict";

let eatme = (function () {

    const DEST_ENDPOINT = "/wbskt/ep";
    const DEST_SUBSCRIBE = "/wbskt/sb";
    const DEST_BATTLE_WAIT = "/battle/wait";
    const DEST_BATTLE_QUIT_WAIT = "/battle/quit-wait";

    const STATE_OFFLINE = 0;
    const STATE_WAITING = 1;
    const STATE_NOT_READY = 2;
    const STATE_READY = 3;
    const STATE_PLAYING = 4;

    let playerId = null;
    let playerState = STATE_OFFLINE;
    let sktMgr = new WebSocketManager();

    let connect = function (sucCb, errCb, subscribeCb) {
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

    let disconnect = function () {
        sktMgr.disconnect();
    }

    let isConnected = function () {
        return sktMgr.isConnected();
    }

    let send = function (dest, obj) {
        sktMgr.send(dest, obj);
    }

    let wait = function () {
        send(DEST_BATTLE_WAIT, {playerId: playerId});
        setPlayerState(STATE_WAITING);
    }

    let quitWait = function () {
        send(DEST_BATTLE_QUIT_WAIT, {playerId: playerId});
        setPlayerState(STATE_OFFLINE);
    }

    let genPlayerId = function () {
        // TODO
        playerId = "playerId1234567";
    }

    let getPlayerId = function () {
        return playerId;
    }

    let getPlayerState = function () {
        return playerState;
    }

    let setPlayerState = function (state) {
        playerState = state;
        console.log("player state: " + state);
    }

    let handleMsg = function (msg) {
        // TODO
        setPlayerState(STATE_NOT_READY);
    }

    return {
        STATE_OFFLINE: STATE_OFFLINE,
        STATE_WAITING: STATE_WAITING,
        STATE_NOT_READY: STATE_NOT_READY,
        STATE_READY: STATE_READY,
        STATE_PLAYING: STATE_PLAYING,

        connect: connect,
        disconnect: disconnect,
        isConnected: isConnected,
        wait: wait,
        quitWait: quitWait,
        genPlayerId: genPlayerId,
        getPlayerId: getPlayerId,
        getPlayerState: getPlayerState,
    }

})();
