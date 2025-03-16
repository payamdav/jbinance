import fs from 'fs/promises';
import {config} from '../../../../config.js';


let depth_binary_path = `${config.data_path}depth/binary/`;
let depth_raw_path = `${config.data_path}queuewriter/depth_snapshot/`;
let symbols_info = {};

async function create_binary_folder_if_not_exists() {
    try {
        await fs.mkdir(depth_binary_path, { recursive: true });
    } catch (error) {
        console.error('Error creating binary folder:', error);
    }
}

async function get_list_of_symbols_from_folder() {
    // list of named folders in the depth_binary_path
    let symbols = [];
    try {
        const files = await fs.readdir(depth_binary_path);
        for (const file of files) {
            // if file is a directory
            const stat = await fs.stat(`${depth_binary_path}${file}`);
            if (stat.isDirectory()) {
                symbols.push(file);
            }
        }
        return symbols;
    } catch (error) {
        console.error('Error reading folder:', error);
    }
}

async function create_folder_for_symbol(symbol) {
    try {
        await fs.mkdir(`${depth_binary_path}${symbol}`, { recursive: true });
        await fs.writeFile(`${depth_binary_path}${symbol}/snapshots.bin`, '', { flag: 'w' });
        await fs.writeFile(`${depth_binary_path}${symbol}/updates.bin`, '', { flag: 'w' });
    } catch (error) {
        console.error('Error creating folder for symbol:', error);
    }
}

async function get_files_sizes(symbol) {
    try {
        const snapshots_size = (await fs.stat(`${depth_binary_path}${symbol}/snapshots.bin`)).size;
        const updates_size = (await fs.stat(`${depth_binary_path}${symbol}/updates.bin`)).size;
        return { snapshots_size, updates_size };
    }
    catch (error) {
        console.error('Error getting file sizes:', error);
    }
}

async function build_symbols_info() {
    try {
        const symbols = await get_list_of_symbols_from_folder();
        for (const symbol of symbols) {
            const { snapshots_size, updates_size } = await get_files_sizes(symbol);
            let last_snapshot_ts = 0;
            let last_snapshot_update_id = 0;
            if (snapshots_size > 0) {
                console.log('Snapshots size:', snapshots_size);
                // todo
            }
            symbols_info[symbol] = {
                last_snapshot_ts,
                last_snapshot_update_id,
                file_handle: null,
            };
        }
    } catch (error) {
        console.error('Error building symbols info:', error);
    }
}

async function raw_snapshot_files() {
    let snapshot_files = [];
    try {
        const files = await fs.readdir(depth_raw_path);
        for (const file of files) {
            // if file starts with 'depth_snapshot-'
            if (file.startsWith('depth_snapshot-')) {
                // check if file is a json file
                if (file.endsWith('.json')) {
                    snapshot_files.push(file);
                }
            }
        }
        // sort files by name
        snapshot_files.sort((a, b) => {
            const a_num = parseInt(a.split('-')[1].split('.')[0]);
            const b_num = parseInt(b.split('-')[1].split('.')[0]);
            return a_num - b_num;
        });
        return snapshot_files;
    } catch (error) {
        console.error('Error reading folder:', error);
    }
}

async function snapshot_raw_to_binary() {
    await create_binary_folder_if_not_exists();
    await build_symbols_info();
    const snapshot_files = await raw_snapshot_files();
    console.log(symbols_info);
    console.log('Snapshot files:', snapshot_files);

    for (const filename of snapshot_files) {
        let file_content = await fs.readFile(`${depth_raw_path}${filename}`, 'utf8');
        const lines = file_content.split('\n');
        for (const line of lines) {
            if (line.length < 10) {
                console.log('Line too short:');
                continue;
            }
            const data = JSON.parse(line);
            const symbol = data.symbol;
            const ts = data.data.T;
            const update_id = data.data.lastUpdateId;
            if (!symbols_info[symbol]) {
                await create_folder_for_symbol(symbol);
                symbols_info[symbol] = {
                    last_snapshot_ts: 0,
                    last_snapshot_update_id: 0,
                    file_handle: null,
                };
            }
            if (symbols_info[symbol].last_snapshot_ts >= ts) continue;
            if (symbols_info[symbol].file_handle === null) symbols_info[symbol].file_handle = await fs.open(`${depth_binary_path}${symbol}/snapshots.bin`, 'a');

            let bids = new Float64Array(1000 * 2);
            let asks = new Float64Array(1000 * 2);

            for (let i = 0; i < data.data.bids.length; i++) {
                bids[i * 2] = parseFloat(data.data.bids[i][0]);
                bids[i * 2 + 1] = parseFloat(data.data.bids[i][1]);
            }
            for (let i = 0; i < data.data.asks.length; i++) {
                asks[i * 2] = parseFloat(data.data.asks[i][0]);
                asks[i * 2 + 1] = parseFloat(data.data.asks[i][1]);
            }
            // write to file
            const buffer = Buffer.alloc(8 + 8 + bids.byteLength + asks.byteLength);
            buffer.writeBigUInt64BE(BigInt(ts), 0);
            buffer.writeBigUInt64BE(BigInt(update_id), 8);
            Buffer.from(bids.buffer).copy(buffer, 16);
            Buffer.from(asks.buffer).copy(buffer, 16 + bids.byteLength);
            let res = await symbols_info[symbol].file_handle.write(buffer);

            symbols_info[symbol].last_snapshot_ts = ts;
            symbols_info[symbol].last_snapshot_update_id = update_id;
        }

    }
    // close all file handles
    for (const symbol in symbols_info) {
        if (symbols_info[symbol].file_handle !== null) {
            await symbols_info[symbol].file_handle.close();
        }
    }

}


async function read_raw_snapshot() {
    let symbol = 'btcusdt';
    let depth_snapshot_path = `${config.data_path}queuewriter/depth_snapshot/`;
    let filename = 'depth_snapshot-0000000000.json';
    let counter = 0;
    let counter2 = 0;
    let symbols = {};
    try {
        const json = await fs.readFile(`${depth_snapshot_path}${filename}`, 'utf8');
        // read file line by line
        const lines = json.split('\n');
        for (let line of lines) {
            if (line.length < 10) {
                console.log('Line too short:');
                continue;
            }
            const data = JSON.parse(line);
            if (symbols[data.symbol]) {
                symbols[data.symbol]++;
            }
            else {
                symbols[data.symbol] = 1;
            }
            if (data.symbol === symbol) {
                counter++;
            }
            else {
                counter2++;
            }
        }
        console.log('Counter:', counter);
        console.log('Counter2:', counter2);
        console.log('Symbols:', symbols);
    }
    catch (error) {
        console.error('Error:', error);
    }
}

await snapshot_raw_to_binary();

