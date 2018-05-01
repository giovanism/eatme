module.exports = (() => {
  'use strict'

  const INFO_ERR_CONNECT = 'Failed to connect server. Please try again.'
  const INFO_ERR_SERVER = 'Server error. Please try again.'
  const INFO_ERR_STATE = 'Invalid state. Please try again.'
  const INFO_ERR_ID = 'Invalid battle/player ID. Please try again.'
  const INFO_ERR_FULL = 'Too much players. Please try again.'

  const INFO_MAIN_START = 'START'
  const INFO_MAIN_READY = 'READY'

  const INFO_START_ATTACK = 'ATTACK !!!'
  const INFO_START_DEFEND = 'DEFEND !!!'

  const INFO_PREPARE_ATTACK = 'Prepare to ATTACK !!!'
  const INFO_PREPARE_DEFEND = 'Prepare to DEFEND !!!'

  const INFO_WELCOME = 'Welcome! Press START to begin.'
  const INFO_WAIT_BTL = 'Waiting for battle...'
  const INFO_WAIT_READY = 'Waiting opponent ready...'
  const INFO_OPPONENT_FOUND = 'Opponent found. Press READY to continue.'
  const INFO_OPPONENT_NOT_FOUND = 'No opponents found. Please try again.'
  const INFO_OPPONENT_NO_RESPONSE = 'Opponent no response. Please find another battle.'
  const INFO_OPPONENT_QUIT = 'Opponent quit. Please find another battle.'
  const INFO_WIN = 'Cheers! You win! Press READY to restart.'
  const INFO_LOST = 'Oops! You lose! Press READY to restart.'

  const SWITCH_INFO_THRESHOLD = 5

  // seconds
  const TIME_WAIT = 10
  const TIME_READY = 10

  // milliseconds
  const DURATION_NORMAL = 500

  const gameCtrl = require('./gamectrl.js')
  const timer = require('./util/timer.js')
  const playground = require('./playground/playground.js')

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
    playground.init($('div#playground canvas'), $('p#time'))
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
      if (!gameCtrl.isOffline()) {
        gameCtrl.quit()
        _resetToWait()
        _updateAndShowInfo(INFO_WELCOME)
      }
    })
  }

  const _initGameEvents = () => {
    gameCtrl.setOnTakingActions(_cbTakingActions)
    gameCtrl.setOnCreatingFood(_cbCreatingFood)
    gameCtrl.setOnSwitchingRole(_cbSwitchingRole)
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

  const _cbTakingActions = (selfAction, opponentAction) => {
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

    if (gameover) {
      _blurPlayground()
      _normalPlayground()
      gameCtrl.done()
      _resetToReady()
      _updateAndShowInfo(win ? INFO_WIN : INFO_LOST)
    }
  }

  const _cbCreatingFood = () => {
    playground.addRandFood(gameCtrl.getRandGenerator())
  }

  const _cbSwitchingRole = () => {
    _updateAndShowInfo(_getStartInfo())
    _normalPlayground()
    window.setTimeout(() => {
      if (gameCtrl.isPlaying()) _hideInfo()
    }, 1000)
  }

  const _handleData = (type, data1, data2) => {
    timer.stopCountDown()
    if (type === gameCtrl.MSG.ERR) {
      _handleErr(data1)
    } else if (type === gameCtrl.MSG.BID) {
      _handleNewBattle(data1)
    } else if (type === gameCtrl.MSG.START) {
      _handleStart()
    } else if (type === gameCtrl.MSG.ACTION) {
      _handleActionsDone()
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
    _updateInfo('')
    _hideMain()
    _showQuit()
    _resetPlayground()
    _showPlayground(() => {
      _updateTime()
      _showTime(() => {
        _updateAndShowInfo('', () => {
          timer.startCountDown(pInfo, 3, 1, () => {
            _updateInfo(_getStartInfo())
            window.setTimeout(() => {
              _hideInfo()
              gameCtrl.action()
              gameCtrl.setGameStarted(true)
            }, 1000)
          })
        })
      })
    })
  }

  const _handleActionsDone = () => {
    const stepsLeft = _updateTime()
    if (stepsLeft <= SWITCH_INFO_THRESHOLD && !playground.isBlinking()) {
      _blinkPlayground()
      _updateAndShowInfo(_getPrepareInfo())
      window.setTimeout(() => {
        if (gameCtrl.isPlaying()) _hideInfo()
      }, 1000)
    }
  }

  const _resetToWait = () => {
    timer.stopCountDown()
    gameCtrl.setGameStarted(false)
    _hideTime()
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

  const _resetPlayground = () => {
    playground.resetSnakes(gameCtrl.isAttacking())
    _noBlurPlayground()
    _normalPlayground()
  }

  const _normalPlayground = () => {
    if (gameCtrl.isAttacking()) {
      playground.attackShadow()
      playground.attackTime()
    } else if (gameCtrl.isDefending()) {
      playground.defendShadow()
      playground.defendTime()
    }
  }

  const _blinkPlayground = () => {
    if (gameCtrl.isAttacking()) {
      playground.blinkAttackShadow()
      playground.attackTime()
    } else if (gameCtrl.isDefending()) {
      playground.blinkDefendShadow()
      playground.defendTime()
    }
  }

  const _blurPlayground = () => {
    playground.blur()
  }

  const _noBlurPlayground = () => {
    playground.noBlur()
  }

  const _showPlayground = (complete) => {
    playground.show(DURATION_NORMAL, complete)
  }

  const _hidePlayground = (complete) => {
    playground.hide(DURATION_NORMAL, complete)
  }

  const _showTime = (complete) => {
    playground.showTime(DURATION_NORMAL, complete)
  }

  const _hideTime = (complete) => {
    playground.hideTime(DURATION_NORMAL, complete)
  }

  const _updateTime = () => {
    const stepsLeft = gameCtrl.roleSwitchStepsLeft()
    playground.updateTime(stepsLeft)
    return stepsLeft
  }

  const _showMain = () => {
    _enableAndShow(btnMain)
    _updateMain()
  }

  const _hideMain = () => {
    _disableAndHide(btnMain)
  }

  const _disableMain = () => {
    _disable(btnMain)
  }

  const _updateMain = () => {
    if (gameCtrl.isNotReady()) {
      btnMain.text(INFO_MAIN_READY)
      btnMain.removeClass('start-bg')
      btnMain.addClass('ready-bg')
    } else {
      btnMain.text(INFO_MAIN_START)
      btnMain.removeClass('ready-bg')
      btnMain.addClass('start-bg')
    }
  }

  const _showQuit = () => {
    _enableAndShow(btnQuit)
  }

  const _hideQuit = () => {
    _disableAndHide(btnQuit)
  }

  const _getStartInfo = () => {
    if (gameCtrl.isAttacking()) {
      return INFO_START_ATTACK
    } else if (gameCtrl.isDefending()) {
      return INFO_START_DEFEND
    } else {
      return ''
    }
  }

  const _getPrepareInfo = () => {
    if (gameCtrl.isAttacking()) {
      return INFO_PREPARE_DEFEND
    } else if (gameCtrl.isDefending()) {
      return INFO_PREPARE_ATTACK
    } else {
      return null
    }
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
  }

  const _updateAndShowInfo = (info, complete) => {
    _hideInfo(() => {
      _updateInfo(info)
      _showInfo(() => {
        if (complete) complete()
      })
    })
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
