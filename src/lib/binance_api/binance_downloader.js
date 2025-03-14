import {downloadFile} from '../utils/file/download.js';
import {config} from '../../../config.js';
import fs from 'fs/promises';

export class BinanceDownloader {
    constructor(market) {
        this.market = market;
        if (this.market === 'um') {
            this.baseUrl = 'https://data.binance.vision/data/futures/um/';
        }
    }

    async download_candles_daily_1m(symbol, year, month, day) {
        try {
            const y = String(year);
            const m = String(month).padStart(2, '0');
            const d = String(day).padStart(2, '0');
            const s = symbol.toUpperCase();
            const fileName = `${s}-1m-${y}-${m}-${d}.zip`;
            const fileDir = `${config.data_path}${this.market}/candles/`;
            const isFileDirExists = await fs.stat(fileDir).catch(() => false);
            if (!isFileDirExists) {
                await fs.mkdir(fileDir, {recursive: true});
            }
            const filePath = `${fileDir}${fileName}`;
            const url = `${this.baseUrl}daily/klines/${s}/1m/${fileName}`;
            await downloadFile(url, filePath);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async download_candles_monthly_1m(symbol, year, month) {
        try {
            const y = String(year);
            const m = String(month).padStart(2, '0');
            const s = symbol.toUpperCase();
            const fileName = `${s}-1m-${y}-${m}.zip`;
            const fileDir = `${config.data_path}${this.market}/candles/`;
            const isFileDirExists = await fs.stat(fileDir).catch(() => false);
            if (!isFileDirExists) {
                await fs.mkdir(fileDir, {recursive: true});
            }
            const filePath = `${fileDir}${fileName}`;
            const url = `${this.baseUrl}monthly/klines/${s}/1m/${fileName}`;
            await downloadFile(url, filePath);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async download_trades_daily(symbol, year, month, day) {
        try {
            const y = String(year);
            const m = String(month).padStart(2, '0');
            const d = String(day).padStart(2, '0');
            const s = symbol.toUpperCase();
            const fileName = `${s}-trades-${y}-${m}-${d}.zip`;
            const fileDir = `${config.data_path}${this.market}/trades/`;
            const isFileDirExists = await fs.stat(fileDir).catch(() => false);
            if (!isFileDirExists) {
                await fs.mkdir(fileDir, {recursive: true});
            }
            const filePath = `${fileDir}${fileName}`;
            const url = `${this.baseUrl}daily/trades/${s}/${fileName}`;
            await downloadFile(url, filePath);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async download_trades_monthly(symbol, year, month) {
        try {
            const y = String(year);
            const m = String(month).padStart(2, '0');
            const s = symbol.toUpperCase();
            const fileName = `${s}-trades-${y}-${m}.zip`;
            const fileDir = `${config.data_path}${this.market}/trades/`;
            const isFileDirExists = await fs.stat(fileDir).catch(() => false);
            if (!isFileDirExists) {
                await fs.mkdir(fileDir, {recursive: true});
            }
            const filePath = `${fileDir}${fileName}`;
            const url = `${this.baseUrl}monthly/trades/${s}/${fileName}`;
            await downloadFile(url, filePath);
        } catch (error) {
            console.error('Error:', error);
        }
    }
    



}
