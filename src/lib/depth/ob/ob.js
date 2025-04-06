import { Snapshot } from "./snapshot.js";
import { Update } from "./update.js";


export class OB {
    constructor(symbol) {
        this.symbol = symbol;
        this.update = new Update(symbol);
        this.snapshot = new Snapshot(symbol);
        this.a = new Map();
        this.b = new Map();
        this.ts = 0;
        this.update_id = 0;
    }

    async find_first_snapshot_aligned_with_update() {
        let scount = await this.snapshot.count();
        for (let sid = 0; sid < scount; sid++) {
            let s = await this.snapshot.index(sid);
            let u = await this.update.find_index_of_relevant_update_for_snapshot(s);
            if (u !== -1) {
                return {
                    snapshot: s,
                    update: u
                }
            }
        }
        return null;
    }

    async build_from_first_till_last_update(cb=undefined, bcb=undefined, acb=undefined) {
        let ucount = await this.update.count();
        let first = await this.find_first_snapshot_aligned_with_update();
        if (first === null) {
            throw new Error("No snapshot found");
        }
        let s = first.snapshot;
        let res = await this.snapshot.read_data(s.offset, s.size, s.bids_size, s.asks_size);
        this.apply_bids(res.bids);
        this.apply_asks(res.asks);
        this.ts = s.ts;
        this.update_id = s.update_id;

        await this.snapshot.close_index();

        // apply all updates

        for (let i = first.update; i < ucount; i++) {
            let u = await this.update.index(i);
            this.ts = u.ts;
            this.update_id = u.u_id;
            let res = await this.update.read_data(u.offset, u.size, u.bids_size, u.asks_size);
            this.apply_bids(res.bids, bcb);
            this.apply_asks(res.asks, acb);
            if (cb !== undefined) cb(this);

            // if (i % 10000 === 0) console.log(`i: ${i} / ${ucount}`);
        }

        await this.update.close_files();
        console.log(`Finished building order book from first snapshot to last update`);
    }

    best_bid() {
        let price = -1;
        for (const [p, s] of this.b) {
            if (p > price) {
                price = p;
            }
        }
        return price;
    }

    best_ask() {
        let price = Number.MAX_VALUE;
        for (const [p, s] of this.a) {
            if (p < price) {
                price = p;
            }
        }
        return price;
    }

    
    tests() {
        const eps = 0.000000001
        console.log(`Count bids: ${this.b.size} asks: ${this.a.size}`);
        let sum_bids = this.b.values().reduce((a, b) => a + b, 0);
        let sum_asks = this.a.values().reduce((a, b) => a + b, 0);
        console.log(`Sum bids: ${sum_bids} asks: ${sum_asks}`);
        let count_bids_zero = 0;
        let count_asks_zero = 0;
        for (const [price, size] of this.b) {
            if (size === 0) {
                count_bids_zero++;
            }
        }
        for (const [price, size] of this.a) {
            if (size === 0) {
                count_asks_zero++;
            }
        }
        console.log(`Count bids zero: ${count_bids_zero} asks zero: ${count_asks_zero}`);
        let sorted_bids_keys = [...this.b.keys()].sort((a, b) => a - b);
        let sorted_asks_keys = [...this.a.keys()].sort((a, b) => a - b);
        let count_bids_keys_near = 0;
        let count_asks_keys_near = 0;
        for (let i = 1; i < sorted_bids_keys.length; i++) {
            if (Math.abs(sorted_bids_keys[i] - sorted_bids_keys[i - 1]) < eps) {
                count_bids_keys_near++;
            }
        }
        for (let i = 1; i < sorted_asks_keys.length; i++) {
            if (Math.abs(sorted_asks_keys[i] - sorted_asks_keys[i - 1]) < eps) {
                count_asks_keys_near++;
            }
        }
        console.log(`Count bids keys near: ${count_bids_keys_near} asks keys near: ${count_asks_keys_near}`);
    }


    apply_bids(bids, cb=undefined) {
        for (const [price, size] of bids) {
            if (size === 0) {
                this.b.delete(price);
            } else {
                this.b.set(price, size);
            }
        }
        if (cb !== undefined) cb(this);
    }

    apply_asks(asks, cb=undefined) {
        for (const [price, size] of asks) {
            if (size === 0) {
                this.a.delete(price);
            } else {
                this.a.set(price, size);
            }
        }
        if (cb !== undefined) cb(this);
    }


}
