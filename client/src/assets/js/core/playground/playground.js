module.exports = (canvasId) => {
  const NUM_ROWS = 10
  const NUM_COLS = 20

  const INIT_BODIES_PAD_HOR = 2
  const INIT_BODIES_PAD_VER = 2

  const plotter = require('./plotter.js')(NUM_ROWS, NUM_COLS)
  const Direc = require('./direc.js')
  const Pos = require('./pos.js')
  const Point = require('./point.js')
  const Snake = require('./snake.js')

  const contents = new Array(NUM_ROWS)

  const snakeLeft = new Snake([
    new Pos(INIT_BODIES_PAD_VER, INIT_BODIES_PAD_HOR + 2),
    new Pos(INIT_BODIES_PAD_VER, INIT_BODIES_PAD_HOR + 1),
    new Pos(INIT_BODIES_PAD_VER, INIT_BODIES_PAD_HOR)
  ], Direc.RIGHT)

  const snakeLeftBodyTypes = [
    plotter.HEAD.RIGHT,
    plotter.BODY.HOR,
    plotter.BODY.HOR
  ]

  const snakeRight = new Snake([
    new Pos(NUM_ROWS - 1 - INIT_BODIES_PAD_VER, NUM_COLS - 1 - INIT_BODIES_PAD_HOR - 2),
    new Pos(NUM_ROWS - 1 - INIT_BODIES_PAD_VER, NUM_COLS - 1 - INIT_BODIES_PAD_HOR - 1),
    new Pos(NUM_ROWS - 1 - INIT_BODIES_PAD_VER, NUM_COLS - 1 - INIT_BODIES_PAD_HOR)
  ], Direc.LEFT)

  const snakeRightBodyTypes = [
    plotter.HEAD.LEFT,
    plotter.BODY.HOR,
    plotter.BODY.HOR
  ]

  let snakeSelf = null
  let snakeOpponent = null

  const init = () => {
    plotter.init(canvasId)
    plotter.drawTestContents()

    for (let i = 0; i < contents.length; ++i) {
      contents[i] = new Array(NUM_COLS)
    }
  }

  const resetSnakes = (selfOnLeft) => {
    if (selfOnLeft) {
      snakeSelf = snakeLeft
      snakeOpponent = snakeRight
    } else {
      snakeSelf = snakeRight
      snakeOpponent = snakeLeft
    }
    snakeSelf.reset()
    snakeOpponent.reset()

    _clear()
    _drawSelfSnake(selfOnLeft ? snakeLeftBodyTypes : snakeRightBodyTypes)
    _drawOpponentSnake(selfOnLeft ? snakeRightBodyTypes : snakeLeftBodyTypes)
  }

  const _drawSelfSnake = (bodyTypes) => {
    _drawSnake(true, snakeSelf, bodyTypes)
  }

  const _drawOpponentSnake = (bodyTypes) => {
    _drawSnake(false, snakeOpponent, bodyTypes)
  }

  const _drawSnake = (self, snake, bodyTypes) => {
    const head = snake.head()
    let drawFunc = self ? plotter.drawSelfHead : plotter.drawOpponentHead
    drawFunc(head.row(), head.col(), bodyTypes[0])

    drawFunc = self ? plotter.drawSelfBody : plotter.drawOpponentBody
    for (let i = 1; i < snake.len(); ++i) {
      const pos = snake.body(i)
      drawFunc(pos.row(), pos.col(), bodyTypes[i])
    }
  }

  const _clear = () => {
    plotter.clearAll()
  }

  return {
    init: init,
    resetSnakes: resetSnakes
  }
}
