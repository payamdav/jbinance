import {BinanceApi} from './src/lib/binance_api/binance_api.js';


let binance = new BinanceApi('um');
let server_time = await binance.get_request('/fapi/v1/exchangeInfo');
console.log(server_time);
