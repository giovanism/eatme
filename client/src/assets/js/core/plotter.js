module.exports = (numRows, numCols) => {
  // Canvas size in pixels
  const CANVAS_WIDTH = Math.floor(0.75 * window.innerWidth)
  const CANVAS_HEIGHT = Math.floor(0.75 * window.innerHeight)

  // Block size in pixels
  const RAW_BLOCK_WIDTH = Math.floor(CANVAS_WIDTH / numCols)
  const RAW_BLOCK_HEIGHT = Math.floor(CANVAS_HEIGHT / numRows)
  const BLOCK_WIDTH = Math.min(RAW_BLOCK_WIDTH, RAW_BLOCK_HEIGHT)
  const BLOCK_HEIGHT = BLOCK_WIDTH

  // Padding size in pixels
  const PAD_HOR = Math.floor(0.5 * (CANVAS_WIDTH - numCols * BLOCK_WIDTH))
  const PAD_VER = Math.floor(0.5 * (CANVAS_HEIGHT - numRows * BLOCK_HEIGHT))

  const SCALE_FACTOR = 0.2
  const DX = BLOCK_WIDTH * SCALE_FACTOR
  const DY = BLOCK_HEIGHT * SCALE_FACTOR

  const COLOR_BG = '#FFFDE7'
  const COLOR_FOOD = '#81C784'
  const COLOR_BODY_SELF = '#F44336'
  const COLOR_BODY_OPPONENT = '#3F51B5'
  const COLOR_HEAD_SELF = COLOR_BODY_SELF
  const COLOR_HEAD_OPPONENT = COLOR_BODY_OPPONENT

  const HEAD = {
    LEFT: 0,
    UP: 1,
    RIGHT: 2,
    DOWN: 3
  }

  const BODY = {
    HOR: 0,
    VER: 1,
    LU: 2,
    UR: 3,
    RD: 4,
    DL: 5
  }

  let ctx = null

  const init = (canvasId) => {
    const jqObj = $('#' + canvasId)
    jqObj.attr('width', CANVAS_WIDTH)
    jqObj.attr('height', CANVAS_HEIGHT)

    const obj = jqObj.get(0)
    if (!obj.getContext) {
      alert('Sorry! Your browser does not support <canvas>. Please use a different one.')
      throw new Error('[plotter] unsupported canvas')
    }

    ctx = obj.getContext('2d', {alpha: false})
    clearAll()
  }

  const clear = (row, col) => {
    _drawRect(_colToX(col), _rowToY(row), BLOCK_WIDTH, BLOCK_HEIGHT, COLOR_BG)
  }

  const clearAll = () => {
    _drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_BG)
  }

  const drawFood = (row, col) => {
    _drawFood(row, col, COLOR_FOOD)
  }

  const drawSelfHead = (row, col, type) => {
    _drawHead(row, col, type, COLOR_HEAD_SELF)
  }

  const drawOpponentHead = (row, col, type) => {
    _drawHead(row, col, type, COLOR_HEAD_OPPONENT)
  }

  const drawSelfBody = (row, col, type) => {
    _drawBody(row, col, type, COLOR_BODY_SELF)
  }

  const drawOpponentBody = (row, col, type) => {
    _drawBody(row, col, type, COLOR_BODY_OPPONENT)
  }

  const _drawFood = (row, col, color) => {
    const xBeg = _colToX(col)
    const yBeg = _rowToY(row)
    const xMid = xBeg + 0.5 * BLOCK_WIDTH
    const yMid = yBeg + 0.5 * BLOCK_HEIGHT
    const r = 0.25 * (BLOCK_WIDTH - 1.5 * DX + BLOCK_HEIGHT - 1.5 * DY)

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(xMid, yMid, r, 0, 2 * Math.PI)
    ctx.fill()
  }

  const _drawHead = (row, col, type, color) => {
    const xBeg = _colToX(col)
    const yBeg = _rowToY(row)
    const xMid = xBeg + 0.5 * BLOCK_WIDTH
    const yMid = yBeg + 0.5 * BLOCK_HEIGHT
    const xEnd = xBeg + BLOCK_WIDTH
    const yEnd = yBeg + BLOCK_HEIGHT
    const rEye = 0.35 * (DX + DY)
    const rEyeball = 0.4 * rEye

    ctx.fillStyle = color
    if (type === HEAD.LEFT) {
      ctx.beginPath()
      ctx.moveTo(xEnd, yBeg + DY)
      ctx.lineTo(xEnd - DX, yBeg + DY)
      ctx.bezierCurveTo(xBeg + 2 * DX, yBeg, xBeg + DX, yBeg + DY, xBeg + DX, yMid)
      ctx.bezierCurveTo(xBeg + DX, yEnd - DY, xBeg + 2 * DX, yEnd, xEnd - DX, yEnd - DY)
      ctx.lineTo(xEnd, yEnd - DY)
      ctx.fill()
      _drawEyes(xMid, yBeg + 1.5 * DY, xMid, yEnd - 1.5 * DY, rEye, rEyeball)
    } else if (type === HEAD.UP) {
      ctx.beginPath()
      ctx.moveTo(xBeg + DX, yEnd)
      ctx.lineTo(xBeg + DX, yEnd - DY)
      ctx.bezierCurveTo(xBeg, yBeg + 2 * DY, xBeg + DX, yBeg + DY, xMid, yBeg + DY)
      ctx.bezierCurveTo(xEnd - DX, yBeg + DY, xEnd, yBeg + 2 * DY, xEnd - DX, yEnd - DY)
      ctx.lineTo(xEnd - DX, yEnd)
      ctx.fill()
      _drawEyes(xBeg + 1.5 * DX, yMid, xEnd - 1.5 * DX, yMid, rEye, rEyeball)
    } else if (type === HEAD.RIGHT) {
      ctx.beginPath()
      ctx.moveTo(xBeg, yBeg + DY)
      ctx.lineTo(xBeg + DX, yBeg + DY)
      ctx.bezierCurveTo(xEnd - 2 * DX, yBeg, xEnd - DX, yBeg + DY, xEnd - DX, yMid)
      ctx.bezierCurveTo(xEnd - DX, yEnd - DY, xEnd - 2 * DX, yEnd, xBeg + DX, yEnd - DY)
      ctx.lineTo(xBeg, yEnd - DY)
      ctx.fill()
      _drawEyes(xMid, yBeg + 1.5 * DY, xMid, yEnd - 1.5 * DY, rEye, rEyeball)
    } else if (type === HEAD.DOWN) {
      ctx.beginPath()
      ctx.moveTo(xBeg + DX, yBeg)
      ctx.lineTo(xBeg + DX, yBeg + DY)
      ctx.bezierCurveTo(xBeg, yEnd - 2 * DY, xBeg + DX, yEnd - DY, xMid, yEnd - DY)
      ctx.bezierCurveTo(xEnd - DX, yEnd - DY, xEnd, yEnd - 2 * DY, xEnd - DX, yBeg + DY)
      ctx.lineTo(xEnd - DX, yBeg)
      ctx.fill()
      _drawEyes(xBeg + 1.5 * DX, yMid, xEnd - 1.5 * DX, yMid, rEye, rEyeball)
    }
  }

  const _drawEyes = (xEye1, yEye1, xEye2, yEye2, rEye, rEyeball) => {
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(xEye1, yEye1, rEye, 0, 2 * Math.PI)
    ctx.arc(xEye2, yEye2, rEye, 0, 2 * Math.PI)
    ctx.fill()

    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.arc(xEye1, yEye1, rEyeball, 0, 2 * Math.PI)
    ctx.arc(xEye2, yEye2, rEyeball, 0, 2 * Math.PI)
    ctx.fill()
  }

  const _drawBody = (row, col, type, color) => {
    const xBeg = _colToX(col)
    const yBeg = _rowToY(row)
    const yEnd = yBeg + BLOCK_HEIGHT - 1
    const verWidth = BLOCK_WIDTH - 2 * DX
    const horHeight = BLOCK_HEIGHT - 2 * DY

    if (type === BODY.HOR) {
      _drawRect(xBeg, yBeg + DY, BLOCK_WIDTH, horHeight, color)
    } else if (type === BODY.VER) {
      _drawRect(xBeg + DX, yBeg, verWidth, BLOCK_HEIGHT, color)
    } else if (type === BODY.LU) {
      _drawRect(xBeg + DX, yBeg, verWidth, DY + 1, color)
      _drawRect(xBeg, yBeg + DY, BLOCK_WIDTH - DX, horHeight, color)
    } else if (type === BODY.UR) {
      _drawRect(xBeg + DX, yBeg, verWidth, DY + 1, color)
      _drawRect(xBeg + DX, yBeg + DY, BLOCK_WIDTH - DX, horHeight, color)
    } else if (type === BODY.RD) {
      _drawRect(xBeg + DX, yEnd - DY, verWidth, DY + 1, color)
      _drawRect(xBeg + DX, yBeg + DY, BLOCK_WIDTH - DX, horHeight, color)
    } else if (type === BODY.DL) {
      _drawRect(xBeg + DX, yEnd - DY, verWidth, DY + 1, color)
      _drawRect(xBeg, yBeg + DY, BLOCK_WIDTH - DX, horHeight, color)
    }
  }

  const _drawRect = (x, y, width, height, color) => {
    ctx.fillStyle = color
    ctx.fillRect(x, y, width, height)
  }

  const _colToX = col => PAD_HOR + col * BLOCK_WIDTH

  const _rowToY = row => PAD_VER + row * BLOCK_HEIGHT

  const drawTestContents = () => {
    clearAll()

    drawSelfHead(0, 0, HEAD.LEFT)
    drawSelfBody(0, 1, BODY.HOR)
    drawSelfBody(0, 2, BODY.DL)
    drawSelfBody(1, 2, BODY.VER)
    drawSelfBody(2, 2, BODY.LU)
    drawSelfBody(2, 1, BODY.HOR)
    drawSelfBody(2, 0, BODY.UR)
    drawSelfBody(1, 0, BODY.RD)
    drawSelfHead(1, 1, HEAD.RIGHT)

    drawSelfHead(0, 5, HEAD.RIGHT)
    drawSelfBody(0, 4, BODY.HOR)
    drawSelfBody(0, 3, BODY.RD)
    drawSelfBody(1, 3, BODY.VER)
    drawSelfBody(2, 3, BODY.UR)
    drawSelfBody(2, 4, BODY.HOR)
    drawSelfBody(2, 5, BODY.LU)
    drawSelfBody(1, 5, BODY.DL)
    drawSelfHead(1, 4, HEAD.LEFT)

    drawOpponentHead(3, 2, HEAD.UP)
    drawOpponentBody(4, 2, BODY.VER)
    drawOpponentBody(5, 2, BODY.LU)
    drawOpponentBody(5, 1, BODY.HOR)
    drawOpponentBody(5, 0, BODY.UR)
    drawOpponentBody(4, 0, BODY.VER)
    drawOpponentBody(3, 0, BODY.RD)
    drawOpponentBody(3, 1, BODY.DL)
    drawOpponentHead(4, 1, HEAD.DOWN)

    drawOpponentHead(3, 3, HEAD.UP)
    drawOpponentBody(4, 3, BODY.VER)
    drawOpponentBody(5, 3, BODY.UR)
    drawOpponentBody(5, 4, BODY.HOR)
    drawOpponentBody(5, 5, BODY.LU)
    drawOpponentBody(4, 5, BODY.VER)
    drawOpponentBody(3, 5, BODY.DL)
    drawOpponentBody(3, 4, BODY.RD)
    drawOpponentHead(4, 4, HEAD.DOWN)

    clear(1, 1)
    drawFood(1, 1)
    clear(4, 4)
    drawFood(4, 4)
  }

  return {
    HEAD: HEAD,
    BODY: BODY,

    init: init,

    clear: clear,
    clearAll: clearAll,

    drawFood: drawFood,
    drawSelfHead: drawSelfHead,
    drawOpponentHead: drawOpponentHead,
    drawSelfBody: drawSelfBody,
    drawOpponentBody: drawOpponentBody,

    drawTestContents: drawTestContents
  }
}