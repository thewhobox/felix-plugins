
/**
 * Lädt ein Modul.
 * @param module Name des Moduls
 */
declare function require(module: string): any;



/**
 * Setzt den Wert eines States.
 * @param id ID des States
 * @param name Name des States
 * @param type Typ (button, string, etc)
 * @param role Rolle (light.level, media.title, etc)
 * @param readwrite Zugriff (0 = keiner, 1 = read, 2 = write, 3 = read/write)
 * @param initValue Initialer Wert
 * @param states Auflistung der erlaubten States ({ 0: "Leerlauf", 1: "Pause", ...})
 */
declare function createState(id: string, name: string, type: string, role: string, readwrite: number): void;
declare function createState(id: string, name: string, type: string, role: string, readwrite: number, initValue:string): void;
declare function createState(id: string, name: string, type: string, role: string, readwrite: number, initValue:string, states: object): void;

/**
 * Gibt den State mit der angegebenen ID zurück.
 * @param id ID des States
 * @returns State Objekt
 */
declare function getState(id: string): any;
declare function getState(id: string, cb: (state: any) => void): void;

/**
 * Setzt den Wert eines States.
 * @param id ID des States
 * @param value Wert zum schreiben
 * @param ack Gibt an ob aktualisierung
 */
declare function setState(id: string, value: any, ack?: boolean): void;

/**
 * Wird ausgelöst, wenn ein bestimmter State sich ändert.
 * @param id ID des States
 * @param cond Gibt an auf was reagiert werden soll
 * @param callback Wird ausgeführt, wenn bedingungen erfült sind
 */
declare function on(id: string, cond: string, callback: (state: any) => void): void;
declare function on(id: string[], cond: string, callback: (state: any) => void): void;
declare function on(id: RegExp, cond: string, callback: (state: any) => void): void;

