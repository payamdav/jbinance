import fs from 'fs/promises';
import {fstat} from 'fs';
import {config} from '../../../../config.js';


export class FileStructure {
    FILES_FOR_EACH_SYMBOL = ['snapshots.bin', 'updates.bin', 'snapshots.idx', 'updates.idx'];
    constructor() {
        this.depth_binary_path = `${config.data_path}depth/binary/`;
        this.snapshot_raw_path = `${config.data_path}queuewriter/depth_snapshot/`;
        this.update_raw_path = `${config.data_path}queuewriter/depth_update/`;
        this.symbols_info = {};
    }

    async init() {
        await this.create_binary_folder();
        await this.get_list_of_symbols_from_folder();
        for (const symbol of this.symbols) {
            await this.add_symbol(symbol);
        }
    }

    async symbol_initialize(symbol) {
        for (const file of this.FILES_FOR_EACH_SYMBOL) {
            let file_size = await this.file_size(symbol, file);
            let key = `${file.replace('.', '')}_size`;
            this.symbols_info[symbol][key] = file_size;
            this.symbols_info[symbol][`${file.replace('.', '')}_handle`] = null;
        }
    }

    async create_binary_folder() {
        try {
            await fs.mkdir(this.depth_binary_path, { recursive: true });
        } catch (error) {
            console.error('Error creating binary folder:', error);
        }
    }

    async get_list_of_symbols_from_folder() {
        try {
            const files = await fs.readdir(this.depth_binary_path);
            for (const file of files) {
                const stat = await fs.stat(`${this.depth_binary_path}${file}`);
                if (stat.isDirectory()) {
                    this.symbols_info[file] = {};
                }
            }
        } catch (error) {
            console.error('Error reading folder:', error);
        }
    }

    async touch_file_if_not_exists(symbol, file) {
        try {
            const file_path = `${this.depth_binary_path}${symbol}/${file}`;
            const isExists = await fs.stat(file_path).catch(() => null);
            if (!isExists) await fs.writeFile(file_path, '', { flag: 'w' });
        } catch (error) {
            console.error('Error touching file:', error);
        }
    }

    async add_symbol(symbol) {
        try {
            await fs.mkdir(`${this.depth_binary_path}${symbol}`, { recursive: true });
            for (const file of this.FILES_FOR_EACH_SYMBOL) {
                await this.touch_file_if_not_exists(symbol, file);
            }
            if (!this.symbols_info[symbol]) {
                this.symbols_info[symbol] = {};
            }
            await this.symbol_initialize(symbol);
        } catch (error) {
            console.error('Error creating folder for symbol:', error);
        }
    }

    async remnove_symbol(symbol) {
        try {
            await fs.rmdir(`${this.depth_binary_path}${symbol}`, { recursive: true });
        } catch (error) {
            console.error('Error removing symbol:', error);
        }
    }

    async remove_all_symbols() {
        try {
            // remove all folders in the depth_binary_path but not files
            const files = await fs.readdir(this.depth_binary_path);
            for (const file of files) {
                const stat = await fs.stat(`${this.depth_binary_path}${file}`);
                if (stat.isDirectory()) {
                    await this.remnove_symbol(file);
                }
            }
        } catch (error) {
            console.error('Error removing all symbols:', error);
        }
    }

    get symbols() {
        return Object.keys(this.symbols_info);
    }

    async file_size(symbol, file) {
        try {
            const file_size = (await fs.stat(`${this.depth_binary_path}${symbol}/${file}`)).size;
            return file_size;
        } catch (error) {
            console.error('Error getting file size:', error);
        }
    }

    async raw_snapshot_files(fromIndex = 0, toIndex = 9999999999) {
        let snapshot_files = [];
        try {
            const files = await fs.readdir(this.snapshot_raw_path);
            for (const file of files) {
                // if file starts with 'depth_snapshot-'
                if (file.startsWith('depth_snapshot-')) {
                    // check if file is a json file
                    if (file.endsWith('.json')) {
                        const file_num = parseInt(file.split('-')[1].split('.')[0]);
                        if (file_num >= fromIndex && file_num <= toIndex) {
                            snapshot_files.push(file);
                        }
                    }
                }
            }
            // sort files by name
            snapshot_files.sort((a, b) => {
                const a_num = parseInt(a.split('-')[1].split('.')[0]);
                const b_num = parseInt(b.split('-')[1].split('.')[0]);
                return a_num - b_num;
            });
            return snapshot_files.map(file => `${this.snapshot_raw_path}${file}`);
        } catch (error) {
            console.error('Error reading folder:', error);
        }
    }

    async raw_update_files(fromIndex = 0, toIndex = 9999999999) {
        let update_files = [];
        try {
            const files = await fs.readdir(this.update_raw_path);
            for (const file of files) {
                // if file starts with 'depth_update-'
                if (file.startsWith('depth_update-')) {
                    // check if file is a json file
                    if (file.endsWith('.json')) {
                        const file_num = parseInt(file.split('-')[1].split('.')[0]);
                        if (file_num >= fromIndex && file_num <= toIndex) {
                            update_files.push(file);
                        }
                    }
                }
            }
            // sort files by name
            update_files.sort((a, b) => {
                const a_num = parseInt(a.split('-')[1].split('.')[0]);
                const b_num = parseInt(b.split('-')[1].split('.')[0]);
                return a_num - b_num;
            });
            return update_files.map(file => `${this.update_raw_path}${file}`);
        } catch (error) {
            console.error('Error reading folder:', error);
        }
    }

    async open_snapshot_indexes_to_read() {
        for (const symbol in this.symbols_info) {
            if (this.symbols_info[symbol].snapshotsidx_handle === null) {
                this.symbols_info[symbol].snapshotsidx_handle = await fs.open(`${this.depth_binary_path}${symbol}/snapshots.idx`, 'r');
            }
        }
    }

    async open_update_indexes_to_read() {
        for (const symbol in this.symbols_info) {
            if (this.symbols_info[symbol].updatesidx_handle === null) {
                this.symbols_info[symbol].updatesidx_handle = await fs.open(`${this.depth_binary_path}${symbol}/updates.idx`, 'r');
            }
        }
    }


    async open_snapshot_files_to_append() {
        for (const symbol in this.symbols_info) {
            if (this.symbols_info[symbol].snapshotsbin_handle === null) {
                this.symbols_info[symbol].snapshotsbin_handle = await fs.open(`${this.depth_binary_path}${symbol}/snapshots.bin`, 'a');
            }
            if (this.symbols_info[symbol].snapshotsidx_handle === null) {
                this.symbols_info[symbol].snapshotsidx_handle = await fs.open(`${this.depth_binary_path}${symbol}/snapshots.idx`, 'a');
            }
        }
    }

    async open_update_files_to_append() {
        for (const symbol in this.symbols_info) {
            if (this.symbols_info[symbol].updatesbin_handle === null) {
                this.symbols_info[symbol].updatesbin_handle = await fs.open(`${this.depth_binary_path}${symbol}/updates.bin`, 'a');
            }
            if (this.symbols_info[symbol].updatesidx_handle === null) {
                this.symbols_info[symbol].updatesidx_handle = await fs.open(`${this.depth_binary_path}${symbol}/updates.idx`, 'a');
            }
        }
    }

    async close_file_handles() {
        let file_handles_key = ['snapshotsbin_handle', 'updatesbin_handle', 'snapshotsidx_handle', 'updatesidx_handle'];
        for (const symbol in this.symbols_info) {
            for (const key of file_handles_key) {
                if (this.symbols_info[symbol][key] !== null) {
                    await this.symbols_info[symbol][key].close();
                    this.symbols_info[symbol][key] = null;
                }
            }
        }
    }

}

export async function append_to_binary_file(file_handle, buffer) {
    // append to binary file and return start offset and length
    const start_offset = await get_file_size(file_handle);
    await file_handle.write(buffer, 0, buffer.length, start_offset);
    const length = buffer.length;
    return {start_offset, length};
}

export async function get_file_size(file_handle) {
    return new Promise((resolve, reject) => {
        fstat(file_handle.fd, (err, stats) => {
            if (err) {
                reject(err);
            } else {
                resolve(stats.size);
            }
        });
    });
}
