import {BinanceDownloader} from '../src/lib/binance_api/binance_downloader.js';
import { Timer} from '../src/lib/utils/timer.js';


async function file_downloader() {
    let bd = new BinanceDownloader('um');
    let symbols = ['adausdt', 'btcusdt', 'ethusdt', 'xrpusdt', 'vineusdt', 'trumpusdt', 'dogeusdt'];
    let days = [14, 15, 16, 17, 18, 19];
    let timer = new Timer();
    for (let symbol of symbols) {
        for (let day of days) {
            timer.checkpoint(`Trades - Symbol: ${symbol} - Day: ${day}`);
            await bd.download_trades_daily(symbol, 2025, 3, day);
            timer.checkpoint(`Candles - Symbol: ${symbol} - Day: ${day}`);
            await bd.download_candles_daily_1m(symbol, 2025, 3, day);
        }
    }
    
}

await file_downloader();
