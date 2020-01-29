const BaseDevice = require('./BaseDevice');

module.exports = class RM extends BaseDevice {

    constructor(host, mac, timeout = 10) {
        super(host, mac, timeout);
        this.type = 'RM2';

        this.on('payload', (err, data) => {
            if (err) { this.emit('error', err); }

            const payloadType = data[0];
            let state;
            switch (payloadType) {
                case 1: // Temperature
                    state = {
                        mac: this.mac.toString('hex'),
                        host: this.host,
                        status: {
                            temperature: (data[0x4] * 10 + data[0x5]) / 10.0,
                        },
                    };
                    break;
                case 4: // get from check_data
                    const temp = Buffer.alloc(data.length - 4, 0);
                    data.copy(temp, 0, 4);
                    this.emit('data', temp);
                    return;
            }
            this.emit('state', state);
        });
    }

    checkData() {
        const packet = Buffer.alloc(16, 0);
        packet[0] = 4;
        this.sendPacket(0x6a, packet);
    }

    sendData(data) {
        let packet = new Buffer([0x02, 0x00, 0x00, 0x00]);
        packet = Buffer.concat([packet, data]);
        this.sendPacket(0x6a, packet);
    }

    enterLearning() {
        const packet = Buffer.alloc(16, 0);
        packet[0] = 3;
        this.sendPacket(0x6a, packet);
    }

    checkTemperature() {
        const packet = Buffer.alloc(16, 0);
        packet[0] = 1;
        this.sendPacket(0x6a, packet);
    }

    requestState() {
        this.checkTemperature();
    }
}
