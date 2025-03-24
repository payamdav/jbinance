import { inflate } from 'zlib';
import {config} from '../../../config.js';
import fs from 'fs/promises';


export class Trade {
    constructor(p=0, v=0, q=0, t=0, bm=false) {
        this.p = p;
        this.v = v;
        this.q = q;
        this.t = t;
        this.bm = bm;
    }

    static fromBuffer(buffer) {
        let trade = new Trade();
        trade.p = buffer.readDoubleLE(0);
        trade.v = buffer.readDoubleLE(8);
        trade.q = buffer.readDoubleLE(16);
        trade.t = Number(buffer.readBigInt64LE(24));
        trade.bm = buffer.readUInt8(32) === 1;
        return trade;
    }
}

export class Trades extends Array {
    static BINARY_RECORD_SIZE = 33;

    constructor(symbol) {
        super();
        this.symbol = symbol;
    }

    static async load(symbol, ts1=0, ts2=Infinity) {
        let trades = new Trades(symbol);
        let binary_path = `${config.data_path}um/trades/${symbol.toLowerCase()}.bin`;
        let binary_file_size = (await fs.stat(binary_path)).size;
        let binary_file_count = binary_file_size / Trades.BINARY_RECORD_SIZE;
        console.log(`Loading ${binary_file_count} trades for ${symbol}...`);
        let binary_file = await fs.open(binary_path, 'r');
        console.log(Trades.BINARY_RECORD_SIZE);
        let buffer = Buffer.alloc(Trades.BINARY_RECORD_SIZE);

        // use binary search to find the first trade with ts >= ts1
        let left = 0;
        let right = binary_file_count - 1;
        let index = 0;
        while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            await binary_file.read(buffer, 0, Trades.BINARY_RECORD_SIZE, mid * Trades.BINARY_RECORD_SIZE);
            let trade = Trade.fromBuffer(buffer);
            if (trade.t < ts1) {
                left = mid + 1;
            } else {
                index = mid;
                right = mid - 1;
            }
        }

        // read all trades with ts >= ts1 and ts <= ts2
        while (index < binary_file_count) {
            await binary_file.read(buffer, 0, Trades.BINARY_RECORD_SIZE, index * Trades.BINARY_RECORD_SIZE)
            let trade = Trade.fromBuffer(buffer);
            if (trade.t > ts2) {
                break;
            }
            trades.push(trade);
            index++;
        }

        await binary_file.close();
        
        return trades;
    }

}
