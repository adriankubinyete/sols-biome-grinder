#!/usr/bin/node
const path = require('path');
const robot = require('robotjs');
const { screenshot } = require(path.resolve('src/utils/utility'));
const { sleep } = require(path.resolve('src/utils/utils'));

function testClickPlayButton(config = {}) {
    const MOUSE_SPEED = 2;
    const COORDINATES = [960, 870];
    const [x1, y1] = COORDINATES;

    console.log('Starting test: CLICK PLAY BUTTON')
    sleep(1000)

    console.log(`Moving to x:${x1} y:${y1}, this should be the CLICK POINT.`)
    robot.moveMouseSmooth(x1, y1, MOUSE_SPEED);
    sleep(1000)

    console.log('DONE!')
    sleep(1000)

};

function testScreenshotPlayButton(config = {}) {
    const {
        scrShot = config?.screenshot || true,
    } = config;

    const MOUSE_SPEED = 2;
    const COORDINATES = [[870, 830], [1050, 930]];
    const SCREENSHOT_FILE = path.resolve('tests/images/test_screenshot_playbutton.png')
    const [one, two] = COORDINATES;
    const [x1, y1] = one;
    const [x2, y2] = two;

    console.log('Starting test: SCREENSHOT PLAY BUTTON')
    sleep(1000)

    console.log(`Moving to x:${x1} y:${y1}, this should be UPPER LEFT point.`)
    robot.moveMouseSmooth(x1, y1, MOUSE_SPEED);
    sleep(1000)

    console.log(`Moving to x:${x2} y:${y2}, this should be BOTTOM RIGHT point.`)
    robot.moveMouseSmooth(x2, y2, MOUSE_SPEED);
    sleep(1000)

    if (scrShot) {
        console.log(`Taking screenshot of ${JSON.stringify(COORDINATES)}`)
        screenshot(COORDINATES, SCREENSHOT_FILE, { keep: true })
        sleep(1000)
    }

    console.log('DONE!')
    sleep(1000)
};

function testScreenshotBiome(config = {}) {
    const {
        scrShot = config?.screenshot || true,
    } = config;
    const MOUSE_SPEED = 2;
    const COORDINATES = [[10, 905], [180, 925]];
    const SCREENSHOT_FILE = path.resolve('tests/images/test_screenshot_biome.png')
    const [one, two] = COORDINATES;
    const [x1, y1] = one;
    const [x2, y2] = two;

    console.log('Starting test: SCREENSHOT BIOME')
    sleep(1000)

    console.log(`Moving to x:${x1} y:${y1}, this should be UPPER LEFT point.`)
    robot.moveMouseSmooth(x1, y1, MOUSE_SPEED);
    sleep(1000)

    console.log(`Moving to x:${x2} y:${y2}, this should be BOTTOM RIGHT point.`)
    robot.moveMouseSmooth(x2, y2, MOUSE_SPEED);
    sleep(1000)

    if (scrShot) {
        console.log(`Taking screenshot of ${JSON.stringify(COORDINATES)}`)
        screenshot(COORDINATES, SCREENSHOT_FILE, { keep: true })
        sleep(1000)
    }

    console.log('DONE!')
    sleep(1000)
};

function executeTests(config = {}) {
    const {
        screenshot_biome = config?.screenshot_biome || true,
        screenshot_playbutton = config?.screenshot_playbutton || true,
    } = config;

    testClickPlayButton()
    testScreenshotBiome({ screenshot: screenshot_biome })
    testScreenshotPlayButton({ screenshot: screenshot_playbutton })
}

module.exports = {
    testClickPlayButton,
    testScreenshotBiome,
    testScreenshotPlayButton,
    executeTests
}
