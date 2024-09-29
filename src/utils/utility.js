#!/usr/bin/node
const path = require('path');
const { Jimp } = require('jimp');
const Tesseract = require('tesseract.js');
const robot = require('robotjs');
const fs = require('fs');
const crypto = require('crypto');
const levenshtein = require('fast-levenshtein');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const { removeLineBreaks, getCurrentTimeFormatted, sleep } = require(path.resolve("src/utils/utils"));
const { BIOMECONFIG } = require(path.resolve('src/config/config'))
const { Tests } = require(path.resolve("src/utils/tests"))
const test = new Tests()

require("dotenv").config({ path: path.resolve(`.env.${process.env.NODE_ENV || 'dev'}`) });
const { Logger } = require(path.resolve('src/utils/logger'));
const log = new Logger("utilities", false).useEnvConfig().create();

// Debugging function to get coordinates manually
// logMouseCoordinates({delay: 250})
function logMouseCoordinates(config = {}) {
    const {
        logging = config?.logging || true,
        extraline = config?.extraline || true,
        delay = config?.delay || 1000,
        width = config?.w || 50, // Padrão de 50px se read_text for true
        height = config?.h || 15, // Padrão de 10px se read_text for true
        read_text = false // Parâmetro para controlar a leitura do texto
    } = config;

    setInterval(async () => {
        const { x, y } = robot.getMousePos();

        // Define as coordenadas da "caixa" para captura
        const coordinates = [
            [x - (width || 50), y - (height || 10)], // (x1, y1) 50px à esquerda e 10px acima
            [x + (width || 50), y + (height || 10)]  // (x2, y2) 50px à direita e 10px abaixo
        ];

        console.log(`Mouse Pos: [${x}, ${y}]`);

        // Se o parâmetro read_text estiver habilitado, tenta reconhecer o texto
        if (read_text) {
            const recognizedText = await readCoordinate(coordinates, { logging: logging });
            console.log(`Texto reconhecido: "${recognizedText}"`);
        }

        if (extraline) { console.log("") }

    }, delay);
}

async function screenshot(coordinates, filePath, config = {}) {
    const {
        logging = config?.logging || true,
        keep_image = config?.keep_image || false
    } = config;
    // screenshot [[x1, y1], [x2, y2]] path.resolve(images/test.png)
    //
    // Estou esperando que as coordenadas sejam:
    // [ [x1, y1], [x2, y2] ]
    // onde 1 representa o canto superior esquerdo
    // e 2 representa o canto inferior direito
    //
    //  (superior esquerdo)
    //  x1y1 --> .__________
    //           |__________|. <--x2y2
    //                         (inferior direito)


    // Extrai as coordenadas
    const [[x1, y1], [x2, y2]] = coordinates;
    const width = x2 - x1;
    const height = y2 - y1;

    // robotjs retorna o bitmap da área capturada
    // é necessário usar o Jimp, para transformar
    // esse bitmap em uma imagem real e salvá-la no filesystem
    //
    // SO que me fez entender o que estava ocorrendo
    // https://stackoverflow.com/questions/41941151/capture-and-save-image-with-robotjs/43898900#43898900
    // Jimp documentation
    // https://jimp-dev.github.io/jimp/api/jimp/classes/jimp/#frombitmap

    try {
        const screenshot = robot.screen.capture(x1, y1, width, height);
        const bitmapBuffer = screenshot.image
        // console.log('robotjs screenshot data:')
        // console.log(screenshot)

        let image = Jimp.fromBitmap({
            data: bitmapBuffer,
            width: screenshot.width,
            height: screenshot.height
        })

        // image.threshold({max:128}) // basically grayscale

        image.write(filePath);
        if (logging) { log.unit('Image saved to "' + filePath + '"') }
        return true
    } catch (e) {
        log.critical(e.stack);
        throw e
    }
}

async function readCoordinate(coordinates, config = {}) {
    const {
        logging = config?.logging || true,
    } = config;

    const randomFileName = crypto.randomBytes(4).toString('hex');
    const tempImagePath = path.resolve(`images/screenshot_${randomFileName}.png`);

    // Extrai as coordenadas
    const [[x1, y1], [x2, y2]] = coordinates;
    const width = x2 - x1;
    const height = y2 - y1;

    try {
        // Captura a tela na região especificada
        await screenshot(coordinates, tempImagePath, { logging: logging });

        // Reconhece o texto da imagem capturada
        const result = await Tesseract.recognize(tempImagePath, 'eng');

        // Retorna o texto reconhecido
        return result.data.text;

    } catch (e) {
        log.critical(e.stack)
        return null; // Retorna null em caso de erro
    } finally {
        // Remove a imagem temporária se existir
        if (fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
            if (logging) { log.unit(`readCoordinate: tempImage ${tempImagePath} removed.`) }
        }
    }
}

async function expectText(expected, coordinates, config = {}) {
    const {
        logging = config?.logging || false,
        RETRY_INTERVAL = config?.retry_interval || 1000, // mili
        RETRY_ATTEMPTS = config?.retry_attempts || 0
    } = config;

    const randomFileName = crypto.randomBytes(4).toString('hex');
    const tempImagePath = path.resolve(`images/screenshot_${randomFileName}.png`);
    if (logging) { log.info(`Expecting "${expected}" at "${JSON.stringify(coordinates)}"`) }

    try {

        for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
            if (logging) { log.debug(`Screenshotting... (${attempt})`) };
            await screenshot(coordinates, tempImagePath, { logging: logging });

            if (logging) { log.unit(`Recognizing from ${tempImagePath}...`) };
            const result = await Tesseract.recognize(tempImagePath, 'eng');
            if (logging) { log.debug(`Recognized: ${result.data.text}`) };

            // Verifica se o texto esperado está no texto reconhecido
            if (result.data.text.includes(expected)) {
                if (logging) { log.info(`Found!`) };
                return true; // Retorna verdadeiro se o texto esperado foi encontrado
            } else {
                if (logging) { log.info(`Not found!`) };
                if (logging) { log.unit(`Removing tempImage "${tempImagePath}" because expected value was not found...`) };
                if (fs.existsSync(tempImagePath)) {
                    fs.unlinkSync(tempImagePath);
                    if (logging) { log.unit(`expectText: tempImage removed.`) };
                } else {
                    if (logging) { log.unit(`Strange... the image doesn't exist anymore, but we didn't delete it yet.`) };
                }
            }

            // Se ainda houver tentativas restantes, espera o intervalo antes de tentar novamente
            if (attempt < RETRY_ATTEMPTS) {
                if (logging) { log.unit(`Retrying in ${RETRY_INTERVAL} milliseconds...`) };
                await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
            }
        }

        if (logging) { log.info(`Exceeded maximum retry attempts. "${expected}" not found.`) };
        return false; // Retorna falso se não encontrou após todas as tentativas

    } catch (e) {
        log.critical(e.stack)
        if (fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
            log.unit(`tempImage removed.`)
        }
        return false
    } finally {
        if (fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
            if (logging) { log.unit(`expectText: tempImage removed.`) };
        }
    }
}

async function determineCurrentProbableBiome(config = {}) {
    const {
        analysis_interval = config?.analysis_interval || 500,
        analysis_iterations = config?.analysis_iterations || 7,
        analysis_output_probable_biome = config?.analysis_output_probable_biome || true,
        analysis_output_probability_list = config?.analysis_output_probability_list || false,
        verbose_if_gibberish = config?.verbose_if_gibberish || true,
        output = config?.output || false,
        return_iterations = config?.return_iterations || false,
    } = config;

    const results = []; // Array para armazenar os resultados das análises
    const probabilities_iterations = {}

    for (let i = 0; i < analysis_iterations; i++) {
        // Obtendo a saída da tela
        let tesseract_biome_output = await readBiome();
        let cleaned_biome = tesseract_biome_output.replace(/[^a-zA-Z0-9.]/g, '').replace(/(\r\n|\n|\r)/gm, '');

        // Analisando a probabilidade de ser válido
        let analysis = analyzeCurrentText(cleaned_biome);

        // Armazenando o bioma mais provável
        results.push(analysis.probably);
        probabilities_iterations[`iteration_${i + 1}`] = {
            probabilities: analysis.probabilities,
            tesseract: tesseract_biome_output,
            cleaned_tesseract: cleaned_biome
        }

        // Enviando saída
        if (analysis_output_probable_biome) { console.log(`${analysis.probably} (${analysis.confidence})`) };
        if (analysis_output_probability_list) { console.log(analysis.probabilities) };

        // Aguardando o intervalo entre análises
        await new Promise(resolve => setTimeout(resolve, analysis_interval));
    }

    // Contando a ocorrência de cada bioma
    const occurrences = results.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
    }, {});

    // Encontrando a palavra com mais ocorrências
    const mostFrequentBiome = Object.keys(occurrences).reduce((a, b) => occurrences[a] > occurrences[b] ? a : b);

    if (output) {
        console.log(`Probable biome: ${mostFrequentBiome} (${occurrences[mostFrequentBiome]} occurrences)`);
    }

    if (mostFrequentBiome === "Unknown" & verbose_if_gibberish) {
        console.log(probabilities_iterations)
    }

    if (return_iterations) {
        return {
            biome: mostFrequentBiome,
            iterations: probabilities_iterations
        }
    }
    return mostFrequentBiome
}

async function readBiome() {
    const BIOMEBOX_COORDINATE = [[10, 905], [180, 925]]
    return readCoordinate(BIOMEBOX_COORDINATE, { logging: false })
}

// Função para calcular a probabilidade de cada palavra ser o texto correto
function calculateProbabilities(text) {
    const PROBABILITY_THRESHOLD = 0.7;
    const GIBBERISH_WORD = "Unknown";
    const probabilities = [];
    let is_gibberish = false;

    const validBiomes = [
        'Normal',
        'Rainy',
        'Windy',
        'Corruption',
        'Null',
        'SandStorm',
        'Hell',
        'Starfall',
        /[0-9]\.[0-9]+/ // Para o glitch
    ];

    // Remove quebras de linha e normaliza o texto para minúsculas
    text = removeLineBreaks(text).trim().toLowerCase();

    // Função para verificar o padrão específico de um "Glitch"
    function isPotentialGlitch(text) {
        // O padrão descrito:
        const glitchPattern = /^[[iI]\s[890256]\s[.,;\s].+$/;
        const letterCount = (text.match(/[a-z]/gi) || []).length; // Conta letras (se houver)

        // Verifica se o texto segue o padrão e possui no máximo 2 letras após o 4º caractere
        return glitchPattern.test(text) && letterCount <= 2;
    }

    // Itera sobre as palavras válidas
    validBiomes.forEach(word => {
        let confidence = 0;

        if (typeof word === 'string') {
            // Calcula a distância de Levenshtein para verificar a similaridade
            const distance = levenshtein.get(word.toLowerCase(), text);
            const similarity = 1 - (distance / Math.max(word.length, text.length));

            // Atribui a confiança baseada na similaridade
            confidence = similarity;

            // Garante que a confiança esteja entre 0 e 1
            confidence = Math.min(confidence, 1);
        } else if (word instanceof RegExp) {
            // Se for uma regex (para glitch), faz a correspondência
            const isMatch = word.test(text) || isPotentialGlitch(text);
            confidence = isMatch ? 1 : 0;
        }

        // Adiciona a confiança da palavra à lista de probabilidades
        probabilities.push({
            word: typeof word === 'string' ? word : 'Glitch',
            confidence: confidence
        });
    });

    // Filtra as palavras que têm confiança maior que 70%
    const highConfidenceWords = probabilities.filter(prob => prob.confidence > PROBABILITY_THRESHOLD);

    // Se não houver palavras com confiança maior que 70%
    if (highConfidenceWords.length === 0) {
        // Define a flag is_gibberish como true
        is_gibberish = true;

        // Retorna a probabilidade de gibberish como 100%
        return {
            probabilities: probabilities.concat({
                word: GIBBERISH_WORD,
                confidence: 1
            }),
            is_gibberish: is_gibberish
        };
    } else {
        // Define a confiança de gibberish como 0%
        const gibberishIndex = probabilities.findIndex(prob => prob.word === GIBBERISH_WORD);
        if (gibberishIndex !== -1) {
            probabilities[gibberishIndex].confidence = 0;
        }

        // Define a flag is_gibberish como false
        is_gibberish = false;
    }

    return {
        probabilities: probabilities,
        is_gibberish: is_gibberish
    };
}

// Função principal que retorna as probabilidades em formato simplificado
function analyzeCurrentText(text) {
    const { probabilities, is_gibberish } = calculateProbabilities(text);

    // Encontra a palavra com a maior confiança
    const mostProbable = probabilities.reduce((prev, curr) => {
        return curr.confidence > prev.confidence ? curr : prev;
    });

    // Retorna o formato solicitado
    return {
        probably: mostProbable.word,
        confidence: mostProbable.confidence.toFixed(2),
        is_gibberish: is_gibberish,
        probabilities: probabilities
    };
}

function click(coordinates) {
    const [x, y] = coordinates;
    robot.moveMouse(x - 5, y - 5); // teleports near objective
    robot.moveMouseSmooth(x, y); // adjust "slowly" to objective
    // log.unit(`Clicking on [${x}, ${y}]`)
    // sleep(200)

    // fast double click
    robot.mouseClick("left", true)

    // slow click
    // robot.mouseToggle("down");
    // setTimeout(function()
    // {
    //     robot.mouseToggle("up");
    // }, 500);


    // robot.mouseClick('left')
    // sleep(200)
    // robot.mouseClick('left')
    // sleep(200)
    // robot.mouseClick('left')
    // sleep(2000)
    // console.log('trying press-release')
    // robot.mousePress()
    // sleep(200)
    // robot.mouseRelease()
}

function clickPlayButton() {
    return click([960, 870])
}

async function handleDiscordMessage(data) {
    const {
        biome = data?.biome || 'Unknown',
        extraData = data?.extra || undefined,
    } = data;

    let ping_user = false;
    let biome_data = {};
    let embed_message;
    let embed_color;

    if (BIOMECONFIG[biome]) {
        biome_data = BIOMECONFIG[biome];

        // nao vai notificar, nem pingar
        if (!biome_data.notify && !biome_data.ping) { return };
        if (biome_data.ping) { ping_user = true };

        embed_message = `**Biome**: \`${biome}\` (${biome_data.spawnchance})`;
        embed_color = biome_data.embed_hex_color;
        // biome configuration was found
    } else {
        // biome configuration was not found
        embed_message = `Couldn't identify biome! :warning:${extraData ? '\n' + JSON.stringify(extraData) : ''}`;
        embed_color = "#1a1a1a"
    }

    const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
    const hook = new Webhook(WEBHOOK_URL);

    let message = new MessageBuilder()
        .setText(ping_user ? `<@${process.env.DISCORD_USERID_TO_PING}>` : '')
        .setColor(embed_color)
        .setDescription(`[${getCurrentTimeFormatted()}] ${embed_message}`)
        .setTimestamp()

    hook.send(message)
};

module.exports = {
    logMouseCoordinates,
    screenshot,
    expectText,
    readCoordinate,
    readBiome,
    determineCurrentProbableBiome,
    handleDiscordMessage,
    clickPlayButton,
}