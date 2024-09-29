#!/usr/bin/node
const path = require('path');
const system = require(path.resolve('src/lib/systemclass'));
const robot = require('robotjs');
console.log('ENVIRONMENT: ' + process.env.NODE_ENV)
require("dotenv").config({ path: path.resolve(`.env.${process.env.NODE_ENV || 'dev'}`) });
const { determineCurrentProbableBiome, expectText, readBiome, readCoordinate, clickPlayButton, handleDiscordMessage } = require(path.resolve('src/utils/utility'));
const { sleep } = require(path.resolve("src/utils/utils"));
const { Logger } = require(path.resolve('src/utils/logger'));
const { Tests } = require(path.resolve("src/utils/tests"))
const log = new Logger("sols-biome-grinder::main", false).useEnvConfig().create();
// const test = new Tests()

let _execUrl
let SVR_NUMBER = 0; // server roll iteration, how many times you rolled server
let MISSED_BIOMES = 0;
let FOUND_BIOMES = 0;
let RECONNECT_ATTEMPTS = 0;

function getPrivateLink() {
    if (_execUrl) { return _execUrl }

    const pvtUrl = new URL(process.env.PRIVATE_SERVER);
    const pvtCode = pvtUrl.searchParams.get("privateServerLinkCode");
    _execUrl = "roblox://placeID=15532962292&linkCode=" + pvtCode;
    return _execUrl
}

async function doServerRoll() {
    if (RECONNECT_ATTEMPTS > 0) { log.warn(`There was ${RECONNECT_ATTEMPTS} reconnections!`)}
    if (RECONNECT_ATTEMPTS > 5) { log.critical('Aborting: too many reconnection attempts ') }
    SVR_NUMBER++
    let URL = getPrivateLink();
    const WAIT_GAME_START = 2500; // ms
    const WAIT_AFTER_PLAY_BUTTON = 5000; // ms
    const WAIT_AFTER_CLOSE = 5000; //ms
    const COORDINATES_PLAY_BUTTON = [[870, 830], [1050, 930]];

    if (await system.isRobloxOpen()) {
        log.info(`[#${SVR_NUMBER}] Game is open on loop begin. Closing...`)
        await system.closeRoblox()
        sleep(WAIT_AFTER_CLOSE)
    }

    // joins private server
    log.info(`[#${SVR_NUMBER}] Joining game...`)
    await system.joinRobloxServer(URL)
    log.debug(`[#${SVR_NUMBER}] Joined`)

    // lets be honest, you're not joining instantly mf
    sleep(WAIT_GAME_START);

    // expects play button.
    log.info(`[#${SVR_NUMBER}] Expecting play button...`)
    if (!await expectText('Play', COORDINATES_PLAY_BUTTON, {
        retry_interval: 1000,
        retry_attempts: 10
    })) {
        // TODO(adrian): retry twice before closing roblox and looping again
        // if the method above fails twice, stop the program because
        // something is wrong (window size or something else for instance)
        log.critical(`[#${SVR_NUMBER}]  Could not locate play button. Aborting for unpredicted behaviour.`)

        log.info(`[#${SVR_NUMBER}] Closing roblox...`)
        await system.closeRoblox()
        log.debug(`[#${SVR_NUMBER}] Closed`)
        sleep(5000) // aguarda 5s
        RECONNECT_ATTEMPTS++
        
        doServerRoll()
        return
    }
    log.debug(`[#${SVR_NUMBER}] Found`)
    clickPlayButton()
    // TODO(adrian): enable auto roll from the get-go
    // funnily: if you roll something with roll cutscene enabled, it will
    // screw us over on biome recognition

    // TODO(adrian): adjust camera for better biome detect.
    // shit siply wont move with robotjs and i cant figure why

    sleep(WAIT_AFTER_PLAY_BUTTON) // waits 3 seconds for fade animation before taking screenshots for biome-detection

    log.info(`[#${SVR_NUMBER}] Detecting biome...`)
    let { biome, iterations } = await determineCurrentProbableBiome({
        analysis_interval: 250,
        analysis_iterations: 7,
        output: true,
        analysis_output_probable_biome: true,
        analysis_output_probability_list: false,
        return_iterations: true
    });
    log.info(`[#${SVR_NUMBER}] Biome on this server: ${biome}`)

    handleDiscordMessage({ biome: biome, server: SVR_NUMBER, extra: iterations })

    if (biome === 'Unknown') {
        MISSED_BIOMES++
    } else {
        FOUND_BIOMES++
    }

    if (['Glitch'].includes(biome)) {
        log.info('Expected biome found, sleeping for 2 minutes before proceeding')
        sleep(120000) // lets wait before proceeding if its an expected biome
    }


    // decide if you stay in the server or leave, based if ping=true
    // if you stay, enable autoroll
    // keep monitoring biome from time to time, to check if it ended
    // could also set biome duration in config, and program a timeout 
    // to run when biome ends by config
    //
    // if yoy leave, do another server roll

    log.info(`[#${SVR_NUMBER}] Closing roblox...`)
    await system.closeRoblox()
    log.debug(`[#${SVR_NUMBER}] Closed`)


    let TOTAL_BIOMES = MISSED_BIOMES + FOUND_BIOMES
    const MISSED_PERCENTAGE = (MISSED_BIOMES / (TOTAL_BIOMES || 1)) * 100;
    const FOUND_PERCENTAGE = (FOUND_BIOMES / (TOTAL_BIOMES || 1)) * 100;
    log.info(`[#${SVR_NUMBER}] Waiting ${WAIT_AFTER_CLOSE / 1000}s before next loop...`)
    log.trace(`[#${SVR_NUMBER}] ${MISSED_PERCENTAGE.toFixed(2)}% biomes missed (${MISSED_BIOMES})`);
    log.trace(`[#${SVR_NUMBER}] ${FOUND_PERCENTAGE.toFixed(2)}% biomes found (${FOUND_BIOMES})`);
    sleep(WAIT_AFTER_CLOSE) // wait 5 seconds before rejoining or else roblox gets mad
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
