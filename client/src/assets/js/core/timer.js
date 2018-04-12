module.exports = (() => {

    let countDownTimerId = null;
    let element = null;
    let oriContent = null;

    let loopTimerId = null;

    const startCountDown = (ele, seconds, cb) => {
        stopCountDown();
        element = ele;
        oriContent = ele.html();
        ele.html(--seconds);
        countDownTimerId = setInterval(() => {
            --seconds;
            if (seconds === -1) {
                stopCountDown();
                if (cb) cb();
            } else {
                ele.html(seconds);
            }
        }, 1000);
    }

    const stopCountDown = () => {
        if (countDownTimerId) clearInterval(countDownTimerId);
        if (element && oriContent) {
            element.html(oriContent);
        }
        countDownTimerId = null;
        element = null;
        oriContent = null;
    }

    const startLoop = (interval, cb) => {
        loopTimerId = setInterval(() => {
            cb();
        }, interval);
    }

    const stopLoop = () => {
        if (loopTimerId) clearInterval(loopTimerId);
        loopTimerId = null;
    }

    return {
        startCountDown: startCountDown,
        stopCountDown: stopCountDown,
        startLoop: startLoop,
        stopLoop: stopLoop
    }

})();
