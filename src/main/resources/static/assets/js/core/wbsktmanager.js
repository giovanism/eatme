"use strict";

function WebSocketManager() {

    this.stompClient = null;

    this.connect = function (connDest, sucCb, errCb, subscribeDest, subscribeCb) {
        let self = this;
        self.stompClient = Stomp.over(new SockJS(connDest));
        self.stompClient.connect({}, function (frame) {
            console.log("[WebSocketManager] connect suc:\n" + frame);
            self.stompClient.subscribe(subscribeDest, subscribeCb);
            if (sucCb) sucCb(frame);
        }, function (err) {
            console.log("[WebSocketManager] connect fail:\n" + err);
            self.stompClient = null;
            if (errCb) errCb(err);
        });
    }

    this.disconnect = function () {
        if (this.stompClient) {
            this.stompClient.disconnect();
        }
        console.log("[WebSocketManager] disconnected");
    }

    this.isConnected = function() {
        return !!this.stompClient;
    }

    this.send = function (dest, obj) {
        if (this.stompClient) {
            this.stompClient.send(dest, {}, JSON.stringify(obj));
        }
    }

}
