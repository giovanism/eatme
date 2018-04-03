"use strict";

let eatme = (function () {

    const DEST_ENDPOINT = "/wbskt/ep";
    const DEST_SUBSCRIBE = "/wbskt/sb";
    const DEST_BATTLE_WAIT = "/battle/wait";
    const DEST_BATTLE_QUIT_WAIT = "/battle/quit-wait";

    let playerId = null;
    let sktMgr = new WebSocketManager();

    let connect = function (sucCb, errCb, subscribeCb) {
        sktMgr.connect(
            DEST_ENDPOINT,
            sucCb,
            errCb,
            DEST_SUBSCRIBE + "/" + playerId,
            function (msg) {
                onMsgReceived(msg);
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
    }

    let quitWait = function () {
        send(DEST_BATTLE_QUIT_WAIT, {playerId: playerId});
    }

    let genPlayerId = function () {
        playerId = "playerId1234567";
        // TODO
    }

    let getPlayerId = function () {
        return playerId;
    }

    let onMsgReceived = function (msg) {
        // TODO
    }

    return {
        connect: connect,
        disconnect: disconnect,
        isConnected: isConnected,
        wait: wait,
        quitWait: quitWait,
        genPlayerId: genPlayerId,
        getPlayerId: getPlayerId,
    }

})();
