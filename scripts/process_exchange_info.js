import {load, save} from '../src/lib/utils/file/saveload.js';

let ei = await load('um_exchange_info.json');
let max_price_precision = 0;
let min_price_precision = 1000;
let max_quantity_precision = 0;
let min_quantity_precision = 1000;

async function process_exchange_info() {
    for (let symbol of ei.symbols) {
        if (symbol.pricePrecision > max_price_precision) {
            max_price_precision = symbol.pricePrecision;
        }
        if (symbol.pricePrecision < min_price_precision) {
            min_price_precision = symbol.pricePrecision;
        }
        if (symbol.quantityPrecision > max_quantity_precision) {
            max_quantity_precision = symbol.quantityPrecision;
        }
        if (symbol.quantityPrecision < min_quantity_precision) {
            min_quantity_precision = symbol.quantityPrecision;
        }
    }
    console.log('Max price precision:', max_price_precision);
    console.log('Min price precision:', min_price_precision);
    console.log('Max quantity precision:', max_quantity_precision);
    console.log('Min quantity precision:', min_quantity_precision);
}

await process_exchange_info();
