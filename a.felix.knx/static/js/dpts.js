var dpts = {
    "main": {
        1: "DPT 1.xxx 1-Bit Status",
        3: "DPT 3.xxx 4-Bit Dimmen",
        4: "DPT 4.xxx 8-Bit Zeichen",
        5: "DPT 5.xxx 8-Bit Ganzzahl Vorzeichenlos",
        6: "DPT 6.xxx 8-Bit Ganzzahl Vorzeichen",
        7: "DPT 7.xxx 2-Byte Ganzzahl Vorzeichenlos (Zeit)",
        8: "DPT 8.xxx 2-Byte Ganzzahl Vorzeichen (Differenz)",
        9: "DPT 9.xxx 2-Byte Gleitkommazahl"
    },
    "sub": {
        1: {
            default: { type: "boolean", role: "onoff" },
            0: { name: "Keinen Sub angeben", func: "on", role: "" },
            1: { name: "1.001 Schalten", func: "on" },
            2: { name: "1.002 Boolesch", func: "on" },
            3: { name: "1.003 Freigegeben", func: "enabled", role: "enabled" },
            4: { name: "1.004 Anstieg", func: "ramp", role: "ramp" },
            5: { name: "1.005 Alarm", func: "alarm", role: "state.alarm" },
            8: { name: "1.008 Auf/Ab", func: "direction", role: "rollo.direction", type: "direction" },
            10: { name: "1.010 Start/Stop", func: "stop", role: "state.stop" },
            19: { name: "1.019 Fenster/Tür", func: "state.door", role: "state" },
            20: { name: "1.020 Szene", func: "scene", role: "scene" },
            100: { name: "1.100 Heizen/Kühlen", func: "heat", role: "state.heat" }
        },
        3: {
            default: { type: "object", role: "blinds", func: "blinds" },
            0: { name: "Keinen Sub angeben" },
            7: { name: "3.007 Dimmer Schritt" },
            8: { name: "3.008 Jalousie Schritt" }
        },
        4: {
            default: { type: "text", role: "char", func: "char" },
            0: { name: "Keinen Sub angeben" },
            1: { name: "4.001 Zeichen (ASCII)" },
            2: { name: "4.002 Zeichen (ISO 8859_1)" }
        },
        5: {
            default: { type: "number", role: "number" },
            0: { name: "Keinen Sub angeben", func: "number" },
            1: { name: "5.001 Prozent (0..100%)", func: "position", type: "state.position", assign: { min: 0, max: 100 } },
            3: { name: "5.003 Winkel (Grad)", func: "angle", assign: { min: 0, max: 360 } },
            4: { name: "5.004 Prozent (0..255%)", func: "percent", assign: { min: 0, max: 255 } },
            5: { name: "5.005 Dezimalfaktor (0..255)", func: "factor", assign: { min: 0, max: 255 } },
            6: { name: "5.005 Tarif (0..255)", func: "tariff", type: "object", role: "tariff", assign: { min: 0, max: 255 } },
            10: { name: "5.010 Zählimpuls (0..255)", func: "count", role: "pulse", assign: { min: 0, max: 255 } }
        },
        6: {
            default: { type: "number", role: "number.percent" },
            0: { name: "Keinen Sub angeben", func: "number" },
            1: { name: "6.001 Prozent (-128..127%)", func: "percent", assign: { min: -128, max: 127 } },
            10: { name: "6.010 Zählimpuls (-128..127", func: "pulse", role: "pulse", assign: { min: -128, max: 127 } },
            20: { name: "6.020 Status mit Modus", func: "status_mode", type: "object" }
        },
        7: {
            default: { type: "number", role: "time.ms", func: "period" },
            0: { name: "Keinen Sub angeben", func: "number" },
            1: { name: "7.001 Pulse", func: "pulse", role: "pulse" },
            2: { name: "7.002 Zeit (ms)", role: "time.ms" },
            3: { name: "7.003 Zeit (10ms)", role: "time.s", assign: { divider: 100 } },
            4: { name: "7.004 Zeit (100ms)", role: "time.s", assign: { divider: 10 } },
            5: { name: "7.005 Zeit (s)", role: "time.s" },
            6: { name: "7.006 Zeit (m)", role: "time.m" },
            7: { name: "7.007 Zeit (h)", role: "time.h" },
            11: { name: "7.011 Länge (mm)", role: "length.mm", func: "length" },
            12: { name: "7.012 Strom (mA)", role: "current.ma", func: "current" },
            13: { name: "7.013 Helligkeit (lux)", role: "level.lux", func: "lux" },
        },
        8: {
            default: { type: "number", role: "time.ms", func: "period" },
            0: { name: "Keinen Sub angeben", func: "number" },
            1: { name: "8.001 Count", func: "count", role: "pulse", assign: { min: -32768, max: 32768 } },
            2: { name: "8.002 Zeitdifferenz (ms)", role: "time.ms", assign: { min: -32768, max: 32768 } },
            3: { name: "8.003 Zeitdifferenz (10ms)", role: "time.s", assign: { divider: 100, min: -328, max: 327 } },
            4: { name: "8.004 Zeitdifferenz (100ms)", role: "time.s", assign: { divider: 10, min: -3277, max: 3276 } },
            5: { name: "8.005 Zeitdifferenz (s)", role: "time.s", assign: { min: -32768, max: 32768 } },
            6: { name: "8.006 Zeitdifferenz (m)", role: "time.m", assign: { min: -32768, max: 32768 } },
            7: { name: "8.007 Zeitdifferenz (h)", role: "time.h", assign: { min: -32768, max: 32768 } },
            10: { name: "8.010 Prozentdifferenz", role: "number.percent", assign: { min: -328, max: 327, divider: 100 } },
            11: { name: "8.011 Rotationswinkel", role: "level.rotation", assign: { min: -32768, max: 32768 } }
        },
        9: {
            default: { type: "float" },
            0: { name: "Keinen Sub angeben", func: "float", role: "number" },
            1: { name: "9.001 Temperatur (°C)", func: "temp", role: "level.temp" },
            2: { name: "9.002 Temperaturdifferenz (K)", func: "temp", role: "level.tempdiff" },
            3: { name: "9.003 Kelvin/Stunde (K/h)", func: "kph", role: "level.kph" },
            4: { name: "9.004 Lux (lux)", func: "lux", role: "level.lux" },
            5: { name: "9.005 Geschwindigkeit (m/s)", func: "speed", role: "level.speed" },
            6: { name: "9.006 Druck (Pa)", func: "pressure", role: "level.pressure" },
            7: { name: "9.007 Feuchtigkeit (%)", func: "humidity", role: "level.humidity" },
            8: { name: "9.008 Teile/Millionen (ppm)", func: "ppm", role: "level.ppm" },
            9: { name: "9.009 Luftdurchsatz (m³/h)", func: "airflow", role: "level.airflow" },
            10: { name: "9.010 Zeit (s)", func: "time", role: "time.s" },
            11: { name: "9.011 Zeit (ms)", func: "time", role: "time.ms" }
        }
    }
}

if(module && module.exports) {
    module.exports = dpts;
}