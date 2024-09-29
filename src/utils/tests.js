#!/usr/bin/node
class Tests {
    constructor (AUTO_LOG_TIME = false) {
        this.AUTO_LOG_TIME = AUTO_LOG_TIME;
        this.times = {};
    }

    time(tag, note = null) {
        this.times[tag] = {
            start: { time: process.hrtime(), note: note },
            end: { time: null, note: null },
            duration: 'running'
        };
    }

    endTime(tag, note = null) {
        let timetag = this.times[tag];
        if (!timetag) {
            console.log(`Não há um marcador "${tag}" para ser cronometrado.`);
            return undefined;
        };
        let diff = process.hrtime(timetag.start.time); // [0] = segundos, [1] = nanosegundos
        let stringifiedTime

        // atualizando this.times
        timetag.end = { time: process.hrtime(), note: note };
        timetag.duration = {seconds: diff[0], milliseconds: parseFloat((diff[1] / 1e6).toFixed(3)), nanoseconds: diff[1]};        

        // definindo a mensagem de retorno
        if (timetag.duration.seconds > 0) {
            stringifiedTime = `${timetag.duration.seconds} s, ${timetag.duration.milliseconds} ms`;
        } else {
            stringifiedTime = `${timetag.duration.milliseconds} ms`;
        }

        if (this.AUTO_LOG_TIME) {
            console.log(`${tag}: ${stringifiedTime}`);
        }

        return stringifiedTime;
    }

    getAllTimes() {
        return this.times;
    }

    getTime(tag) {
        return this.times[tag].duration
    }

}

module.exports = {
    Tests
}
