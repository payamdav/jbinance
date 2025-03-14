import { BinanceApi } from '../src/lib/binance_api/binance_api.js';
import {QueueWrite} from '../src/lib/utils/file/queue_write.js';


async function depth_snapshot_fetcher(symbolsIn) {
    const api = new BinanceApi('um');
    const queue = new QueueWrite('depth_snapshot', 1000, 10);
    await queue.create_directory();

    while(true) {
        for (const symbol of symbolsIn) {
            let data = await api.get_request(`/fapi/v1/depth`, {symbol: symbol, limit: 1000});
            if (data) {
                queue.push(JSON.stringify({symbol: symbol, data: data}));
            }
            await new Promise(resolve => setTimeout(resolve, 60000));
 
        }
    }
}


let symbols = ['vineusdt', 'trumpusdt', 'adausdt', 'dogeusdt', 'xrpusdt', 'btcusdt', 'ethusdt'];
await depth_snapshot_fetcher(symbols);
