import {BinanceDownloader} from './src/lib/binance_api/binance_downloader.js';

async function test() {
    const downloader = new BinanceDownloader('um');
    // await downloader.download_candles_daily_1m('btcusdt', 2025, 3, 10);
    // await downloader.download_candles_daily_1m('btcusdt', 2025, 3, 13);
    // await downloader.download_candles_daily_1m('btcusdt', 2025, 3, 12);

    // await downloader.download_candles_monthly_1m('adausdt', 2025, 3);
    await downloader.download_candles_monthly_1m('adausdt', 2025, 2);
    // await downloader.download_candles_daily_1m('adausdt', 2025, 3, 10);

    // await downloader.download_trades_daily('vineusdt', 2025, 3, 10);
    // await downloader.download_trades_monthly('vineusdt', 2025, 3);
    // await downloader.download_trades_monthly('vineusdt', 2025, 2);



}


await test();

