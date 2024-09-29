#!/usr/bin/node

// PS: It doesn't need to be ordered, I just like it that way.
// PPS: I won't be doing time search! (daytime, nighttime)
let BIOMECONFIG = {
    'Glitch': {
        embed_hex_color: '#000000',
        spawnchance: 30000,
        notify: true,
        ping: true,
    },
    'Null': {
        embed_hex_color: '#464646',
        spawnchance: 13333,
        notify: true,
        ping: true,
    },
    'Corruption': {
        embed_hex_color: '#802cb6',
        spawnchance: 9000,
        notify: true,
        ping: true,
    },
    'Starfall': {
        embed_hex_color: '#0186ff',
        spawnchance: 7500,
        notify: true,
        ping: true,
    },
    'Hell': {
        embed_hex_color: '#ff6601',
        spawnchance: 6666,
        notify: true,
        ping: true,
    },
    'SandStorm': {
        embed_hex_color: '#fff77f',
        spawnchance: 3000,
        notify: true,
        ping: true,
    },
    'Rainy': {
        embed_hex_color: '#0006ff',
        spawnchance: 750,
        notify: true,
        ping: false,
    },
    'Snowy': {
        embed_hex_color: '#dcedee',
        spawnchance: 600,
        notify: true,
        ping: false,
    },
    'Windy': {
        embed_hex_color: '#c1f5f8',
        spawnchance: 500,
        notify: true,
        ping: false,
    },
    'Normal': {
        embed_hex_color: '#e9e9e9',
        spawnchance: 1,
        notify: true,
        ping: false,
    },
}

module.exports = {
    BIOMECONFIG
}
