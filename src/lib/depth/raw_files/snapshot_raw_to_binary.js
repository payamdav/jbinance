import fs from 'fs/promises';
import {FileStructure, append_to_binary_file} from './common.js';


async function import_raw_snapshot(from_index=0, to_index=9999999999) {
    let file_structure = new FileStructure();
    await file_structure.init();
    let snapshot_files = await file_structure.raw_snapshot_files(from_index, to_index);

    // set last snapshot ts and update id
    await file_structure.open_snapshot_indexes_to_read();
    for (const symbol of Object.values(file_structure.symbols_info)) {
        if(symbol['snapshotsidx_size'] === 0) {
            symbol['last_snapshot_ts'] = 0;
            symbol['last_snapshot_update_id'] = 0;
        }
        else {
            // read last line of index file - snapshot idx record set: ts, update_id, start_offset, length, bids_size, asks_size
            let buffer = Buffer.alloc(8 + 8 + 8 + 8 + 4 + 4);
            await symbol['snapshotsidx_handle'].read(buffer, 0, buffer.length, symbol['snapshotsidx_size'] - buffer.length);
            let ts = Number(buffer.readBigUInt64BE(0));
            let update_id = Number(buffer.readBigUInt64BE(8));
            symbol['last_snapshot_ts'] = ts;
            symbol['last_snapshot_update_id'] = update_id;

        }
    }
    await file_structure.close_file_handles();
    await file_structure.open_snapshot_files_to_append();


    for (const raw_file_path of snapshot_files) {
        let file_content = await fs.readFile(raw_file_path, 'utf8');
        const lines = file_content.split('\n');
        for (const line of lines) {
            if (line.length < 10) {
                // console.log('Line too short:');
                continue;
            }
            const data = JSON.parse(line);
            const symbol = data.symbol;
            const ts = data.data.T;
            const update_id = data.data.lastUpdateId;
            const bids_size = data.data.bids.length;
            const asks_size = data.data.asks.length;
            if (!file_structure.symbols_info[symbol]) {
                await file_structure.add_symbol(symbol);
                file_structure.symbols_info[symbol]['last_snapshot_ts'] = 0;
                file_structure.symbols_info[symbol]['last_snapshot_update_id'] = 0;
                await file_structure.open_snapshot_files_to_append();
            }
            if (file_structure.symbols_info[symbol].last_snapshot_ts >= ts) continue;

            let array_buffer = new ArrayBuffer(bids_size * 2 * 8 + asks_size * 2 * 8);
            let bids_view = new Float64Array(array_buffer, 0, bids_size * 2);
            let asks_view = new Float64Array(array_buffer, bids_size * 2 * 8, asks_size * 2);
            for (let i = 0; i < bids_size; i++) {
                bids_view[i * 2] = parseFloat(data.data.bids[i][0]);
                bids_view[i * 2 + 1] = parseFloat(data.data.bids[i][1]);
            }
            for (let i = 0; i < asks_size; i++) {
                asks_view[i * 2] = parseFloat(data.data.asks[i][0]);
                asks_view[i * 2 + 1] = parseFloat(data.data.asks[i][1]);
            }

            let {start_offset, length} = await append_to_binary_file(file_structure.symbols_info[symbol]['snapshotsbin_handle'], Buffer.from(array_buffer));

            // write to index file
            let index_buffer = Buffer.alloc(8 + 8 + 8 + 8 + 4 + 4);
            index_buffer.writeBigUInt64BE(BigInt(ts), 0);
            index_buffer.writeBigUInt64BE(BigInt(update_id), 8);
            index_buffer.writeBigUInt64BE(BigInt(start_offset), 16);
            index_buffer.writeBigUInt64BE(BigInt(length), 24);
            index_buffer.writeInt32BE(bids_size, 32);
            index_buffer.writeInt32BE(asks_size, 36);
            await file_structure.symbols_info[symbol]['snapshotsidx_handle'].write(index_buffer);

            file_structure.symbols_info[symbol]['last_snapshot_ts'] = ts;
            file_structure.symbols_info[symbol]['last_snapshot_update_id'] = update_id;
        }
    }

    await file_structure.close_file_handles();


}



// await import_raw_snapshot(0,0);
// await import_raw_snapshot();
await import_raw_snapshot(4);