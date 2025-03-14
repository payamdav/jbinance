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


await symbol_info('BTCUSDT');
await symbol_info('ETHUSDT');
await symbol_info('ADAUSDT');
await symbol_info('VINEUSDT');
