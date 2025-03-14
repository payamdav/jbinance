export class PLevelizer {
    constructor(start_price=10000, end_price=150000, percent=0.0001) {
        this.start_price = start_price;
        this.end_price = end_price;
        this.percent = percent;
        this.levels = [];

        let cur_price = start_price;
        while (cur_price < end_price) {
            this.levels.push(cur_price);
            cur_price *= (1 + percent);
        }
        this.end_price = cur_price;
    }

    get_level(price) {
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (price >= this.levels[i]) {
                return i;
            }
        }
        return this.levels.length;
    }

    get_level_binary_search(price) {
        let left = 0;
        let right = this.levels.length - 1;
        while (left <= right) {
            let middle = Math.floor(left + (right - left) / 2);
            if (price < this.levels[middle]) {
                right = middle - 1;
            } else if (price > this.levels[middle]) {
                left = middle + 1;
            } else {
                return middle;
            }
        }
        return right;
    }

    map_level(prices) {
        return prices.map((price) => this.get_level_binary_search(price));
    }

    
}