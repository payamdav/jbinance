import { config } from "../../../config.js";
import fs from 'fs/promises';


export class Snapshot {
    INDEX_BYTES = 40;
    constructor(symbol) {
        symbol = symbol.toLowerCase();
        this.symbol = symbol;
        this.binary_path = `${config.data_path}depth/binary/${symbol}/snapshots.bin`;
        this.index_path = `${config.data_path}depth/binary/${symbol}/snapshots.idx`;
        this.index_handle = null;
    }

    async index_file_size () {
        try {
            const stat = await fs.stat(this.index_path);
            return stat.size;
        } catch (error) {
            throw error;
        }
    }

    async count() {
        return await this.index_file_size() / this.INDEX_BYTES;

    }

    async open_index() {
        this.index_handle = await fs.open(this.index_path, 'r');
    }

    async close_index() {
        await this.index_handle.close();
        this.index_handle = null;
    }

    async index(idx) {
        if (this.index_handle === null) await this.open_index();
        let buffer = Buffer.alloc(this.INDEX_BYTES);
        await this.index_handle.read(buffer, 0, buffer.length, idx * this.INDEX_BYTES);
        return {
            ts: Number(buffer.readBigUInt64BE(0)),
            update_id: Number(buffer.readBigUInt64BE(8)),
            offset: Number(buffer.readBigUInt64BE(16)),
            size: Number(buffer.readBigUInt64BE(24)),
            bids_size: Number(buffer.readUInt32BE(32)),
            asks_size: Number(buffer.readUInt32BE(36)),
        };
    }

    async all_index() {
        let count = await this.count();
        let index = [];
        for (let i = 0; i < count; i++) {
            index.push(await this.index(i));
        }
        return index;
    }

    async read_data(offset, size, bids_size, asks_size) {
        let buffer = Buffer.alloc(size);
        let file_handle = await fs.open(this.binary_path, 'r');
        await file_handle.read(buffer, 0, size, offset);
        let bids = new Float64Array(buffer.buffer, 0, bids_size * 2);
        let asks = new Float64Array(buffer.buffer, bids_size * 2 * 8, asks_size * 2);
        let b = new Map();
        let a = new Map();
        for (let i = 0; i < bids_size; i++) {
            b.set(Math.round(bids[i * 2] * 100000000) / 100000000, bids[i * 2 + 1]);
        }
        for (let i = 0; i < asks_size; i++) {
            a.set(Math.round(asks[i * 2] * 100000000) / 100000000, asks[i * 2 + 1]);
        }
        await file_handle.close();

        return {
            bids: b,
            asks: a
        };
    }
    async read(idx) {
        let index = await this.index(idx);
        return await this.read_data(index.offset, index.size, index.bids_size, index.asks_size);
    }

    async find_index_equal_or_smaller_than_ts(ts) {
        let all_index = await this.all_index();
        for (let i = all_index.length - 1; i >= 0; i--) {
            if (all_index[i].ts <= ts) {
                return {
                    idx: i,
                    index: all_index[i]
                }
            }
        }
        return {
            idx: -1,
            index: null
        }
    }

    async find_index_equal_or_larger_than_ts(ts) {
        let all_index = await this.all_index();
        for (let i = 0; i < all_index.length; i++) {
            if (all_index[i].ts >= ts) {
                return {
                    idx: i,
                    index: all_index[i]
                }
            }
        }
        return {
            idx: -1,
            index: null
        }
    }

    async find_index_equal_or_larger_than_update_id(update_id) {
        let all_index = await this.all_index();
        for (let i = 0; i < all_index.length; i++) {
            if (all_index[i].update_id >= update_id) {
                return {
                    idx: i,
                    index: all_index[i]
                }
            }
        }
        return {
            idx: -1,
            index: null
        }
    }

    async find_index_equal_or_smaller_than_update_id(update_id) {
        let all_index = await this.all_index();
        for (let i = all_index.length - 1; i >= 0; i--) {
            if (all_index[i].update_id <= update_id) {
                return {
                    idx: i,
                    index: all_index[i]
                }
            }
        }
        return {
            idx: -1,
            index: null
        }
    }



}


// let snapshot = new Snapshot('BTCUSDT');
// console.log(await snapshot.index_file_size());
// console.log(await snapshot.count());
// console.log(await snapshot.index(0));
// console.log(await snapshot.index(1));
// console.log(await snapshot.all_index());
// console.log(await snapshot.read(200));

// console.log('-------------------------');

// snapshot = new Snapshot('XRPUSDT');
// console.log(await snapshot.index_file_size());
// console.log(await snapshot.count());
// console.log(await snapshot.index(0));
// console.log(await snapshot.index(1));
