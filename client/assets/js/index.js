"use strict";

$(() => {

    let btnFind = $("#find-btn");
    let pPrompt = $("#prompt");

    btnFind.click(findBattle);

    $(window).on("beforeunload", () => {
        eatme.quitWait();
        eatme.quitBattle();
        eatme.disconnect();
    });

    function enableFindBtn() {
        btnFind.prop("disabled", false);
    }

    function disableFindBtn() {
        btnFind.prop("disabled", true);
    }

    function showInfo(info) {
        pPrompt.text(info);
    }

    function clearInfo(info) {
        pPrompt.text("");
    }

    function findBattle() {
        disableFindBtn();
        clearInfo();

        setTimeout(() => {
            if (eatme.getPlayerState() === eatme.STATE_WAITING) {
                eatme.quitWait();
                enableFindBtn();
                showInfo("Timeout. Please try again.");
            }
        }, 10000);

        if (!eatme.getPlayerId()) {
            eatme.genPlayerId();
        }

        if (eatme.isConnected()) {
            eatme.wait();
        } else {
            eatme.connect(eatme.wait,
                (err) => {
                    enableFindBtn();
                    showInfo("Failed to connect server. Please try again.");
                },
                (msg) => {
                    handleMsg(msg);
                }
            );
        }
    }

    function handleMsg(msg) {
        const {headers: {type}, body} = msg;
        if (type === eatme.MSG_ERR) {
            if (body === eatme.ERR_SERVER) {
                enableFindBtn();
                showInfo("Server error. Please try again.");
            } else if (body === eatme.ERR_WAITING_QUEUE_PUSH_FULL) {
                enableFindBtn();
                showInfo("Waiting pool is full. Please try again.");
            } else if (body === eatme.ERR_WAITING_QUEUE_PUSH_INVALID) {
                enableFindBtn();
                showInfo("Enqueue under invalid state. Please try again.");
            }
        } else if (type === eatme.MSG_BID) {
            enableFindBtn();
            showInfo("Find battle: " + body);
        }
    }

})
