"use strict";

$(() => {

    $(window).on("beforeunload", () => {
        quit();
        eatme.disconnect();
    });

    let btnFind = $("button#find-btn");
    let btnReady = $("button#ready-btn");
    let pPrompt = $("p#prompt");

    btnFind.click(() => {
        disable(btnFind);
        clrInfo();
        startCountDown(btnFind, 5, () => {
            if (eatme.getPlayerState() === eatme.STATE_WAITING) {
                quit();
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
        startCountDown(btnReady, 10, () => {
            if (eatme.getPlayerState() === eatme.STATE_READY) {
                eatme.quitBattle();
                hide(btnReady);
                show(btnFind);
                setInfo("Opponent no respond. Please try again.");
            }
        })
        eatme.ready();
    })

    function handleMsg(type, data) {
        if (type === eatme.MSG_ERR) {
            hide(btnReady);
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

    function startCountDown(ele, seconds, cb) {
        let oriContent = ele.html();
        ele.html(--seconds);
        let timer = setInterval(() => {
            --seconds;
            if (seconds === -1) {
                clearInterval(timer);
                ele.html(oriContent);
                if (cb) cb();
            } else {
                ele.text(seconds);
            }
        }, 1000);
    }

    function enable(ele) {
        ele.prop("disabled", false);
    }

    function disable(ele) {
        ele.prop("disabled", true);
    }

    function show(ele) {
        enable(ele);
        ele.show("slow");
    }

    function hide(ele) {
        disable(ele);
        ele.hide("slow");
    }

    function setInfo(info) {
        pPrompt.text(info);
    }

    function clrInfo() {
        pPrompt.text("");
    }

})
