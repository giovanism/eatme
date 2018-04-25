module.exports = (() => {
  'use strict'

  // seconds
  const TIME_WAIT = 10
  const TIME_READY = 10
  const TIME_CONFIRM = 10

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

  const btnFind = $('button#find-btn')
  const btnReady = $('button#ready-btn')
  const btnQuit = $('button#quit-btn')
  const pInfo = $('p#info')

  const init = () => {
    playground.init()

    $(window).on('beforeunload', () => {
      gameCtrl.quit()
    })

    $(document).keydown((event) => {
      if (gameCtrl.isPlaying()) {
        const action = MAP_KEY_ACTION[event.which]
        const direc = MAP_ACTION_DIREC[action]
        const lastDirec = playground.lastSelfDirec()
        if (!playground.DIREC.isOpposite(direc, lastDirec)) {
          gameCtrl.setNextAction(action)
          if (gameCtrl.isGameStarted()) gameCtrl.action()
        }
      }
    })

    btnFind.click(() => {
      _disable(btnFind)
      _clrInfo()
      _show(btnQuit)
      timer.startCountDown(btnFind, TIME_WAIT - 1, 0, () => {
        if (gameCtrl.isWaiting()) {
          _resetToWait()
          gameCtrl.quit()
          _setInfo('Timeout. Please try again.')
        }
      })
      gameCtrl.genPlayerId()
      if (gameCtrl.isConnected()) {
        gameCtrl.wait()
      } else {
        gameCtrl.connect(gameCtrl.wait,
          () => {
            _resetToWait()
            _setInfo('Failed to connect server. Please try again.')
          },
          _handleData
        )
      }
    })

    btnReady.click(() => {
      _disable(btnReady)
      _clrInfo()
      timer.startCountDown(btnReady, TIME_READY - 1, 0, () => {
        if (gameCtrl.isReady()) {
          _resetToWait()
          gameCtrl.quit()
          _setInfo('Opponent no respond. Please try again.')
        }
      })
      gameCtrl.ready()
    })

    btnQuit.click(() => {
      $.confirm({
        title: 'Confirm',
        content: 'Are you sure to quit?',
        autoClose: 'cancel|' + (TIME_CONFIRM * 1000),
        draggable: false,
        theme: 'bootstrap',
        animateFromElement: false,
        animation: 'scale',
        closeAnimation: 'scale',
        animationSpeed: 200,
        buttons: {
          confirm: {
            text: 'Yes',
            action: () => {
              _resetToWait()
              _clrInfo()
              gameCtrl.quit()
            }
          },
          cancel: {
            text: 'No',
            btnClass: 'btn-blue',
            action: () => {}
          }
        }
      })
    })

    gameCtrl.setOnTakingActions((selfAction, opponentAction) => {
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
        _resetToReady()
        gameCtrl.done()
      }
    })

    gameCtrl.setOnCreatingFood((foodPos) => {
      _appendInfo('(' + foodPos + ')')
    })

    gameCtrl.setOnSwitchingRole(() => {
      if (gameCtrl.isAttacking()) {
        _appendInfo('ATTACK')
      } else if (gameCtrl.isDefending()) {
        _appendInfo('DEFEND')
      }
    })
  }

  const _handleData = (type, data1, data2) => {
    timer.stopCountDown()
    if (type === gameCtrl.MSG.ERR) {
      _resetToWait()
      const errCode = data1
      if (errCode === gameCtrl.ERR.SERVER) {
        _setInfo('Server error. Please try again.')
      } else if (errCode === gameCtrl.ERR.INVALID_STATE) {
        _setInfo('Invalid state. Please try again.')
      } else if (errCode === gameCtrl.ERR.INVALID_BATTLE) {
        _setInfo('Invalid battle and player ID. Please try again.')
      } else if (errCode === gameCtrl.ERR.BATTLE_FULL) {
        _setInfo('Too much players. Please try again.')
      } else if (errCode === gameCtrl.ERR.OPPONENT_QUIT) {
        gameCtrl.disconnect()
        _setInfo('Opponent quit. Please try again.')
      }
    } else if (type === gameCtrl.MSG.BID) {
      const battleId = data1
      _hide(btnFind)
      _show(btnReady)
      _show(btnQuit)
      _setInfo('Find battle: ' + battleId)
    } else if (type === gameCtrl.MSG.START) {
      _hide(btnReady)
      _startGame()
    }
  }

  const _startGame = () => {
    playground.resetSnakes(gameCtrl.isAttacking())
    timer.startCountDown(pInfo, 3, 1, () => {
      _setInfo('START')
      setTimeout(() => {
        if (gameCtrl.isAttacking()) {
          _setInfo('ATTACK')
        } else if (gameCtrl.isDefending()) {
          _setInfo('DEFEND')
        }
        gameCtrl.action()
        gameCtrl.setGameStarted(true)
      }, 1000)
    })
  }

  const _resetToWait = () => {
    timer.stopCountDown()
    gameCtrl.setGameStarted(false)
    _hide(btnReady)
    _hide(btnQuit)
    _show(btnFind)
  }

  const _resetToReady = () => {
    timer.stopCountDown()
    gameCtrl.setGameStarted(false)
    _hide(btnFind)
    _show(btnReady)
    _show(btnQuit)
  }

  const _enable = (e) => {
    e.prop('disabled', false)
  }

  const _disable = (e) => {
    e.prop('disabled', true)
  }

  const _show = (e) => {
    _enable(e)
    e.show()
  }

  const _hide = (e) => {
    _disable(e)
    e.hide()
  }

  const _setInfo = (info) => {
    pInfo.html(info)
    window.scrollTo(0, document.body.scrollHeight)
  }

  const _appendInfo = (info) => {
    pInfo.html(pInfo.html() + info)
    window.scrollTo(0, document.body.scrollHeight)
  }

  const _clrInfo = () => {
    pInfo.text('')
  }

  return {
    init: init
  }
})()
