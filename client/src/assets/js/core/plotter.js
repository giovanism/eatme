module.exports = (() => {
  const CANVAS_WIDTH = 3 * window.innerWidth / 4
  const CANVAS_HEIGHT = 3 * window.innerHeight / 4

  let ctx = null

  const init = (canvasId) => {
    const jqObj = $('#' + canvasId)
    jqObj.attr('width', CANVAS_WIDTH)
    jqObj.attr('height', CANVAS_HEIGHT)
    ctx = jqObj.get(0).getContext('2d')
    ctx.fillStyle = '#FFFDE7'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  }

  return {
    init: init
  }
})()
