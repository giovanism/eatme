module.exports = (() => {
  'use strict'

  const FREQ_ACTION = 150 // ms

  let gameCtrl = null
  let playground = null

  let loopId = null

  const init = (ctrl, plygrnd) => {
    gameCtrl = ctrl
    playground = plygrnd
  }

  const fakeBattleId = () => {
    return 'robotbattle'
  }

  const fakeSeed = () => {
    return Math.floor(Math.random() * Math.floor(1e7))
  }

  const fakeAttack = () => {
    return Math.random() < 0.5 ? '0' : '1'
  }

  const start = (cb) => {
    loopId = window.setInterval(() => {
      if (gameCtrl.isGameStarted()) {
        let humanAction = gameCtrl.getNextAction()
        if (humanAction) {
          cb(humanAction, _nextAction())
        }
      }
    }, FREQ_ACTION)
  }

  const stop = () => {
    if (loopId) {
      window.clearInterval(loopId)
      loopId = null
    }
  }

  const _nextAction = () => {
    return gameCtrl.ACTION.LEFT
  }

  return {
    init: init,
    fakeBattleId: fakeBattleId,
    fakeSeed: fakeSeed,
    fakeAttack: fakeAttack,
    start: start,
    stop: stop
  }
})()
