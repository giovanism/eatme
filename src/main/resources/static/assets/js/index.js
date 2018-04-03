"use strict";

$(function () {

    $(window).on("beforeunload", function () {
        eatme.quitWait();
        eatme.disconnect();
    });

    $("#wait-btn").click(waitBattle);

    function waitBattle() {
        $("#wait-btn").prop("disabled", true);
        if (!eatme.getPlayerId()) {
            eatme.genPlayerId();
        }
        if (eatme.isConnected()) {
            eatme.wait();
        } else {
            eatme.connect(eatme.wait, function (err) {
                $("#wait-btn").prop("disabled", false);
            }, function (msg) {
                console.log(Object.keys(msg));
                $("#wait-btn").prop("disabled", false);
            });
        }
    }

})
