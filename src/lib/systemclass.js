const wincmd = require('node-windows');

class System {
    constructor() {
        this.robloxProcessId = null;
        this.checkRobloxProcess();
    }

    async checkRobloxProcess() {
        try {
            const processes = await this.getProcesses();
            this.robloxProcessId = this.extractRobloxProcessId(processes);
        } catch (error) {
            console.error('Error checking Roblox processes:', error);
        }
    }

    async getProcesses() {
        return new Promise((resolve, reject) => {
            wincmd.list((processes) => {
                resolve(processes);
            }, false);
        });
    }

    extractRobloxProcessId(processes) {
        const robloxProcess = processes.find(p => p.Nomedaimagem.includes('RobloxPlayer'));
        return robloxProcess ? robloxProcess['Identifica��opessoal'] : false;
    }

    async isRobloxOpen() {
        await this.checkRobloxProcess();
        return this.robloxProcessId !== false;
    }

    async joinRobloxServer(url) {
        try {
            const isOpen = await this.isRobloxOpen(); // Verifica se o Roblox já está aberto

            if (isOpen) {
                console.log('Roblox já está aberto. O link do servidor não será acessado.');
                return; // Sai da função se o Roblox já estiver aberto
            }

            await this.execCommand(`start "" "${url}"`);
            await this.waitForRobloxToOpen();
        } catch (error) {
            throw new Error('Failed to open Roblox: ' + error.message);
        }
    }

    execCommand(command) {
        return new Promise((resolve, reject) => {
            const { exec } = require('child_process');
            exec(command, (error) => {
                if (error) {
                    return reject(error);
                }
                resolve();
            });
        });
    }

    waitForRobloxToOpen() {
        return new Promise((resolve) => {
            const interval = setInterval(async () => {
                const isOpen = await this.isRobloxOpen();
                if (isOpen) {
                    clearInterval(interval);
                    resolve();
                }
            }, 3000);
        });
    }

    async closeRoblox() {
        const processId = await this.getRobloxProcessId();
        if (!processId) {
            throw new Error('Roblox is not running.');
        }

        try {
            await this.execCommand(`taskkill /F /PID ${processId}`);
            await this.waitForRobloxToClose();
        } catch (error) {
            throw new Error('Failed to close Roblox: ' + error.message);
        }
    }

    async getRobloxProcessId() {
        await this.checkRobloxProcess();
        return this.robloxProcessId;
    }

    waitForRobloxToClose() {
        return new Promise((resolve) => {
            const interval = setInterval(async () => {
                const isOpen = await this.isRobloxOpen();
                if (!isOpen) {
                    clearInterval(interval);
                    resolve();
                }
            }, 3000);
        });
    }
}

module.exports = new System();
