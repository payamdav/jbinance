import fs from 'fs/promises';
import {config} from '../../../../config.js';


export async function save(data, filename) {
    try {
        // create directories if config.file_path does not exist
        await fs.mkdir(config.files_path, {recursive: true});
        const json = JSON.stringify(data);
        await fs.writeFile(`${config.files_path}${filename}`, json);
    } catch (error) {
        console.error('Error:', error);
    }
}


export async function load(filename) {
    try {
        const json = await fs.readFile(`${config.files_path}${filename}`, 'utf8');
        return JSON.parse(json);
    }
    catch (error) {
        console.error('Error:', error);
    }
}
