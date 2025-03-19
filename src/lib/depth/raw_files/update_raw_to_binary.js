import fs from 'fs/promises';
import {FileStructure, append_to_binary_file} from './common.js';


async function import_raw_update(from_index=0, to_index=9999999999) {
    let file_structure = new FileStructure();
    await file_structure.init();
    let update_files = await file_structure.raw_update_files(from_index, to_index);

    // set last update ts and update id
    await file_structure.open_update_indexes_to_read();
    for (const symbol of Object.values(file_structure.symbols_info)) {
        if(symbol['updatesidx_size'] === 0) {
            symbol['last_update_ts'] = 0;
            symbol['last_update_update_id'] = 0;
        }
        else {
            // read last line of index file - update idx record set: ts, U, u, pu, start_offset, length, bids_size, asks_size
            let buffer = Buffer.alloc(8 + 8 + 8 + 8 + 8 + 8 + 4 + 4);
            await symbol['updatesidx_handle'].read(buffer, 0, buffer.length, symbol['updatesidx_size'] - buffer.length);
            let ts = Number(buffer.readBigUInt64BE(0));
            let update_id = Number(buffer.readBigUInt64BE(16));  // u
            symbol['last_update_ts'] = ts;
            symbol['last_update_update_id'] = update_id;

        }
    }
    await file_structure.close_file_handles();
    await file_structure.open_update_files_to_append();


    for (const raw_file_path of update_files) {
        let file_content = await fs.readFile(raw_file_path, 'utf8');
        const lines = file_content.split('\n');
        for (const line of lines) {
            if (line.length < 10) {
                // console.log('Line too short:');
                continue;
            }
            const data = JSON.parse(line).data;
            const symbol = data.s.toLowerCase();
            const ts = data.T;
            const U_id = data.U;
            const u_id = data.u;
            const pu_id = data.pu;
            const bids_size = data.b.length;
            const asks_size = data.a.length;
            if (!file_structure.symbols_info[symbol]) {
                await file_structure.add_symbol(symbol);
                file_structure.symbols_info[symbol]['last_update_ts'] = 0;
                file_structure.symbols_info[symbol]['last_update_update_id'] = 0;
                await file_structure.open_update_files_to_append();
            }
            if (file_structure.symbols_info[symbol].last_update_ts >= ts) continue;

            let array_buffer = new ArrayBuffer(bids_size * 2 * 8 + asks_size * 2 * 8);
            let bids_view = new Float64Array(array_buffer, 0, bids_size * 2);
            let asks_view = new Float64Array(array_buffer, bids_size * 2 * 8, asks_size * 2);
            for (let i = 0; i < bids_size; i++) {
                bids_view[i * 2] = parseFloat(data.b[i][0]);
                bids_view[i * 2 + 1] = parseFloat(data.b[i][1]);
            }
            for (let i = 0; i < asks_size; i++) {
                asks_view[i * 2] = parseFloat(data.a[i][0]);
                asks_view[i * 2 + 1] = parseFloat(data.a[i][1]);
            }

            let {start_offset, length} = await append_to_binary_file(file_structure.symbols_info[symbol]['updatesbin_handle'], Buffer.from(array_buffer));

            // write to index file - update idx record set: ts, U, u, pu, start_offset, length, bids_size, asks_size
            let index_buffer = Buffer.alloc(8 + 8 + 8 + 8 + 8 + 8 + 4 + 4);
            index_buffer.writeBigUInt64BE(BigInt(ts), 0);
            index_buffer.writeBigUInt64BE(BigInt(U_id), 8);
            index_buffer.writeBigUInt64BE(BigInt(u_id), 16);
            index_buffer.writeBigUInt64BE(BigInt(pu_id), 24);
            index_buffer.writeBigUInt64BE(BigInt(start_offset), 32);
            index_buffer.writeBigUInt64BE(BigInt(length), 40);
            index_buffer.writeInt32BE(bids_size, 48);
            index_buffer.writeInt32BE(asks_size, 52);
            await file_structure.symbols_info[symbol]['updatesidx_handle'].write(index_buffer);

            file_structure.symbols_info[symbol]['last_update_ts'] = ts;
            file_structure.symbols_info[symbol]['last_update_update_id'] = u_id;
        }
    }

    await file_structure.close_file_handles();


}



// await import_raw_update(0,0);
// await import_raw_update(600);
