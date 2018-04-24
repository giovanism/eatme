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

  const STATE = {
    OFFLINE: '0',
    WAITING: '1',
    NOT_READY: '2',
    READY: '3',
    ATTACKING: '4',
    DEFENDING: '5'
  }

  const ACTION = {
    LEFT: '1',
    UP: '2',
    RIGHT: '3',
    DOWN: '4'
  }

  const MSG = {
    ERR: '0',
    BID: '1',
    START: '2',
    ACTION: '3'
  }

  const ERR = {
    SERVER: '1',
    INVALID_STATE: '2',
    INVALID_BATTLE: '3',
    BATTLE_FULL: '100',
    OPPONENT_QUIT: '200'
  }

  // steps
  const FREQ_SWITCH = 10
  const FREQ_FOOD = 5

  const MSG_SEPARATOR = '_'

  const messenger = require('./util/messenger.js')

  let playerId = null
  let playerState = STATE.OFFLINE

  let battleId = null
  let random = null

  let steps = 0
  let started = false
  let nextAction = null

  let onTakingActions = null
  let onCreatingFood = null
  let onSwitchingRole = null

  const isPlaying = () => {
    return playerState === STATE.ATTACKING ||
           playerState === STATE.DEFENDING
  }

  const getPlayerState = () => playerState

  const _setPlayerState = state => {
    playerState = state
    console.log('[gamectrl] state: ' + state)
  }

  const setStarted = s => { started = s }

  const isStarted = () => !!started

  const setNextAction = action => { nextAction = action }

  const setOnTakingActions = cb => { onTakingActions = cb }

  const setOnCreatingFood = cb => { onCreatingFood = cb }

  const setOnSwitchingRole = cb => { onSwitchingRole = cb }

  const genPlayerId = () => {
    if (!playerId) playerId = UUID.generate().replace(/-/g, '')
  }

  const _resetToWait = clrPlayerId => {
    if (clrPlayerId === true) playerId = null
    _setPlayerState(STATE.OFFLINE)
    battleId = null
    random = null
    steps = 0
    nextAction = null
  }

  const _resetToReady = () => {
    _setPlayerState(STATE.NOT_READY)
    random = null
    steps = 0
    nextAction = null
  }

  const connect = (sucCb, errCb, subscribeCb) => {
    messenger.connect(
      DEST_ENDPOINT,
      sucCb,
      () => {
        _resetToWait(true)
        if (errCb) errCb()
      },
      DEST_SUBSCRIBE + '/' + playerId,
      msg => {
        _handleMsg(msg.body, subscribeCb)
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
    if (playerState === STATE.OFFLINE) {
      messenger.send(DEST_WAIT, {
        playerId: playerId
      })
      _setPlayerState(STATE.WAITING)
    } else {
      throw new Error('[gamectrl] call wait() in state ' + playerState)
    }
  }

  const quitWait = () => {
    if (playerState === STATE.WAITING) {
      messenger.send(DEST_QUIT_WAIT, {
        playerId: playerId
      })
      _resetToWait()
    } else {
      throw new Error('[gamectrl] call quitWait() in state ' + playerState)
    }
  }

  const ready = () => {
    if (playerState === STATE.NOT_READY) {
      messenger.send(DEST_READY, {
        playerId: playerId,
        battleId: battleId
      })
      _setPlayerState(STATE.READY)
    } else {
      throw new Error('[gamectrl] call ready() in state ' + playerState)
    }
  }

  const action = () => {
    if (isPlaying()) {
      messenger.send(DEST_ACTION, {
        playerId: playerId,
        battleId: battleId,
        action: Number(nextAction)
      })
    } else {
      throw new Error('[gamectrl] call action() in state ' + playerState)
    }
  }

  const done = () => {
    if (isPlaying()) {
      messenger.send(DEST_DONE, {
        playerId: playerId,
        battleId: battleId
      })
      _resetToReady()
    } else {
      throw new Error('[gamectrl] call done() in state ' + playerState)
    }
  }

  const quitBattle = () => {
    if (playerState !== STATE.OFFLINE && playerState !== STATE.WAITING) {
      messenger.send(DEST_QUIT_BATTLE, {
        playerId: playerId,
        battleId: battleId
      })
      _resetToWait()
    } else {
      throw new Error('[gamectrl] call quitBattle() in state ' + playerState)
    }
  }

  const quit = () => {
    if (playerState === STATE.OFFLINE) return
    if (playerState === STATE.WAITING) {
      quitWait()
    } else {
      quitBattle()
    }
    disconnect()
  }

  const _handleMsg = (msgBody, cb) => {
    const [type, data1, data2] = msgBody.split(MSG_SEPARATOR, 3)
    if (type === MSG.ERR) {
      _handleErrMsg(data1)
    } else if (type === MSG.BID) {
      if (playerState === STATE.WAITING) _handleBattleMsg(data1)
    } else if (type === MSG.START) {
      if (playerState === STATE.READY) _handleStartMsg(data1, data2 === '1')
    } else if (type === MSG.ACTION) {
      if (isPlaying()) _handleActionMsg(data1, data2)
    }
    if (cb) cb(type, data1, data2)
  }

  const _handleErrMsg = errCode => {
    console.log('[gamectrl] err: ' + errCode)
    _resetToWait()
  }

  const _handleBattleMsg = id => {
    battleId = id
    _setPlayerState(STATE.NOT_READY)
  }

  const _handleStartMsg = (randSeed, attack) => {
    steps = 0
    random = new Math.seedrandom(randSeed)
    _setPlayerState(attack ? STATE.ATTACKING : STATE.DEFENDING)
    setNextAction(attack ? ACTION.RIGHT : ACTION.LEFT)
  }

  const _handleActionMsg = (myAction, opponentAction) => {
    if (onTakingActions) onTakingActions(myAction, opponentAction)
    if (!isPlaying()) return
    ++steps
    if (steps % FREQ_FOOD === 0) {
      const foodPos = random.int32()
      if (onCreatingFood) onCreatingFood(foodPos)
    }
    if (steps % FREQ_SWITCH === 0) {
      _setPlayerState(playerState === STATE.ATTACKING ? STATE.DEFENDING : STATE.ATTACKING)
      if (onSwitchingRole) onSwitchingRole()
    }
  }

  return {
    STATE: STATE,
    ACTION: ACTION,
    MSG: MSG,
    ERR: ERR,

    isPlaying: isPlaying,
    getPlayerState: getPlayerState,
    setStarted: setStarted,
    isStarted: isStarted,
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
    quit: quit
  }
})()
