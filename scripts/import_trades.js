import {trades_raw_to_binary} from '../src/lib/trades/raw_files/trades_raw_to_binary.js';


let symbols = ['adausdt', 'btcusdt', 'ethusdt', 'xrpusdt', 'vineusdt', 'trumpusdt', 'dogeusdt'];

for (let symbol of symbols) {
    await trades_raw_to_binary(symbol, 2025, 3, 14);
    await trades_raw_to_binary(symbol, 2025, 3, 15);
    await trades_raw_to_binary(symbol, 2025, 3, 16);
    await trades_raw_to_binary(symbol, 2025, 3, 17);
    await trades_raw_to_binary(symbol, 2025, 3, 18);
}

