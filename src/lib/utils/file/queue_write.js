import fs from 'node:fs/promises';
import {config} from '../../../../config.js';


export class QueueWrite {
    constructor(name, file_data_limit= 1000, queue_bunch_size_to_write= 100) {
        this.name = name;
        this.queue = [];
        this.serial = 0;
        this.dir = `${config.data_path}queuewriter/${this.name}/`;
        this.current_filepath = null;
        this.current_file = null;
        this.current_file_data_counter = 0;
        this.file_data_limit = file_data_limit;
        this.queue_bunch_size_to_write = queue_bunch_size_to_write;
        this.writer_in_progress = false;

    }

    async create_directory() {
        try {
            await fs.mkdir(this.dir, {recursive: true});
        } catch (error) {
            console.error('Error:', error);
        }
    }

    push(data) {
        this.queue.push(data);
        if (this.queue.length >= this.queue_bunch_size_to_write) {
            this.fetch_and_write();
        }

    }

    fetch() {
        if (this.queue.length === 0) {
            return null;
        }
        const data = this.queue.shift();
        return data;
    }

    async open_next_file() {
        this.current_filepath = `${this.dir}${this.name}-${String(this.serial).padStart(10, '0')}.json`;
        this.serial++;
        this.current_file = await fs.open(this.current_filepath, 'w');
        this.current_file_data_counter = 0;
    }

    async close_current_file() {
        if (this.current_file) {
            await this.current_file.close();
            this.current_file = null;
        }
    }

    async fetch_and_write() {
        if (this.writer_in_progress) return;
        this.writer_in_progress = true;
        while(this.queue.length > 0) {
            if (!this.current_file) {
                await this.open_next_file();
            }
            const data = this.fetch();
            if (data) {
                await this.current_file.writeFile(data + '\n');
                this.current_file_data_counter++;
                if (this.current_file_data_counter >= this.file_data_limit) {
                    await this.close_current_file();
                }
            }
    
        }
        this.writer_in_progress = false;
    }



}
