module.exports = (() => {
  let loopTimerId = null
  let countDownTimerId = null
  let element = null
  let oriContent = null

  const startLoop = (interval, cb) => {
    loopTimerId = setInterval(() => {
      cb()
    }, interval)
  }

  const stopLoop = () => {
    if (loopTimerId) clearInterval(loopTimerId)
    loopTimerId = null
  }

  const startCountDown = (ele, beg, end, cb) => {
    stopCountDown()
    element = ele
    oriContent = ele.html()
    ele.html(beg)
    countDownTimerId = setInterval(() => {
      --beg
      if (beg === end - 1) {
        stopCountDown()
        if (cb) cb()
      } else {
        ele.html(beg)
      }
    }, 1000)
  }

  const stopCountDown = () => {
    if (countDownTimerId) clearInterval(countDownTimerId)
    if (element && oriContent) element.html(oriContent)
    countDownTimerId = null
    element = null
    oriContent = null
  }

  return {
    startLoop: startLoop,
    stopLoop: stopLoop,
    startCountDown: startCountDown,
    stopCountDown: stopCountDown
  }
})()
