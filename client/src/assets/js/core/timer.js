module.exports = (() => {

    let countDownTimerId = null;
    let element = null;
    let oriContent = null;

    let loopTimerId = null;

    const startCountDown = (ele, beg, end, cb) => {
        stopCountDown();
        element = ele;
        oriContent = ele.html();
        ele.html(beg);
        countDownTimerId = setInterval(() => {
            --beg;
            if (beg === end - 1) {
                stopCountDown();
                if (cb) cb();
            } else {
                ele.html(beg);
            }
        }, 1000);
    }

    const stopCountDown = () => {
        if (countDownTimerId) clearInterval(countDownTimerId);
        if (element && oriContent) element.html(oriContent);
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
