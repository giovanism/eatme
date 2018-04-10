$(() => {
    "use strict";

    $(window).on("beforeunload", () => {
        quit();
        eatme.disconnect();
    });

    let btnFind = $("button#find-btn");
    let btnReady = $("button#ready-btn");
    let btnQuit = $("button#quit-btn");
    let pPrompt = $("p#prompt");

    btnFind.click(() => {
        disable(btnFind);
        clrInfo();
        show(btnQuit);
        eatme.startCountDown(btnFind, 5, () => {
            if (eatme.getPlayerState() === eatme.STATE_WAITING) {
                quit();
                hide(btnQuit);
                enable(btnFind);
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
                    eatme.stopCountDown();
                    enable(btnFind);
                    setInfo("Failed to connect server. Please try again.");
                },
                (type, data) => {
                    handleMsg(type, data);
                }
            );
        }
    });

    btnReady.click(() => {
        disable(btnReady);
        clrInfo();
        eatme.startCountDown(btnReady, 10, () => {
            if (eatme.getPlayerState() === eatme.STATE_READY) {
                eatme.quitBattle();
                hide(btnReady);
                hide(btnQuit);
                show(btnFind);
                setInfo("Opponent no respond. Please try again.");
            }
        })
        eatme.ready();
    })

    btnQuit.click(() => {
        if (confirm("Are you sure to quit?")) {
            clrInfo();
            eatme.stopCountDown();
            quit();
            hide(btnReady);
            hide(btnQuit);
            show(btnFind);
        }
    })

    function handleMsg(type, data) {
        eatme.stopCountDown();
        if (type === eatme.MSG_ERR) {
            hide(btnReady);
            hide(btnQuit);
            show(btnFind);
            if (data === eatme.ERR_SERVER) {
                setInfo("Server error. Please try again.");
            } else if (data === eatme.ERR_INVALID_STATE) {
                setInfo("Invalid state. Please try again.");
            } else if (data === eatme.ERR_INVALID_BATTLE) {
                setInfo("Invalid battle and player ID. Please try again.");
            } else if (data === eatme.ERR_WAITING_QUEUE_PUSH_FULL) {
                setInfo("Waiting pool is full. Please try again.");
            } else if (data === eatme.ERR_OPPONENT_QUIT) {
                eatme.quitBattle();
                setInfo("Opponent quit. Please try again.");
            }
        } else if (type === eatme.MSG_BID) {
            hide(btnFind);
            show(btnReady);
            show(btnQuit);
            setInfo("Find battle: " + data);
        } else if (type === eatme.MSG_START) {
            hide(btnReady);
            let state = eatme.getPlayerState();
            if (state === eatme.STATE_ATTACKING) {
                setInfo("Attacking!");
            } else if (state === eatme.STATE_DEFENDING) {
                setInfo("Defending!");
            }
        }
    }

    function quit() {
        let state = eatme.getPlayerState();
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
        pPrompt.text(info);
    }

    function clrInfo() {
        pPrompt.text("");
    }

})
