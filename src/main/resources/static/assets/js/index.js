"use strict";

$(function () {

    $(window).on("beforeunload", function () {
        eatme.quitWait();
        eatme.disconnect();
    });

    $("#find-btn").click(waitBattle);

    function waitBattle() {
        disableFindBtn();
        clearInfo();

        setTimeout(function () {
            if (eatme.getPlayerState() === eatme.STATE_WAITING) {
                eatme.quitWait();
                enableFindBtn();
                console.log("Waiting timeout");
                showInfo("Timeout. Please try again.");
            }
        }, 6000);

        if (!eatme.getPlayerId()) {
            eatme.genPlayerId();
        }

        if (eatme.isConnected()) {
            eatme.wait();
        } else {
            eatme.connect(eatme.wait,
                function (err) {
                    enableFindBtn();
                    showInfo("Failed to connect server. Please try again.");
                },
                function (msg) {
                    enableFindBtn();
                    handleMsg(msg);
                }
            );
        }
    }

    function enableFindBtn() {
        $("#find-btn").prop("disabled", false);
    }

    function disableFindBtn() {
        $("#find-btn").prop("disabled", true);
    }

    function showInfo(info) {
        $("#prompt").text(info);
    }

    function clearInfo(info) {
        $("#prompt").text("");
    }

    function handleMsg(msg) {
        console.log(Object.keys(msg));
    }

})
