#!/usr/bin/node
const path = require('path');
const { Jimp } = require('jimp');
const Tesseract = require('tesseract.js');
const robot = require('robotjs');
const fs = require('fs');
const crypto = require('crypto');
const levenshtein = require('fast-levenshtein');
const { verbose } = require('winston');

require("dotenv").config({ path: path.resolve(`.env.${process.env.NODE_ENV || 'dev'}`) });
const { Logger } = require(path.resolve('src/utils/logger'));
const log = new Logger("utilities", false).useEnvConfig().create();

// Debugging function to get coordinates manually
// logMousePosition({delay: 250})
function logMousePosition(config = {}) {
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
        logging = config?.logging || true
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
        logging = config?.logging || true,
        RETRY_INTERVAL = config?.retry_interval || 1000, // mili
        RETRY_ATTEMPTS = config?.retry_attempts || 0
    } = config;

    const randomFileName = crypto.randomBytes(4).toString('hex');
    const tempImagePath = path.resolve(`images/screenshot_${randomFileName}.png`);
    if (logging) { log.info(`Expecting "${expected}" at "${JSON.stringify(coordinates)}"`) }

    try {

        for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
            if (logging) { log.unit(`Screenshotting... (${attempt})`) };
            await screenshot(coordinates, tempImagePath);

            if (logging) { log.unit(`Recognizing from ${tempImagePath}...`) };
            const result = await Tesseract.recognize(tempImagePath, 'eng');
            if (logging) { log.unit(`Recognized: ${result.data.text}`) };

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
        analysis_log = config?.log_every_analysis || false,
        verbose_if_gibberish = config?.verbose_if_gibberish || true,
        output = config?.output || false,
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
        probabilities_iterations[`iteration_${i+1}`] = analysis.probabilities

        // Enviando saída
        if (analysis_log) {
            console.log(`Return: ${analysis.probably} (${analysis.confidence})`)
            console.log(analysis.probabilities);
        };

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

    return mostFrequentBiome
}

async function readBiome() {
    const BIOMEBOX_COORDINATE = [[10, 905], [180, 925]]
    return readCoordinate(BIOMEBOX_COORDINATE, { logging: false })
}

// Função para remover quebras de linha
const removeLineBreaks = (text) => {
    return text.replace(/(\r\n|\n|\r)/gm, '');
};

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
        /0\.[0-9]+/ // Para o glitch
    ];

    // Remove quebras de linha e normaliza o texto para minúsculas
    text = removeLineBreaks(text).trim().toLowerCase();

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
            const isMatch = word.test(text);
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

module.exports = {
    logMousePosition,
    screenshot,
    expectText,
    readCoordinate,
    readBiome,
    determineCurrentProbableBiome,
}