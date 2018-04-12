$(() => {

    const eatme = require("./eatme.js");

    const btnFind = $("button#find-btn");
    const btnReady = $("button#ready-btn");
    const btnQuit = $("button#quit-btn");
    const pPrompt = $("p#prompt");

    $(window).on("beforeunload", () => {
        quit();
        eatme.disconnect();
    });

    $(document).keydown((event) => {
        if (eatme.isPlaying()) {
            if (event.which === 37) {
                eatme.setNextAction(eatme.ACTION_LEFT);
            } else if (event.which === 38) {
                eatme.setNextAction(eatme.ACTION_UP);
            } else if (event.which === 39) {
                eatme.setNextAction(eatme.ACTION_RIGHT);
            } else if (event.which === 40) {
                eatme.setNextAction(eatme.ACTION_DOWN);
            }
        }
    })

    btnFind.click(() => {
        disable(btnFind);
        clrInfo();
        show(btnQuit);
        eatme.startCountDown(btnFind, 5, () => {
            if (eatme.getPlayerState() === eatme.STATE_WAITING) {
                resetToFind();
                quit();
                setInfo("Timeout. Please try again.");
            }
        })
        if (!eatme.getPlayerId()) {
            eatme.genPlayerId();
        }
        if (eatme.isConnected()) {
            eatme.wait();
        } else {
            eatme.connect(eatme.wait,
                (err) => {
                    resetToFind();
                    setInfo("Failed to connect server. Please try again.");
                },
                handleData
            );
        }
    });

    btnReady.click(() => {
        disable(btnReady);
        clrInfo();
        eatme.startCountDown(btnReady, 10, () => {
            if (eatme.getPlayerState() === eatme.STATE_READY) {
                resetToFind();
                eatme.quitBattle();
                setInfo("Opponent no respond. Please try again.");
            }
        })
        eatme.ready();
    })

    btnQuit.click(() => {
        if (confirm("Are you sure to quit?")) {
            resetToFind();
            clrInfo();
            quit();
        }
    })

    eatme.setOnBothActionPrepared((myAction, opponentAction) => {
        appendInfo("(" + myAction + "," + opponentAction + ")");
    })

    function handleData(type, data1, data2) {
        eatme.stopCountDown();
        if (type === eatme.MSG_ERR) {
            const errCode = data1;
            resetToFind();
            if (errCode === eatme.ERR_SERVER) {
                setInfo("Server error. Please try again.");
            } else if (errCode === eatme.ERR_INVALID_STATE) {
                setInfo("Invalid state. Please try again.");
            } else if (errCode === eatme.ERR_INVALID_BATTLE) {
                setInfo("Invalid battle and player ID. Please try again.");
            } else if (errCode === eatme.ERR_WAITING_QUEUE_PUSH_FULL) {
                setInfo("Waiting pool is full. Please try again.");
            } else if (errCode === eatme.ERR_OPPONENT_QUIT) {
                eatme.quitBattle();
                setInfo("Opponent quit. Please try again.");
            }
        } else if (type === eatme.MSG_BID) {
            const battleId = data1;
            hide(btnFind);
            show(btnReady);
            show(btnQuit);
            setInfo("Find battle: " + battleId);
        } else if (type === eatme.MSG_START) {
            hide(btnReady);
            const state = eatme.getPlayerState();
            if (state === eatme.STATE_ATTACKING) {
                setInfo("Attacking!");
            } else if (state === eatme.STATE_DEFENDING) {
                setInfo("Defending!");
            }
            eatme.startMainLoop();
        }
    }

    function resetToFind() {
        eatme.stopCountDown();
        eatme.stopMainLoop();
        hide(btnReady);
        hide(btnQuit);
        show(btnFind);
    }

    function quit() {
        const state = eatme.getPlayerState();
        if (state === eatme.STATE_OFFLINE) {
            return;
        }
        if (state === eatme.STATE_WAITING) {
            eatme.quitWait();
        } else {
            eatme.quitBattle();
        }
    }

    function enable(ele) {
        ele.prop("disabled", false);
    }

    function disable(ele) {
        ele.prop("disabled", true);
    }

    function show(ele) {
        enable(ele);
        ele.show();
    }

    function hide(ele) {
        disable(ele);
        ele.hide();
    }

    function setInfo(info) {
        pPrompt.html(info);
    }

    function appendInfo(info) {
        pPrompt.html(pPrompt.html() + info);
    }

    function clrInfo() {
        pPrompt.text("");
    }

})
