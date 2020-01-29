require('buffer-safe');
const dgram = require('dgram');
const EventEmitter = require('events');
const os = require('os');
const { A1, BaseDevice, MP1, RM, SP1, SP2 } = require('./devices');

// https://gitlab.com/zyrorl/broadlink

class Broadlink extends EventEmitter {
    constructor() {
        super();
        this.devices = new Map();
    }

    discover() {
        clearTimeout(this.timeout);
        this.closed = false;

        const interfaces = os.networkInterfaces();
        const addresses = [];
        Object.keys(interfaces).forEach((idx) => {
            const filteredInterface = interfaces[idx].find((iface) => {
                return iface.family === 'IPv4' && iface.internal === false;
            });
            if (filteredInterface) { addresses.push(filteredInterface.address); }
        });

        addresses.forEach((addr) => {
            const address = addr.split('.');
            const dgc = dgram.createSocket({ type: 'udp4', reuseAddr: true });

            dgc.on('listening', () => {
                dgc.setBroadcast(true);

                const port = dgc.address().port;

                const now = new Date();
                const timezone = now.getTimezoneOffset() / -3600;
                const year = now.getFullYear();

                const packet = Buffer.alloc(0x30, 0);

                if (timezone < 0) {
                    packet[0x08] = 0xff + timezone - 1;
                    packet[0x09] = 0xff;
                    packet[0x0a] = 0xff;
                    packet[0x0b] = 0xff;
                } else {
                    packet[0x08] = timezone;
                    packet[0x09] = 0;
                    packet[0x0a] = 0;
                    packet[0x0b] = 0;
                }

                packet[0x0c] = year & 0xff;
                packet[0x0d] = year >> 8;
                packet[0x0e] = now.getMinutes();
                packet[0x0f] = now.getHours();
                const subyear = year % 100;
                packet[0x10] = subyear;
                packet[0x11] = now.getDay();
                packet[0x12] = now.getDate();
                packet[0x13] = now.getMonth();
                packet[0x18] = parseInt(address[0], 10);
                packet[0x19] = parseInt(address[1], 10);
                packet[0x1a] = parseInt(address[2], 10);
                packet[0x1b] = parseInt(address[3], 10);
                packet[0x1c] = port & 0xff;
                packet[0x1d] = port >> 8;
                packet[0x26] = 6;
                let checksum = 0xbeaf;

                for (let i = 0; i < packet.length; i++) {
                    checksum += packet[i];
                }
                checksum = checksum & 0xffff;
                packet[0x20] = checksum & 0xff;
                packet[0x21] = checksum >> 8;

                dgc.send(packet, 0, packet.length, 80, '255.255.255.255');
            });

            dgc.on('message', (msg, rinfo) => {
                const host = rinfo;
                const mac = Buffer.alloc(6, 0);
                msg.copy(mac, 0, 0x34, 0x40);
                const devtype = msg[0x34] | msg[0x35] << 8;

                if (!this.devices[mac.toString()]) {
                    const dev = this.genDevice(devtype, host, mac);
                    this.devices[mac.toString()] = dev;
                    dev.on('deviceReady', () => { this.emit('deviceReady', dev); });
                    dev.auth();
                    dgc.close();
                    this.closed = true;
                } else {
                    this.emit('deviceReady', this.devices[mac.toString()]);
                    dgc.close();
                    this.closed = true;
                }
            });

            dgc.bind();

            this.timeout = setTimeout(() => {
                if(!this.closed) {
                    try {
                        dgc.close();
                    } catch {}
                }
            }, 15000)
        });
    }

    genDevice(devtype, host, mac) {
        switch (devtype) {
            case 0: // SP1
                return new SP1(host, mac);
            case 0x2711: // SP2
            case 0x27199 || 0x7919 || 0x271a || 0x791a: // Honeywell SP2
            case 0x2720: // SPMini
            case 0x2733 || 0x273e: // OEM branded SPMini
            case 0x2728: // SPMini2
            case 0x753e: // SP3
            case 0x2736: // SPMiniPlus
                return new SP2(host, mac);
            case 0x4EB5: // MP1
                return new MP1(host, mac);
            case 0x2712: // RM2
            case 0x2737: // RM Mini
            case 0x273d: // RM Pro Phicomm
            case 0x2783: // RM2 Home Plus
            case 0x277c: // RM2 Home Plus GDT
            case 0x272a: // RM2 Pro Plus
            case 0x2787: // RM2 Pro Plus 2
            case 0x278b: // RM2 Pro Plus BL
            case 0x278f: // RM Mini Shate
                return new RM(host, mac);
            case 0x2714: // A1
                return new A1(host, mac);
            default:
                if (devtype >= 0x7530 && devtype <= 0x273e) { // OEM Branded SPMini2
                    return new SP2(host, mac);
                }
                return new BaseDevice(host, mac);
        }
    }
}

module.exports = new Broadlink();