export class BinanceApi {
  constructor(market) {
    this.market = market;
    if (this.market === 'um') {
      this.restUrl = 'https://fapi.binance.com';
    }
  }

  async get_request(endpoint, params={}) {
    try {
        const url = `${this.restUrl}${endpoint}`;
        const response = await fetch(url + '?' +new URLSearchParams(params));
        if (response.status !== 200) {
          console.error('Error:', response);
          return;
        }
        const data = await response.json();
        return data;
    
    } catch (error) {
        console.error('Error:', error);
    }
  }

  async get_request_text(endpoint, params={}) {
    try {
        const url = `${this.restUrl}${endpoint}`;
        const response = await fetch(url + '?' +new URLSearchParams(params));
        if (response.status !== 200) {
          console.error('Error:', response);
          return;
        }
        const data = await response.text();
        return data;
    
    } catch (error) {
        console.error('Error:', error);
    }
  }



}
