module.exports = (() => {
  'use strict'

  const NUM_ROWS = 10
  const NUM_COLS = 20

  const INIT_BODIES_PAD_HOR = 2
  const INIT_BODIES_PAD_VER = 2

  const plotter = require('./plotter.js')(NUM_ROWS, NUM_COLS)
  const DIREC = require('./direc.js')
  const Pos = require('./pos.js')
  const Point = require('./point.js')
  const Snake = require('./snake.js')

  const MAP_DIREC_PLOT_TYPES = {}
  MAP_DIREC_PLOT_TYPES[DIREC.LEFT] = plotter.HEAD.LEFT
  MAP_DIREC_PLOT_TYPES[DIREC.UP] = plotter.HEAD.UP
  MAP_DIREC_PLOT_TYPES[DIREC.RIGHT] = plotter.HEAD.RIGHT
  MAP_DIREC_PLOT_TYPES[DIREC.DOWN] = plotter.HEAD.DOWN

  const SNAKE_LEFT = new Snake([
    new Pos(INIT_BODIES_PAD_VER, INIT_BODIES_PAD_HOR + 2),
    new Pos(INIT_BODIES_PAD_VER, INIT_BODIES_PAD_HOR + 1),
    new Pos(INIT_BODIES_PAD_VER, INIT_BODIES_PAD_HOR)
  ], DIREC.RIGHT)

  const SNAKE_LEFT_BODY_PLOT_TYPES = [
    plotter.HEAD.RIGHT,
    plotter.BODY.HOR,
    plotter.BODY.HOR
  ]

  const SNAKE_RIGHT = new Snake([
    new Pos(NUM_ROWS - 1 - INIT_BODIES_PAD_VER, NUM_COLS - 1 - INIT_BODIES_PAD_HOR - 2),
    new Pos(NUM_ROWS - 1 - INIT_BODIES_PAD_VER, NUM_COLS - 1 - INIT_BODIES_PAD_HOR - 1),
    new Pos(NUM_ROWS - 1 - INIT_BODIES_PAD_VER, NUM_COLS - 1 - INIT_BODIES_PAD_HOR)
  ], DIREC.LEFT)

  const SNAKE_RIGHT_BODY_PLOT_TYPES = [
    plotter.HEAD.LEFT,
    plotter.BODY.HOR,
    plotter.BODY.HOR
  ]

  const COLOR = {
    FOOD: '#81C784',
    SELF_HEAD: '#F44336',
    SELF_BODY: '#F44336',
    OPPONENT_HEAD: '#3F51B5',
    OPPONENT_BODY: '#3F51B5',
    SHADOW_ATTACK: '#F44336',
    SHADOW_DEFEND: '#3F51B5'
  }

  const contents = new Array(NUM_ROWS)

  let canvasContainer = null
  let timeTxt = null

  let snakeSelf = null
  let snakeOpponent = null

  const isEmptyType = (type) => type === Point.TYPE.EMPTY

  const isWallType = (type) => type === Point.TYPE.WALL

  const isFoodType = (type) => type === Point.TYPE.FOOD

  const isSelfType = (type) =>
    type === Point.TYPE.SELF_HEAD || type === Point.TYPE.SELF_BODY

  const isOpponentType = (type) =>
    type === Point.TYPE.OPPONENT_HEAD || type === Point.TYPE.OPPONENT_BODY

  const isSafeType = (type) => isEmptyType(type) || isFoodType(type)

  const lastSelfDirec = () => snakeSelf.lastDirec()

  const init = (canvas, pTime) => {
    plotter.init(canvas, COLOR)
    // plotter.drawTestContents()
    canvasContainer = canvas.parent()

    timeTxt = pTime
    timeTxt.css('top', plotter.actualMarginVer() + 0.05 * plotter.actualContentHeight())

    for (let i = 0; i < contents.length; ++i) {
      contents[i] = new Array(NUM_COLS)
      for (let j = 0; j < contents[i].length; ++j) {
        contents[i][j] = new Point()
      }
    }
  }

  const resetSnakes = (selfOnLeft) => {
    if (selfOnLeft) {
      snakeSelf = SNAKE_LEFT
      snakeOpponent = SNAKE_RIGHT
    } else {
      snakeSelf = SNAKE_RIGHT
      snakeOpponent = SNAKE_LEFT
    }
    snakeSelf.reset()
    snakeOpponent.reset()

    _clearAll()
    _addSelfSnake(selfOnLeft ? SNAKE_LEFT_BODY_PLOT_TYPES : SNAKE_RIGHT_BODY_PLOT_TYPES)
    _addOpponentSnake(selfOnLeft ? SNAKE_RIGHT_BODY_PLOT_TYPES : SNAKE_LEFT_BODY_PLOT_TYPES)
  }

  const attackShadow = () => {
    plotter.drawAttackShadow()
  }

  const defendShadow = () => {
    plotter.drawDefendShadow()
  }

  const blinkAttackShadow = () => {
    plotter.drawBlinkAttackShadow()
  }

  const blinkDefendShadow = () => {
    plotter.drawBlinkDefendShadow()
  }

  const show = (duration, complete) => {
    canvasContainer.fadeIn(duration, complete)
  }

  const hide = (duration, complete) => {
    canvasContainer.fadeOut(duration, complete)
  }

  const blur = () => {
    canvasContainer.addClass('blur')
  }

  const noBlur = () => {
    canvasContainer.removeClass('blur')
  }

  const showTime = (duration, complete) => {
    timeTxt.fadeIn(duration, complete)
  }

  const hideTime = (duration, complete) => {
    timeTxt.fadeOut(duration, complete)
  }

  const updateTime = (txt) => {
    timeTxt.html(txt)
  }

  const attackTime = () => {
    timeTxt.css('color', COLOR.SELF_BODY)
  }

  const defendTime = () => {
    timeTxt.css('color', COLOR.OPPONENT_BODY)
  }

  const addRandFood = (random) => {
    const empties = []
    for (let i = 0; i < NUM_ROWS; ++i) {
      for (let j = 0; j < NUM_COLS; ++j) {
        if (isEmptyType(contents[i][j].type())) empties.push(new Pos(i, j))
      }
    }
    if (empties.length > 0) {
      const foodIdx = Math.floor(random() * empties.length)
      _updateFood(empties[foodIdx])
    }
  }

  const moveSelfSnake = (direc) => {
    return _moveSnake(true, direc)
  }

  const moveOpponentSnake = (direc) => {
    return _moveSnake(false, direc)
  }

  const _addSelfSnake = (bodyPlotTypes) => {
    _addSnake(true, bodyPlotTypes)
  }

  const _addOpponentSnake = (bodyPlotTypes) => {
    _addSnake(false, bodyPlotTypes)
  }

  const _addSnake = (self, bodyPlotTypes) => {
    const snake = self ? snakeSelf : snakeOpponent
    for (let i = 0; i < snake.len(); ++i) {
      const body = snake.body(i)
      if (i === 0) {
        _updateHead(body, bodyPlotTypes[i], self)
      } else {
        _updateBody(body, bodyPlotTypes[i], self)
      }
    }
  }

  const _moveSnake = (self, direc) => {
    const snake = self ? snakeSelf : snakeOpponent
    const oldHead = snake.head()
    const oldTail = snake.tail()
    const lastDirec = snake.lastDirec()

    const newHead = oldHead.adj(direc)
    const eatType = _isValid(newHead) ? _point(newHead).type() : Point.TYPE.WALL
    const foodEaten = isFoodType(eatType)

    let oldHeadPlotType = null
    if ((lastDirec === DIREC.LEFT && direc === DIREC.LEFT) ||
        (lastDirec === DIREC.RIGHT && direc === DIREC.RIGHT)) {
      oldHeadPlotType = plotter.BODY.HOR
    } else if ((lastDirec === DIREC.UP && direc === DIREC.UP) ||
               (lastDirec === DIREC.DOWN && direc === DIREC.DOWN)) {
      oldHeadPlotType = plotter.BODY.VER
    } else if ((lastDirec === DIREC.RIGHT && direc === DIREC.UP) ||
               (lastDirec === DIREC.DOWN && direc === DIREC.LEFT)) {
      oldHeadPlotType = plotter.BODY.LU
    } else if ((lastDirec === DIREC.LEFT && direc === DIREC.UP) ||
               (lastDirec === DIREC.DOWN && direc === DIREC.RIGHT)) {
      oldHeadPlotType = plotter.BODY.UR
    } else if ((lastDirec === DIREC.LEFT && direc === DIREC.DOWN) ||
               (lastDirec === DIREC.UP && direc === DIREC.RIGHT)) {
      oldHeadPlotType = plotter.BODY.RD
    } else if ((lastDirec === DIREC.RIGHT && direc === DIREC.DOWN) ||
               (lastDirec === DIREC.UP && direc === DIREC.LEFT)) {
      oldHeadPlotType = plotter.BODY.DL
    }

    if (!isWallType(eatType)) _updateHead(newHead, MAP_DIREC_PLOT_TYPES[direc], self)
    _updateBody(oldHead, oldHeadPlotType, self)

    if (!foodEaten && !isSelfType(eatType)) _clear(oldTail)

    snake.move(direc, foodEaten)

    return eatType
  }

  const _updateFood = (pos) => {
    plotter.drawFood(pos.row(), pos.col())
    _point(pos).type(Point.TYPE.FOOD)
  }

  const _updateHead = (pos, plotType, self) => {
    plotter.drawHead(pos.row(), pos.col(), plotType, self)
    _point(pos).type(self ? Point.TYPE.SELF_HEAD : Point.TYPE.OPPONENT_HEAD)
  }

  const _updateBody = (pos, plotType, self) => {
    plotter.drawBody(pos.row(), pos.col(), plotType, self)
    _point(pos).type(self ? Point.TYPE.SELF_BODY : Point.TYPE.OPPONENT_BODY)
  }

  const _clear = (pos) => {
    plotter.clear(pos.row(), pos.col())
    _point(pos).type(Point.TYPE.EMPTY)
  }

  const _clearAll = () => {
    plotter.clearAll()
    for (let i = 0; i < NUM_ROWS; ++i) {
      for (let j = 0; j < NUM_COLS; ++j) {
        contents[i][j].type(Point.TYPE.EMPTY)
      }
    }
  }

  const _isValid = (pos) =>
    pos.row() >= 0 && pos.row() < NUM_ROWS && pos.col() >= 0 && pos.col() < NUM_COLS

  const _point = (pos) => contents[pos.row()][pos.col()]

  return {
    DIREC: DIREC,

    isEmptyType: isEmptyType,
    isWallType: isWallType,
    isFoodType: isFoodType,
    isSelfType: isSelfType,
    isOpponentType: isOpponentType,
    isSafeType: isSafeType,

    lastSelfDirec: lastSelfDirec,

    init: init,
    resetSnakes: resetSnakes,

    attackShadow: attackShadow,
    defendShadow: defendShadow,
    blinkAttackShadow: blinkAttackShadow,
    blinkDefendShadow: blinkDefendShadow,

    show: show,
    hide: hide,
    blur: blur,
    noBlur: noBlur,

    showTime: showTime,
    hideTime: hideTime,
    updateTime: updateTime,
    attackTime: attackTime,
    defendTime: defendTime,

    addRandFood: addRandFood,

    moveSelfSnake: moveSelfSnake,
    moveOpponentSnake: moveOpponentSnake
  }
})()
