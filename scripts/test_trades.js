import {Trades} from '../src/lib/trades/trades.js';


async function test_trades() {
    let symbol = 'vineusdt';
    let trades = await Trades.load(symbol);
    console.log(trades.length);
    console.log(trades[0]);
    console.log(trades[trades.length-1]);
}

await test_trades();
