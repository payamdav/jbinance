import {Update} from './update.js';
import {Timer} from '../utils/timer.js';


async function update_index_alignment(symbol) {
    let update = new Update(symbol);
    let count = await update.count();

    let pindex;

    for (let i = 0; i < count; i++) {
        let index = await update.index(i);
        if (i > 1) {
            if (index.ts <= pindex.ts) {
                console.log(`ts error at: ${i} ${index.ts} ${pindex.ts}`);
            }
            if (index.pu !== pindex.u) {
                console.log(`pu error at: ${i} ${index.pu} ${pindex.u}`);
            }
            if (index.U > pindex.u) {
                console.log(`U error at: ${i} ${index.U} ${pindex.u}`);
            }

        }
        pindex = index;

        // if (i % 10000 === 0) console.log(`i: ${i}`);

    }

    await update.close_files();

    console.log(`count: ${count}`);

}

async function bids_asks_validity(symbol) {
    let update = new Update(symbol);
    let count = await update.count();
    let count_zero_bids = 0;
    let count_zero_asks = 0;

    for (let i = 0; i < count; i++) {
        let {bids, asks} = await update.read(i);
        let pkey = 0;
        for (const key of bids.keys()) {
            if (key <= pkey) {
                console.log(`bids key error at: ${i} ${key} ${pkey}`);
            }
            pkey = key;
        }
        pkey = 0;
        for (const key of asks.keys()) {
            if (key <= pkey) {
                console.log(`asks key error at: ${i} ${key} ${pkey}`);
            }
            pkey = key;
        }
        if (bids.size === 0) count_zero_bids++;
        if (asks.size === 0) count_zero_asks++;
    }
    console.log(`count: ${count}`);
    console.log(`count_zero_bids: ${count_zero_bids}`);
    console.log(`count_zero_asks: ${count_zero_asks}`);

    await update.close_files();
}

let symbols = ['adausdt', 'btcusdt', 'ethusdt', 'xrpusdt', 'vineusdt', 'trumpusdt', 'dogeusdt'];

let timer = new Timer();

for (const symbol of symbols) {
    timer.checkpoint(symbol);
    console.log('-------------------------');
    // await update_index_alignment(symbol);
    await bids_asks_validity(symbol);
}


