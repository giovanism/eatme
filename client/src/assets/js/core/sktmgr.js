/* global Stomp, SockJS */

module.exports = (() => {
  let stompClient = null

  const connect = (connDest, sucCb, errCb, subscribeDest, subscribeCb) => {
    stompClient = Stomp.over(new SockJS(connDest))
    stompClient.connect({},
      frame => {
        console.log('[WebSocketManager] connect suc:\n' + frame)
        stompClient.subscribe(subscribeDest, subscribeCb)
        if (sucCb) sucCb(frame)
      },
      err => {
        console.log('[WebSocketManager] connect fail:\n' + err)
        stompClient = null
        if (errCb) errCb()
      }
    )
  }

  const disconnect = () => {
    if (stompClient) stompClient.disconnect()
    console.log('[WebSocketManager] disconnected')
  }

  const isConnected = () => !!stompClient

  const send = (dest, obj) => {
    if (stompClient) stompClient.send(dest, {}, JSON.stringify(obj))
  }

  return {
    connect: connect,
    disconnect: disconnect,
    isConnected: isConnected,
    send: send
  }
})()
