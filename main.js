#!/usr/bin/node
const path = require('path');
const system = require(path.resolve('systemclass'));

console.log('ENVIRONMENT: ' + process.env.NODE_ENV)
require("dotenv").config({ path: path.resolve(`.env.${process.env.NODE_ENV || 'dev'}`) });
const { Logger } = require(path.resolve('src/utils/logger'));
const log = new Logger("sols-biome-grinder::main", false).useEnvConfig().create();

// test objective: 
// launch game 
// confirm game is open
// wait 10s
// close game
// confirm game is closed

let _execUrl

function getPrivateLink() {
    if (_execUrl) { return _execUrl }

    const pvtUrl = new URL(process.env.PRIVATE_SERVER);
    const pvtCode = pvtUrl.searchParams.get("privateServerLinkCode");
    _execUrl = "roblox://placeID=15532962292&linkCode=" + pvtCode;
    return _execUrl
}

async function launchRoblox() {
    let URL = getPrivateLink();

    console.log('opening roblox')
    await system.joinRobloxServer(URL)
    console.log('server joined!')


    //
    // console.log('closing roblox')
    // await system.closeRoblox()
    // console.log('closed roblox')
}


async function test() {
    await launchRoblox()

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
