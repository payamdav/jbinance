import {load, save} from '../src/lib/utils/file/saveload.js';
import {BinanceApi} from '../src/lib/binance_api/binance_api.js';


let ei = await load('um_exchange_info_with_candles.json');

async function extract_symbol(symbol) {
    let symbol_info = ei.symbols.find((s) => s.symbol === symbol);
    await save(symbol_info, `${symbol}_info.json`);

}


await extract_symbol('BTCUSDT');
await extract_symbol('ETHUSDT');
await extract_symbol('ADAUSDT');
await extract_symbol('VINEUSDT');
