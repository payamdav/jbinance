import { config } from "../../../../config.js";
import fs from 'fs/promises';


export class Update {
    INDEX_BYTES = 56;
    constructor(symbol) {
        symbol = symbol.toLowerCase();
        this.symbol = symbol;
        this.binary_path = `${config.data_path}depth/binary/${symbol}/updates.bin`;
        this.index_path = `${config.data_path}depth/binary/${symbol}/updates.idx`;
        this.index_handle = null;
        this.binary_handle = null;
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

    async open_files() {
        if (this.index_handle === null) this.index_handle = await fs.open(this.index_path, 'r');
        if (this.binary_handle === null) this.binary_handle = await fs.open(this.binary_path, 'r');
    }

    async close_files() {
        if (this.index_handle !== null) {
            await this.index_handle.close();
            this.index_handle = null;
        }
        if (this.binary_handle !== null) {
            await this.binary_handle.close();
            this.binary_handle = null;
        }
    }

    async index(idx) {
        await this.open_files();
        let buffer = Buffer.alloc(this.INDEX_BYTES);
        await this.index_handle.read(buffer, 0, buffer.length, idx * this.INDEX_BYTES);
        return {
            ts: Number(buffer.readBigUInt64BE(0)),
            U_id: Number(buffer.readBigUInt64BE(8)),
            u_id: Number(buffer.readBigUInt64BE(16)),
            pu_id: Number(buffer.readBigUInt64BE(24)),
            offset: Number(buffer.readBigUInt64BE(32)),
            size: Number(buffer.readBigUInt64BE(40)),
            bids_size: Number(buffer.readUInt32BE(48)),
            asks_size: Number(buffer.readUInt32BE(52))
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
        await this.open_files();
        let buffer = Buffer.alloc(size);
        await this.binary_handle.read(buffer, 0, size, offset);
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

    async find_index_of_relevant_update_for_snapshot(s) { // s is snapshot header object
        let count = await this.count();
        let left = 0;
        let right = count - 1;
        let index = null;
        while (left <= right) {
            let mid = Math.floor((left + right) / 2);
            index = await this.index(mid);
            if (index.u_id < s.update_id) left = mid + 1;
            else if (index.U_id > s.update_id) right = mid - 1;
            else return mid;
        }
        return -1;
    }

}


// let update = new Update('BTCUSDT');
// console.log(await update.index_file_size());
// console.log(await update.count());
// console.log(await update.index(0));
// console.log(await update.index(1));
// console.log(await update.index(800000));
// // console.log(await update.all_index());
// console.log(await update.read(200));
// update.close_index();

// console.log('-------------------------');

// update = new Update('XRPUSDT');
// console.log(await update.index_file_size());
// console.log(await update.count());
// console.log(await update.index(0));
// console.log(await update.index(1));
