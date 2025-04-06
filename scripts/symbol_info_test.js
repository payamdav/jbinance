import {Analyze} from '../src/lib/symbol_analyze/symbol_analyze.js';
import {load} from '../src/lib/utils/file/saveload.js';

async function symbol_info(symbol) {
    console.log(`${symbol}\n`);
    let symbol_data = await load(`${symbol}_info.json`);
    // console.log(symbol_data);
    let analyze = new Analyze(symbol_data);
    analyze.base_analysis();
    analyze.print();
    console.log('\n---------------------------------\n');
}


// await symbol_info('BTCUSDT');
// await symbol_info('ETHUSDT');
// await symbol_info('ADAUSDT');
// await symbol_info('VINEUSDT');



let ei = await load('um_exchange_info_with_candles.json');


async function symbol_info_2(symbol) {
    symbol = symbol.toUpperCase();
    console.log(`${symbol}\n`);
    let symbol_info = ei.symbols.find((s) => s.symbol === symbol);
    // console.log(symbol_info);
    // console.log(Object.keys(symbol_info));
    // for (let [key, value] of Object.entries(symbol_info)) {
    //     if (!key.startsWith('candle')) {
    //         console.log(`${key}: ${value}`);
    //     }
    // }
    let max_price = symbol_info.candles_m.reduce((max, candle) => Math.max(max, candle.h), 0);
    console.log(`max price: ${max_price}`);
    console.log(max_price / (1 / Math.pow(10, symbol_info.pricePrecision)));
    console.log('\n---------------------------------\n');
}


let symbols = ['adausdt', 'btcusdt', 'ethusdt', 'xrpusdt', 'vineusdt', 'trumpusdt', 'dogeusdt'];

for (let symbol of symbols) {
    await symbol_info_2(symbol);
}
// await symbol_info_2('btcusdt');