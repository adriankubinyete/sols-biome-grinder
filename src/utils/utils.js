#!/usr/bin/node

function removeLineBreaks (text) {
    return text.replace(/(\r\n|\n|\r)/gm, '');
};

function sleep(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

function getCurrentTimeFormatted() {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // HH:mm:ss
    return `${hours}:${minutes}:${seconds}`;
};

module.exports = {
    sleep,
    removeLineBreaks,
    getCurrentTimeFormatted
}
