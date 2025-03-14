import {save} from '../src/lib/utils/file/saveload.js';
import { BinanceApi } from '../src/lib/binance_api/binance_api.js';



let api = new BinanceApi('um');
let data = await api.get_request('/fapi/v1/exchangeInfo');
save(data, 'um_exchange_info.json');

