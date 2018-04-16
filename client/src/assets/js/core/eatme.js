/* global UUID */

module.exports = (() => {
  const DEST_ENDPOINT = '/ws/ep'
  const DEST_SUBSCRIBE = '/ws/sb'
  const DEST_WAIT = '/game/wait'
  const DEST_QUIT_WAIT = '/game/quit-wait'
  const DEST_READY = '/game/ready'
  const DEST_ACTION = '/game/action'
  const DEST_DONE = '/game/done'
  const DEST_QUIT_BATTLE = '/game/quit-btl'

  const STATE_OFFLINE = '0'
  const STATE_WAITING = '1'
  const STATE_NOT_READY = '2'
  const STATE_READY = '3'
  const STATE_ATTACKING = '4'
  const STATE_DEFENDING = '5'

  const ACTION_LEFT = '1'
  const ACTION_UP = '2'
  const ACTION_RIGHT = '3'
  const ACTION_DOWN = '4'

  const MSG_SEPARATOR = '|'
  const MSG_ERR = '0'
  const MSG_BID = '1'
  const MSG_START = '2'
  const MSG_ACTION = '3'

  const ERR_SERVER = '1'
  const ERR_INVALID_STATE = '2'
  const ERR_INVALID_BATTLE = '3'
  const ERR_WAITING_QUEUE_PUSH_FULL = '100'
  const ERR_OPPONENT_QUIT = '200'

  const FREQ_SWITCH = 10
  const FREQ_FOOD = 5

  const messenger = require('./messenger.js')
  const timer = require('./timer.js')

  let playerId = null
  let playerState = STATE_OFFLINE

  let battleId = null
  let random = null

  let steps = 0
  let lastAction = null
  let nextAction = null

  let onTakingActions = null
  let onCreatingFood = null
  let onSwitchingRole = null

  const getPlayerState = () => playerState

  const isPlaying = () => {
    return playerState === STATE_ATTACKING || playerState === STATE_DEFENDING
  }

  const setPlayerState = state => {
    playerState = state
    console.log('state: ' + state)
  }

  const setNextAction = action => {
    nextAction = action
  }

  const setOnTakingActions = cb => {
    onTakingActions = cb
  }

  const setOnCreatingFood = cb => {
    onCreatingFood = cb
  }

  const setOnSwitchingRole = cb => {
    onSwitchingRole = cb
  }

  const genPlayerId = () => {
    if (!playerId) playerId = UUID.generate().replace(/-/g, '')
  }

  const resetToWait = clrPlayerId => {
    if (clrPlayerId === true) playerId = null
    setPlayerState(STATE_OFFLINE)
    battleId = null
    random = null
    steps = 0
    lastAction = null
    nextAction = null
  }

  const resetToReady = () => {
    setPlayerState(STATE_NOT_READY)
    random = null
    steps = 0
    lastAction = null
    nextAction = null
  }

  const connect = (sucCb, errCb, subscribeCb) => {
    messenger.connect(
      DEST_ENDPOINT,
      sucCb,
      () => {
        resetToWait(true)
        if (errCb) errCb()
      },
      DEST_SUBSCRIBE + '/' + playerId,
      msg => {
        handleMsg(msg.body, subscribeCb)
      }
    )
  }

  const disconnect = () => {
    messenger.disconnect()
  }

  const isConnected = () => {
    return messenger.isConnected()
  }

  const wait = () => {
    if (playerState === STATE_OFFLINE) {
      messenger.send(DEST_WAIT, {
        playerId: playerId
      })
      setPlayerState(STATE_WAITING)
    } else {
      throw new Error('Call wait() in state ' + playerState)
    }
  }

  const quitWait = () => {
    if (playerState === STATE_WAITING) {
      messenger.send(DEST_QUIT_WAIT, {
        playerId: playerId
      })
      resetToWait()
    } else {
      throw new Error('Call quitWait() in state ' + playerState)
    }
  }

  const ready = () => {
    if (playerState === STATE_NOT_READY) {
      messenger.send(DEST_READY, {
        playerId: playerId,
        battleId: battleId
      })
      setPlayerState(STATE_READY)
    } else {
      throw new Error('Call ready() in state ' + playerState)
    }
  }

  const action = () => {
    if (isPlaying()) {
      if (nextAction !== lastAction) {
        messenger.send(DEST_ACTION, {
          playerId: playerId,
          battleId: battleId,
          action: Number(nextAction)
        })
        lastAction = nextAction
      }
    } else {
      throw new Error('Call action() in state ' + playerState)
    }
  }

  const done = () => {
    if (isPlaying()) {
      messenger.send(DEST_DONE, {
        playerId: playerId,
        battleId: battleId
      })
      resetToReady()
    } else {
      throw new Error('Call done() in state ' + playerState)
    }
  }

  const quitBattle = () => {
    if (playerState !== STATE_OFFLINE && playerState !== STATE_WAITING) {
      messenger.send(DEST_QUIT_BATTLE, {
        playerId: playerId,
        battleId: battleId
      })
      resetToWait()
    } else {
      throw new Error('Call quitBattle() in state ' + playerState)
    }
  }

  const startCountDown = (ele, beg, end, cb) => {
    timer.startCountDown(ele, beg, end, cb)
  }

  const stopCountDown = () => {
    timer.stopCountDown()
  }

  const handleMsg = (msgBody, cb) => {
    const [type, data1, data2] = msgBody.split(MSG_SEPARATOR, 3)
    if (type === MSG_ERR) {
      handleErrMsg(data1)
    } else if (type === MSG_BID) {
      if (playerState === STATE_WAITING) handleBattleMsg(data1)
    } else if (type === MSG_START) {
      if (playerState === STATE_READY) handleStartMsg(data1, data2 === '1')
    } else if (type === MSG_ACTION) {
      if (isPlaying()) handleActionMsg(data1, data2)
    }
    if (cb) cb(type, data1, data2)
  }

  const handleErrMsg = errCode => {
    if (errCode === ERR_SERVER) {
      setPlayerState(STATE_OFFLINE)
    } else if (errCode === ERR_INVALID_STATE) {
      setPlayerState(STATE_OFFLINE)
    } else if (errCode === ERR_INVALID_BATTLE) {
      setPlayerState(STATE_OFFLINE)
    } else if (errCode === ERR_WAITING_QUEUE_PUSH_FULL) {
      setPlayerState(STATE_OFFLINE)
    }
  }

  const handleBattleMsg = id => {
    battleId = id
    setPlayerState(STATE_NOT_READY)
  }

  const handleStartMsg = (randSeed, attack) => {
    steps = 0
    random = new Math.seedrandom(randSeed)
    setPlayerState(attack ? STATE_ATTACKING : STATE_DEFENDING)
    setNextAction(attack ? ACTION_RIGHT : ACTION_LEFT)
  }

  const handleActionMsg = (myAction, opponentAction) => {
    if (onTakingActions) onTakingActions(myAction, opponentAction)
    if (!isPlaying()) return
    ++steps
    if (steps % FREQ_FOOD === 0) {
      const foodPos = random.int32()
      if (onCreatingFood) onCreatingFood(foodPos)
    }
    if (steps % FREQ_SWITCH === 0) {
      setPlayerState(playerState === STATE_ATTACKING ? STATE_DEFENDING : STATE_ATTACKING)
      if (onSwitchingRole) onSwitchingRole()
    }
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
    MSG_ACTION: MSG_ACTION,

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
    action: action,
    done: done,
    quitBattle: quitBattle,

    startCountDown: startCountDown,
    stopCountDown: stopCountDown
  }
})()
