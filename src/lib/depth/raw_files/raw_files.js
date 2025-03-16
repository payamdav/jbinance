import fs from 'fs/promises';
import {config} from '../../../../config.js';

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

await read_raw_snapshot();
