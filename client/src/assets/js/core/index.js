$(() => {
  // seconds
  const TIME_WAIT = 5
  const TIME_READY = 10
  const TIME_CONFIRM = 10

  const eatme = require('./eatme.js')

  const btnFind = $('button#find-btn')
  const btnReady = $('button#ready-btn')
  const btnQuit = $('button#quit-btn')
  const pPrompt = $('p#prompt')

  let gameStarted = false

  $(window).on('beforeunload', () => {
    quit()
    eatme.disconnect()
  })

  $(document).keydown((event) => {
    if (gameStarted && eatme.isPlaying()) {
      if (event.which === 37) {
        eatme.setNextAction(eatme.ACTION_LEFT)
        eatme.action()
      } else if (event.which === 38) {
        eatme.setNextAction(eatme.ACTION_UP)
        eatme.action()
      } else if (event.which === 39) {
        eatme.setNextAction(eatme.ACTION_RIGHT)
        eatme.action()
      } else if (event.which === 40) {
        eatme.setNextAction(eatme.ACTION_DOWN)
        eatme.action()
      }
    }
  })

  btnFind.click(() => {
    disable(btnFind)
    clrInfo()
    show(btnQuit)
    eatme.startCountDown(btnFind, TIME_WAIT - 1, 0, () => {
      if (eatme.getPlayerState() === eatme.STATE_WAITING) {
        resetToWait()
        quit()
        setInfo('Timeout. Please try again.')
      }
    })
    eatme.genPlayerId()
    if (eatme.isConnected()) {
      eatme.wait()
    } else {
      eatme.connect(eatme.wait,
        () => {
          resetToWait()
          setInfo('Failed to connect server. Please try again.')
        },
        handleData
      )
    }
  })

  btnReady.click(() => {
    disable(btnReady)
    clrInfo()
    eatme.startCountDown(btnReady, TIME_READY - 1, 0, () => {
      if (eatme.getPlayerState() === eatme.STATE_READY) {
        resetToWait()
        eatme.quitBattle()
        setInfo('Opponent no respond. Please try again.')
      }
    })
    eatme.ready()
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
            resetToWait()
            clrInfo()
            quit()
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

  eatme.setOnTakingActions((myAction, opponentAction) => {
    appendInfo('(' + myAction + ',' + opponentAction + ')')
    if (myAction === eatme.ACTION_DOWN && opponentAction === eatme.ACTION_DOWN) { // Test done()
      resetToReady()
      appendInfo(eatme.getPlayerState() === eatme.STATE_ATTACKING ? 'WIN' : 'LOSE')
      eatme.done()
    }
  })

  eatme.setOnCreatingFood((foodPos) => {
    appendInfo('(' + foodPos + ')')
  })

  eatme.setOnSwitchingRole(() => {
    const state = eatme.getPlayerState()
    if (state === eatme.STATE_ATTACKING) {
      appendInfo('ATTACK')
    } else if (state === eatme.STATE_DEFENDING) {
      appendInfo('DEFEND')
    }
  })

  function handleData(type, data1, data2) {
    eatme.stopCountDown()
    if (type === eatme.MSG_ERR) {
      const errCode = data1
      resetToWait()
      if (errCode === eatme.ERR_SERVER) {
        setInfo('Server error. Please try again.')
      } else if (errCode === eatme.ERR_INVALID_STATE) {
        setInfo('Invalid state. Please try again.')
      } else if (errCode === eatme.ERR_INVALID_BATTLE) {
        setInfo('Invalid battle and player ID. Please try again.')
      } else if (errCode === eatme.ERR_WAITING_QUEUE_PUSH_FULL) {
        setInfo('Waiting pool is full. Please try again.')
      } else if (errCode === eatme.ERR_OPPONENT_QUIT) {
        eatme.quitBattle()
        setInfo('Opponent quit. Please try again.')
      }
    } else if (type === eatme.MSG_BID) {
      const battleId = data1
      hide(btnFind)
      show(btnReady)
      show(btnQuit)
      setInfo('Find battle: ' + battleId)
    } else if (type === eatme.MSG_START) {
      hide(btnReady)
      startGame()
    }
  }

  function startGame() {
    eatme.startCountDown(pPrompt, 3, 1, () => {
      setInfo('START')
      setTimeout(() => {
        const state = eatme.getPlayerState()
        if (state === eatme.STATE_ATTACKING) {
          setInfo('ATTACK')
        } else if (state === eatme.STATE_DEFENDING) {
          setInfo('DEFEND')
        }
        eatme.action()
        gameStarted = true
      }, 1000)
    })
  }

  function resetToWait() {
    eatme.stopCountDown()
    gameStarted = false
    hide(btnReady)
    hide(btnQuit)
    show(btnFind)
  }

  function resetToReady() {
    eatme.stopCountDown()
    gameStarted = false
    hide(btnFind)
    show(btnReady)
    show(btnQuit)
  }

  function quit() {
    const state = eatme.getPlayerState()
    if (state === eatme.STATE_OFFLINE) {
      return
    }
    if (state === eatme.STATE_WAITING) {
      eatme.quitWait()
    } else {
      eatme.quitBattle()
    }
  }

  function enable(ele) {
    ele.prop('disabled', false)
  }

  function disable(ele) {
    ele.prop('disabled', true)
  }

  function show(ele) {
    enable(ele)
    ele.show()
  }

  function hide(ele) {
    disable(ele)
    ele.hide()
  }

  function setInfo(info) {
    pPrompt.html(info)
    window.scrollTo(0, document.body.scrollHeight)
  }

  function appendInfo(info) {
    pPrompt.html(pPrompt.html() + info)
    window.scrollTo(0, document.body.scrollHeight)
  }

  function clrInfo() {
    pPrompt.text('')
  }
})
