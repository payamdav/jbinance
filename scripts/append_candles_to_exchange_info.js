import {load, save} from '../src/lib/utils/file/saveload.js';
import {BinanceApi} from '../src/lib/binance_api/binance_api.js';


async function get_latest_candles(symbol, interval, limit) {
    let api = new BinanceApi('um');
    let data = await api.get_request('/fapi/v1/klines', {symbol: symbol, interval: interval, limit: limit});
    if (Array.isArray(data)) {
        data = data.map((candle) => {
            return {
                t: candle[0],
                o: parseFloat(candle[1]),
                h: parseFloat(candle[2]),
                l: parseFloat(candle[3]),
                c: parseFloat(candle[4]),
                v: parseFloat(candle[5]),
                close_time: candle[6],
                q: parseFloat(candle[7]),
                n: candle[8],
                bv: parseFloat(candle[9]),
                bq: parseFloat(candle[10])
            };
        });
    } else {
        return [];
    }
    return data;
}

async function get_candles_all() {
    let ei = await load('um_exchange_info.json');
    for (let i = 0; i < ei.symbols.length; i++) {
        console.log(`Fetching ${i}/${ei.symbols[i].symbol} - status: ${ei.symbols[i].status}`);
        let symbol = ei.symbols[i].symbol;
        ei.symbols[i].candles_m = await get_latest_candles(symbol, '1M', 12);
        ei.symbols[i].candles_d = await get_latest_candles(symbol, '1d', 56);  // 8 weeks
        ei.symbols[i].candles_h = await get_latest_candles(symbol, '1h', 1344);  // 8 weeks
        if (i != 0 && i % 100 === 0) {
            // wait a minute
            console.log('Waiting...');
            await new Promise(resolve => setTimeout(resolve, 60000));
        }
    }
    save(ei, 'um_exchange_info_with_candles.json');
    console.log('Done');
}


await get_candles_all();

