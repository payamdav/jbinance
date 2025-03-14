import {homedir} from 'os';

export let config = {};
config.data_path = `${homedir()}/data/`;
config.files_path = `${config.data_path}files/`;
