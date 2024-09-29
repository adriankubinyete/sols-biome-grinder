#!/usr/bin/node
const path = require('path');
const system = require(path.resolve('src/lib/systemclass'));
const robot = require('robotjs');
const { setTimeout } = require('timers/promises');

console.log('ENVIRONMENT: ' + process.env.NODE_ENV)
require("dotenv").config({ path: path.resolve(`.env.${process.env.NODE_ENV || 'dev'}`) });
const { determineCurrentProbableBiome, expectText, readBiome, readCoordinate, notifyDiscord, clickPlayButton, sleep } = require(path.resolve("src/utils/utility"));
const { Logger } = require(path.resolve('src/utils/logger'));
const { Tests } = require(path.resolve("src/utils/tests"))
const log = new Logger("sols-biome-grinder::main", false).useEnvConfig().create();
// const test = new Tests()

let _execUrl
let SVR_NUMBER = 0; // server roll iteration, how many times you rolled server

function getPrivateLink() {
    if (_execUrl) { return _execUrl }

    const pvtUrl = new URL(process.env.PRIVATE_SERVER);
    const pvtCode = pvtUrl.searchParams.get("privateServerLinkCode");
    _execUrl = "roblox://placeID=15532962292&linkCode=" + pvtCode;
    return _execUrl
}

async function doServerRoll() {
    SVR_NUMBER++
    let URL = getPrivateLink();

    // open roblox if not open yet
    await system.joinRobloxServer(URL)

    // lets be honest, you're not joining instantly mf
    sleep(2500)

    if (!await expectText('Play', [[870, 830], [1050, 930]], {
        retry_interval: 1000,
        retry_attempts: 10
    })) {
        console.log(`<S#${SVR_NUMBER}> could not locate textbox play`)
        return
    }
    clickPlayButton()

    // adjust camera for detect
    // hold right click
    // scroll all the way in
    // ONE scroll out
    // this shit doesnt work with robotjs apparently?

    sleep(5000) // waits 3 seconds for fade animation before taking screenshots for biome-detection

    log.info(`<S#${SVR_NUMBER}> Detecting biome...`)
    let biome = await determineCurrentProbableBiome({
        analysis_interval: 250,
        analysis_iterations: 7,
        output: true,
        analysis_output_probable_biome: true,
        analysis_output_probability_list: false,
    });
    log.info(`<S#${SVR_NUMBER}> Biome on this server: ${biome}`)

    notifyDiscord(biome)

    log.unit(`<S#${SVR_NUMBER}> Closing roblox...`)
    await system.closeRoblox()
    log.unit(`<S#${SVR_NUMBER}> Succesfully closed`)

    const WAIT_NEXT_ROLL = 5000; //ms
    log.unit(`<S#${SVR_NUMBER}> Waiting ${WAIT_NEXT_ROLL * 1000}s before next loop...`)
    sleep(WAIT_NEXT_ROLL) // wait 5 seconds before rejoining or else roblox gets mad
    // (time is approximated)
    doServerRoll()
}


async function test() {
    await doServerRoll()

}

(async () => { await test() })()


// CORE objectives:

// launch private
// done > private server url
// done > checking if game is already open (skip to check biome)
// done > confirm game is open

// wait loadtime
// done (expect play) > how to determine game is loaded

// click start
// wip (expect play, click pos)> how to determine screen pos to cick

// check biome, notify if needed
// done (read coord)> determine where biome is located
// done (read coord)> read text from biome
// > if needed, notify

// close private
// done > close game
// done > confirm game is closed

// repeat
