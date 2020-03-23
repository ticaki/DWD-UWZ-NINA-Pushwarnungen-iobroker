//Version 0.97.1
// Erläuterung Update:
// Suche im Script nach 123456 und kopiere/ersetze ab diesem Punkt. So braucht ihr die Konfiguration nicht zu erneuern.
// Das gilt solange die version 0.96.xxx ist, ab 0.97, 0.98, usw. muß man auch die Konfiguration neumachen oder im Forum nach den Änderungen schauen.
// Link: https://forum.iobroker.net/topic/30616/script-dwd-uwz-nina-warnungen-als-push-sprachnachrichten/
//
// V.0.97 Vor dem Start des Scriptes den Datenzweig .alert löschen.
/*
/* ************************************************************************* */
/*             Script zum Übertragen der DWD/UWZ-Wetterwarnungen über        */
/*             Telegram, Pushover, Home24-Mediaplayer, SayIt, Alexa          */
/*             Datenpunkt, eMail oder ioGo                                   */
/*             Pushnachrichten können manuell ausgelöst werden               */
/*             höchstes Warnlevel pro Warnungstyp is als State vorhanden     */
/*     mit freundlicher Unterstützung von Paul53 (Tausend Dank nochmals)     */
/*                    Stand: 13022017    PrinzEisenherz1                     */
/*                    Stand: 08032020    ticaki                              */
/*                                                                           */
/*                                                                           */
/* ************************************************************************* */

/*
Unterstützt:
- Telegram, Pushover, Home24-Mediaplayer, SayIt, Alexa, Datenpunkt, eMail oder ioGo
- DWD-Adapter & Unwetterzentrale-Script & NINA-Adapter V0.0.22
- Wetterwarnung
- Wetterentwarnung

Funktionen:
- Filter die Warnungen nach doppelt, Gefahr(level) und Höhe
- Umschalten über iobroker zwischen DWD/UWZ/NINA
- Autorestart bei Datenpunkterstellung
- Automatischer Versand und/oder manueller Nachrichtenversand
- Zeitschaltuhr für Sprachausgabe
- Datenpunkte mit der Startzeit, Endzeit, Type, Schlagzeile, Beschreibung, Farbe für Level(bgcolor) und höchstem Warnlevel dieses Typs
- Unterstützung für 0_userdata
- Datenpunkthauptpfade sind konfigurierbar incl. 0_userdata
- Konfigurationsprüfung soweit möglich
- Automodus und einzelne Pushdienste über iobroker schaltbar, sowohl für Automodus als auch Manuell
- Optimierte Sprachausgabe
- Fingerweg vom .alive state :)

Kleinkram:
- Sprachausgabe: Sturmdetails werden ausgefiltert oder korrekt ausgesprochen (konfigurierbar)
- Sprachausgabe: Pause zwischen dem Absenden der einzelnen Warnungen an die Wiedergabeeinheit konfigurierbar.
- Manuelle Sprachnachrichten können die Zeitschaltuhr missachten. (konfigurierbar)
- Multi-User/Device bei fast allen Pushdiensten verfügbar (außer Datenpunkt & pushover)
- Alexa und SayIt mit Lautstärkeeinstellung. Alexagruppen unterstützen keine Lautstärke trotzdem konfigurieren.
- Zusätzliche Hervorhebung konfigurierbar über attentionWarningLevel (im Betreff/Ansage)
- Filter für Nina-sender
- Namesbezeichner für Nina verfügbar, diese werden benötigt, falls in der Warnung Ort genannt wird, das auszugeben und damit die Bedeutung der Warnung hervorzuheben.

Farben-Bedeutung:
0 - Grün
1 - Dunkelgrün
2 - Gelb Wetterwarnungen (Stufe 2)
3 - Orange Warnungen vor markantem Wetter (Stufe 3)
4 - Rot Unwetterwarnungen (Stufe 4) // im Grunde höchste Stufe in diesem Skript.
5 - Violett Warnungen vor extremem Unwetter (nur DWD/ Weltuntergang nach aktueller Erfahrung)



Dank an:
- Mic für die createUserStates() Funktionen
- CruziX der diese eingebaut hat.
- crunchip, sigi234, Latzi fürs Testen und Ideen
- die ursprünglichen Authoren s.o.

/* ************************************************************************
/* ************************************************************************ */

/* ************************************************************************ */
/*            Datenpfad konfigurieren                                       */
/* ************************************************************************ */
/*                                                                          */
/*            0_userdata. möglich                                           */
/*                                                                          */
/* ************************************************************************ */



var mainStatePath = 'javascript.0.wetterwarnung_test.';



/* ************************************************************************ */
/*            Datenpfad konfigurieren ENDE                                  */
/* ************************************************************************ */
/* ************************************************************************ */
/* NICHT EDITIEREN */
/* ************************************************************************ */
/* ************************************************************************ */
var konstanten = [
    {'name':'telegram','value':1},
    {"name":'pushover',"value":2, count:0, delay:400},
    {"name":'email',"value":4},
    {"name":'sayit',"value":8, count:0, delay:0},
    {"name":'home24',"value":16, count:0, delay:0},
    {"name":'alexa',"value":32, count:0, delay:0},
    {"name":'state',"value":64},
    {"name":'iogo',"value":128}
];
const TELEGRAM = konstanten[0].value;
const PUSHOVER = konstanten[1].value;
const EMAIL = konstanten[2].value;
const SAYIT = konstanten[3].value;
const HOMETWO = konstanten[4].value;
const ALEXA = konstanten[5].value;
const STATE = konstanten[6].value;
const IOGO = konstanten[7].value;
var uPushdienst = 0;
const DWD = 1;
const UWZ = 2;
const NINA = 4;
const MODES = [{mode:DWD, text:'DWD'},{mode:UWZ, text:'UWZ'},{mode:NINA, text:'NINA'}];
if(mainStatePath[mainStatePath.length - 1] != '.') mainStatePath += '.';
const aliveState = mainStatePath+'alive';
if (extendedExists(aliveState)) {
    setState(aliveState, true, true);
}

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */
/*                       Konfiguration ab hier                               */
/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

/* Konfiguration der zu nutzenden Ausgabe um //uPushdienst+= PUSHOVER; zu aktivieren, bitte die // enfernen, also uPushdienst+= PUSHOVER; */
//uPushdienst+= TELEGRAM;          // Auskommentieren zum aktivieren
//uPushdienst+= PUSHOVER;          // Auskommentieren zum aktivieren
//uPushdienst+= EMAIL;             // Auskommentieren zum aktivieren. Einstellungen nicht vergessen
//uPushdienst+= SAYIT;             // Auskommentieren zum aktivieren. Einstellungen nicht vergessen
//uPushdienst+= HOMETWO;           // Auskommentieren zum aktivieren. Einstellungen nicht vergessen
//uPushdienst+= ALEXA;             // Auskommentieren zum aktivieren. Einstellungen nicht vergessen
//uPushdienst+= STATE;             // Auskommentieren zum aktivieren. State befindet sich unter mainStatePath.message
//uPushdienst+= IOGO;              // Auskommentieren zum aktivieren. Einstellungen nicht vergessen

/* ************************************************************************* */
/*                 Beispiele zur weiteren Konfiguration                      */
/* ************************************************************************* */
/*
/* kein oder einen Eintrag möglich:
/* var senderEmailID = ["max@mustermann.de"];
/*
/* kein oder mehrfach nach gleichem Muster [1, 2, 3] bzw. ['1', '2', '3'] Einträge
/* '' ist das selbe wie "", jedoch nicht mischen.
/*
/* var empfaengerEmailID = ["max@musterman.de","max2@musterman.de"];
/* var telegramUser = []; // leer
/* var telegramUser = ['']; // leer
/* var telegramUser = ['Hans']; // User mit Namen Hans
/* var telegramUser = ['Hans', 'Gretel']; // User mit Namen Hans und User mit Namen Gretel
/* var idSayIt = ["sayit.0.tts.text"];
/* var sayItVolumen = [60]; // Zahl ohne ''
/* var idSayIt = ["sayit.0.tts.text","sayit.1.tts.text"];
/* var sayItVolumen = [60, 30]; // mehrfach Zahl ohne ''
/* var ioGoUser = ['max@musterman.de'];
/* var idAlexaSerial =['G090RV32984110Y', 'G090RZ3345643XR'];
/* var alexaVolumen = [40, 30]; // Lautstärke die gleiche Anzahl an Einträgen wie bei idAlexaSerial
/*
/* ************************************************************************* */
/*                          weitere Konfiguration                            */
/* ************************************************************************* */

/* für UWZ Regionnamen eingeben "Warnung der Unwetterzentrale für XXXX" */
/* Textbeispiel anstatt Entenhausen: 'Stadt / Dorfname' 'Berlin' 'den Regionsbezeichnung' 'den Schwarzwald' ''*/
/* var regionName = ['UWZDE13245', 'Entenhausen'] */
var regionName          = [['','']];

// für Nina wird die Gemeinde und der Landkreis benötigt. Am besten von hier kopieren: https://warnung.bund.de/assets/json/suche_channel.json
// ohne die kryptischen Zeichen.
var uGemeinde = '';
var uLandkreis = '';

/* Einstellungen zur Emailbenachrichtigung*/
var senderEmailID       = [""]; // mit Sender Emailadresse füllen. email Adapter muß installiert sein. 1 Eintrag erlaubt [] oder ["email1"]
var empfaengerEmailID   = [""]; // mit Empfänger Emailadresse füllen. Mehrere Empfänger möglich. [] oder ["email1"] oder ["email1","email2"]

/* Konfiguration Sprachausgabe über Home24 - Mediaplayer */
//var idMediaplayer = ["192.168.178.x:Port"];
var idMediaplayer       = [""]; // Eingabe IP-Adresse incl. Port für Home24-Mediaplayer mehrere Möglich - ungetestet

/* Konfiguration Telegram */
var telegramUser        = ['']; // Einzelnutzer ['Hans']; Multinutzer ['Hans', 'Gretel']; Nutzer vom Adapter übernehmen [];
var telegramChatId      = [''];

/* Konfiguration Pushover */
var uPushoverDeviceName     = ''; // ein bestimmtes Gerät z.B: ['droid4'];
var uPushoverSound          = ''; // Sounds siehe: https://pushover.net/api#sounds

//Konfiguration von ioGo
var ioGoUser = ['']; // // Einzelnutzer ['Hans']; Multinutzer ['Hans', 'Gretel']; Nutzer vom Adapter übernehmen [];

/* Konfiguration Sprachausgabe über SayIt */
var idSayIt             = ["sayit.0.tts.text"]; // mehrfach Einträge möglich
var sayItVolumen        = [30]; // gleiche Anzahl wie idSayIt

/* Konfiguration Sprachausgabe über Alexa
/* mehrere Einträge möglich, bei mir ging nur der Echo, 2 dots 2.Gen reagieren nicht auf announcement. */
var idAlexaSerial       = ['']; // die reine Seriennummer des Echos z.B.: var idAlexaSerial =['G090RV32984110Y', 'G090RV32984110Y']
var alexaVolumen        = [30]; // Lautstärke die gleiche Anzahl an Einträgen wie bei idAlexaSerial

// Filtereinstellungen
const minlevel                      =    1 // Warnungen unterhalb dieses Levels nicht senden;
const attentionWarningLevel         =    4 // Warnung gleich oder oberhalb dieses Levels mit zusätzlichen Hinweisen versehen
const minhoehe                      =    0 // Warnung für eine Höhe unterhalb dieses Wertes nicht senden
const maxhoehe                      =    5000 // Warnung für eine Höhe oberhalb dieses Wertes nicht senden

//Filtere Meldungen selben Typs & Datenquelle, die von einer längeren Meldung mit gleichem oder höherem Level überdeckt werden.
// gilt nicht für Warnung mit gleichem oder höherem Level als attentionWarningLevel. Ab 4 wirds beim DWD gefährlich
const uFilterDuplicate = true; // weshalb? hatte 2 Meldungen alles gleich nur die Uhrzeit ->  von 0:00 - 14:00 und von 6:00 - 14:00
//Formatierungsstring für Datum / Zeit Alternative "TT.MM.YYYY SS:mm" KEINE Anpassung nötig
const formatierungString =  "TT.MM.YY SS:mm";

// Sprachausgabe Zeiten
// Für durchgehende Sprachausgabe die Einstellung der Zeiten auf '' setzen. z.B. var startTimeSpeak = '';
var startTimeSpeak =        '6:45';// Zeiten mo - fr ab der Sprachausgaben ok sind. Nicht unter 6 Uhr gehen oder den Schedule ändern
var startTimeSpeakWeekend = '9:00';// sa + so Bemerkung siehe oben
var endTimeSpeak =          '22:30'; // ab diesem Zeitpunkt gibt es keine Sprachausgabe

// Ein manuellen Auslösen von Sprachnachrichten, löscht alle noch nicht ausgegebenen Sprachnachrichten aus der Liste.
var uManuellClickClearSpeakMessageList = true;

// Automatikmodus schalten geht über mainStatePath.config.auto.on
//var autoSendWarnings = true;
//Auslösen der Pushnachricht über States ignoriert Sprachausgabezeiten
var forcedSpeak             = true;
// keine Ansage über m/s Knoten und Windstärke. Die Angabe mit Kilometer pro Stunde wird angesagt
var windForceDetailsSpeak   = false;

/* ************************************************************************* */
/*                       Nur Anpassen wenn nötig                             */
/* ************************************************************************* */
// Die Geschwindigkeit gibt an wie lange das Skript wartet bevor es eine neue Nachricht an die Sprachausgabe sendet.
konstanten[3].delay /*SayIt*/       = 86; // Vorlese Geschwindigkeit pro Zeichen in ms
konstanten[4].delay /*Home24*/      = 90; // Vorlese Geschwindigkeit pro Zeichen in ms
konstanten[5].delay /*Alexa*/       = 86; // Vorlese Geschwindigkeit pro Zeichen in ms

// Automodus Filter um Warnungen unterhalb attentionWarningLevel von DWD, UWZ oder NINA zu unterdrücken
// Sprachausgabe bei auto und manuell unterdrückt.
// Diese Warnungen sind vorhanden, sie werden nur in den benannten Fällen ausgeblendet.
// Ist eine feste Vorgabe überschreibt alles andere
var uFilterList               = 0;   // generelles Filter für den AutoModus ( = DWD + UWZ; oder = NINA; oder = 0;), außer Warnungslevel ist gleich/über attentionWarningLevel
var uAutoNinaFilterList       = ['CAP@hochwasserzentralen.de']; //Nina only. Filter diesen Sender raus s.o. - mehrere ['abc','cde'];

var uwzPath=            'javascript.0.UWZ';
var dwdPath=            'dwd.0';
var ninaPath=           'nina.0'

var telegramInstanz=    'telegram.0';
var pushoverInstanz=    'pushover.0';
var ioGoInstanz=        'iogo.0';
var alexaInstanz=       'alexa2.0';
var emailInstanz=       'email.0';

var uLogAusgabe=        true; // auf false gibt es überhaupt keine Ausgabe beim normalen Betrieb.

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */
/*                       Konfiguration Ende                                  */
/* ************************************************************************* */
/*        Keine Anpassungen ab hier, außer du weißt was du tuest             */
/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */

//Logausgabe
var DEBUG = false;
var DEBUGSENDEMAIL = false;
//ab hier bei Update
// 123456

// MODE einstellen über Datenpunkte, das hier hat keine auswirkungen
// nur für ersten Lauf nötig, ab dann überschreiben States diesen Wert
var MODE = 0; // DWD oder UWZ wird von gültigen Einstellungen im Datenpfad überschrieben


// Wandel Usereingabe in sauberes True / False um
forcedSpeak = !!forcedSpeak;
windForceDetailsSpeak = !!windForceDetailsSpeak;

// Variable nicht konfigurierbar
const SPEAK = ALEXA + HOMETWO + SAYIT;
const PUSH = TELEGRAM + PUSHOVER + IOGO + STATE;
const ALLMSG = EMAIL;
const ALLMODES = DWD | UWZ | NINA;
const CANHTML = EMAIL;
const CANPLAIN = PUSH + EMAIL;
const placeHolder = 'XXXXPLACEHOLDERXXXX';
const configModeState = mainStatePath + 'config.mode';
const mirrorMessageState = mainStatePath + 'message';
const SPACE = ' ';
const NEWLINE = '\n';
var idAlexa = alexaInstanz + '.Echo-Devices.' + placeHolder + '.Commands.announcement';
var idAlexaVolumen = alexaInstanz + '.Echo-Devices.' + placeHolder + '.Commands.speak-volume';
var autoSendWarnings = true;
var forceSpeak = false;
var timer = null;
var onClickCheckRun = false;
var warnDatabase = { new: [], old: [] };
var subDWDhandler = null;
var subUWZhandler = null;
var subNINAhandler = null;
var timeoutFromCreateState = null;
var dwdpushdienst = uPushdienst,
    ninapushdienst = uPushdienst,
    uwzpushdienst = uPushdienst;
let dwdManpushdienst = uPushdienst,
    ninaManpushdienst = uPushdienst,
    uwzManpushdienst = uPushdienst;
var firstRun = true;;
var _speakToArray = [{ speakEndtime: new Date() }]; // muß immer 1 Element enthalten
var _speakToInterval = null
// Warning types
var warningTypesString = [];
warningTypesString[DWD] = [
    ['Gewitter','⚡'],
    ['Sturm', '🌪'],
    ['Regen', '🌧'],
    ['Schnee', '🌨'],
    ['Nebel', '🌁'],
    ['Frost', '🌡'],
    ['Glatteis', '❄'],
    ['Tauwetter', '⛄'],
    ['Hitzewarnungen', '🔥'],
    ['UV_Warnungen', '🔆']/*,
    ['Kuestenwarnungen', ''],
    ['Binnenseewarnungen', '']*/
];

warningTypesString[UWZ] = [
    ['n_a', ''],
    ['unbekannt', ''],
    ['Sturm-Orkan', '🌪'],
    ['Schneefall', '🌨'],
    ['Starkregen', '🌧'],
    ['Extremfrost', '🌡'],
    ['Waldbrandgefahr', '🔥'],
    ['Gewitter', '⚡'],
    ['Glätte', '❄'],
    ['Hitze', '🔆'],
    ['Glatteisregen', '❄'],
    ['Bodenfrost', '🌡']
];

// State über den man gesonderte Aktionen auslösen kann, gibt die höchste Warnstufe aus.
const stateAlert = // Änderungen auch in setAlertState() anpassen
[
        { "name": 'level', "default": -1, "type": { read: true, write: false, type: "number", name: '' } },
        { "name": 'type', "default": -1, "type": { read: true, write: false, type: "number", name: '' } },
        { "name": 'begin', "default": 0, "type": { read: true, write: false, role: "value.time", type: "number", name: '' } },
        { "name": 'end', "default": 0, "type": { read: true, write: false, role: "value.time", type: "number", name: '' } },
        { "name": 'headline', "default": '', "type": { read: true, write: false, type: "string", name: '' } },
        { "name": 'description', "default": '', "type": { read: true, write: false, type: "string", name: '' } },
        { "name": 'color', "default": '', "type": { read: true, write: false, type: "string", name: '' } },
        { "name": 'symbol', "default": '', "type": { read: true, write: false, type: "string", name: '' } },
        { "name": 'hash', "default": 0, "type": { read: true, write: false, role: "value", type: "number", name: '' } }
  ]
// hash erzeugen
String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

var deviceList = 		{};

for (let a=0;a<konstanten.length; a++) {
    deviceList[konstanten[a].value] = {};
    if ( konstanten[a].count !== undefined ) deviceList[konstanten[a].value].count = konstanten[a].count;
    if ( konstanten[a].delay !== undefined ) deviceList[konstanten[a].value].delay = konstanten[a].delay;
}
/* *************************************************************************
* Überprüfe Nutzerkonfiguration
/* ************************************************************************* */
{
    testValueTypeLog(uPushdienst & (SPEAK + PUSH + ALLMSG), 'uPushdienst', 'number', true);
    testValueTypeLog(uwzPath, 'uwzPath', 'string', true);
    testValueTypeLog(dwdPath, 'dwdPath', 'string', true);
    testValueTypeLog(ninaPath, 'ninaPath', 'string', true);
    testValueTypeLog(telegramInstanz, 'telegramInstanz', 'string', true);
    testValueTypeLog(pushoverInstanz, 'pushoverInstanz', 'string', true);
    testValueTypeLog(ioGoInstanz, 'ioGoInstanz', 'string', true);
    testValueTypeLog(alexaInstanz, 'alexaInstanz', 'string', true);
    testValueTypeLog(emailInstanz, 'emailInstanz', 'string', true);
    testValueTypeLog(uGemeinde, 'uGemeinde', 'string');
    testValueTypeLog(uLandkreis, 'uLandkreis', 'string');
    if (!Array.isArray(regionName[0])) {
        regionName = [regionName];
    }
    let b = 0;
    for (var a = 0; a < regionName.length; a++) {
        b++;
        if (Array.isArray(regionName) && regionName[a].length != 0) {
            if (regionName[a].length != 2) {
                if (uLogAusgabe) log('Konfiguration enthält Fehler. var regionName - Eintrag: ' + (b) + ' hat keine 2 Werte [\'UWZxxxxxxx\',\'name\']', 'error');
                stopScript(scriptName);
            } else {
                if (!regionName[a][0] && !regionName[a][1]) regionName.splice(a--, 1)
                else {
                    testValueTypeLog(regionName[a][0], 'regionName Wert: ' + (b) + '.01', 'string', true);
                    testValueTypeLog(regionName[a][1], 'regionName Wert: ' + (b) + '.02', 'string');
                }
            }
        } else {
            regionName.splice(a--, 1)
        }
    }

    function checkConfigArray(arr, name, type) {
        for (let a = 0; a < arr.length; a++) {
            if (!arr[a]) arr.splice(a--, 1);
            else {
                testValueTypeLog(arr[a], 'name', type);
            }
        }
    }

    checkConfigArray(uAutoNinaFilterList, 'uAutoNinaFilterList', 'string');
    checkConfigArray(senderEmailID, 'senderEmailID', 'string');
    checkConfigArray(empfaengerEmailID, 'empfaengerEmailID', 'string');
    checkConfigArray(idAlexaSerial, 'idAlexaSerial', 'string');
    checkConfigArray(idMediaplayer, 'idMediaplayer', 'string');
    checkConfigArray(telegramUser, 'telegramUser', 'string');
    checkConfigArray(idSayIt, 'idSayIt', 'string');
    checkConfigArray(ioGoUser, 'ioGoUser', 'string');
    checkConfigArray(telegramChatId, 'telegramChatId', 'string');

    for (let a = 0; a < sayItVolumen.length; a++) {
        if (sayItVolumen[a] === undefined) sayItVolumen[a] = 0;
        else testValueTypeLog(sayItVolumen[a], 'sayItVolumen', 'number');
    }
    for (let a = 0; a < alexaVolumen.length; a++) {
        if (alexaVolumen[a] === undefined) alexaVolumen[a] = 0;
        else testValueTypeLog(alexaVolumen[a], 'alexaVolumen', 'number');
    }
    if ((uPushdienst & ALEXA) != 0) {
        testValueTypeLog(idAlexaSerial, 'idAlexaSerial', 'array');
        if (idAlexaSerial.length == 0) {
            log('Keine Alexa / Echoseriennummer eingetragen. Überpüfen!', 'error');
            stopScript(scriptName);
        }
        for (let a = 0; a < idAlexaSerial.length; a++) {
            if (!extendedExists(replacePlaceholder(idAlexa, idAlexaSerial[a]))) {
                log('Alexa - Serial ' + idAlexaSerial[a] + ' ist fehlerhaft. Überpüfen! Object ID:' + replacePlaceholder(idAlexa, idAlexaSerial[a]), 'error');
                stopScript(scriptName);
            }
        }
    }


    if ((uPushdienst & SAYIT) != 0) {
        testValueTypeLog(idSayIt, 'idSayIt', 'array');
        for (let a = 0; a < idSayIt.length; a++) {
            if (
                !extendedExists(idSayIt[a])
            ) {
                if (uLogAusgabe) log('SayIt - Konfiguration ist fehlerhaft. Überpüfen!', 'error');
                stopScript(scriptName);
            }
        }
    }
    if ((uPushdienst & EMAIL) != 0) {
        if (senderEmailID.length > 1) {
            log('eMail - Konfiguration ist fehlerhaft. Nur 1 Eintrag in senderEmailID erlaubt!', 'error');
            stopScript(scriptName);
        }
    }
}
/***************************************************************************************
* function testValueTypeLog(test, teststring, typ, need = false)
* @param {any} test           Variable deren Typ / Inhalt getestet werden soll
* @param {string} teststring  Variable als String, wie er im Script steht
* @param {string} typ         Soll - Type der Variable alles + 'array'
* @param {boolean} need       Variable darf nicht null / leer sein
/***************************************************************************************/
function testValueTypeLog(test, teststring, typ, need = false) {
    if (test === undefined) {
        let errorLog = 'Konfiguration enthält Fehler. Der / Ein Wert von var ' + teststring + ' ist undefiniert oder fehlt!';
        log(errorLog, 'error');
        stopScript(scriptName);
    }
    if (typ == 'array') {
        if (!test || !Array.isArray(test)) {
            let errorLog = 'Konfiguration enthält Fehler. Der / Ein Wert von var ' + teststring + ' ist kein Array. Es fehlen wohl die umschließenden []!';
            log(errorLog, 'error');
            stopScript(scriptName);
        }
    } else if (typeof test !== typ) {
        let errorLog = 'Konfiguration enthält Fehler. Ändere ' + teststring + ' = [';
        if (typ == 'string') {
            errorLog += test + '];//(' + typeof test + ') in ' + teststring + ' = [\'' + test + '\'];//(' + typ + ')';
        } else {
            errorLog += '\'' + test + '\'];//(' + typeof test + ') in ' + teststring + ' = [' + test + '];//(' + typ + ')';
        }
        log(errorLog, 'error');
        stopScript(scriptName);
    }
    if (need && !test) {
        log('Konfiguration enthält Fehler. Der Wert von var ' + teststring + ' wird benötigt, ist jedoch nicht konfiguriert!', 'error');
        stopScript(scriptName);
    }
}
/* *************************************************************************
* Überprüfe Nutzerkonfiguration ENDE
/* *************************************************************************
* Erstellung von Datenpunkten
* Trigger aktivieren und Datenpflege für eigene Datenpunkte
/* ************************************************************************* */

function changeMode(modeFromState) {
    if (MODE != modeFromState || firstRun) {
        let oldMode = MODE;
        MODE = modeFromState;
        myLog('MODE wurde geändert. MODE: '+MODE + ' firstRun:'+firstRun);
        InitDatabase(firstRun);
        dataSubscribe();
        if (!firstRun) { // überspringe das beim Starten des Scripts
            for (var a = 0;a < konstanten.length;a++) {
                for (let x = 0;x < MODES.length;x++) {
                    let oid = mainStatePath+'config.auto.'+MODES[x].text.toLowerCase()+'.'+konstanten[a].name;
                    let update = !!((switchFlags(MODE, oldMode, false)&MODES[x].mode));
                    if (extendedExists(oid)) {
                        setState(oid, update || !!(getAutoPushFlags(MODE&MODES[x].mode)&konstanten[a].value));
                    }
                    oid = mainStatePath+'config.manuell.'+MODES[x].text.toLowerCase()+'.'+konstanten[a].name;
                    if (extendedExists(oid)) {
                        setState(oid, update || !!(getManuellPushFlags(MODE&MODES[x].mode)&konstanten[a].value));
                    }
                }
            }
        }
        if (autoSendWarnings && !firstRun) checkWarningsMain();
        firstRun = false;
    }
    setConfigModeStates(modeFromState);
}
{

    // State der Pushnachrichten über pushover / telegram spiegelt
    if (!extendedExists(mirrorMessageState)) {
        createCustomState(mirrorMessageState, '', {read: true, write: false, desc: "Beschreibung", type: "string",});
    }

    // MODE änderung über Datenpunkte string
    if (!extendedExists(aliveState)) {
        createCustomState(aliveState, false, {read: true, write: false, desc: "Script läuft", type: "boolean", def: false });
    }

    if (!extendedExists(configModeState)) {
        createCustomState(configModeState, 'DWD', {read: true, write: true, desc: "Modusauswahl DWD oder UWZ",type: "string",def: ''});
    } else {
        on({id:configModeState, change:'ne', ack:false}, function(obj){
            if (obj.state.val && typeof obj.state.val === 'string'
            && (obj.state.val.toUpperCase().includes('DWD') || obj.state.val.toUpperCase().includes('UWZ')|| obj.state.val.toUpperCase().includes('NINA'))) {
                //setState(configModeState, MODE, true)
                let mode = 0;
                mode |= obj.state.val.toUpperCase().includes('DWD') ? DWD   : 0;
                mode |= obj.state.val.toUpperCase().includes('UWZ') ? UWZ   : 0;
                mode |= obj.state.val.toUpperCase().includes('NINA')? NINA  : 0;
                if ( MODE != mode ) {
                    myLog('Modus wird geändert von: '+mode+ ' String:' +obj.state.val);
                    changeMode(mode);
                } else {
                    changeMode(MODE);
                }
            } else {
                changeMode(MODE);
            }
        });
    }

    // MODE änderung über Datenpunkte Boolean
    for (let a = 0;a < MODES.length;a++) {
        let tok = MODES[a].text.toLowerCase();
        let id = mainStatePath+'config.'+tok;
        if (!extendedExists(id)) {
            let mi = !!(MODE&MODES[a].mode);
            createCustomState(id, mi, {read: true, write: true, desc: "Aktivere "+tok.toUpperCase()+'.', type: "boolean",def: mi});
        } else {
            on({id:id, change:'ne', ack:false}, function(obj){
                let arr = obj.id.split('.');
                let tok = arr[arr.length - 1].toUpperCase();
                let mode = MODES[MODES.findIndex(function(j){return j.text == tok})].mode;
                let oldMode = MODE;
                oldMode = switchFlags(oldMode, mode, obj.state.val);
                myLog('Modus wird geändert von: '+MODE);
                changeMode(oldMode);
            });
            MODE = switchFlags(MODE, MODES[a].mode, getState(id).val);
        }
    }
    //Initialisierung falls oben nicht geschehen
    if (firstRun) changeMode(MODE);
    // Automodus ein und ausschalten
    let id = mainStatePath+'config.auto.on';
    if (!extendedExists(id)) {
        createCustomState(id, true, {read: true, write: true, desc: "Aktivere automatischen Push bei eintreffen der Warnungen.",type: "boolean",def: true});
    } else {
        autoSendWarnings = getState(id).val;
        setState(id, autoSendWarnings, true);
    }
}

// setzte alle MODE Datenpunkte
function setConfigModeStates(mode) {
    if (extendedExists(configModeState)) setState(configModeState, (mode&DWD?'DWD':'') + (mode&UWZ?'UWZ':'') + (mode&NINA?'NINA':''), true);
    for (let a = 0;a < MODES.length;a++) {
        let t = MODES[a].text.toLowerCase();
        let id = mainStatePath+'config.'+t;
        if (extendedExists(id)) setState(id,!!(mode&MODES[a].mode), true);
    }
}


{
    let allStateExist = true;
    let mode = [MODES[0],MODES[1]];
    for (let c = 0;c < mode.length;c++) {
        let stateAlertId = mainStatePath+'alert.'+mode[c].text.toLowerCase()+'.';
        for (let b = 0;b < warningTypesString[mode[c].mode].length;b++) {
            for (let a = 0;a < stateAlert.length;a++)
            {
                let stateAlertIdFull = stateAlertId + warningTypesString[mode[c].mode][b][0]+'.'+stateAlert[a].name;
                stateAlert[a].type.name = stateAlert[a].name;
                if (!extendedExists(stateAlertIdFull)) {
                    createCustomState(stateAlertIdFull, stateAlert[a].default, stateAlert[a].type);
                    allStateExist = false;
                }
            }
        }
    }
}

// Nachrichtenversand per Click States/ config. und auto . erzeugen und subscript
for (var a = 0; a < konstanten.length; a++) {
    if ((uPushdienst & konstanten[a].value) != 0) {
        if (!extendedExists(mainStatePath + 'commands.' + konstanten[a].name)) {
            createCustomState(mainStatePath + 'commands.' + konstanten[a].name, false, { read: true, write: true, desc: "Beschreibung", type: "boolean", role: "button", def: false });
        }
        for (let x = 0; x < MODES.length; x++) {
            let oid = mainStatePath + 'config.auto.' + MODES[x].text.toLowerCase() + '.' + konstanten[a].name;
            if (!extendedExists(oid)) {
                createCustomState(oid, ((uPushdienst & konstanten[a].value) != 0), { read: true, write: true, desc: "Schalte Autopushmöglichkeiten ein / aus", type: "boolean", def: ((uPushdienst & konstanten[a].value) != 0) });
            } else {
                setConfigKonstanten(oid, getState(oid).val, true);
            }
            oid = mainStatePath + 'config.manuell.' + MODES[x].text.toLowerCase() + '.' + konstanten[a].name;
            if (!extendedExists(oid)) {
                createCustomState(oid, ((uPushdienst & konstanten[a].value) != 0), { read: true, write: true, desc: "Schalte Manuellepushmöglichkeiten ein / aus", type: "boolean", def: ((uPushdienst & konstanten[a].value) != 0) });
            } else {
                setConfigKonstanten(oid, getState(oid).val, false);
            }
        }
    }
}
// on() für alles unter config.auto
subscribe({ id: new RegExp(getRegEx(mainStatePath + 'config.auto', '^') + '.*'), change: 'ne', ack: false }, function(obj) {
    if (obj.id == mainStatePath + 'config.auto.on') {
        myLog('Auto trigger: ' + obj.id + ' Value:' + obj.state.val);
        autoSendWarnings = !!obj.state.val;
        setState(obj.id, autoSendWarnings, true);
        for (var a = 0; a < konstanten.length; a++) {
            for (let x = 0; x < MODES.length; x++) {
                let oid = mainStatePath + 'config.auto.' + MODES[x].text.toLowerCase() + '.' + konstanten[a].name;
                if (extendedExists(oid)) {
                    setState(oid, obj.state.val);
                }
            }
        }
    } else {
        myLog('else auto trigger: ' + obj.id + ' Value:' + obj.state.val);
        setConfigKonstanten(obj.id, obj.state.val, true);
    }
});
// on() für alles unter config.manuell
subscribe({ id: new RegExp(getRegEx(mainStatePath + 'config.manuell', '^') + '.*'), change: 'ne', ack: false }, function(obj) {
    myLog('Manuell trigger: ' + obj.id + ' Value:' + obj.state.val);
    setConfigKonstanten(obj.id, obj.state.val, false);
});
subscribe({ id: new RegExp(getRegEx(mainStatePath + 'commands', '^') + '.*') }, function(obj) {
    if (!obj.state.val) return;
    setState(obj.id, false, true);
    let b = obj.id.split('.');
    let d = konstanten.findIndex(function(c) { return (c.name === b[b.length - 1]); })
    if (d == -1) return;
    warnDatabase.old = [];
    let oPd = uPushdienst;
    uPushdienst &= konstanten[d].value;
    forceSpeak = forcedSpeak;
    onClickCheckRun = true;
    if ((uPushdienst & SPEAK) != 0 && uManuellClickClearSpeakMessageList) _speakToArray = [{ speakEndtime: new Date() }];

    checkWarningsMain();
    onClickCheckRun = false;
    forceSpeak = false;
    uPushdienst = oPd;
});

// Hilfsfunktion zu on()
function setConfigKonstanten(id, val, auto) {
    let b = id.split('.');
    let m = b[b.length - 2];
    let d = konstanten.findIndex(function(c) { return (c.name === b[b.length - 1]); });
    if (d == -1) return;
    let value = konstanten[d].value
    let tp = 0;
    switch (m) {
        case 'dwd': {
            val = val && !!(MODE & DWD);
            if (auto) dwdpushdienst = switchFlags(dwdpushdienst, value, val);
            else dwdManpushdienst = switchFlags(dwdManpushdienst, value, val);
            break;
        }
        case 'uwz': {
            val = val && !!(MODE & UWZ);
            if (auto) uwzpushdienst = switchFlags(uwzpushdienst, value, val);
            else uwzManpushdienst = switchFlags(uwzManpushdienst, value, val);
            break;
        }
        case 'nina': {
            val = val && !!(MODE & NINA);
            if (auto) ninapushdienst = switchFlags(ninapushdienst, value, val);
            else ninaManpushdienst = switchFlags(ninaManpushdienst, value, val);
            break;
        }
        default: {
            log('unbekannter Mode:' + m + 'in setConfigKonstanten', 'error');
        }
    }
    setState(id, val, true);
}

// setzte die Alert States auf die höchste aktuelle Warnstufe
function setAlertState() {
    let mode = [MODES[0], MODES[1]];
    for (let a = 0; a < 2; a++) {
        if (!(MODE & mode[a].mode)) continue;
        let stateAlertid = mainStatePath + 'alert.' + mode[a].text.toLowerCase() + '.';
        for (let b = 0; b < warningTypesString[mode[a].mode].length; b++) {
            let stateAlertIdFull = stateAlertid + warningTypesString[mode[a].mode][b][0] + '.';
            let AlertLevel = -1;
            let AlertIndex = -1;
            for (let c = 0; c < warnDatabase.new.length; c++) {
                if (warnDatabase.new[c].type == b && warnDatabase.new[c].level > AlertLevel) {
                    AlertLevel = warnDatabase.new[c].level;
                    AlertIndex = c;
                }
            }
            if (extendedExists(stateAlertIdFull + stateAlert[0].name)) {
                if (getState(stateAlertIdFull + stateAlert[0].name).val != AlertLevel
                || ( AlertIndex > -1 && getState(stateAlertIdFull + stateAlert[8].name).val != warnDatabase.new[AlertIndex].hash)) {
                    setState(stateAlertIdFull + stateAlert[0].name, AlertLevel);
                    setState(stateAlertIdFull + stateAlert[1].name, b);
                    setState(stateAlertIdFull + stateAlert[2].name, (AlertIndex > -1 ? new Date(warnDatabase.new[AlertIndex].start).getTime() : 0));
                    setState(stateAlertIdFull + stateAlert[3].name, (AlertIndex > -1 ? new Date(warnDatabase.new[AlertIndex].end).getTime() : 0));
                    setState(stateAlertIdFull + stateAlert[4].name, (AlertIndex > -1 ? warnDatabase.new[AlertIndex].headline : ''));
                    setState(stateAlertIdFull + stateAlert[5].name, (AlertIndex > -1 ? warnDatabase.new[AlertIndex].description : ''));
                    setState(stateAlertIdFull + stateAlert[6].name, (AlertIndex > -1 ? warnDatabase.new[AlertIndex].color : ''));
                    setState(stateAlertIdFull + stateAlert[7].name, (AlertIndex > -1 ? warnDatabase.new[AlertIndex].symbol : ''));
                    setState(stateAlertIdFull + stateAlert[8].name, (AlertIndex > -1 ? warnDatabase.new[AlertIndex].hash : 0));
                }
            }
        }
    }
}
/* *************************************************************************
* Erstellung von Datenpunkten ENDE
* Trigger aktivieren und Datenpflege für eigene Datenpunkte ENDE
/* ************************************************************************* */
/* *************************************************************************
* Hilfsfunktion für Flags Bearbeitung Pushdienste & MODE
/* ************************************************************************* */

function getPushModeFlag(mode, noflags) {
    if (noflags === undefined || !noflags) {
        if (onClickCheckRun) return getManuellPushFlags(mode);
        else return getAutoPushFlags(mode);
    } else {
        if (onClickCheckRun) return getManuellPushMode(mode);
        else return getAutoPushMode(mode);
    }
}

function getAutoPushMode(mode) {
    if (onClickCheckRun) return getManuellPushMode(mode);
    if (mode !== undefined) {
        if (mode & DWD) mode = switchFlags(mode, DWD, !!(uPushdienst & dwdpushdienst));
        if (mode & UWZ) mode = switchFlags(mode, UWZ, !!(uPushdienst & uwzpushdienst));
        if (mode & NINA) mode = switchFlags(mode, NINA, !!(uPushdienst & ninapushdienst));
        return mode;
    }
    myLog('getAutoPushFlags() mode unbekannt!', 'info');
    return 0;
}

function getManuellPushMode(mode) {
    if (!onClickCheckRun) return getAutoPushMode(mode);
    if (mode !== undefined) {
        if (mode & DWD) mode = switchFlags(mode, DWD, !!(uPushdienst & dwdManpushdienst));
        if (mode & UWZ) mode = switchFlags(mode, UWZ, !!(uPushdienst & uwzManpushdienst));
        if (mode & NINA) mode = switchFlags(mode, NINA, !!(uPushdienst & ninaManpushdienst));
        return mode;
    }
    myLog('getAutoPushFlags() mode unbekannt!', 'error');
    return 0;
}

function getAutoPushFlags(mode) {
    if (mode !== undefined) {
        let m = 0;
        if (mode & DWD) m |= (uPushdienst & dwdpushdienst);
        if (mode & UWZ) m |= (uPushdienst & uwzpushdienst);
        if (mode & NINA) m |= (uPushdienst & ninapushdienst);
        return m;
    }
    myLog('getAutoPushFlags() mode unbekannt!', 'error');
    return 0;
}

function getManuellPushFlags(mode) {
    if (mode !== undefined) {
        let m = 0;
        if (mode & DWD) m |= (uPushdienst & dwdManpushdienst);
        if (mode & UWZ) m |= (uPushdienst & uwzManpushdienst);
        if (mode & NINA) m |= (uPushdienst & ninaManpushdienst);
        return m;
    }
    myLog('getManuellPushFlags() mode unbekannt!', 'error');
    return 0;
}

function switchFlags(g, f, b) {
    if (b) g |= f;
    else g &= ~f;
    return g;
}

function getModeState() {
    if (extendedExists(configModeState)) {
        let value = getState(configModeState).val;
        let mode = 0;
        mode |= value.toUpperCase().includes('DWD') ? DWD : 0;
        mode |= value.toUpperCase().includes('UWZ') ? UWZ : 0;
        mode |= value.toUpperCase().includes('NINA') ? NINA : 0;
        return mode;
    }
    return null;
}
/* *************************************************************************
* Hilfsfunktion für Flags bearbeitung Pushdienste ENDE
/* *************************************************************************
* Zeitschaltuhr
/* ************************************************************************* */

// Zeitsteuerung für SayIt & Alexa
var START = new Date();
var ENDE = new Date();
setWeekend();

function setWeekend() {
    if (forceSpeak) return;
    let date = new Date();
    let n = date.getDay();
    let weekend = 0;
    weekend = (n === 0 || n == 6) ? 1 : 0;
    if (weekend == 1) { // wenn Wochenende, dann setze Start auf 9h, sonst 6:45h
        START = convertStringToDate(startTimeSpeakWeekend);
    } else {
        START = convertStringToDate(startTimeSpeak);
    }
    ENDE = convertStringToDate(endTimeSpeak);
}
// Hilsfunktion
function convertStringToDate(s) {
    if (typeof s !== 'string' ) return null;
    var e = s.split(':');
    if (!Array.isArray(e) || e.length != 2) return null;
    var d = new Date();
    d.setHours(Number(e[0]), Number(e[1]), 0);
    return d;
}
/* *************************************************************************
* Zeitschaltuhr ENDE
/* ************************************************************************* */
/* *************************************************************************
* Hauptfunktion zur Auswahl der Warnungen zum Versenden und Aufbereiten der
* Nachrichten
/* ************************************************************************* */

// Hauptfunktion entscheiden was wohin gesendet wird
function checkWarningsMain() {
    if (!forcedSpeak) forceSpeak = (!startTimeSpeakWeekend || !startTimeSpeak || !endTimeSpeak);
    setWeekend();
    let DebugMail = '';
    if (DEBUGSENDEMAIL) {
        for (a = 0; a < warnDatabase.new.length; a++) DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.new' + a, JSON.stringify(warnDatabase.new[a]));
        for (a = 0; a < warnDatabase.old.length; a++) DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.old' + a, JSON.stringify(warnDatabase.old[a]));
        DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.new.length', warnDatabase.new.length.toString(), null);
        DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.old.length', warnDatabase.old.length.toString(), null);
    }
    // Option nicht ausreichend getestet.
    if (uFilterDuplicate) {
        let dn = new Date();
        for (let a = 0; a < warnDatabase.new.length; a++) {
            let w = warnDatabase.new[a];
            for (let b = a + 1; b < warnDatabase.new.length; b++) {
                let w2 = warnDatabase.new[b];
                if (
                    w.mode !== w2.mode ||
                    w.type !== w2.type ||
                    w.level > attentionWarningLevel ||
                    w2.level > attentionWarningLevel
                ) continue;
                if (w.start >= w2.start && w.end <= w2.end && w.level <= w2.level) {
                    let i = getIndexOfHash(warnDatabase.old, w.hash);
                    if (i != -1) warnDatabase.old.splice(i, 1);
                    warnDatabase.new.splice(a--, 1);
                    break;
                } else if (w.start <= w2.start && w.end >= w2.end && w.level >= w2.level) {
                    let i = getIndexOfHash(warnDatabase.old, w2.hash);
                    if (i != -1) warnDatabase.old.splice(i, 1);
                    warnDatabase.new.splice(b--, 1);
                    // w endet vor w2 && w2 startet bevor w endet && w hat kleiner gleiches level wie w2 -> lösche w
                    // Hochwassermeldungen werden laufend aufgehoben und durch neue erstzt;
                } else if (w.end < w2.end && w2.start < w.end && w.level <= w2.level) {
                    let i = getIndexOfHash(warnDatabase.old, w.hash);
                    if (i != -1) warnDatabase.old.splice(i, 1);
                    warnDatabase.new.splice(a--, 1);
                    break;
                    // siehe oben nur umgedreht
                } else if (w2.end < w.end && w.start < w2.end && w2.level <= w.level) {
                    let i = getIndexOfHash(warnDatabase.old, w2.hash);
                    if (i != -1) warnDatabase.old.splice(i, 1);
                    warnDatabase.new.splice(b--, 1);
                }
            }
        }
    }

    let ignoreWarningCount = 0,
        ignoreModes = 0;
    for (let a = 0; a < warnDatabase.new.length; a++) {
        let w = warnDatabase.new[a];
        for (let b = 0; b < warnDatabase.old.length; b++) {
            let w2 = warnDatabase.old[b];
            if (
                w.mode !== w2.mode ||
                w.type !== w2.type ||
                w.level > attentionWarningLevel ||
                w2.level > attentionWarningLevel ||
                w.hash == w2.hash
            ) continue;
            // w endet vor / gleich w2 && w2 startet bevor / gleich w endet && w hat kleiner gleiches level wie w2 -> lösche w2
            if (w2.end <= w.end && w2.end >= w.start  && w2.level <= w.level) {
                let i = getIndexOfHash(warnDatabase.new, w2.hash);
                if (i != -1) { warnDatabase.new.splice(i, 1); if (i < a) t = --a; }
                warnDatabase.old.splice(b--, 1);
            }
        }
    }
    for (let a = 0; a < warnDatabase.new.length; a++) {
        let w = warnDatabase.new[a];
        if ( isWarnIgnored(w)) {
            ignoreWarningCount++
            ignoreModes |= w.mode;
        }
    }



    warnDatabase.new.sort(function(a, b) { return a.level == b.level ? b.begin - a.begin : b.level - a.level; })
    var collectMode = 0;
    let emailHtmlWarn = '';
    let emailHtmlClear = '';
    let speakMsgTemp = [];
    collectMode = 0;
    let debugdata = '';
    /* Bereich für 'Wetterwarnung gültig bis wurde aufgehoben' */
    for (let i = 0; i < warnDatabase.old.length; i++) {
        let entry = warnDatabase.old[i];
        let description = entry.description;
        let headline = entry.headline;
        let hash = entry.hash;
        let area = entry.areaID;
        let mode = entry.mode;
        let count = 0;
        let symbol = entry.symbol ? entry.symbol + SPACE : '';
        if (isWarnIgnored(entry)) continue;
        if (DEBUGSENDEMAIL) debugdata += i + SPACE + mode + SPACE + hash + SPACE + getIndexOfHash(warnDatabase.new, hash) + SPACE + (getPushModeFlag(mode) & PUSH).toString(2) + '<br';
        if (headline && getIndexOfHash(warnDatabase.new, hash) == -1 && (warnDatabase.new.length > ignoreWarningCount)) {
            let prefix = ''
            let end = entry.end ? getFormatDate(entry.end) : null;
            collectMode |= mode;
            // Text Entwarnungen
            if (mode === NINA) {
                prefix = 'Die Warnung';
            } else {
                prefix = 'Die Wetterwarnung';
            }
            let pushMsg = symbol + prefix + getArtikelMode(mode) + "'" + headline + area + (end ? " gültig bis " + end + "Uhr'" : '') + " wurde aufgehoben.";
            // EMAIL
            emailHtmlClear += pushMsg + '<br>';
            // PUSH
            // Insgesamt x... anhängen
            pushMsg += getStringWarnCount(null, warnDatabase.new.length);
            sendMessage(getPushModeFlag(mode) & PUSH, symbol + (mode == NINA ? 'Entwarnung' : 'Wetterentwarnung'), symbol + pushMsg);
            myLog('text old:' + pushMsg);
            // SPEAK
            pushMsg = headline + getArtikelMode(mode, true) + area + (end ? ' gültig bis ' + getFormatDateSpeak(end) + ' Uhr' : '') + ' wurde aufgehoben' + '  .  ';
            speakMsgTemp.push([pushMsg, mode]);
            myLog('Sprache old:' + pushMsg);
        }
    }
    if (DEBUGSENDEMAIL) DebugMail = buildHtmlEmail(DebugMail, 'Index Mode Hash Index-New Flags', debugdata, null);
    let gefahr = false;
    let count = 0;
    /* Bereich für 'Neue Amtliche Wetterwarnung' */
    for (let i = 0; i < warnDatabase.new.length; i++) {
        let entry = warnDatabase.new[i];
        let headline = entry.headline;
        let description = entry.description;
        let level = entry.level;
        let instruction = entry.instruction;
        let hash = entry.hash;
        let area = entry.areaID;
        let color = entry.color;
        let mode = entry.mode;
        let symbol = entry.symbol ? entry.symbol + SPACE : '';
        if (DEBUGSENDEMAIL) debugdata += i + SPACE + mode + SPACE + hash + SPACE + getIndexOfHash(warnDatabase.old, hash) + SPACE + (getPushModeFlag(mode)).toString(2) + SPACE + isWarnIgnored(entry) + '<br';
        if (isWarnIgnored(entry) && !onClickCheckRun) continue;
        if (hash && getIndexOfHash(warnDatabase.old, hash) == -1) {
            let todoBitmask = uPushdienst;
            collectMode |= mode;
            count++;
            if (!gefahr) gefahr = level > attentionWarningLevel;

            let begin = entry.start ? getFormatDate(entry.start) : '',
                end = entry.end ? getFormatDate(entry.end) : '';
            let sTime = SPACE,
                bt = (begin || end);
            if (begin || end) sTime = "gültig ";
            if (begin) sTime += "vom " + begin + " Uhr";
            if ((begin && end)) sTime += SPACE;
            if (end) sTime += "bis " + end + " Uhr";

            // html
            if ((getPushModeFlag(mode) & CANHTML) != 0) {
                let he = '',
                    de = '';
                if (entry.html) {
                    let html = entry.html;
                    if (html.headline) he = html.headline;
                    else he = headline;
                    if (html.description) de = html.description;
                    else de = description;
                    if (html.instruction && html.instruction.length > 2) de += '<br><br>Handlungsanweisungen:<br>' + html.instruction;
                    else if (instruction && instruction.length > 2) de += '<br><br>Handlungsanweisungen:<br>' + instruction;
                    if (entry.html !== undefined) de += '<br><br>' + entry.html.web;
                } else {
                    he = headline;
                    de = description;
                    if (instruction && instruction.length > 2) de += '<br><br>Handlungsanweisungen:<br>' + instruction;
                }
                let html = (bt ? sTime + '<br>' : '') + de;
                html = html[0].toUpperCase() + html.substring(1);

                emailHtmlWarn = buildHtmlEmail(emailHtmlWarn, symbol + he + getArtikelMode(mode) + area + ':', html, color, false);
                html = he + getArtikelMode(mode) + area + ':' + html;
                if (warnDatabase.new.length > 1) html += getStringWarnCount(count, warnDatabase.new.length);
                let b = getPushModeFlag(mode) & CANHTML & ~EMAIL;
                sendMessage(b, symbol + getTopic(mode), html, entry);
                todoBitmask &= ~b & ~EMAIL;
            }
            // Plain text
            if ((getPushModeFlag(mode) & CANPLAIN & todoBitmask) != 0) {

                let pushMsg = headline + getArtikelMode(mode) + area + (bt ? NEWLINE + sTime : '') + NEWLINE + description;
                if (!!instruction && typeof instruction === 'string' && instruction.length > 2) {
                    pushMsg += NEWLINE + 'Handlungsanweisungen:' + NEWLINE + instruction;
                }

                // Anzahl Meldungen erst am Ende zu email hinzufügen
                if (todoBitmask & EMAIL) emailHtmlWarn = buildHtmlEmail(emailHtmlWarn, headline + getArtikelMode(mode) + area + ':', pushMsg, color, false);
                /* ab Level 4 zusätzlicher Hinweis */

                if (warnDatabase.new.length > 1) pushMsg += getStringWarnCount(count, warnDatabase.new.length);
                let b = getPushModeFlag(mode) & CANPLAIN & todoBitmask & PUSH;
                sendMessage(b, symbol + getTopic(mode), symbol + pushMsg, entry);
                myLog('text new:' + pushMsg);
                todoBitmask &= ~b;
            }
            // Sprache
            if ((getPushModeFlag(mode) & SPEAK) != 0) {

                sTime = SPACE;
                if (begin || end) sTime += "gültig ";
                if (begin) sTime += "vom " + getFormatDateSpeak(begin) + " Uhr";
                if ((begin && end)) sTime += " ";
                if (end) sTime += "bis " + getFormatDateSpeak(end) + " Uhr";
                if (!!instruction && typeof instruction === 'string' && instruction.length > 2) {
                    description += SPACE + SPACE + 'Handlungsanweisungen:' + NEWLINE + instruction;
                }
                let speakMsg = getTopic(mode, true) + headline + getArtikelMode(mode, true) + area + sTime + '.' + SPACE + replaceTokenForSpeak(description);
                if (!isWarnIgnored(entry) && (forceSpeak || compareTime(START, ENDE, 'between')) && (getPushModeFlag(mode) & SPEAK) != 0) {
                    sendMessage(getPushModeFlag(mode) & SPEAK, '', speakMsg, entry);
                }
                myLog('Sprache new:' + speakMsg + ' isWarnIgnored():' + isWarnIgnored(entry));
            }

            function getTopic(mode, s) {
                if (s == undefined) s = false;
                let result = '';
                if (mode !== NINA) {
                    result = (level > attentionWarningLevel) ? 'Wichtige Wetterwarnung: ' : s ? '' : 'Wetterwarnung';
                } else {
                    result = (level > attentionWarningLevel) ? 'Gefahr Warnung: ' : s ? '' : 'Warnung';
                }
                return result;
            }
        }
    }
    if (DEBUGSENDEMAIL) DebugMail = buildHtmlEmail(DebugMail, 'Index Mode Hash Index-old Flags ignored', debugdata, null);


    if ((getPushModeFlag(collectMode) & ALLMSG) != 0 && (emailHtmlWarn + emailHtmlClear)) {
        emailHtmlWarn = buildHtmlEmail(emailHtmlWarn, (emailHtmlClear ? 'Aufgehobene Warnungen' : null), emailHtmlClear, 'silver', false);
        emailHtmlWarn = buildHtmlEmail(emailHtmlWarn, null, getStringWarnCount(null, warnDatabase.new.length), null, true);
        sendMessage(getPushModeFlag(collectMode) & ALLMSG, (gefahr ? "Wichtige Warnungen" : "Warnungen") + getArtikelMode(collectMode) + "(iobroker)", emailHtmlWarn);
    }
    /* Bereich für 'Alle Wetterwarnungen wurden aufgehoben' */
    if (!emailHtmlWarn && warnDatabase.new.length == ignoreWarningCount && (warnDatabase.old.length > ignoreWarningCount || onClickCheckRun)) {
        for (let a = 0; a < warnDatabase.old.length; a++) collectMode |= warnDatabase.old[a].mode;

        let pushMsg = 'Alle Warnmeldungen' + getArtikelMode(collectMode) + 'wurden aufgehoben.' + getStringIgnoreCount(ignoreWarningCount);

        // Einen Mode ermitteln der aktiv ist und der das Versenden erlauben würde.
        if (!getPushModeFlag(collectMode)) collectMode = getPushModeFlag(switchFlags(ALLMODES, collectMode, false) & MODE, true);
        if (!getPushModeFlag(collectMode)) log('Keine erlaubten Versandmöglichkeiten im ' + (onClickCheckRun ? 'manuellen Modus' : 'Automatikmodus') + ' gefunden!');

        /* Bereich für Sprachausgabe über SayIt & Alexa & Home24*/
        if (forceSpeak || compareTime(START, ENDE, 'between')) { // Ansage über Sayit nur im definierten Zeitbereich
            sendMessage(getPushModeFlag(collectMode) & SPEAK, '', pushMsg);
        }
        myLog('all all:' + pushMsg + ' PUSH' + (getPushModeFlag(collectMode) & PUSH).toString(2) + ' ALLMSG:' + (getPushModeFlag(collectMode) & ALLMSG).toString(2));

        let topic = ((collectMode & NINA || !collectMode) ? 'Entwarnungen' : 'Wetterentwarnung');
        sendMessage(getPushModeFlag(collectMode) & PUSH, topic, pushMsg, );
        sendMessage(getPushModeFlag(collectMode) & ALLMSG, topic + getArtikelMode(collectMode) + '(iobroker)', buildHtmlEmail('', pushMsg, null, 'silver', true));
    }
    if (DEBUGSENDEMAIL) {
        let a;
        DebugMail = buildHtmlEmail(DebugMail, 'uPushdienst', 'Binär:' + uPushdienst.toString(2) + ' Decimal:' + uPushdienst.toString(), null);
        for (a = 0; a < warnDatabase.new.length; a++) DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.new' + a, JSON.stringify(warnDatabase.new[a]));
        for (a = 0; a < warnDatabase.old.length; a++) DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.old' + a, JSON.stringify(warnDatabase.old[a]));
        DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.new.length', warnDatabase.new.length.toString(), null);
        DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.old.length', warnDatabase.old.length.toString(), null, true);
        if (DEBUGSENDEMAIL) sendMessage(uPushdienst & EMAIL, 'Debug checkWarningsMain() ' + scriptName, DebugMail);
        //log(DebugMail);
    }
    /* Neue Werte sichern */
    warnDatabase.old = cloneObj(warnDatabase.new);
}
/* *************************************************************************
* Hauptfunktion zur Auswahl der Warnungen zum Versenden und Aufbereiten der
* Nachrichten ENDE
/* ************************************************************************* */
/* *************************************************************************
* Senden der Nachricht über die verschiedenen Möglichkeiten
/* ************************************************************************* */
//Versende die Warnungen über die Schienen
function sendMessage(pushdienst, topic, msg, entry) {
    if (entry === undefined) entry = null;
    if ((pushdienst & TELEGRAM) != 0) {
        let nMsg = {};
        if (entry && entry.web && entry.webname) nMsg.reply_markup = { inline_keyboard: [[{ text: entry.webname, url: entry.web }]] };
        nMsg.text = msg;
        if (telegramUser.length > 0) {
            nMsg.user = telegramUser;
            _sendTo(TELEGRAM, telegramInstanz, nMsg);
        }
        if (telegramChatId.length > 0) {
            nMsg.ChatId = telegramChatId;
            _sendTo(TELEGRAM, telegramInstanz, nMsg);
        }
        if (!(telegramUser.length > 0 || telegramChatId.length > 0)) {
            _sendTo(TELEGRAM, telegramInstanz, nMsg);
        }
    }
    if ((pushdienst & PUSHOVER) != 0) {
        let newMsg = { html: 1 };
        let usesound = ((deviceList[PUSHOVER].count == undefined || deviceList[PUSHOVER].count == 0) || !(!entry || entry.level < attentionWarningLevel));
        newMsg.message = msg;
        newMsg.title = topic;
        if (entry) {
            if (entry.web) { newMsg.url = entry.web;
                newMsg.url_title = entry.webname };
            newMsg.message = msg.replace(entry.headline, '<font color="' + entry.color + '">' + entry.headline + '</font>');
            //msg = msg.split(' '); msg[0]='<font color="'+entry.color+'">'+msg[0]+'</font>';msg = msg.join(' ');
            if (entry.level >= attentionWarningLevel) newMsg.priority = 1;
        }
        if (!usesound) newMsg.sound = 'none';
        else if (uPushoverSound) newMsg.sound = uPushoverSound;
        if (uPushoverDeviceName) newMsg.device = uPushoverDeviceName;
        _sendTo(PUSHOVER, pushoverInstanz, newMsg);
    }
    if ((pushdienst & IOGO) != 0) {
        let j = {};
        j.text = msg;
        j.title = topic;
        if (ioGoUser.length > 0) {
            j.user = ioGoUser[0];
            for (let a = 1; a < ioGoUser.length; a++) {
                j.user += ',' + ioGoUser[a];
            }
        }
        _sendTo(IOGO, ioGoInstanz, j);
    }
    if ((pushdienst & STATE) != 0) {
        setState(mirrorMessageState, msg, true);
    }
    if ((pushdienst & SPEAK) != 0) {
        _speakTo(pushdienst & SPEAK, msg);
    }
    if ((pushdienst & EMAIL) != 0) {
        let j = {};
        j.html = msg;
        j.subject = topic;
        if (senderEmailID[0]) j.from = senderEmailID[0];
        if (empfaengerEmailID.length > 0) {
            for (let a = 0; a < empfaengerEmailID.length; a++) {
                j.to = empfaengerEmailID[a];
                _sendTo(EMAIL, emailInstanz, j);
            }
        } else {
            _sendTo(EMAIL, emailInstanz, j);
        }
    }

    function _sendTo(dienst, a, b) {
        if (deviceList[dienst].count == undefined) {
            sendTo(a, b);
        } else {
            setTimeout(function(dienst, a, b) {
                sendTo(a, b);
                deviceList[dienst].count--;
            }, (deviceList[dienst].count++ * deviceList[dienst].delay + 20), dienst, a, b);
        }
    }
    // nur einmal pro Mitteilung aufrufen
    // Element 0 im Array muß immer vorhanden sein.
    function _speakTo(dienst, msg) {
        if (_speakToInterval) clearInterval(_speakToInterval);
        _speakToArray = _addItem(_speakToArray, msg, dienst);
        _speakToArray = _speakToArray.sort(function(a, b) { return a.startTimeSpeak - b.startTimeSpeak; });

        _speakToInterval = setInterval(function() {
            if (_speakToArray.length > 1) {
                let entry = _speakToArray[1];
                if (entry.startTimeSpeak <= new Date()) {
                    let nTime = new Date(new Date().getTime() + (deviceList[entry.dienst].delay * (entry.msg + _getMsgCountString(_speakToArray, entry.dienst)).length));
                    let value = nTime.getTime() - new Date(entry.endTimeSpeak).getTime();
                    for (let a = 1; a < _speakToArray.length; a++) {
                        if (entry.dienst == _speakToArray[a].dienst) {
                            _speakToArray[a].endTimeSpeak = new Date(_speakToArray[a].endTimeSpeak.getTime() + value);
                            if (a != 1 || value < 0) _speakToArray[a].startTimeSpeak = new Date(_speakToArray[a].startTimeSpeak.getTime() + value);
                        }
                    }
                    if (entry.dienst == HOMETWO) {
                        for (let a = 0; a < idMediaplayer.length; a++) {
                            var Url2 = "http://" + idMediaplayer[a] + "/track = 4fachgong.mp3|tts=" + entry.msg + _getMsgCountString(_speakToArray, entry.dienst);
                            myLog('Url2 :' + Url2);
                            request(Url2);
                        }
                    } else if (entry.dienst == SAYIT) {
                        for (let a = 0; a < idSayIt.length; a++) {
                            setState(idSayIt[a], sayItVolumen[a] + ";" + entry.msg + _getMsgCountString(_speakToArray, entry.dienst));
                        }
                    } else if (entry.dienst == ALEXA) {
                        for (let a = 0; a < idAlexaSerial.length; a++) {
                            // Wenn auf Gruppe, keine Lautstärkenregelung möglich
                            if (extendedExists(replacePlaceholder(idAlexaVolumen, idAlexaSerial[a]))) setState(replacePlaceholder(idAlexaVolumen, idAlexaSerial[a]), alexaVolumen[a]);
                            setState(replacePlaceholder(idAlexa, idAlexaSerial[a]), entry.msg + _getMsgCountString(_speakToArray, entry.dienst));
                        }
                    }
                    myLog('Länge der auszugebenen Sprachnachricht: ' + (entry.endTimeSpeak.getTime() - entry.startTimeSpeak));
                    _speakToArray.shift();
                    _speakToArray = _speakToArray.sort(function(a, b) { return a.startTimeSpeak - b.startTimeSpeak; });

                }
            } else clearInterval(_speakToInterval);
        }, 1000);
        return;
        // Hilfunktionen
        // gibt den letzten Satz zur Sprachausgabe zurück.
        function _getMsgCountString(arr, dienst) {
            let msgAppend = '';
            let len = arr.filter(function(a, b) { return !!(a.dienst & dienst); }).length - 1;
            if (len > 1) {
                if (len - 1 == 1) {
                    msgAppend = ' Eine weitere neue Warnung.';
                } else {
                    msgAppend = ' Es gibt ' + (len) + ' weitere neue Warnungen.';
                }
            } else {
                if (warnDatabase.new.length == 0) { if (!onClickCheckRun) msgAppend = ' keine weitere Warnung.'; } else {
                    if (warnDatabase.new.length == 1) msgAppend = ' Insgesamt eine aktive Warnung.';
                    else msgAppend = ' Insgesamt ' + warnDatabase.new.length + ' aktive Warnungen.';
                }
            }
            return msgAppend;
        }
        // fügt eine Sprachausgabe dem Array hinzu
        function _addItem(arr, a, dienst) {
            if ((dienst & HOMETWO) != 0) {
                let m = deviceList[HOMETWO].delay * a.length + 2000;
                __addItem(arr, a, HOMETWO, m)
            }
            if ((dienst & SAYIT) != 0) {
                let m = deviceList[SAYIT].delay * a.length + 2000;
                __addItem(arr, a, SAYIT, m)
            }
            if ((dienst & ALEXA) != 0) {
                let m = deviceList[ALEXA].delay * a.length + 2000;
                __addItem(arr, a, ALEXA, m)
            }
            return arr;
            // Hilfsunktion
            function __addItem(arr, a, dienst, m) {
                let t = null;
                for (let a = arr.length - 1; a >= 0; a--) {
                    if (dienst == arr[a].dienst) { t = arr[a].endTimeSpeak; break; }
                }
                t = t || new Date();
                let nt = new Date(t);
                nt.setMilliseconds(t.getMilliseconds() + m);
                arr.push({ msg: a, dienst: dienst, endTimeSpeak: nt, startTimeSpeak: t });
            }
        }
    }
}
/* *************************************************************************
* Senden der Nachricht über die verschiedenen Möglichkeiten
*                           ENDE
/* ************************************************************************* */
/* *************************************************************************
* Datenquelle Trigger
/* ************************************************************************* */
// setzt on() für DWD oder UWZ
function dataSubscribe() {
    if (subDWDhandler) unsubscribe(subDWDhandler);
    if (MODE & DWD) {
        let r = getRegEx(dwdPath, '^');
        r += '.*\.object$';
        myLog('subscribe path:' + r);
        subDWDhandler = subscribe({ id: new RegExp(r), change: 'ne' }, onChangeDWD);
    }
    if (subUWZhandler) unsubscribe(subUWZhandler);
    if (MODE & UWZ) {
        let r = getRegEx(uwzPath, '^');
        r += '.*\.object$';
        myLog('subscribe path:' + r);
        subUWZhandler = subscribe({ id: new RegExp(r), change: 'ne' }, onChangeUWZ);
    }
    if (subNINAhandler) unsubscribe(subNINAhandler);
    if (MODE & NINA) {
        let r = getRegEx(ninaPath, '^');
        r += '.*.rawJson$';
        myLog('subscribe path:' + r);
        subNINAhandler = subscribe({ id: new RegExp(r), change: 'ne' }, onChangeNina);
    }
}

function onChangeDWD(dp) {
    myLog('onchange DWD id:' + dp.id);
    onChange(dp, DWD);
}

function onChangeUWZ(dp) {
    myLog('onchange UWZ id:' + dp.id);
    onChange(dp, UWZ);
}

function onChangeNina(dp) {
    myLog('onchange NINA ' + dp.id);
    onChange(dp, NINA);
}

// funktion die von on() aufgerufen wird
function onChange(dp, mode) {
    if (addDatabaseData(dp.id, dp.state.val, mode, false)) {
        myLog('Datenbank wurde geändert - checkWarningsMain():' + autoSendWarnings + ' id:' + dp.id + ' Mode:' + mode);
        if (timer) clearTimeout(timer);
        if (autoSendWarnings) timer = setTimeout(checkWarningsMain, 20000);
    }
}
/* *************************************************************************
* Datenquelle Trigger  ENDE
/* ************************************************************************* */
/* *************************************************************************
* Datenbank
/* ************************************************************************* */
// Erstes befüllen der Database
function InitDatabase(first) {
    if (first) warnDatabase = { new: [], old: [] };
    if (MODE & DWD) {
        var idAll = $("state[state.id=" + dwdPath + ".*.object$]");
        _helper(idAll, DWD, first);
    } else {
        warnDatabase.new = warnDatabase.new.filter(function(j) {
            return j.mode != DWD;
        });
    }

    if (MODE & UWZ) {
        var idAll = $("state[state.id=" + uwzPath + ".*.object$]");
        _helper(idAll, UWZ, first);
    } else {
        warnDatabase.new = warnDatabase.new.filter(function(j) {
            return j.mode != UWZ;
        });
    }
    if (MODE & NINA) {
        var idAll = $("state[state.id=" + ninaPath + ".*.rawJson$]");
        _helper(idAll, NINA, first);
    } else {
        warnDatabase.new = warnDatabase.new.filter(function(j) {
            return j.mode != NINA;
        });
    }
    if (!first) removeDuplicateHash();
    return;

    function _helper(arr, mode, first) {
        for (let a = 0; a < arr.length; a++) {
            let id = arr[a];
            addDatabaseData(id, getState(id).val, mode, first);
        }
    }
}


// für Objekt zur Database hinzu
function addDatabaseData(id, value, mode, old) {
    var warn = null;
    let change = false;
    let jvalue = null;
    myLog("addDatabaseData() ID + JSON:" + id + SPACE + JSON.stringify(value));
    if (value && value != {} && value !== undefined && value != "{}")
    jvalue = JSON.parse(value);
    if (mode == UWZ) {
        change = removeDatabaseDataID(id);
        if (jvalue) {
            warn = getDatabaseData(jvalue, mode);
            if (warn) {
                warn.areaID = getRegionNameUWZ(id);
                warn.hash = JSON.stringify(warn).hashCode();
                warn.id = id;
                warnDatabase.new.push(warn);
                if (old) warnDatabase.old.push(warn);
                change = true;
                if (uLogAusgabe)
                log("Add UWZ warning to database. headline: " + warn.headline);
            }
        }
    } else if (mode == DWD) {
        change = removeDatabaseDataID(id);
        if (jvalue) {
            warn = getDatabaseData(jvalue, mode);
            if (warn) {
                warn.areaID = " für " + warn.areaID;
                warn.hash = JSON.stringify(warn).hashCode();
                warn.id = id;
                warnDatabase.new.push(warn);
                if (old) warnDatabase.old.push(warn);
                change = true;
                if (uLogAusgabe)
                log("Add DWD warning to database. headline: " + warn.headline);
            }
        }
    } else if (mode == NINA) {
        if (jvalue.info === undefined || !Array.isArray(jvalue.info))
            return false;
        let tempArr = [];
        let grouphash = 0;
        // sammele die neuen Daten
        for (let a = 0; a < jvalue.info.length; a++) {
            warn = getDatabaseData(jvalue.info[a], mode);
            // Warnungen nur aufnehmen wenn sie nicht beendet sind. Null berücksichtigt.
            if (warn && (!warn.end || new Date(warn.end) > new Date())) {
                warn.identifier     = jvalue.identifier === undefined ? "" : jvalue.identifier;
                warn.sender         = jvalue.sender === undefined ? "" : jvalue.sender;
                warn.hash = JSON.stringify(warn).hashCode();
                // setzte start auf das Sendungsdatum, aber nicht im Hash berücksichtigen, ist keine neue Nachricht nur weil sich das datum ändert.
                // Wenn sich der Rest den Inhaltes ändert, ist es eine neue Nachricht
                warn.start          = warn.start || jvalue.sent === undefined     ? warn.start    : getDateObject(jvalue.sent).getTime();
                warn.id = id;
                if (!grouphash) grouphash = warn.hash;
                warn.grouphash = grouphash;
                tempArr.push(warn);
                myLog("Added to tempdatabase");
            }
        }
        // Vergleiche vorhandene und neue Daten wenn hash = hash aktualisiere ID, wenn nicht und ID = ID lösche Eintrag und
        if (tempArr.length > 0) {
            for (let a = 0; a < tempArr.length; a++) {
                for (let b = 0; b < warnDatabase.new.length; b++) {
                    if (tempArr[a].hash == warnDatabase.new[b].hash) {
                        if (uLogAusgabe && warnDatabase.new[b].id != tempArr[a].id) log( "Update database Nina warning old id<>new id. headline: " +warn.headline );
                        warnDatabase.new[b].id = tempArr[a].id;
                        tempArr.splice(a--, 1);
                        break;
                    } else if (
                        tempArr[a].id == warnDatabase.new[b].id &&
                        tempArr[a].grouphash != warnDatabase.new[b].grouphash
                    ) {
                        myLog(
                            "warnDatabase.new set id to null because duplicate id and wrong grouphash: " +
                            warnDatabase.new[b].headline
                        );
                        warnDatabase.new[b].id = null;
                    }
                }
            }
        }
        if (tempArr.length > 0) {
            for (let a = 0; a < tempArr.length; a++) {
                warn = tempArr[a];
                warnDatabase.new.push(warn);
                if (old) warnDatabase.old.push(warn);
                if (uLogAusgabe)
                    log(
                        "Add Nina warning to database. headline: " +
                        warn.headline
                    );
            }
            change = true;
        }
    }
    if (change) setAlertState();
    return change;

    // vergleich regionName und die Obj.id und gib den benutzerfreundlichen Namen zurück.
    function getRegionNameUWZ(id) {
        if (!Array.isArray(regionName) || regionName.length == 0) return "";
        for (let a = 0; a < regionName.length; a++) {
            if (id.includes(regionName[a][0])) {
                return "für " + regionName[a][1];
            }
        }
        return "";
    }
}

function isWarnIgnored(warn) {
    if (warn.level <= attentionWarningLevel) {
        if ((uFilterList & warn.mode) != 0) return true;
        if ((warn.mode & NINA) != 0) {
            if (uAutoNinaFilterList.indexOf(warn.sender) != -1) {
                myLog('Filter: \'' + warn.sender + '\' ist in uAutoNinaFilterList - level: ' + warn.level);
                return true;
            }
        }
    }
    return false;
}

function getIndexOfHash(db, hash, mode, id) {
    if (id === undefined && mode === undefined) return db.findIndex(function(j) {
        return j.hash === hash;
    });
    else if (id === undefined) return db.findIndex(function(j) {
        return j.hash === hash && j.mode == mode;
    });
    else if (mode === undefined) return db.findIndex(function(j) {
        return j.hash === hash && j.id == id;
    });
    else return db.findIndex(function(j) {
        return j.hash === hash && j.mode == mode && j.id == id;
    });
}

// Wandelt den Datensatz in ein internes Format um
function getDatabaseData(warn, mode){
    if (!warn || warn === undefined || typeof warn !== 'object' || warn === {} || warn =='{}') return null;
    let result={};
    if (mode === DWD) {
        if (
            warn.altitudeStart > maxhoehe
            || (warn.altitudeEnd && warn.altitudeEnd < minhoehe)
            || warn.level < minlevel
        ) {myLog('Übergebenens Json DWD verworfen');return null;}
        result['mode'] = DWD;
        result['description']   = warn.description === undefined 	? '' 	: warn.description;
        result['headline']      = warn.headline === undefined 		? '' 	: warn.headline;
        result['start']         = warn.start === undefined 			? null 	: warn.start || null;
        result['end']           = warn.end === undefined 			? null 	: warn.end || null;
        result['instruction']   = warn.instruction === undefined 	? '' 	: warn.instruction;
        result['type']          = warn.type === undefined 			? -1 	: warn.type;
        result['level']         = warn.level === undefined 			? -1 	: warn.level;
        result['areaID'] 		= warn.regionName === undefined 	? '' 	: warn.regionName;
        result['web'] 			= '';
        result['webname'] 		= '';
        result['symbol']        = result.type === -1                ? ''    : warningTypesString[DWD][result.type][1];
    } else if (mode === UWZ) {
        if (
            warn.payload === undefined
            || warn.payload.altMin > maxhoehe
            || (warn.payload.altMax && warn.payload.altMax < minhoehe)
            || warn.level < minlevel

        ) {myLog('Übergebenens Json UWZ verworfen');return null;}
        result['mode'] = UWZ;
        result['description'] 	= warn.payload.translationsLongText.DE === undefined 	? '' 	: warn.payload.translationsLongText.DE;
        result['start'] 		= warn.dtgStart === undefined 							? null 	: warn.dtgStart * 1000 || null;
        result['end'] 			= warn.dtgEnd === undefined 							? null 	: warn.dtgEnd * 1000 || null;
        result['instruction'] 	= warn.instruction === undefined 						? '' 	: warn.instruction;
        result['type'] 			= warn.type === undefined 								? -1 	: warn.type;
        result['level'] 		= warn.payload.levelName === undefined 					? -1 	: getUWZLevel(warn.payload.levelName);
        result['headline'] 		= warn.type === undefined 								? '' 	: 'Warnung vor '+warningTypesString[UWZ][result.type][0];
        result['areaID'] 		= warn.areaID === undefined 							? '' 	: warn.areaID;
        result['color'] 		= getLevelColor(result.level);
        result['web'] 			= '';
        result['webname'] 		= '';
        result['symbol']        = result.type === -1                                    ? ''    : warningTypesString[UWZ][result.type][1];
    } else if (mode === NINA) {
        // level 2, 3, 4
        let web='';
        web = warn.web === undefined || !warn.web? '' : '<br>'+warn.web+'<br>';
        result['mode'] = NINA;
        //result['identifier'] = warn.identifier === undefined ? '' : warn.identifier;
        //result['sender'] = warn.sender === undefined ? '' : warn.sender;
        result['web'] 					= warn.web === undefined || !warn.web         ? '' 	: warn.web.replace(/(\<a href\=\")|(\"\>.+\<\/a\>)/ig,'');
        result['webname'] 				= warn.web === undefined || !warn.web	      ? ''	: warn.web.replace(/(\<a href\=\".+\"\>)|(\<\/a\>)/ig,'');
        result['description'] 			= warn.description === undefined              ? '' 	: removeHtml(warn.description);
        result['start'] 				= warn.onset === undefined 		              ? null 	: getDateObject(warn.onset).getTime() || null;
        result['end'] 					= warn.expires === undefined 			      ? null	: getDateObject(warn.expires).getTime() || null;
        result['instruction'] 			= warn.instruction === undefined 		      ? '' 	: removeHtml(warn.instruction);
        result['typename'] 				= warn.event === undefined 				      ? '' 	: removeHtml(warn.event);
        result['type'] 					= result.typename.hashCode();
        //result['urgency'] 			= warn.urgency === undefined 			      ? '' 	: warn.urgency;
        result['severity'] 				= warn.severity === undefined 			      ? '' 	: warn.severity;
        //result['certainty']		 	= warn.certainty === undefined 			      ? ''	: warn.certainty;
        result['headline'] 				= warn.headline === undefined 			      ? ''	: removeHtml(warn.headline);
        result['areaID'] 				= warn.area === undefined 				      ? ''	: getNinaArea(warn.area);
        result['level'] 				= warn.severity === undefined 			      ? -1	: getNinaLevel(warn.severity, result.typename);
        result['color'] 				= getLevelColor(result.level);
        result['html'] 					= {};
        result['html']['web'] 			= warn.web === undefined || !warn.web 	      ? '' 	: warn.web;
        result['html']['instruction'] 	= warn.instruction === undefined 		      ? '' 	: warn.instruction;
        result['html']['headline'] 		= warn.headline === undefined 			      ? '' 	: warn.headline;
        result['html']['description'] 	= warn.description === undefined 		      ? '' 	: warn.description;
        result['symbol']                = '';
        if ( result.level < minlevel ) return null;
    }
    result['color'] = getLevelColor(result.level);
    result['id']='';
    result['pending'] = 0;
    result['hash'] = 0;
    myLog('result: ' + JSON.stringify(result));
    return result;

    function getNinaArea(value) {
        let result = 'für ihre Region'
        if (!value && !Array.isArray(value)) return result;
        // gibt nur 1 nix zum Suchen.
        if (value.length == 0) return 'für ' + value[0].areaDesc;

        let region = '';
        let lvl = 5;
        let len = 1000;
        for (let a = 0; a < value.length; a++) {
            if (value[a].areaDesc !== undefined) {
                let area = value[a].areaDesc;
                if (area.includes(uGemeinde) && area.length - uGemeinde.length < len) {
                    region = area;
                    len = area.length - uGemeinde.length;
                    lvl = 1;
                } else if (lvl > 2 && area.includes(uLandkreis)) {
                    lvl = 2;
                    region = area;
                }
            }
            if (value[a].geocode !== undefined) {
                let newval = value[a].geocode;
                for (let b = 0; b < newval.length; b++) {
                    if (newval[b].valueName === undefined) continue;
                    let area = newval[b].valueName;
                    if (area.includes(uGemeinde) && area.length - uGemeinde.length < len) {
                        region = area;
                        len = area.length - uGemeinde.length;
                        lvl = 1;
                    } else if (lvl > 2 && area.includes(uLandkreis)) {
                        lvl = 2;
                        region = area;
                    }
                }
            }
        }
        if (region) region = 'für ' + region;
        return region || result;
    }
    // gibt Nina level zurück
    function getNinaLevel(str, type) {
        let ninaLevel = [
            'Minor',
            'Moderate',
            'Severe',
            'Extreme'
        ]
        let offset = 2;
        // Hochwassser ist immer Severe das ist im Vergleich denke ich zu hoch.
        if (type == 'Hochwasserinformation') offset = 0;
        return ninaLevel.indexOf(str) + offset;
    }
    // Gibt Farben für die level zurück
    function getLevelColor(level) {
        var color = [
            '#00ff00', // 0 - Grün
            '#009b00', // 1 - Dunkelgrün
            '#d7d700', // 2 - Gelb Wetterwarnungen (Stufe 2) //vorher:#ffff00
            '#ffb400', // 3 - Orange Warnungen vor markantem Wetter (Stufe 3)
            '#ff0000', // 4 - Rot Unwetterwarnungen (Stufe 4) // im grunde höchste Stufe in diesem Skript.
            '#ff00ff', // 5 - Violett Warnungen vor extremem Unwetter (nur DWD/ Weltuntergang nach aktueller Erfahrung)
        ];
        if (level >= 0 && level <= 5) return color[level];
        return null;
    }

    function getUWZLevel(warnName) {
        var result = -1; // -1 is an error!
        var alert = warnName.split("_");
        var colors = {
            color: ["green", "darkgreen", "yellow", "orange", "red", "violet"],
            level: [0, 0, 1, 2, 3, 4] // um 1 level reduziert, sond nicht mit DWD vergleichbar nach Erfahrungen
        };
        if (alert[0] == "notice") { result = 1; } else if (alert[1] == "forewarn") { result = 1; } else {
            result = colors.level[colors.color.indexOf(alert[2])];
        }
        return result;
    }
    }

    function removeHtml(a) {
        let b = a.replace(/<br\/>/ig, NEWLINE);
        b = b.replace(/(&nbsp;|<([^>]+)>)/ig, '');
        return b;
    }
// Überprüfe wegen Nina - Adapter häufig die DB ob obj.ids gelöscht wurden.
// Dachte ich zuerst, die Server sind aber sehr unzuverlässig und Meldungen werden laufend nicht ausgeliefert.
// Folglich werden Entwarnung raus geschickt. Jetzt warten wir 10 * 9 = 90 Minuten entwarnen erst dann.
// Abgelaufene Meldungen werden aufgeräumt.
schedule('18 */10 * * * *', function() {
    let c = false;
    for (let a = 0; a < warnDatabase.new.length; a++) {
        let w = warnDatabase.new[a];
        if (!extendedExists(w.id)) {
            if (warnDatabase.new[a].pending++ >= 8) { //  9 Durchläufe
                if (uLogAusgabe) log('Remove old warning with id: ' + warnDatabase.new[a].id + ' and headline: ' + warnDatabase.new[a].headline);
                warnDatabase.new.splice(a--, 1);
                c = true;
            }
        } else {
            w.pending = 0;
        }
        if (w.end && new Date(w.end) < new Date()) {
            if (uLogAusgabe) log('Remove expired warning with id: ' + warnDatabase.new[a].id + ', headline: ' + warnDatabase.new[a].headline + ' expire:' + new Date(w.end));
            warnDatabase.new.splice(a--, 1);
            c = true;
        }
    }
    if (c && autoSendWarnings) {
        if (timer) clearTimeout(timer);
        checkWarningsMain();
    }
});

// entferne Eintrag aus der Database
function removeDatabaseDataID(id, multitimes) {
    if (!id || (typeof id !== 'string')) return false;
    if (multitimes === undefined) multitimes = false;
    let change = false;
    if (warnDatabase.new && warnDatabase.new.length > 0) {
        let i=-2;
        while (i!=-1) {
            i = warnDatabase.new.findIndex(function(j){return j.id == id});
            if (i!=-1) {
                warnDatabase.new.splice(i, 1);
                change = true;
            }
            if (!multitimes) break;
        }
    }
    return change;
}
function removeDuplicateHash() {
    if (warnDatabase.new && warnDatabase.new.length > 0) {
        warnDatabase.new = warnDatabase.new.filter(function(j, i){
            let b = (-1 == warnDatabase.new.findIndex(function(j2, i2){
                return i > i2 && j.mode == j2.mode && j.hash == j2.hash;
            }));
            if (!b) myLog('new filtere:'+JSON.stringify(j));
            return b;}
        )
    }
    if (warnDatabase.old && warnDatabase.old.length > 0) {
        warnDatabase.old = warnDatabase.old.filter(function(j, i){
            let b = (-1 == warnDatabase.old.findIndex(function(j2, i2){
                return i > i2 && j.mode == j2.mode && j.hash == j2.hash;
            }));
            if (!b) myLog('old filtere:'+JSON.stringify(j));
            return b;}
        )
    }
}


/* *************************************************************************
* Datenbank ENDE
/* ************************************************************************* */
/* *************************************************************************
* Aufbereitung von Texten für die verschiedenen Pushmöglichkeiten
/* ************************************************************************* */
function getArtikelMode(mode, speak = false) {
    let r = SPACE;
    if (mode & DWD) r += (DEBUG ? 'des DWD('+scriptName+') ' : 'des DWD ');
    if (mode & UWZ) {
        if (r.length > 1) r += 'und ';
        if (speak) r += (DEBUG ? 'der Unwetterzentrale('+scriptName+') ' : 'der Unwetterzentrale ');
        else r += (DEBUG ? 'der UWZ('+scriptName+') ' : 'der UWZ ');
    }
    if (mode & NINA) {
        if (r.length > 1) r += 'und ';
        r += (DEBUG ? 'von Nina('+scriptName+') ' : 'von Nina ');
    }
    return r;
}

// Gibt einen fertigen Zähler string zurück. 1 / 3 wenn es Sinn macht und manuelle Auslösung
function getStringWarnCount(i, c) {
    return SPACE + 'Insgesamt ' + ((i && onClickCheckRun && c > 1) ? (i.toString() + '/') : '') + ((c == 1) ? 'eine gültige Warnung.' : (c.toString() + ' gültige Warnungen.'));
}
// gibt einen fertigen String für ignorierte Warnungen zurück
function getStringIgnoreCount(c) {
    if (c == 0) return '';
    let r = SPACE;
    if (c == 1) r += 'Es wird eine Warnung ignoriert.';
    else r += 'Es werden ' + c.toString() + ' Warnungen ignoriert.';
    return r;
}
// ersetzt Placeholder
function replacePlaceholder(str, insertText) {
    return str.replace(placeHolder, insertText);
}
// baut eine html table für Email
function buildHtmlEmail(mailMsg, headline, msg, color, last = false) {
    if (!mailMsg) mailMsg = '<table border="1" cellpadding="0" cellspacing="0" width="100%">';
    if (headline) {
        if (color) mailMsg += '<tr><td style="padding: 5px 0 5px 0;" bgcolor=\"' + color + '\"><b>' + headline + '</b></td></tr>';
        else mailMsg += '<tr><td style="padding: 5px 0 5px 0;"><b>' + headline + '</b></td></tr>';
    }
    if (msg) mailMsg += '<tr><td style="padding: 5px 0 20px 0;">' + msg + '</td></tr>';
    if (last) mailMsg += '</table>';
    return mailMsg;
}

/* Entfernt "°C" und anders aus Sprachmeldung und ersetzt es durch "Grad" */
/* noch nicht für UWZ angepasst */
function replaceTokenForSpeak(beschreibung) {
    var rueckgabe = beschreibung;
    try {
        rueckgabe = rueckgabe.replace(/\°C/g, "Grad");
        rueckgabe = rueckgabe.replace(/km\/h/g, "Kilometer pro Stunde");
        rueckgabe = rueckgabe.replace(/l\/m\²/g, "Liter pro Quadratmeter");
        rueckgabe = rueckgabe.replace(/\d{1,2}\.\d{1,2}\.\d{4}../gi, function(x) {
            return getFormatDateSpeak(x);
        })
        rueckgabe = rueckgabe.replace(/\d{1,2}\.\d{1,2}\.../gi, function(x) {
            return getFormatDateSpeak(x);
        })
        if (!windForceDetailsSpeak) {
            rueckgabe = rueckgabe.replace(/\([0-9]+.m\/s..[0-9]+kn..Bft.[0-9]+../g, "");
        } else {
            rueckgabe = rueckgabe.replace(/kn/g, " Knoten");
            rueckgabe = rueckgabe.replace(/Bft/g, " Windstärke");
            rueckgabe = rueckgabe.replace(/m\/s/g, " Meter pro Sekunde");
        }
    } catch (e) { log(e, 'warn'); }
    return rueckgabe;
}

// Formatiere Date zu string
function getFormatDate(a) {
    if (!a || (!(typeof a === 'number')) && !(typeof a === 'object')) return '';
    return formatDate(new Date (a).getTime(), formatierungString);
}
// hilffunktion für Zeitausgabe über Sprache
// @PARAM Rückgabe von getFormatDate
function getFormatDateSpeak(a) {
    if (!a || typeof a !== 'string') return '';
    let b = a.split('.');
    let m = '';
    switch (b[1]) {
        case '01': m='Januar';      break;
        case '02': m='Februar';     break;
        case '03': m='März';        break;
        case '04': m='April';       break;
        case '05': m='Mai';         break;
        case '06': m='Juni';        break;
        case '07': m='Juli';        break;
        case '08': m='August';      break;
        case '09': m='September';   break;
        case '10': m='Oktober';     break;
        case '11': m='November';    break;
        case '12': m='Dezember';    break;
        default: m='';
    }
    //  if (Number(b[0]) < 10) b[0]=b[0].slice(1, 1);
    // Das geht echt einfacher  *g*
    b[0] = Number(b[0]).toString();
    b[1] = m; // setze Monatsname
    // entferne Jahr
    let c = b[2].split(SPACE);
    c[0] = '';
    b[2] = c.join(SPACE);
    return b.join(SPACE);
    }


/* *************************************************************************
* Aufbereitung von Texten für die verschiedenen Pushmöglichkeiten ENDE
/* ************************************************************************* */
/* *************************************************************************
* Anfrage über Telegramm mit Ww? und WetterWarnungen?
/* ************************************************************************* */

if ((uPushdienst & TELEGRAM) != 0) {
    on({ id: telegramInstanz + '.communicate.request', change: "any", ack: false }, function(obj) {
        var msg = obj.state.val;
        var user = msg.substring(1, msg.indexOf(']'));
        msg = msg.substring(msg.indexOf(']') + 1, msg.length);
        if (msg.includes('Ww?') || msg.includes('Wetterwarnungen?')) {
            setState(mainStatePath + 'commands.' + konstanten[0].name, true);
        } else if (DEBUG && msg.includes('Wwdmail')) {
            let olddebug = DEBUGSENDEMAIL;
            DEBUGSENDEMAIL = true;
            setState(mainStatePath + 'commands.' + konstanten[2].name, true, function() {
                setTimeout(function() {
                    DEBUGSENDEMAIL = olddebug;
                }, 200);
            });
        } else if (msg.includes('Wwdon')) {
            DEBUG = true;
        } else if (msg.includes('Wwdoff')) {
            DEBUG = false;
        }
    });
}
/* *************************************************************************
* Anfrage über Telegramm mit Ww? und WetterWarnungen?
*               ENDE
/* ************************************************************************* */
/* *************************************************************************
* Restartfunktion
/* ************************************************************************* */
// wenn alive schon false, starte das Skript neu
onStop(function(callback) {
    if (extendedExists(aliveState)) {
        if (!getState(aliveState).val) {
            log('wird neugestartet!');
            setState(aliveState, false, true, function() {
                setTimeout(function() {
                    startScript(scriptName);
                    log('Neustart wurde ausgeführt');
                }, 1000)
            });
        } else {
            log('wurde beendet!');
            setState(aliveState, false, true);
        }
    }
    callback();
}, 200)

// stop das Skript und setzt den Alivestatus
function restartScript() {
    setTimeout(function() {
        setState(aliveState, false, false, function() {
            myLog('Wird über restartScript() beendet.!');
            stopScript(scriptName);
        });
    }, 200);
}
/* *************************************************************************
* Restartfunktion
*           ENDE
/* ************************************************************************* */
/* *************************************************************************
* Erstellung von States incl. 0_userdata & Zugehöriges
/* ************************************************************************* */
// gibt die ersten beiden Teile von ID zurück
function getCustomRoot(id) {
    let sRoot = id.split('.');
    if (!Array.isArray(sRoot)) {
        log('Fehler: ' + id + ' ist fehlerhaft. Es fehlt ein . ', 'error');
        stopScript(scriptName);
    }
    if (sRoot[0] === '0_userdata') sRoot = '0_userdata.0';
    else sRoot = 'javascript.' + id.split('.')[1];
    return sRoot;
}
// gibt das zurück was nicht zu getCustomRoot() gehört
function getEndOfState(id) {
    return id.replace(getCustomRoot(id) + '.', '');
}

// erweiterte existsState() funktion
function extendedExists(id) {
    let r = (id) && ($(id).length > 0) && (existsState(id));
    return r;
}

// verhält sich wie createState()
function createCustomState(id, def, type, callback = undefined) {
    if (!extendedExists(id)) {
        myLog('getCustomRoot: ' + getCustomRoot(id));
        myLog('getEndOfState: ' + getEndOfState(id));
        if (def == null && type.type == 'string') type.def = '';
        else type.def = def;
        createUserStates(getCustomRoot(id), false, [
            [getEndOfState(id), type],
        ], callback);
        // Restart Skript nach dem States erzeugt wurden
        // Nutze Timeout um erst am Ende aller CreateStates das Skript neuzustarten
        if (timeoutFromCreateState) clearTimeout(timeoutFromCreateState);
        timeoutFromCreateState = setTimeout(function() {
            restartScript();
        }, 400);
    }
}
/**
* Create states under 0_userdata.0 or javascript.x
* Current Version:     https://github.com/Mic-M/iobroker.createUserStates
* Support:             https://forum.iobroker.net/topic/26839/
* Autor:               Mic (ioBroker) | Mic-M (github)
* Version:             1.1 (26 January 2020)
* Example:             see https://github.com/Mic-M/iobroker.createUserStates#beispiel
* -----------------------------------------------
* PLEASE NOTE: Per https://github.com/ioBroker/ioBroker.javascript/issues/474, the used function setObject()
*              executes the callback PRIOR to completing the state creation. Therefore, we use a setTimeout and counter.
* -----------------------------------------------
* @param {string} where          Where to create the state: '0_userdata.0' or 'javascript.x'.
* @param {boolean} force         Force state creation (overwrite), if state is existing.
* @param {array} statesToCreate  State(s) to create. single array or array of arrays
* @param {object} [callback]     Optional: a callback function -- This provided function will be executed after all states are created.
*/
function createUserStates(where, force, statesToCreate, callback = undefined) {

    const WARN = false; // Only for 0_userdata.0: Throws warning in log, if state is already existing and force=false. Default is false, so no warning in log, if state exists.
    const LOG_DEBUG = false; // To debug this function, set to true
    // Per issue #474 (https://github.com/ioBroker/ioBroker.javascript/issues/474), the used function setObject() executes the callback
    // before the state is actual created. Therefore, we use a setTimeout and counter as a workaround.
    const DELAY = 50; // Delay in milliseconds (ms). Increase this to 100, if it is not working.

    // Validate "where"
    if (where.endsWith('.')) where = where.slice(0, -1); // Remove trailing dot
    if ( (where.match(/^((javascript\.([1-9][0-9]|[0-9]))$|0_userdata\.0$)/) == null) ) {
        log('This script does not support to create states under [' + where + ']', 'error');
        return;
    }

    // Prepare "statesToCreate" since we also allow a single state to create
    if(!Array.isArray(statesToCreate[0])) statesToCreate = [statesToCreate]; // wrap into array, if just one array and not inside an array

    // Add "where" to STATES_TO_CREATE
    for (let i = 0; i < statesToCreate.length; i++) {
        let lpPath = statesToCreate[i][0].replace(/\.*\./g, '.'); // replace all multiple dots like '..', '...' with a single '.'
        lpPath = lpPath.replace(/^((javascript\.([1-9][0-9]|[0-9])\.)|0_userdata\.0\.)/,'') // remove any javascript.x. / 0_userdata.0. from beginning
        lpPath = where + '.' + lpPath; // add where to beginning of string
        statesToCreate[i][0] = lpPath;
    }

    if (where != '0_userdata.0') {
        // Create States under javascript.x
        let numStates = statesToCreate.length;
        statesToCreate.forEach(function(loopParam) {
            if (LOG_DEBUG) log('[Debug] Now we are creating new state [' + loopParam[0] + ']');
            let loopInit = (loopParam[1]['def'] == undefined) ? null : loopParam[1]['def']; // mimic same behavior as createState if no init value is provided
            createState(loopParam[0], loopInit, force, loopParam[1], function() {
                numStates--;
                if (numStates === 0) {
                    if (LOG_DEBUG) log('[Debug] All states processed.');
                    if (typeof callback === 'function') { // execute if a function was provided to parameter callback
                        if (LOG_DEBUG) log('[Debug] Function to callback parameter was provided');
                        return callback();
                    } else {
                        return;
                    }
                }
            });
        });
    } else {
        // Create States under 0_userdata.0
        let numStates = statesToCreate.length;
        let counter = -1;
        statesToCreate.forEach(function(loopParam) {
            counter += 1;
            if (LOG_DEBUG) log ('[Debug] Currently processing following state: [' + loopParam[0] + ']');
            if( ($(loopParam[0]).length > 0) && (extendedExists(loopParam[0])) ) { // Workaround due to https://github.com/ioBroker/ioBroker.javascript/issues/478
                // State is existing.
                if (WARN && !force) log('State [' + loopParam[0] + '] is already existing and will no longer be created.', 'warn');
                if (!WARN && LOG_DEBUG) log('[Debug] State [' + loopParam[0] + '] is already existing. Option force (=overwrite) is set to [' + force + '].');
                if(!force) {
                    // State exists and shall not be overwritten since force=false
                    // So, we do not proceed.
                    numStates--;
                    if (numStates === 0) {
                        if (LOG_DEBUG) log('[Debug] All states successfully processed!');
                        if (typeof callback === 'function') { // execute if a function was provided to parameter callback
                            if (LOG_DEBUG) log('[Debug] An optional callback function was provided, which we are going to execute now.');
                            return callback();
                        }
                    } else {
                        // We need to go out and continue with next element in loop.
                        return; // https://stackoverflow.com/questions/18452920/continue-in-cursor-foreach
                    }
                } // if(!force)
            }

            // State is not existing or force = true, so we are continuing to create the state through setObject().
            let obj = {};
            obj.type = 'state';
            obj.native = {};
            obj.common = loopParam[1];
            setObject(loopParam[0], obj, function (err) {
                if (err) {
                    log('Cannot write object for state [' + loopParam[0] + ']: ' + err);
                } else {
                    if (LOG_DEBUG) log('[Debug] Now we are creating new state [' + loopParam[0] + ']')
                    let init = null;
                    if(loopParam[1].def === undefined) {
                        if(loopParam[1].type === 'number') init = 0;
                        if(loopParam[1].type === 'boolean') init = false;
                        if(loopParam[1].type === 'string') init = '';
                    } else {
                        init = loopParam[1].def;
                    }
                    setTimeout(function() {
                        setState(loopParam[0], init, true, function() {
                            if (LOG_DEBUG) log('[Debug] setState durchgeführt: ' + loopParam[0]);
                            numStates--;
                            if (numStates === 0) {
                                if (LOG_DEBUG) log('[Debug] All states processed.');
                                if (typeof callback === 'function') { // execute if a function was provided to parameter callback
                                    if (LOG_DEBUG) log('[Debug] Function to callback parameter was provided');
                                    return callback();
                                }
                            }
                        });
                    }, DELAY + (20 * counter) );
                }
            });
        });
    }
}
/* *************************************************************************
* Erstellung von States incl. 0_userdata & Zugehöriges
*           ENDE
/* ************************************************************************* */
/* *************************************************************************
* Hilffunktion sonstiges
/* ************************************************************************* */
// Klone das Objekt
function cloneObj(j) {
    if (Array.isArray(j)) {
        var arr = [j.length];
        for (let a=0;a<j.length;a++) arr[a]=j[a];
        return arr;
    }
    return JSON.parse(JSON.stringify(j));
}
function myLog(msg, channel){
    if (DEBUG) {
        if (channel=== undefined) channel = 'info';
        log(msg,channel);
    }
}
function getRegEx(value, firstChar) {
    let path = value.split('.');
    if (value[value.length-1] == '.') path.splice(path.length-1,1);
    let r = '';
    if (firstChar !== undefined) r+=firstChar;
    for (let a=0;a<path.length;a++) {
        if (path[a]) r+=path[a]+'\.';
    }
    return r;
}
/* *************************************************************************
* Hilffunktion sonstiges
*           ENDE
/* ************************************************************************* */
