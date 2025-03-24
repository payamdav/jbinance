import {config} from '../../../../config.js';
import fs from 'fs/promises';
import {fstat} from 'fs';


export async function trades_raw_to_binary(symbol, year, month, day) {
    const raw_path = `${config.data_path}um/trades/${symbol.toUpperCase()}-trades-${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}.csv`;
    const binary_path = `${config.data_path}um/trades/${symbol.toLowerCase()}.bin`;
    let raw_file = await fs.readFile(raw_path, 'utf8');
    let raw_lines = raw_file.split('\n');
    let binary_file = await fs.open(binary_path, 'a');
    for (const line of raw_lines) {
        if (line.length < 20 || isNaN(line[0])) continue;
        let fields = line.split(',');
        let price = Math.round(parseFloat(fields[1]) * 100000000) / 100000000;
        let quantity = Math.round(parseFloat(fields[2]) * 100000000) / 100000000;
        let quote = Math.round(parseFloat(fields[3]) * 100000000) / 100000000;
        let timestamp = parseInt(fields[4]);
        let is_buyer_maker = fields[5] === 'true';
        // buffer --> price(float64), quantity(float64), quote(float64), timestamp(int64), is_buyer_maker(bool)
        let buffer = Buffer.alloc(8 + 8 + 8 + 8 + 1);
        buffer.writeDoubleLE(price, 0);
        buffer.writeDoubleLE(quantity, 8);
        buffer.writeDoubleLE(quote, 16);
        buffer.writeBigInt64LE(BigInt(timestamp), 24);
        buffer.writeUInt8(is_buyer_maker ? 1 : 0, 32);
        await binary_file.write(buffer);
    }
    await binary_file.close();

}
