import {sma, atr} from '@ixjb94/indicators-js';
import {average, standardDeviation} from 'simple-statistics';
import {PLevelizer} from '../ta/pip_levelizer.js';



export class Analyze {
    constructor(symbol) {
        this.symbol = symbol;
        this.m = this.symbol.candles_m;
        this.d = this.symbol.candles_d;
        this.h = this.symbol.candles_h;
    }

    print() {
        // console.log(this.symbol);
        // console.log(this.m.map((candle) => candle.c));
        console.log({mounts: this.months, days: this.days, min_price: this.min_price, max_price: this.max_price, usdt_per_day: this.usdt_per_day});
        console.log({daily_atr: this.daily_atr, hourly_atr: this.hourly_atr});
        console.log({average_daily_candle_pips: this.average_daily_candle_pips, average_hourly_candle_pips: this.average_hourly_candle_pips});
    }

    base_analysis() {
        this.months = this.m.length;
        this.days = this.d.length;
        this.min_price = this.m.reduce((min, p) => p.l < min ? p.l : min, this.m[0].l);
        this.max_price = this.m.reduce((max, p) => p.h > max ? p.h : max, this.m[0].h);
        this.usdt_per_day = this.d.reduce((sum, p) => sum + p.q, 0) / this.days;
        this.levelizer = new PLevelizer(this.min_price, this.max_price, 0.0001);
        this.mhl = this.levelizer.map_level(this.m.map((candle) => candle.h));
        this.mll = this.levelizer.map_level(this.m.map((candle) => candle.l));
        this.mcl = this.levelizer.map_level(this.m.map((candle) => candle.c));
        this.dhl = this.levelizer.map_level(this.d.map((candle) => candle.h));
        this.dll = this.levelizer.map_level(this.d.map((candle) => candle.l));
        this.dcl = this.levelizer.map_level(this.d.map((candle) => candle.c));
        this.hhl = this.levelizer.map_level(this.h.map((candle) => candle.h));
        this.hll = this.levelizer.map_level(this.h.map((candle) => candle.l));
        this.hcl = this.levelizer.map_level(this.h.map((candle) => candle.c));
        this.daily_atr = average(atr(this.dhl, this.dll, this.dcl, 14));
        this.hourly_atr = average(atr(this.hhl, this.hll, this.hcl, 14));
        this.average_daily_candle_pips = average(this.dhl) - average(this.dll);
        this.average_hourly_candle_pips = average(this.hhl) - average(this.hll);



    }


    average() {
        let avg = average(this.m.map((candle) => candle.c));
        console.log(avg);
        return avg;
    }

    sma(period) {
        let res = sma(this.m.map((candle) => candle.c), period);
        console.log(res);
        return res;
    }


}
