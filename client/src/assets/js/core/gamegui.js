module.exports = (() => {
  'use strict'

  const INFO_ERR_CONNECT = 'Failed to connect server. Please try again.'
  const INFO_ERR_SERVER = 'Server error. Please try again.'
  const INFO_ERR_STATE = 'Invalid state. Please try again.'
  const INFO_ERR_ID = 'Invalid battle/player ID. Please try again.'
  const INFO_ERR_FULL = 'Too much players. Please try again.'

  const INFO_WELCOME = 'Welcome to EatMe! Press START to begin.'
  const INFO_WAIT_BTL = 'Wait for battle...'
  const INFO_WAIT_READY = 'Wait opponent ready...'
  const INFO_OPPONENT_FOUND = 'Opponent found. Press READY to continue.'
  const INFO_OPPONENT_NOT_FOUND = 'No opponents found. Please try again.'
  const INFO_OPPONENT_NO_RESPONSE = 'Opponent no response. Please find another battle.'
  const INFO_OPPONENT_QUIT = 'Opponent quit. Please find another battle.'

  // seconds
  const TIME_WAIT = 10
  const TIME_READY = 10
  const TIME_CONFIRM = 10

  // milliseconds
  const DURATION_NORMAL = 200
  const DURATION_SHORT = 100

  const gameCtrl = require('./gamectrl.js')
  const timer = require('./util/timer.js')
  const playground = require('./playground/playground.js')('playground')

  const MAP_KEY_ACTION = {
    37: gameCtrl.ACTION.LEFT,
    38: gameCtrl.ACTION.UP,
    39: gameCtrl.ACTION.RIGHT,
    40: gameCtrl.ACTION.DOWN
  }

  const MAP_ACTION_DIREC = {}
  MAP_ACTION_DIREC[gameCtrl.ACTION.LEFT] = playground.DIREC.LEFT
  MAP_ACTION_DIREC[gameCtrl.ACTION.UP] = playground.DIREC.UP
  MAP_ACTION_DIREC[gameCtrl.ACTION.RIGHT] = playground.DIREC.RIGHT
  MAP_ACTION_DIREC[gameCtrl.ACTION.DOWN] = playground.DIREC.DOWN

  const btnMain = $('button#main-btn')
  const btnQuit = $('button#quit-btn')
  const pInfo = $('p#info')
  const canvasPlayground = $('canvas#playground')

  const init = () => {
    _initGlobal()
    _initPlayground()
    _initInfo()
    _initMainBtn()
    _initQuitBtn()
    _initGameEvents()
    _resetToWait()
  }

  const _initGlobal = () => {
    $(window).on('beforeunload', () => {
      gameCtrl.quit()
    })

    $(document).keydown((event) => {
      if (!gameCtrl.isPlaying()) return

      const action = MAP_KEY_ACTION[event.which]
      const direc = MAP_ACTION_DIREC[action]
      const lastDirec = playground.lastSelfDirec()
      if (playground.DIREC.isOpposite(direc, lastDirec)) return

      gameCtrl.setNextAction(action)
      if (gameCtrl.isGameStarted()) gameCtrl.action()
    })
  }

  const _initPlayground = () => {
    playground.init()
  }

  const _initInfo = () => {
    _updateInfo(INFO_WELCOME)
  }

  const _initMainBtn = () => {
    btnMain.click(() => {
      _disableMain()
      if (gameCtrl.isOffline()) {
        _updateAndShowInfo(INFO_WAIT_BTL, () => {
          _showQuit()
          _findOpponent()
        })
      } else if (gameCtrl.isNotReady()) {
        _updateAndShowInfo(INFO_WAIT_READY, () => {
          _showQuit()
          _ready()
        })
      }
    })
  }

  const _initQuitBtn = () => {
    btnQuit.click(() => {
      if (!gameCtrl.isOffline()) _confirmQuit()
    })
  }

  const _initGameEvents = () => {
    gameCtrl.setOnCreatingFood(() => {
      playground.addRandFood(gameCtrl.getRandGenerator())
    })

    gameCtrl.setOnSwitchingRole(() => {
      if (gameCtrl.isAttacking()) {
        _appendInfo('ATTACK')
      } else if (gameCtrl.isDefending()) {
        _appendInfo('DEFEND')
      }
    })

    gameCtrl.setOnTakingActions(_handleActions)
  }

  const _findOpponent = () => {
    timer.startCountDown(btnMain, TIME_WAIT - 1, 0, () => {
      if (gameCtrl.isWaiting()) {
        gameCtrl.quit()
        _resetToWait()
        _updateAndShowInfo(INFO_OPPONENT_NOT_FOUND)
      }
    })

    gameCtrl.genPlayerId()

    if (gameCtrl.isConnected()) {
      gameCtrl.wait()
    } else {
      gameCtrl.connect(gameCtrl.wait,
        () => {
          _resetToWait()
          _updateAndShowInfo(INFO_ERR_CONNECT)
        },
        _handleData
      )
    }
  }

  const _ready = () => {
    timer.startCountDown(btnMain, TIME_READY - 1, 0, () => {
      if (gameCtrl.isReady()) {
        gameCtrl.quit()
        _resetToWait()
        _updateAndShowInfo(INFO_OPPONENT_NO_RESPONSE)
      }
    })

    gameCtrl.ready()
  }

  const _confirmQuit = () => {
    $.confirm({
      title: 'Confirm',
      content: 'Are you sure to quit?',
      autoClose: 'cancel|' + (TIME_CONFIRM * 1000),
      draggable: false,
      theme: 'bootstrap',
      animateFromElement: false,
      animation: 'scale',
      closeAnimation: 'scale',
      animationSpeed: DURATION_SHORT,
      buttons: {
        confirm: {
          text: 'Yes',
          action: () => {
            gameCtrl.quit()
            _resetToWait()
            _updateAndShowInfo(INFO_WELCOME)
          }
        },
        cancel: {
          text: 'No',
          btnClass: 'btn-blue',
          action: () => {}
        }
      }
    })
  }

  const _handleActions = (selfAction, opponentAction) => {
    let gameover = false
    let win = false
    let eatType = null

    if (gameCtrl.isAttacking()) {
      // Move self first
      eatType = playground.moveSelfSnake(MAP_ACTION_DIREC[selfAction])
      if (!playground.isSafeType(eatType)) {
        win = playground.isOpponentType(eatType)
        gameover = true
      } else {
        // Move opponent then
        eatType = playground.moveOpponentSnake(MAP_ACTION_DIREC[opponentAction])
        if (!playground.isSafeType(eatType)) {
          win = true
          gameover = true
        }
      }
    } else if (gameCtrl.isDefending()) {
      // Move opponent first
      eatType = playground.moveOpponentSnake(MAP_ACTION_DIREC[opponentAction])
      if (!playground.isSafeType(eatType)) {
        win = !playground.isSelfType(eatType)
        gameover = true
      } else {
        // Move self then
        eatType = playground.moveSelfSnake(MAP_ACTION_DIREC[selfAction])
        if (!playground.isSafeType(eatType)) {
          win = false
          gameover = true
        }
      }
    }

    _appendInfo('(' + selfAction + ',' + opponentAction + ')')

    if (gameover) {
      _appendInfo(win ? 'WIN' : 'LOSE')
      gameCtrl.done()
      _resetToReady()
    }
  }

  const _handleData = (type, data1, data2) => {
    timer.stopCountDown()
    if (type === gameCtrl.MSG.ERR) {
      _handleErr(data1)
    } else if (type === gameCtrl.MSG.BID) {
      _handleNewBattle(data1)
    } else if (type === gameCtrl.MSG.START) {
      _handleStart()
    }
  }

  const _handleErr = (errCode) => {
    gameCtrl.quit()
    _resetToWait()
    if (errCode === gameCtrl.ERR.SERVER) {
      _updateAndShowInfo(INFO_ERR_SERVER)
    } else if (errCode === gameCtrl.ERR.INVALID_STATE) {
      _updateAndShowInfo(INFO_ERR_STATE)
    } else if (errCode === gameCtrl.ERR.INVALID_BATTLE) {
      _updateAndShowInfo(INFO_ERR_ID)
    } else if (errCode === gameCtrl.ERR.BATTLE_FULL) {
      _updateAndShowInfo(INFO_ERR_FULL)
    } else if (errCode === gameCtrl.ERR.OPPONENT_QUIT) {
      _updateAndShowInfo(INFO_OPPONENT_QUIT)
    }
  }

  const _handleNewBattle = (battleId) => {
    _resetToReady()
    _updateAndShowInfo(INFO_OPPONENT_FOUND)
  }

  const _handleStart = () => {
    _hideMain()
    _showQuit()
    playground.resetSnakes(gameCtrl.isAttacking())
    _showPlayground(() => {
      _updateAndShowInfo('', () => {
        timer.startCountDown(pInfo, 3, 1, () => {
          _updateInfo('START')
          setTimeout(() => {
            if (gameCtrl.isAttacking()) {
              _updateInfo('ATTACK')
            } else if (gameCtrl.isDefending()) {
              _updateInfo('DEFEND')
            }
            gameCtrl.action()
            gameCtrl.setGameStarted(true)
          }, 1000)
        })
      })
    })
  }

  const _resetToWait = () => {
    timer.stopCountDown()
    gameCtrl.setGameStarted(false)
    _hidePlayground()
    _showMain()
    _hideQuit()
  }

  const _resetToReady = () => {
    timer.stopCountDown()
    gameCtrl.setGameStarted(false)
    _showMain()
    _showQuit()
  }

  const _showPlayground = (complete) => {
    _show(canvasPlayground, complete)
  }

  const _hidePlayground = (complete) => {
    _hide(canvasPlayground, complete)
  }

  const _showMain = () => {
    _enableAndShow(btnMain)
    _updateMain()
  }

  const _hideMain = () => {
    _disableAndHide(btnMain)
  }

  const _enableMain = () => {
    _enable(btnMain)
  }

  const _disableMain = () => {
    _disable(btnMain)
  }

  const _updateMain = () => {
    btnMain.text(gameCtrl.isNotReady() ? 'READY' : 'START')
  }

  const _showQuit = () => {
    _enableAndShow(btnQuit)
  }

  const _hideQuit = () => {
    _disableAndHide(btnQuit)
  }

  const _showInfo = (complete) => {
    _show(pInfo, complete)
  }

  const _hideInfo = (complete) => {
    _hide(pInfo, () => {
      pInfo.html('')
      if (complete) complete()
    })
  }

  const _updateInfo = (info) => {
    pInfo.html(info)
    if (gameCtrl.isPlaying()) {
      pInfo.removeClass('light')
      pInfo.addClass('dark')
    } else {
      pInfo.removeClass('dark')
      pInfo.addClass('light')
    }
  }

  const _updateAndShowInfo = (info, complete) => {
    _hideInfo(() => {
      _updateInfo(info)
      _showInfo(() => {
        if (complete) complete()
      })
    })
  }

  const _appendInfo = (info) => {
    pInfo.html(pInfo.html() + info)
  }

  const _enableAndShow = (jqObj, complete) => {
    _enable(jqObj)
    _show(jqObj, complete)
  }

  const _disableAndHide = (jqObj, complete) => {
    _disable(jqObj)
    _hide(jqObj, complete)
  }

  const _show = (jqObj, complete) => {
    jqObj.fadeIn(DURATION_NORMAL, complete)
  }

  const _hide = (jqObj, complete) => {
    jqObj.fadeOut(DURATION_NORMAL, complete)
  }

  const _enable = (jqObj) => {
    jqObj.prop('disabled', false)
  }

  const _disable = (jqObj) => {
    jqObj.prop('disabled', true)
  }

  return {
    init: init
  }
})()
