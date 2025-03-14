import {QueueWrite} from '../utils/file/queue_write.js';


export class BinanceWS {
    constructor(market, mode='internal', name='binance_ws') {
        this.market = market;
        if (this.market === 'um') {
            this.baseUrl = 'wss://fstream.binance.com';
        }
        this.wsUrl = null;
        this.socket = null;
        this.connected = false;
        this.active = false;
        this.combined = false;
        this.streams = [];
        this.mode = mode;
        if (this.mode === 'queue_writer') {
            this.queue = new QueueWrite(name);
        }

        this.wwatchdogTimer = setInterval(() => {
            this.watchdog();
        }, 5000);


    }

    connect() {
        this.active = true;
    }

    disconnect() {
        this.active = false;
    }

    watchdog() {
        if (this.active) {
            if (this.socket && this.connected) {
                return;
            } else {
                this.doConnect();
            }
        }
        else {
            if (this.socket && this.connected) {
                this.socket.close();
                console.log('WebSocket connection closed');
            }
        }
    }



    addStream(stream) {
        if (!this.streams.includes(stream)) {
            this.streams.push(stream);
            this.buildUrl();
            console.log(`Stream ${stream} added`);
        } else {
            console.log(`Stream ${stream} already exists`);
        }
    }

    removeStream(stream) {
        const index = this.streams.indexOf(stream);
        if (index !== -1) {
            this.streams.splice(index, 1);
            this.buildUrl();
            console.log(`Stream ${stream} removed`);
        } else {
            console.log(`Stream ${stream} does not exist`);
        }
    }

    buildUrl() {
        if (this.streams.length === 0) {
            console.log('No streams to subscribe to');
            return;
        }
        else if (this.streams.length === 1) {
            this.combined = false;
            this.wsUrl = `${this.baseUrl}/ws/${this.streams[0]}`;
        } else {
            this.combined = true;
            const streamString = this.streams.join('/');
            this.wsUrl = `${this.baseUrl}/stream?streams=${streamString}`;
        }
    }

    doConnect() {
        this.socket = new WebSocket(this.wsUrl);

        this.socket.addEventListener('open', () => {
            this.connected = true;
            console.log('WebSocket connection opened');
        });

        this.socket.addEventListener('message', (event) => {
            if (this.mode === 'internal') {
                this.handleMessage(event);
            }
            else if (this.mode === 'queue_writer') {
                this.queue.push(event.data);
            }
        });

        this.socket.addEventListener('close', (event) => {
            this.connected = false;           
            console.log('WebSocket connection closed', event.code, event.reason);
        });

        this.socket.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
        });

    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Message received:', data);
            // Handle the message data here
        } catch (error) {
            console.error('Error parsing message:', error);
            console.log('Raw message:', event.data);
        }
    }

    sendMessage(message) {
        if (this.socket && this.connected) {
            this.socket.send(JSON.stringify(message));
            console.log('Message sent:', message);
        } else {
            console.error('WebSocket is not connected. Cannot send message.');
        }
    }

  
}