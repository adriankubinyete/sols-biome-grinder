let path = require('path');
const robot = require('robotjs');
const { screenshot } = require('./src/utils/utility');
const { logMouseCoordinates, determineCurrentProbableBiome, expectText, readBiome, readCoordinate, notifyDiscord, clickPlayButton, sleep } = require(path.resolve("src/utils/utility"));
const { Tests } = require(path.resolve("src/utils/tests"))
const test = new Tests();


// Main testing function
(async () => {

    // robot.moveMouse(960, 870)
    // robot.moveMouseSmooth(965, 875)
    // robot.mouseClick("left", true)
    // robot.mouseClick("left", true)
    // robot.mouseClick("left", true)
    // sleep(1000)
    // console.log('Scrolling')
    // robot.scrollMouse(0, 0)

    // const PLAYBUTTONBOX = [[870, 830], [1050, 930]]
    // const BIOMEBOX = [[10, 905], [180, 925]]

    // const randomFileName = "bananas";
    // const tempImagePath = path.resolve(`images/screenshot_${randomFileName}.png`);
    // await screenshot(BIOMEBOX, tempImagePath)

    // console.log('Biome: ' + await readBiome())

    

    // sleep(500)
    // robot.keyToggle('i', 'down')
    // sleep(500)
    // robot.mouseToggle("up", "right");

    // sleep(5000)
    // robot.keyTap('i')
    // robot.keyTap('o')
    // robot.keyToggle('i', 'down')
    // // robot.keyTap('i')
    // sleep(1500) // segura I por 1500 segundos
    // robot.keyTap('i')
    // robot.keyToggle('i', 'up')
    // // robot.keyTap('i')

    // sleep(250) // pausa 250 ms

    // robot.keyTap('o')
    // robot.keyToggle('o', 'down')
    // sleep(1000) // segura O por 1 segundo
    // robot.keyTap('o')
    // robot.keyToggle('o', 'up')


    // MouseMove, % A_ScreenWidth/2, % A_ScreenHeight/2
    // Sleep, 200
    // Loop 20 {
    //     Click, WheelUp
    //     Sleep, 50
    // }
    // Loop 10 {
    //     Click, WheelDown
    //     Sleep, 50
    // }

    // sleep(100)
    // robot.scrollMouse(0, -50)
    // await logMouseCoordinates()
    // ---- DISCORD MESSAGE
    // let ret = await notifyDiscord('Glitch');
    // console.log(ret)

    // ---- REPEATING
    // const runInLoop = async () => {
    //     // console.log("Biome: " + await determineCurrentProbableBiome({ 
    //     //     analysis_interval: 50,
    //     //     output: true,
    //     //     verbose_if_gibberish: true,
    //     //     // analysis_log: true
    //     // }));

    //     let INTERVAL = 250 // ms
    //     let ITERATIONS = 5

    //     test.time('biome')
    //     console.log(`Expected wait time: ${(INTERVAL * ITERATIONS)/1000} seconds`)
    //     let biome = await determineCurrentProbableBiome({
    //         analysis_interval: INTERVAL,
    //         analysis_iterations: ITERATIONS,
    //         output: false,
    //         analysis_log: false
    //     });
    //     let duration = test.endTime('biome');
    //     console.log('Took ' + duration)


    //     if (['Glitch', 'Normal', 'Rainy', 'Windy'].includes(biome)) {
    //         notifyDiscord(biome, false)
    //         console.log('got expected biome!')
    //     } else {
    //         console.log(`not the expected biome! (${biome})`)
    //     }
    // };

    // await runInLoop();

    // setInterval(runInLoop, 5000)


    // ---- SINGLE
    // console.log( "It's probably: " + await determineCurrentProbableBiome({ 
    //     analysis_interval: 50,
    //     output: true,
    //     verbose_if_gibberish: false,
    //     analysis_log: true
    // }))
})();
