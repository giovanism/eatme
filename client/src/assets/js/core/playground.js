module.exports = (canvasId) => {
  const NUM_ROWS = 6
  const NUM_COLS = 6

  const plotter = require('./plotter.js')(NUM_ROWS, NUM_COLS)

  const init = () => {
    plotter.init(canvasId)
    plotter.drawTestContents()
  }

  return {
    init: init
  }
}
