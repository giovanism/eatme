module.exports = (canvasId) => {
  const plotter = require('./plotter.js')

  const init = () => {
    plotter.init(canvasId)
  }

  return {
    init: init
  }
}
