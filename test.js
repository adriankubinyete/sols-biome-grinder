let robot = require('robotjs');
let path = require('path');
const { determineCurrentProbableBiome, expectText, readCoordinate } = require(path.resolve("src/utils/utility"));
const levenshtein = require('fast-levenshtein');

// Função principal
(async () => {
    console.log( "It's probably: " + await determineCurrentProbableBiome({ 
        analysis_interval: 50,
        output: true,
        verbose_if_gibberish: false,
        analysis_log: true
    }))
    // console.log( await readBiome() )
    // const stopReading = await testBiomeReading([]);

    // // Para parar a leitura, chame stopReading();
    // // Exemplo: após 10 segundos
    // setTimeout(() => {
    //     stopReading();
    //     console.log('Leitura de bioma parada.');
    // }, 10000);
})();
