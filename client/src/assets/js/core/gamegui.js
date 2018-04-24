module.exports = (() => {
  // seconds
  const TIME_WAIT = 10
  const TIME_READY = 10
  const TIME_CONFIRM = 10

  const gameCtrl = require('./gamectrl.js')
  const timer = require('./util/timer.js')
  const playground = require('./playground/playground.js')('playground')

  const KEYBOARD_ACTION = {
    37: gameCtrl.ACTION.LEFT,
    38: gameCtrl.ACTION.UP,
    39: gameCtrl.ACTION.RIGHT,
    40: gameCtrl.ACTION.DOWN
  }

  const btnFind = $('button#find-btn')
  const btnReady = $('button#ready-btn')
  const btnQuit = $('button#quit-btn')
  const pPrompt = $('p#prompt')

  const init = () => {
    playground.init()

    $(window).on('beforeunload', () => {
      gameCtrl.quit()
    })

    $(document).keydown((event) => {
      if (gameCtrl.isPlaying()) {
        const action = KEYBOARD_ACTION[event.which]
        if (action) {
          gameCtrl.setNextAction(action)
          if (gameCtrl.isStarted()) gameCtrl.action()
        }
      }
    })

    btnFind.click(() => {
      _disable(btnFind)
      _clrInfo()
      _show(btnQuit)
      timer.startCountDown(btnFind, TIME_WAIT - 1, 0, () => {
        if (gameCtrl.getPlayerState() === gameCtrl.STATE.WAITING) {
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
        if (gameCtrl.getPlayerState() === gameCtrl.STATE.READY) {
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

    gameCtrl.setOnTakingActions((myAction, opponentAction) => {
      _appendInfo('(' + myAction + ',' + opponentAction + ')')
      if (myAction === gameCtrl.ACTION.DOWN &&
          opponentAction === gameCtrl.ACTION.DOWN) { // Test done()
        _resetToReady()
        _appendInfo(gameCtrl.getPlayerState() === gameCtrl.STATE.ATTACKING ? 'WIN' : 'LOSE')
        gameCtrl.done()
      }
    })

    gameCtrl.setOnCreatingFood((foodPos) => {
      _appendInfo('(' + foodPos + ')')
    })

    gameCtrl.setOnSwitchingRole(() => {
      const state = gameCtrl.getPlayerState()
      if (state === gameCtrl.STATE.ATTACKING) {
        _appendInfo('ATTACK')
      } else if (state === gameCtrl.STATE.DEFENDING) {
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
    playground.resetSnakes()
    timer.startCountDown(pPrompt, 3, 1, () => {
      _setInfo('START')
      setTimeout(() => {
        const state = gameCtrl.getPlayerState()
        if (state === gameCtrl.STATE.ATTACKING) {
          _setInfo('ATTACK')
        } else if (state === gameCtrl.STATE.DEFENDING) {
          _setInfo('DEFEND')
        }
        gameCtrl.action()
        gameCtrl.setStarted(true)
      }, 1000)
    })
  }

  const _resetToWait = () => {
    timer.stopCountDown()
    gameCtrl.setStarted(false)
    _hide(btnReady)
    _hide(btnQuit)
    _show(btnFind)
  }

  const _resetToReady = () => {
    timer.stopCountDown()
    gameCtrl.setStarted(false)
    _hide(btnFind)
    _show(btnReady)
    _show(btnQuit)
  }

  const _enable = e => { e.prop('disabled', false) }

  const _disable = e => { e.prop('disabled', true) }

  const _show = e => {
    _enable(e)
    e.show()
  }

  const _hide = e => {
    _disable(e)
    e.hide()
  }

  const _setInfo = info => {
    pPrompt.html(info)
    window.scrollTo(0, document.body.scrollHeight)
  }

  const _appendInfo = info => {
    pPrompt.html(pPrompt.html() + info)
    window.scrollTo(0, document.body.scrollHeight)
  }

  const _clrInfo = () => { pPrompt.text('') }

  return {
    init: init
  }
})()
