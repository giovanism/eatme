module.exports = (() => {

    const DEST_ENDPOINT = "/ws/ep";
    const DEST_SUBSCRIBE = "/ws/sb";
    const DEST_WAIT = "/btl/wait";
    const DEST_READY = "/btl/ready";
    const DEST_ACTION = "/btl/action";
    const DEST_QUIT_WAIT = "/btl/quit-wait";
    const DEST_QUIT_BATTLE = "/btl/quit-btl";

    const STATE_OFFLINE = "0";
    const STATE_WAITING = "1";
    const STATE_NOT_READY = "2";
    const STATE_READY = "3";
    const STATE_ATTACKING = "4";
    const STATE_DEFENDING = "5";

    const ACTION_LEFT = "1";
    const ACTION_UP = "2";
    const ACTION_RIGHT = "3";
    const ACTION_DOWN = "4";

    const MSG_SEPARATOR = "|";
    const MSG_ERR = "0";
    const MSG_BID = "1";
    const MSG_START = "2";
    const MSG_OPPONENT_ACTION = "3";

    const ERR_SERVER = "1"; 
    const ERR_INVALID_STATE = "2";
    const ERR_INVALID_BATTLE = "3";
    const ERR_WAITING_QUEUE_PUSH_FULL = "100";
    const ERR_OPPONENT_QUIT = "200";

    const INTERVAL_ACTION = 1000;  // ms

    const FREQ_SWITCH = 10;
    const FREQ_FOOD = 5;

    const sktMgr = require("./sktmgr.js");  // Manage websocket connection
    const timer = require("./timer.js");

    let playerId = null;
    let playerState = STATE_OFFLINE;

    let battleId = null;
    let random = null;

    let steps = 0;
    let lastAction = null;
    let nextAction = null;
    let lastActionFinished = true;

    let onTakingActions = null;
    let onCreatingFood = null;
    let onSwitchingRole = null;

    const getPlayerId = () => playerId;

    const getPlayerState = () => playerState;

    const isPlaying = () => {
        return playerState === STATE_ATTACKING
            || playerState === STATE_DEFENDING;
    }

    const setPlayerState = state => {
        playerState = state;
        console.log("state: " + state);
    }

    const setNextAction = action => { nextAction = action }

    const setOnTakingActions = cb => { onTakingActions = cb; }

    const setOnCreatingFood = cb => { onCreatingFood = cb; }

    const setOnSwitchingRole = cb => { onSwitchingRole = cb; }

    const genPlayerId = () => {
        if (!playerId) playerId = UUID.generate().replace(/-/g, "");
    }

    const reset = clrPlayerId => {
        if (clrPlayerId === true) playerId = null;
        setPlayerState(STATE_OFFLINE);
        battleId = null;
        random = null;
        steps = 0;
        lastAction = null;
        nextAction = null;
        lastActionFinished = true;
    }

    const connect = (sucCb, errCb, subscribeCb) => {
        sktMgr.connect(
            DEST_ENDPOINT,
            sucCb,
            err => {
                reset(true);
                if (errCb) errCb(err);
            },
            DEST_SUBSCRIBE + "/" + playerId,
            msg => { handleMsg(msg.body, subscribeCb); }
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
            send(DEST_WAIT, {
                playerId: playerId
            });
            setPlayerState(STATE_WAITING);
        } else {
            throw new Error("Call wait() in state " + playerState);
        }
    }

    const quitWait = () => {
        if (playerState === STATE_WAITING) {
            send(DEST_QUIT_WAIT, {
                playerId: playerId
            });
            reset();
        } else {
            throw new Error("Call quitWait() in state " + playerState);
        }
    }

    const ready = () => {
        if (playerState === STATE_NOT_READY) {
            send(DEST_READY, {
                playerId: playerId,
                battleId: battleId
            });
            setPlayerState(STATE_READY);
        } else {
            throw new Error("Call ready() in state " + playerState);
        }
    }

    const action = () => {
        if (playerState === STATE_ATTACKING || playerState === STATE_DEFENDING) {
            send(DEST_ACTION, {
                playerId: playerId,
                battleId: battleId,
                action: Number(nextAction)
            });
            lastAction = nextAction;
            lastActionFinished = false;
        } else {
            throw new Error("Call action() in state " + playerState);
        }
    }

    const quitBattle = () => {
        if (playerState !== STATE_OFFLINE && playerState !== STATE_WAITING) {
            send(DEST_QUIT_BATTLE, {
                playerId: playerId,
                battleId: battleId
            });
            reset();
        } else {
            throw new Error("Call quitBattle() in state " + playerState);
        }
    }

    const startMainLoop = () => {
        timer.startLoop(INTERVAL_ACTION, () => {
            if (isPlaying() && lastActionFinished && nextAction) action();
        });
    }

    const stopMainLoop = () => {
        timer.stopLoop();
    }

    const handleMsg = (msgBody, cb) => {
        const [type, data1, data2] = msgBody.split(MSG_SEPARATOR, 3);
        if (type === MSG_ERR) {
            handleErrMsg(data1);
        } else if (type === MSG_BID) {
            handleBattleMsg(data1);
        } else if (type === MSG_START) {
            handleStartMsg(data1, data2 === "1");
        } else if (type === MSG_OPPONENT_ACTION) {
            handleOpponentActionMsg(data1);
        }
        if (cb) cb(type, data1, data2);
    }

    const handleErrMsg = errCode => {
        if (errCode === ERR_SERVER) {
            setPlayerState(STATE_OFFLINE);
        } else if (errCode === ERR_INVALID_STATE) {
            setPlayerState(STATE_OFFLINE);
        } else if (errCode === ERR_INVALID_BATTLE) {
            setPlayerState(STATE_OFFLINE);
        } else if (errCode === ERR_WAITING_QUEUE_PUSH_FULL) {
            setPlayerState(STATE_OFFLINE);
        }
    }

    const handleBattleMsg = id => {
        battleId = id;
        setPlayerState(STATE_NOT_READY);
    }

    const handleStartMsg = (randSeed, attack) => {
        steps = 0;
        random = new Math.seedrandom(randSeed);
        setPlayerState(attack ? STATE_ATTACKING : STATE_DEFENDING);
    }

    const handleOpponentActionMsg = opponentAction => {
        if (onTakingActions) onTakingActions(lastAction, opponentAction);
        ++steps;
        if (steps % FREQ_FOOD === 0) {
            const foodPos = random.int32();
            if (onCreatingFood) onCreatingFood(foodPos);
        }
        if (steps % FREQ_SWITCH === 0) {
            setPlayerState(playerState === STATE_ATTACKING ? STATE_DEFENDING : STATE_ATTACKING);
            if (onSwitchingRole) onSwitchingRole();
        }
        lastActionFinished = true;
    }

    return {
        STATE_OFFLINE: STATE_OFFLINE,
        STATE_WAITING: STATE_WAITING,
        STATE_NOT_READY: STATE_NOT_READY,
        STATE_READY: STATE_READY,
        STATE_ATTACKING: STATE_ATTACKING,
        STATE_DEFENDING: STATE_DEFENDING,

        ACTION_LEFT: ACTION_LEFT,
        ACTION_UP: ACTION_UP,
        ACTION_RIGHT: ACTION_RIGHT,
        ACTION_DOWN: ACTION_DOWN,

        MSG_ERR: MSG_ERR,
        MSG_BID: MSG_BID,
        MSG_START: MSG_START,
        MSG_OPPONENT_ACTION: MSG_OPPONENT_ACTION,

        ERR_SERVER: ERR_SERVER,
        ERR_INVALID_STATE: ERR_INVALID_STATE,
        ERR_INVALID_BATTLE: ERR_INVALID_BATTLE,
        ERR_WAITING_QUEUE_PUSH_FULL: ERR_WAITING_QUEUE_PUSH_FULL,
        ERR_OPPONENT_QUIT: ERR_OPPONENT_QUIT,

        getPlayerState: getPlayerState,
        isPlaying: isPlaying,

        setNextAction: setNextAction,
        setOnTakingActions: setOnTakingActions,
        setOnCreatingFood: setOnCreatingFood,
        setOnSwitchingRole: setOnSwitchingRole,

        genPlayerId: genPlayerId,

        connect: connect,
        disconnect: disconnect,
        isConnected: isConnected,

        wait: wait,
        quitWait: quitWait,
        ready: ready,
        quitBattle: quitBattle,

        startCountDown: timer.startCountDown,
        stopCountDown: timer.stopCountDown,

        startMainLoop: startMainLoop,
        stopMainLoop: stopMainLoop
    }

})();