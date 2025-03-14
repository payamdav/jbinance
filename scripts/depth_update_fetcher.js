import {BinanceWS} from '../src/lib/binance_api/binance_ws.js';


async function depth_update_fetcher(symbols) {
    const ws = new BinanceWS('um', 'queue_writer', 'depth_update');
    for (const symbol of symbols) {
        ws.addStream(`${symbol}@depth`);
    }
    await ws.queue.create_directory();
    ws.queue.queue_bunch_size_to_write = 100;
    ws.queue.file_data_limit = 10000;
    ws.connect();
}

let symbols = ['vineusdt', 'trumpusdt', 'adausdt', 'dogeusdt', 'xrpusdt', 'btcusdt', 'ethusdt'];

await depth_update_fetcher(symbols);


