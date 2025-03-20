import {Update} from './update.js';
import {Snapshot} from './snapshot.js';
import {Timer} from '../utils/timer.js';



class OBChecker {
    constructor(symbol) {
        this.symbol = symbol;
        this.update = new Update(symbol);
        this.snapshot = new Snapshot(symbol);
        this.sid = -1; // snapshot id
        this.uid = -1; // update id
        this.s_finished = false; // snapshot finished
        this.u_finished = false; // update finished
    }

    async start() {
        await this.update.open_files();
        await this.snapshot.open_index();
        this.snapshot_count = await this.snapshot.count();
        this.update_count = await this.update.count();
        await this.next_snapshot();
        await this.next_update();
        await this.check();
        await this.destroy();
    }

    async destroy() {
        await this.update.close_files();
        await this.snapshot.close_index();
    }

    async next_snapshot() {
        if (this.sid >= this.snapshot_count - 1) {
            this.s_finished = true;
            return false;
        }
        this.sid++;
        this.s = await this.snapshot.index(this.sid);
        return true;
    }

    async next_update() {
        if (this.uid >= this.update_count - 1) {
            this.u_finished = true;
            return false;
        }
        this.uid++;
        this.u = await this.update.index(this.uid);
        return true;
    }

    async check() {
        console.log(`Checking ${this.symbol} - snapshot_count: ${this.snapshot_count} update_count: ${this.update_count}`);
        // console.log(`s: ${this.s.update_id} u: ${this.u.u_id}`);
        await this.process();
        console.log(`Finished ${this.symbol} - count_time_diff_error: ${this.count_time_diff_error} count_none_relevant_update: ${this.count_none_relevant_update}`);
    }

    async process() {
        this.count_time_diff_error = 0;
        this.count_none_relevant_update = 0;
        while(!this.s_finished) {
            this.ru = await this.adjust_to_relevant_update();
            if (!this.ru) {
                this.count_none_relevant_update++;
                // console.log(`No relevant update for snapshot ${this.sid}`);
                this.next_snapshot();
                continue;
            }
            // console.log(`snapshot: ${this.sid} => update ${this.uid}`, ` ${this.u.U_id}  ${this.s.update_id}   ${this.u.u_id}`);
            let time_diff = Math.abs(this.s.ts - this.u.ts);
            if (time_diff > 1000) {
                this.count_time_diff_error++;
                console.log(`Timestamp error at snapshot ${this.sid} update ${this.uid} ${this.s.ts} ${this.u.ts} - diff: ${time_diff}`);
            }
            await this.next_snapshot();
        }
    
    }

    async adjust_to_relevant_update() {
        if (this.s.update_id < this.u.U_id) {
            return false;
        }
        while (true && !this.u_finished) {
            if (this.s.update_id >= this.u.U_id && this.s.update_id <= this.u.u_id) {
                return true;
            }
            await this.next_update();
            if (this.u_finished) {
                return false;
            }
        }
        return false;
    }


}



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
    // await bids_asks_validity(symbol);

    let ob_checker = new OBChecker(symbol);
    await ob_checker.start();

}


