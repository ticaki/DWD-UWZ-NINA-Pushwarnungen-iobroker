//Version 0.94.8 Ursprüngliches Skript
//Version 0.95.4
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
- Automodus und einzelne Pushdienste über iobroker schaltbar (hat nicht mit manuellem Versand zu tun)
- Optimierte Sprachausgabe
- Fingerweg vom .alive state :)

Kleinkram:
- Sprachausgabe: Sturmdetails werden ausgefiltert oder korrekt ausgesprochen (konfigurierbar)
- Sprachausgabe: Pause zwischen dem Absenden der einzelnen Warnungen an die Wiedergabeeinheit konfigurierbar.
- Manuelle Sprachnachrichten können die Zeitschaltuhr missachten. (konfigurierbar)
- Multi-User/Device bei fast allen Pushdiensten verfügbar (außer Datenpunkt & pushover)
- Alexa und SayIt mit Lautstärkeeinstellung. Alexagruppen unterstützen keine Lautstärke trotzdem konfigurieren.
- Zusätzliche Hervorhebung konfigurierbar über warnlevel (im Betreff/Ansage)

Dank an:
- Mic für die createUserStates() Funktionen
- CruziX der diese eingebaut hat.
- crunchip, sigi234, Latzi fürs Testen und Ideen
- die ursprünglichen Authoren s.o.

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
    {"name":'telegram',"value":1},
    {"name":'pushover',"value":2},
    {"name":'email',"value":4},
    {"name":'sayit',"value":8},
    {"name":'home24',"value":16},
    {"name":'alexa',"value":32},
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
var uPushdienst=0;
const DWD = 1;
const UWZ = 2;
const NINA = 4;
const MODES = [{mode:DWD, text:'DWD'},{mode:UWZ, text:'UWZ'},{mode:NINA, text:'NINA'}];
if(mainStatePath[mainStatePath.length-1] != '.') mainStatePath += '.';
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
/* kein oder mehrfach nach gleichem Muster [1,2,3] bzw. ['1','2','3'] Einträge
/* '' ist das selbe wie "", jedoch nicht mischen.
/*
/* var empfaengerEmailID = ["max@musterman.de","max2@musterman.de"];
/* var telegramUser = []; // leer
/* var telegramUser = ['']; // leer
/* var telegramUser = ['Hans']; // User mit Namen Hans
/* var telegramUser = ['Hans','Gretel']; // User mit Namen Hans und User mit Namen Gretel
/* var idSayIt = ["sayit.0.tts.text"];
/* var sayItVolumen = [60]; // Zahl ohne ''
/* var idSayIt = ["sayit.0.tts.text","sayit.1.tts.text"];
/* var sayItVolumen = [60,30]; // mehrfach Zahl ohne ''
/* var ioGoUser = ['max@musterman.de'];
/* var idAlexaSerial =['G090RV32984110Y','G090RZ3345643XR'];
/* var alexaVolumen = [40,30]; // Lautstärke die gleiche Anzahl an Einträgen wie bei idAlexaSerial
/*
/* ************************************************************************* */
/*                          weitere Konfiguration                            */
/* ************************************************************************* */

/* für UWZ Regionnamen eingeben "Warnung der Unwetterzentrale für XXXX" */
/* Textbeispiel anstatt Entenhausen: 'Stadt/Dorfname' 'Berlin' 'den Regionsbezeichnung' 'den Schwarzwald' ''*/
/* var regionName = ['UWZDE12345','Entenhausen'] */
var regionName          = [['','']];

/* Einstellungen zur Emailbenachrichtigung*/
var senderEmailID       = [""]; // mit Sender Emailadresse füllen. email Adapter muß installiert sein. 1 Eintrag erlaubt [] oder ["email1"]
var empfaengerEmailID   = [""];// mit Empfänger Emailadresse füllen. Mehrere Empfänger möglich. [] oder ["email1"] oder ["email1","email2"]

/* Konfiguration Sprachausgabe über Home24-Mediaplayer */
//var idMediaplayer = ["192.168.178.x:Port"];
var idMediaplayer       = [""]; // Eingabe IP-Adresse incl. Port für Home24-Mediaplayer mehrere Möglich - ungetestet

/* Konfiguration Telegram */
var telegramUser        = ['']; // Einzelnutzer ['Hans']; Multinutzer ['Hans','Gretel']; Nutzer vom Adapter übernehmen [];
var telegramChatId      = [''];

/* Konfiguration Sprachausgabe über SayIt */
var idSayIt             = ["sayit.0.tts.text"]; // mehrfach Einträge möglich
var sayItVolumen        = [30]; // gleiche Anzahl wie idSayIt

/* Konfiguration Sprachausgabe über Alexa
/* mehrere Einträge möglich, bei mir ging nur der Echo, 2 dots 2.Gen reagieren nicht auf announcement. */
var idAlexaSerial       = ['']; // die reine Seriennummer des Echos z.B.: var idAlexaSerial =['G090RV32984110Y','G090RV32984110Y']
var alexaVolumen        = [30]; // Lautstärke die gleiche Anzahl an Einträgen wie bei idAlexaSerial

//Konfiguration von ioGo
var ioGoUser = ['']; // // Einzelnutzer ['Hans']; Multinutzer ['Hans','Gretel']; Nutzer vom Adapter übernehmen [];

// Filtereinstellungen
const minlevel          =    1 // Warnungen gleich oder unterhalb dieses Levels nicht senden;
const warnlevel         =    3 // Warnung oberhalb dieses Levels mit zusätzlichen Hinweisen versehen
const minhoehe          =    0 // Warnung für eine Höhe unterhalb dieses Wertes nicht senden
const maxhoehe          =    5000 // Warnung für eine Höhe oberhalb dieses Wertes nicht senden

//Filtere Meldungen selben Typs & Datenquelle, die von einer längeren Meldung mit gleichem oder höherem Level überdeckt werden.
// gilt nicht für Warnung mit höherem Level als warnlevel. Ab 4 wirds beim DWD gefährlich
const uFilterDuplicate = true; // weshalb? hatte 2 Meldungen alles gleich nur die Uhrzeit ->  von 0:00 - 14:00 und von 6:00 - 14:00
//Formatierungsstring für Datum/Zeit Alternative "TT.MM.YYYY SS:mm" KEINE Anpassung nötig
const formatierungString =  "TT.MM.YY SS:mm";

// Sprachausgabe Zeiten
// Für durchgehende Sprachausgabe die Einstellung der Zeiten auf '' setzen. z.B. var startTimeSpeak = '';
var startTimeSpeak =        '6:45';// Zeiten mo-fr ab der Sprachausgaben ok sind. Nicht unter 6 Uhr gehen oder den Schedule ändern
var startTimeSpeakWeekend = '9:00';// sa + so Bemerkung siehe oben
var endTimeSpeak =          '22:30'; // ab diesem Zeitpunkt gibt es keine Sprachausgabe

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
var uSpeakSpeakPerCharAlexa   = 86; // Vorlese Geschwindigkeit pro Zeichen in ms
var uSpeakSpeakPerCharHomeTwo = 90; // Vorlese Geschwindigkeit pro Zeichen in ms
var uSpeakSpeakPerCharSayIt   = 85; // Vorlese Geschwindigkeit pro Zeichen in ms

var uAutoNinaFilterList       = ['CAP@hochwasserzentralen.de']; // filter diesen Sender raus außer Warnlevel ist über warnlevel

var uwzPath=            'javascript.0.UWZ';
var dwdPath=            'dwd.0';
var ninaPath=           'nina.0'

var telegramInstanz=    'telegram.0';
var pushoverInstanz=    'pushover.0';
var ioGoInstanz=        'iogo.0';
var alexaInstanz=       'alexa2.0';
var emailInstanz=       'email';
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


// MODE einstellen über Datenpunkte, das hier hat keine auswirkungen
// nur für ersten Lauf nötig, ab dann überschreiben States diesen Wert
var MODE = 0; // DWD oder UWZ wird von gültigen Einstellungen im Datenpfad überschrieben


// Wandel Usereingabe in sauberes True/False um
forcedSpeak = !!forcedSpeak;
windForceDetailsSpeak = !!windForceDetailsSpeak;

// Variable nicht konfigurierbar
var SPEAK = ALEXA+HOMETWO+SAYIT;
var PUSH = TELEGRAM+PUSHOVER+IOGO+STATE;
var ALLMSG = EMAIL;
var ALLMODES= [DWD,UWZ,NINA];
var placeHolder = 'XXXXPLACEHOLDERXXXX';
var idAlexa = alexaInstanz+'.Echo-Devices.'+placeHolder+'.Commands.announcement';
var idAlexaVolumen = alexaInstanz+'.Echo-Devices.'+placeHolder+'.Commands.speak-volume';
var autoSendWarnings = true;
var forceSpeak = false;
var timer = null;
var onClickCheckRun = false;
var warnDatabase = {new:[],old:[]};
var subDWDhandler = null;
var subUWZhandler = null;
var subNINAhandler = null;
var subDublicateNinaTimer = null;
var timeoutFromCreateState = null;
var dwdpushdienst = uPushdienst, ninapushdienst = uPushdienst,uwzpushdienst = uPushdienst;
var firstRun = true;;
const configModeState = mainStatePath+'config.mode';
const mirrorMessageState = mainStatePath+'message';

// Warning types
var warningTypesString = {};
warningTypesString[DWD] = [
    'Gewitter',
    'Sturm',
    'Regen',
    'Schnee',
    'Nebel',
    'Frost',
    'Glatteis',
    'Tauwetter',
    'Hitzewarnungen',
    'UV_Warnungen'/*,
    'Kuestenwarnungen',
    'Binnenseewarnungen'*/
];

warningTypesString[UWZ] = [
    "n_a",
    "unbekannt",
    "Sturm-Orkan",
    "Schneefall",
    "Starkregen",
    "Extremfrost",
    "Waldbrandgefahr",
    "Gewitter",
    "Glätte",
    "Hitze",
    "Glatteisregen",
    "Bodenfrost"
];

// State über den man gesonderte Aktionen auslösen kann, gibt die höchste Warnstufe aus.
const stateAlert = // Änderungen auch in setAlertState() anpassen
[
    {"name":'level',"default":-1,"type":{ read: true, write: false, type: "number",name:''}},
    {"name":'type',"default":-1,"type":{ read: true, write: false, type: "number",name:''}},
    {"name":'begin',"default":null,"type":{ read: true, write: false, role: "value.datetime", type: "string", name:''}},
    {"name":'end',"default":null,"type":{ read: true, write: false, role: "value.datetime", type: "string", name:''}},
    {"name":'headline',"default":'',"type":{ read: true, write: false, type: "string", name:''}},
    {"name":'description',"default":'',"type":{ read: true, write: false, type: "string", name:''}},
    {"name":'color',"default":'',"type":{ read: true, write: false, type: "string", name:''}},
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

/* *************************************************************************
* Überprüfe Nutzerkonfiguration
/* ************************************************************************* */


testValueTypeLog(uPushdienst&(SPEAK+PUSH+ALLMSG), 'uPushdienst', 'number', true);
testValueTypeLog(uwzPath, 'uwzPath', 'string', true);
testValueTypeLog(dwdPath, 'dwdPath', 'string', true);
testValueTypeLog(ninaPath, 'ninaPath', 'string', true);
testValueTypeLog(regionName, 'regionName', 'array');
if (!Array.isArray(regionName[0])) {
    regionName=[regionName];
}
{
    let b = 0;
    for (var a=0;a<regionName.length;a++) {
        b++;
        if (Array.isArray(regionName) && regionName[a].length!=0) {
            if (regionName[a].length!=2 ) {
                log('Konfiguration enthält Fehler. var regionName - Eintrag: '+(b)+' hat keine 2 Werte [\'UWZxxxxxxx\',\'name\']','error');
                stopScript();
            } else {
                if (!regionName[a][0] && !regionName[a][1] ) regionName.splice(a--,1)
                else {
                    testValueTypeLog(regionName[a][0], 'regionName Wert: '+(b)+'.01', 'string', true);
                    testValueTypeLog(regionName[a][1], 'regionName Wert: '+(b)+'.02', 'string');
                }
            }
        } else {
            regionName.splice(a--,1)
        }
    }
}
{
    for (let a=0;a<senderEmailID.length;a++) {
        if (!senderEmailID[a]) senderEmailID.splice(a--,1);
        else {
            testValueTypeLog(senderEmailID[a],'senderEmailID','string');
        }
    }
    for (let a=0;a<empfaengerEmailID.length;a++) {
        if (!empfaengerEmailID[a]) empfaengerEmailID.splice(a--,1);
        else {
            testValueTypeLog(empfaengerEmailID[a],'empfaengerEmailID','string');
        }
    }
    for (let a=0;a<idAlexaSerial.length;a++) {
        if (!idAlexaSerial[a]) idAlexaSerial.splice(a--,1);
        else {
            testValueTypeLog(idAlexaSerial[a],'idAlexaSerial','string');
        }
    }
    for (let a=0;a<idMediaplayer.length;a++) {
        if (!idMediaplayer[a]) idMediaplayer.splice(a--,1);
        else {
            testValueTypeLog(idMediaplayer[a],'idMediaplayer','string');
        }
    }
    for (let a=0;a<telegramUser.length;a++) {
        if (!telegramUser[a]) telegramUser.splice(a--,1);
        else {
            testValueTypeLog(telegramUser[a],'telegramUser','string');
        }
    }
    for (let a=0;a<idSayIt.length;a++) {
        if (!idSayIt[a]) idSayIt.splice(a--,1);
        else {
            testValueTypeLog(idSayIt[a],'idSayIt','string');
        }
    }
    for (let a=0;a<ioGoUser.length;a++) {
        if (!ioGoUser[a]) ioGoUser.splice(a--,1);
        else {
            testValueTypeLog(ioGoUser[a],'ioGoUser','string');
        }
    }
    for (let a=0;a<telegramChatId.length;a++) {
        if (!telegramChatId[a]) telegramChatId.splice(a--,1);
        else {
            testValueTypeLog(telegramChatId[a],'telegramChatId','string');
        }
    }
    for (let a=0;a<sayItVolumen.length;a++) {
        if (sayItVolumen[a] === undefined) sayItVolumen[a]=0;
        else testValueTypeLog(sayItVolumen[a],'sayItVolumen','number');
    }
    for (let a=0;a<alexaVolumen.length;a++) {
        if (alexaVolumen[a] === undefined) alexaVolumen[a]=0;
        else testValueTypeLog(alexaVolumen[a],'alexaVolumen','number');
    }
    if ((uPushdienst&ALEXA) != 0) {
        testValueTypeLog(idAlexaSerial,'idAlexaSerial','array');
        if (idAlexaSerial.length==0) {
            log('Keine Alexa/Echoseriennummer eingetragen. Überpüfen!','error');
            stopScript();
        }
        for (let a=0;a<idAlexaSerial.length;a++) {
            if (!extendedExists(getFullId(idAlexa,idAlexaSerial[a]))) {
                log('Alexa-Serial '+idAlexaSerial[a]+' ist fehlerhaft. Überpüfen!','error');
                stopScript();
            }
        }
    }
}

if ((uPushdienst&SAYIT) != 0) {
    testValueTypeLog(idSayIt,'idSayIt','array');
    for (let a=0;a<idSayIt.length;a++) {
        if (
            !extendedExists(idSayIt[a])
        ) {
            log('SayIt-Konfiguration ist fehlerhaft. Überpüfen!','error');
            stopScript();
        }
    }
}
if ((uPushdienst&EMAIL) != 0) {
    if (senderEmailID.length>1) {
        log('eMail-Konfiguration ist fehlerhaft. Nur 1 Eintrag in senderEmailID erlaubt!','error');
        stopScript();
    }
}



/***************************************************************************************
* function testValueTypeLog(test, teststring, typ, need=false)
* @param {any} test           Variable deren Typ/Inhalt getestet werden soll
* @param {string} teststring  Variable als String, wie er im Script steht
* @param {string} typ         Soll-Type der Variable alles + 'array'
* @param {boolean} need       Variable darf nicht null/leer sein
/***************************************************************************************/
function testValueTypeLog(test, teststring, typ, need=false) {
    if (test === undefined) {
        let errorLog = 'Konfiguration enthält Fehler. Der/Ein Wert von var '+teststring+' ist undefiniert oder fehlt!';
        log(errorLog,'error');
        stopScript();
    }
    if (typ == 'array') {
        if (!test || !Array.isArray(test)) {
            let errorLog = 'Konfiguration enthält Fehler. Der/Ein Wert von var '+teststring+' ist kein Array. Es fehlen wohl die umschließenden []!';
            log(errorLog,'error');
            stopScript();
        }
    } else if ( typeof test !== typ ) {
        let errorLog = 'Konfiguration enthält Fehler. Ändere '+teststring+' = [';
        if (typ == 'string') {
            errorLog+=test+'];//('+typeof test+') in '+teststring+' = [\''+test+'\'];//('+typ+')';
        } else {
            errorLog+='\''+test+'\'];//('+typeof test+') in '+teststring+' = ['+test+'];//('+typ+')';
        }
        log(errorLog, 'error');
        stopScript();
    }
    if (need && !test) {
        log('Konfiguration enthält Fehler. Der Wert von var '+teststring+' wird benötigt, ist jedoch nicht konfiguriert!','error');
        stopScript();
    }
}

/* *************************************************************************
* Überprüfe Nutzerkonfiguration ENDE
/* *************************************************************************
* Erstellung von Datenpunkten
* Trigger aktivieren und Datenpflege für eigene Datenpunkte
/* ************************************************************************* */

function changeMode(modeFromState) {
    setConfigModeStates(modeFromState);
    if (MODE != modeFromState || firstRun) {
        MODE=modeFromState;
        myLog('MODE wurde geändert. MODE: '+MODE + ' firstRun:'+firstRun);
        InitDatabase(firstRun);
        dataSubscribe();
        setAlertState();
        if (autoSendWarnings && !firstRun) checkWarningsMain();
        firstRun = false;
    }
}
{

    // State der Pushnachrichten über pushover/telegram spiegelt
    if (!extendedExists(mirrorMessageState)) {
        createCustomState(mirrorMessageState,'', {read: true, write: false, desc: "Beschreibung", type: "string",});
    }

    // MODE änderung über Datenpunkte string
    if (!extendedExists(aliveState)) {
        createCustomState(aliveState, false, {read: true, write: false, desc: "Script läuft", type: "boolean", def: false });
    }

    if (!extendedExists(configModeState)) {
        createCustomState(configModeState,'DWD', {read: true,write: true,desc: "Modusauswahl DWD oder UWZ",type: "string",def: ''});
    } else {
        on({id:configModeState, change:'ne', ack:false}, function(obj){
            if (obj.state.val && typeof obj.state.val === 'string'
            && (obj.state.val.toUpperCase().includes('DWD') || obj.state.val.toUpperCase().includes('UWZ')|| obj.state.val.toUpperCase().includes('NINA'))) {
                //setState(configModeState, MODE,true)
                let mode=0;
                mode |= obj.state.val.toUpperCase().includes('DWD')?DWD:0;
                mode |= obj.state.val.toUpperCase().includes('UWZ')?UWZ:0;
                mode |= obj.state.val.toUpperCase().includes('NINA')?NINA:0;
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
    for (let a=0;a<MODES.length;a++) {
        let tok = MODES[a].text.toLowerCase();
        let id = mainStatePath+'config.'+tok;
        if (!extendedExists(id)) {
            let mi = !!(MODE&MODES[a].mode);
            createCustomState(id, mi, {read: true,write: true,desc: "Aktivere "+tok.toUpperCase()+'.',type: "boolean",def: mi});
        } else {
            on({id:id, change:'ne', ack:false}, function(obj){
                let arr = obj.id.split('.');
                let tok = arr[arr.length-1].toUpperCase();
                let mode = MODES[MODES.findIndex(function(j){return j.text==tok})].mode;
                let oldMode = MODE;
                if (obj.state.val) oldMode|=mode;
                else oldMode&=~mode;
                myLog('Modus wird geändert von: '+MODE);
                changeMode(oldMode);
            });
            if (getState(id).val) MODE|=MODES[a].mode;
            else MODE&=~MODES[a].mode;
        }
    }
    //Initialisierung falls oben nicht geschehen
    if (firstRun) changeMode(MODE);
    // Automodus ein und ausschalten
    let id = mainStatePath+'config.auto.on';
    if (!extendedExists(id)) {
        createCustomState(id, true, {read: true,write: true,desc: "Aktivere automatischen Push bei eintreffen der Warnungen.",type: "boolean",def: true});
    } else {
        autoSendWarnings = getState(id).val;
        setState(id, autoSendWarnings, true);
    }
}

// setzte alle MODE Datenpunkte
function setConfigModeStates(mode) {
    if (extendedExists(configModeState)) setState(configModeState, (mode&DWD?'DWD':'')+(mode&UWZ?'UWZ':'')+(mode&NINA?'NINA':''), true);
    for (let a=0;a<MODES.length;a++) {
        let t = MODES[a].text.toLowerCase();
        let id = mainStatePath+'config.'+t;
        if (extendedExists(id)) setState(id,!!(mode&MODES[a].mode),true);
    }
}


{
    let allStateExist = true;
    let mode = [MODES[0],MODES[1]];
    for (let c=0;c<mode.length;c++) {
        let stateAlertId = mainStatePath+'alert.'+mode[c].text.toLowerCase()+'.';
        for (let b=0;b<warningTypesString[mode[c].mode].length;b++) {
            for (let a=0;a<stateAlert.length;a++)
            {
                let stateAlertIdFull = stateAlertId+warningTypesString[mode[c].mode][b]+'.'+stateAlert[a].name;
                stateAlert[a].type.name = stateAlert[a].name;
                if (!extendedExists(stateAlertIdFull)) {
                    createCustomState(stateAlertIdFull,stateAlert[a].default, stateAlert[a].type);
                    allStateExist=false;
                }
            }
        }
    }
    if (allStateExist) setAlertState();
}

// Nachrichtenversand per Click States erzeugen und subscript
for (var a=0;a<konstanten.length;a++){
    if (!extendedExists(mainStatePath+'commands.'+konstanten[a].name)) {
        createCustomState(mainStatePath+'commands.'+konstanten[a].name,false, {read: true,write: true,desc: "Beschreibung",type: "boolean",role: "button",def: false});
    }
    for (let x=0;x<MODES.length;x++)
    {
        let oid = mainStatePath+'config.auto.'+MODES[x].text.toLowerCase()+'.'+konstanten[a].name;
        if (!extendedExists(oid)) {
            createCustomState(oid,((uPushdienst&konstanten[a].value)!=0), {read: true,write: true,desc: "Schalte Autopushmöglichkeiten ein/aus",type: "boolean",def: ((uPushdienst&konstanten[a].value)!=0)});
        } else {
            setConfigKonstanten(oid, getState(oid).val);
        }
    }
}
// on() für alles unter config.auto
subscribe({id: new RegExp(getRegEx(mainStatePath+'config.auto','^')+'.*'), change:'ne', ack: false},function(obj){
    if (obj.id == mainStatePath+'config.auto.on') {
        myLog('trigger: ' + obj.id + ' Value:' + obj.state.val);
        autoSendWarnings = !!obj.state.val;
        setState(obj.id, autoSendWarnings, true);
    } else {
        myLog('else trigger: ' + obj.id + ' Value:' + obj.state.val);
        setConfigKonstanten(obj.id, obj.state.val);
    }
});
subscribe({id: new RegExp(getRegEx(mainStatePath+'commands','^')+'.*')},function(obj){
    if (!obj.state.val) return;
    setState(obj.id,false,true);
    let b = obj.id.split('.');
    let d = konstanten.findIndex(function(c){return (c.name===b[b.length-1]);})
    if (d == -1) return;
    warnDatabase.old = [];
    let oPd = uPushdienst;
    uPushdienst &=konstanten[d].value;
    forceSpeak = forcedSpeak;
    onClickCheckRun = true;
    checkWarningsMain();
    onClickCheckRun = false;
    forceSpeak = false;
    uPushdienst = oPd
});

// Hilfsfunktion zu on()
function setConfigKonstanten(id, val){
    let b = id.split('.');
    let m = b[b.length-2];
    let d = konstanten.findIndex(function(c){return (c.name===b[b.length-1]);});
    if (d == -1) return;
    let value = konstanten[d].value
    let tp=0;
    switch (m) {
        case 'dwd': {
            dwdpushdienst = getNewFlags(dwdpushdienst, value, val);
            break;
        }
        case 'uwz': {
            uwzpushdienst = getNewFlags(uwzpushdienst, value, val);
            break;
        }
        case 'nina': {
            ninapushdienst = getNewFlags(ninapushdienst, value, val);
            break;
        }
        default: {
            log('unbekannter Mode:'+m+'in setConfigKonstanten', 'error');
        }
    }
    setState(id, val, true);
}

// setzte die Alert States auf die höchste aktuelle Warnstufe
function setAlertState(){
    let mode=[MODES[0],MODES[1]];
    for (let a=0;a<2;a++) {
        if (!(MODE&mode[a].mode)) continue;
        let stateAlertid = mainStatePath+'alert.'+mode[a].text.toLowerCase()+'.';
        for (let b=0;b<warningTypesString[mode[a].mode].length;b++)
        {
            let stateAlertIdFull = stateAlertid+warningTypesString[mode[a].mode][b]+'.';
            let AlertLevel = -1;
            let AlertIndex = -1;
            for (let c=0;c<warnDatabase.new.length;c++) {
                if (warnDatabase.new[c].type == b && warnDatabase.new[c].level > AlertLevel) {
                    AlertLevel=warnDatabase.new[c].level;
                    AlertIndex=c;
                }
            }
            if (extendedExists(stateAlertIdFull+stateAlert[0].name)) {
                if (getState(stateAlertIdFull+stateAlert[0].name).val!=AlertLevel) {
                    setState(stateAlertIdFull+stateAlert[0].name,AlertLevel);
                    setState(stateAlertIdFull+stateAlert[1].name,b);
                    setState(stateAlertIdFull+stateAlert[2].name,(AlertIndex>-1?formatDate(new Date(warnDatabase.new[AlertIndex].start),formatierungString):''));
                    setState(stateAlertIdFull+stateAlert[3].name,(AlertIndex>-1?formatDate(new Date(warnDatabase.new[AlertIndex].end),formatierungString):''));
                    setState(stateAlertIdFull+stateAlert[4].name,(AlertIndex>-1?warnDatabase.new[AlertIndex].headline:''));
                    setState(stateAlertIdFull+stateAlert[5].name,(AlertIndex>-1?warnDatabase.new[AlertIndex].description:''));
                    setState(stateAlertIdFull+stateAlert[6].name,(AlertIndex>-1?warnDatabase.new[AlertIndex].color:''));
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


function getAutoPushFlags(mode) {
    if (onClickCheckRun) return uPushdienst;
    if (mode === undefined) return null;
    if (mode==DWD) return (uPushdienst&dwdpushdienst);
    if (mode==UWZ) return (uPushdienst&uwzpushdienst);
    if (mode==NINA) return (uPushdienst&ninapushdienst);
    return 0;
}

function getNewFlags(g, f, b) {
    if (b) g |= uPushdienst & f;
    else g &= ~f;
    return g;
}

function getModeState()
{
    if (extendedExists(configModeState)) {
        let value = getState(configModeState).val;
        let mode = 0;
        mode |= value.toUpperCase().includes('DWD')?DWD:0;
        mode |= value.toUpperCase().includes('UWZ')?UWZ:0;
        mode |= value.toUpperCase().includes('NINA')?NINA:0;
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

function setWeekend()
{
    if (forceSpeak) return;
    let date = new Date();
    let n = date.getDay();
    let weekend = 0;
    weekend = (n === 0 || n == 6) ? 1 : 0;
    if(weekend == 1){                     // wenn Wochenende, dann setze Start auf 9h, sonst 6:45h
        START = convertStringToDate(startTimeSpeakWeekend);
    }
    else{
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
    d.setHours(Number(e[0]));
    d.setMinutes(Number(e[1]));
    d.setSeconds(0);
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
    if (!forcedSpeak) forceSpeak = (!startTimeSpeakWeekend||!startTimeSpeak||!endTimeSpeak);
    setWeekend();
    let DebugMail ='';
    if (DEBUGSENDEMAIL) {
        for (a=0;a<warnDatabase.new.length;a++) DebugMail = buildHtmlEmail(DebugMail,'warnDatabase.new'+a, JSON.stringify(warnDatabase.new[a],null,false));
        for (a=0;a<warnDatabase.old.length;a++) DebugMail = buildHtmlEmail(DebugMail,'warnDatabase.old'+a, JSON.stringify(warnDatabase.old[a],null,false));
        DebugMail = buildHtmlEmail(DebugMail,'warnDatabase.new.length', warnDatabase.new.length.toString(),null,false);
        DebugMail = buildHtmlEmail(DebugMail,'warnDatabase.old.length', warnDatabase.old.length.toString(),null,false);
    }
    // Sicher entfernen
    removeDuplicateHash();
    if (uFilterDuplicate) {
        let dn = new Date();
        for(let a=0;a<warnDatabase.new.length;a++) {
            let w = warnDatabase.new[a];
            for(let b=a+1;b<warnDatabase.new.length;b++) {
                let w2 = warnDatabase.new[b];
                if (
                    w.mode !== w2.mode
                    || w.type !== w2.type
                    || w.level > warnlevel
                    || w2.level > warnlevel
                ) continue;
                if (w.start >= w2.start && w.end <= w2.end && w.level<= w2.level) {
                    let i = warnDatabase.old.findIndex(function(j){return w.hash === j.hash});
                    if (i!=-1) warnDatabase.old.splice(i,1);
                    warnDatabase.new.splice(a--,1);
                    break;
                } else if (w.start <= w2.start && w.end >= w2.end && w.level>= w2.level) {
                    let i = warnDatabase.old.findIndex(function(j){return w2.hash === j.hash});
                    if (i!=-1) warnDatabase.old.splice(i,1);
                    warnDatabase.new.splice(b--,1);
                    break;
                    // w endet vor w2 && w2 startet bevor w endet && w hat kleiner gleiches level wie w2 -> lösche w
                    // Hochwassermeldungen werden laufend aufgehoben und durch neue erstzt;
                } else if (w.end < w2.end && w2.start < w.end  && w.level <= w2.level) {
                    let i = warnDatabase.old.findIndex(function(j){return w.hash === j.hash});
                    if (i!=-1) warnDatabase.old.splice(i,1);
                    warnDatabase.new.splice(a--,1);
                    // siehe oben nur umgedreht
                } else if (w2.end < w.end && w.start < w2.end  && w2.level <= w.level) {
                    let i = warnDatabase.old.findIndex(function(j){return w2.hash === j.hash});
                    if (i!=-1) warnDatabase.old.splice(i,1);
                    warnDatabase.new.splice(b--,1);
                }
            }
        }
    }
    let oarr=[];
    let narr=[];
    for(let a=0;a<warnDatabase.new.length;a++) {
        let w = warnDatabase.new[a];
        for(let b=0;b<warnDatabase.old.length;b++) {
            let w2 = warnDatabase.old[b];
            if (
                w.mode !== w2.mode
                || w.type !== w2.type
                || w.level > warnlevel
                || w2.level > warnlevel
            ) continue;
            // w==w2 das erste Vorkommen wird überspungen.
            let dup = warnDatabase.old.findIndex(function(j){return j.hash==w.hash});
            if (dup == b) continue;
            // w endet vor/gleich w2 && w2 startet bevor/gleich w endet && w hat kleiner gleiches level wie w2 -> lösche w2
            if (w2.end <= w.end && w.start <= w2.end  && w2.level <= w.level) {
                let i = warnDatabase.new.findIndex(function(j){return (j.hash==w2.hash)});
                if (i != -1) warnDatabase.new.splice(a--,1);
                warnDatabase.old.splice(b--,1);
            }
        }
    }


    warnDatabase.new.sort(function(a,b) {return a.level==b.level?b.begin-a.begin:b.level-a.level;})
    setAlertState();
    var collectMode = 0;
    if (DEBUGSENDEMAIL) {
        let a;
        DebugMail = buildHtmlEmail(DebugMail,'uPushdienst', uPushdienst,null,false);
        for (a=0;a<warnDatabase.new.length;a++) DebugMail = buildHtmlEmail(DebugMail,'warnDatabase.new'+a, JSON.stringify(warnDatabase.new[a],null,false));
        for (a=0;a<warnDatabase.old.length;a++) DebugMail = buildHtmlEmail(DebugMail,'warnDatabase.old'+a, JSON.stringify(warnDatabase.old[a],null,false));
        DebugMail = buildHtmlEmail(DebugMail,'warnDatabase.new.length', warnDatabase.new.length.toString(),null,false);
        DebugMail = buildHtmlEmail(DebugMail,'warnDatabase.old.length', warnDatabase.old.length.toString(),null,true);
        sendMessage(uPushdienst&EMAIL, 'Debug checkWarningsMain() '+scriptName, '','',DebugMail);
    }
    /* Bereich für 'Alle Wetterwarnungen wurden aufgehoben' */
    if(warnDatabase.new.length==0 && (warnDatabase.old.length>0 || onClickCheckRun)) {
        for (let a=0;a<warnDatabase.old.length;a++) collectMode|=warnDatabase.old[a].mode;
        let pushMsg = 'Alle Warnmeldungen'+artikelMode(collectMode)+'wurden aufgehoben';

        /* Bereich für Sprachausgabe über SayIt & Alexa & Home24*/
        if ( forceSpeak || compareTime(START, ENDE, 'between')){                  // Ansage über Sayit nur im definierten Zeitbereich
            sendMessage(getAutoPushFlags(collectMode)&SPEAK,'','',pushMsg,'');
        }
        myLog('all all:'+pushMsg);
        sendMessage(getAutoPushFlags(collectMode)&PUSH,((collectMode&NINA||!collectMode)?'Entwarnungen':'Wetterentwarnung'),pushMsg,'','');
        sendMessage(getAutoPushFlags(collectMode)&ALLMSG,((collectMode&NINA||!collectMode)?'Entwarnungen':'Wetterentwarnung')+artikelMode(collectMode)+ '(iobroker)', '', '', buildHtmlEmail('', pushMsg, null, 'silver', true));

        /* alle Sicherungen Wetterwarnung löschen */
        warnDatabase.old = cloneObj(warnDatabase.new);
        return;
    }
    let emailHtmlWarn='';
    let emailHtmlClear='';
    let speakMsgTemp=[];
    collectMode=0;
    /* Bereich für 'Wetterwarnung gültig bis wurde aufgehoben' */
    for(let i = 0; i < warnDatabase.old.length; i++) {
        let description = warnDatabase.old[i].description;
        let headline = warnDatabase.old[i].headline;
        let hash = warnDatabase.old[i].hash;
        let area = warnDatabase.old[i].areaID;
        let mode = warnDatabase.old[i].mode;
        if(description && headline && warnDatabase.new.findIndex(function(j){return j.hash == hash;}) == -1 ) {
            myLog('json old:'+JSON.stringify(warnDatabase.old[i]));
            collectMode|=mode;
            let end = getFormatDate(warnDatabase.old[i].end);
            // Text Entwarnungen
            let prefix = ''
            if (mode === NINA) {
                prefix='Die Warnung';
            } else {
                prefix='Die Wetterwarnung';
            }
            let pushMsg = prefix+artikelMode(mode)+"'"+ headline+area+(end?" gültig bis " + end + "Uhr'":'')+" wurde aufgehoben.";
            // email html newline
            emailHtmlClear+=pushMsg+'<br><br>';
            // Insgesamt x... anhängen
            pushMsg += getStringWarnCount(null, warnDatabase.new.length);
            sendMessage(getAutoPushFlags(mode)&PUSH,(mode==NINA?'Entwarnung':'Wetterentwarnung'),pushMsg,'','');
            myLog('text old:'+pushMsg);

            /* Sprache: Wetterentwarnungen */
            pushMsg = headline +artikelMode(mode,true)+ area + (end?' gültig bis ' + getFormatDateSpeak(end) + ' Uhr':'')+' wurde aufgehoben' + '  .  ';
            speakMsgTemp.push([pushMsg,mode]);
            myLog('Sprache old:'+pushMsg);
        }
    }
    let gefahr = false;
    let count=0;
    /* Bereich für 'Neue Amtliche Wetterwarnung' */
    for(let i = 0; i < warnDatabase.new.length; i++) {
        let headline = warnDatabase.new[i].headline;
        let description = warnDatabase.new[i].description;
        let level = warnDatabase.new[i].level;
        let instruction = warnDatabase.new[i].instruction;
        let hash = warnDatabase.new[i].hash;
        let area = warnDatabase.new[i].areaID;
        let color = warnDatabase.new[i].color;
        let mode = warnDatabase.new[i].mode;
        if(hash && warnDatabase.old.findIndex(function(j){return j.hash == hash;}) == -1 ) {
            myLog('json old:'+JSON.stringify(warnDatabase.new[i]));
            collectMode|=mode;
            count++;
            if (!gefahr) gefahr=level>warnlevel;
            let begin = getFormatDate(warnDatabase.new[i].start);
            let end = getFormatDate(warnDatabase.new[i].end)
            let sTime =' ';
            let bt = (begin && end);
            if (bt) sTime= "gültig vom " + begin + " Uhr bis " + end + " Uhr";
            let pushMsg =area + (bt?"\n"+sTime:'')+"\n" + description;
            let html ='';
            if (warnDatabase.new[i].html != undefined) html=sTime+ "<br>" +warnDatabase.new[i].html.description;
            else html=(bt?sTime + '<br>':'') +description;
            let instPush = '';
            if (!!instruction && typeof instruction === 'string' && instruction.length > 2){
                instPush+='\nHandlungsanweisungen:\n '+instruction;
                if (warnDatabase.new[i].html != undefined) html+='<br>Handlungsanweisungen:<br>'+warnDatabase.new[i].html.instruction;
                else html+='<br>Handlungsanweisungen:<br>'+instruction;
            }
            // Anzahl Meldungen erst am Ende zu email hinzufügen
            if (warnDatabase.new[i].html != undefined) emailHtmlWarn=buildHtmlEmail(emailHtmlWarn,warnDatabase.new[i].html.headline+artikelMode(mode)+area,html,color,false);
            else emailHtmlWarn=buildHtmlEmail(emailHtmlWarn,headline+artikelMode(mode)+area,html,color,false);
            /* ab Level 4 zusätzlicher Hinweis */
            let topic = '';
            if ( mode !== NINA ) {
                topic = (level>warnlevel)?'Wichtige Wetterwarnung':'Wetterwarnung';
            } else {
                topic = (level>warnlevel)?'Gefahr Warnung':'Warnung';
            }
            pushMsg = headline + artikelMode(mode) + pushMsg + instPush;
            if (warnDatabase.new.length>1) pushMsg += getStringWarnCount(count, warnDatabase.new.length);
            sendMessage(getAutoPushFlags(mode)&PUSH,topic,pushMsg,'','');
            myLog('text new:'+pushMsg);
            /* Sprache: Verknüpfen aller aktuellen Warnmeldungen */
            var replaceDescription0 = replaceTokenForSpeak(description);
            if ( mode !== NINA ) {
                topic = (level>warnlevel)?'Achtung Unwetter  ':'';
            } else {
                topic = (level>warnlevel)?'Gefahr ':'';
            }
            if (bt) sTime = "gültig vom " + getFormatDateSpeak(begin) + " Uhr, bis " + getFormatDateSpeak(end) + " Uhr. ";
            pushMsg = topic + headline+ artikelMode(mode,true)+area + sTime + replaceDescription0 + instPush;
            speakMsgTemp.push([pushMsg,mode]);
            myLog('Sprache new:'+pushMsg);
        }
    }
    /* Bereich für Sprachausgabe */
    if (speakMsgTemp.length>0 && (forceSpeak || compareTime(START, ENDE, 'between')) && (uPushdienst & (HOMETWO+SAYIT+ALEXA))!=0 ) {
        let a=100;
        let b = a;
        let c = a;
        while (speakMsgTemp.length>0)
        {
            let msgAppend = '';
            if (speakMsgTemp.length > 1) {
                if (speakMsgTemp.length-1==1) {
                    msgAppend = ' Eine weitere neue Warnung.';
                } else {
                    msgAppend = speakMsgTemp.length-1+' weitere neue Warnungen.';
                }
            } else {
                if (warnDatabase.new.length==0) {if ( !onClickCheckRun )msgAppend = ' keine weitere Warnung.';}
                else {
                    if (warnDatabase.new.length==1) msgAppend = ' Insgesamt eine aktive Warnung.';
                    else msgAppend = ' Insgesamt '+warnDatabase.new.length+ ' aktive Warnungen.';
                }
            }
            if((getAutoPushFlags(speakMsgTemp[0][1]) & HOMETWO)!=0 ){
                setTimeout(function(msg,msg2){
                    sendMessage(HOMETWO,'','',msg+msg2,'');
                },a,speakMsgTemp[0][0], msgAppend);
            }
            /* Bereich für Sprachausgabe über SayIt + Alexa */
            if ((getAutoPushFlags(speakMsgTemp[0][1]) & SAYIT)!=0) {
                setTimeout(function(msg,msg2){
                    sendMessage(SAYIT,'','',msg+msg2,'');
                },b,speakMsgTemp[0][0], msgAppend);
            }
            if ((getAutoPushFlags(speakMsgTemp[0][1]) & ALEXA)!=0) {
                setTimeout(function(msg,msg2){
                    sendMessage(ALEXA,'','',msg+msg2,'');
                },c,speakMsgTemp[0][0], msgAppend);
            }
            a+=uSpeakSpeakPerCharHomeTwo*speakMsgTemp[0].length+2000;
            b+=uSpeakSpeakPerCharSayIt*speakMsgTemp[0].length+2000;
            c+=uSpeakSpeakPerCharAlexa*speakMsgTemp[0].length+2000;
            myLog('Länge der auszugebenen Sprachnachricht: ' + speakMsgTemp[0].length.toString()+' Nachricht:'+speakMsgTemp[0]);
            speakMsgTemp.shift();
        }
    }
    if ((getAutoPushFlags(collectMode) & ALLMSG)!=0 && (emailHtmlWarn+emailHtmlClear)) {
        emailHtmlWarn = buildHtmlEmail(emailHtmlWarn, (emailHtmlClear?'Aufgehobene Warnungen':null),emailHtmlClear,'silver',false);
        emailHtmlWarn = buildHtmlEmail(emailHtmlWarn,null,getStringWarnCount(null, warnDatabase.new.length),null,true);
        sendMessage(getAutoPushFlags(collectMode)&ALLMSG,(gefahr?"Wichtige Warnungen":"Warnungen")+ artikelMode(collectMode) + "(iobroker)", '', '', emailHtmlWarn);
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
function sendMessage(pushdienst, topic, msgsingle, msgspeak, msgall) {
    if (msgsingle) {
        if ((pushdienst & TELEGRAM)!=0) {
            if (telegramUser.length>0) {
                for (let a=0;a<telegramUser.length;a++) {
                    sendTo (telegramInstanz, {user: telegramUser[a], text: msgsingle});
                }
            }
            if (telegramChatId.length>0){
                for (let a=0;a<telegramChatId.length;a++) {
                    sendTo (telegramInstanz, {ChatId: telegramChatId[a], text: msgsingle});
                }
            }
            if(!(telegramUser.length>0||telegramChatId.length>0)) {
                sendTo (telegramInstanz, msgsingle);
            }
        }
        if ((pushdienst & PUSHOVER)!=0) {
            sendTo(pushoverInstanz, msgsingle);
        }
        if ((pushdienst & IOGO)!=0) {
            if (ioGoUser.length>0) {
                for (let a=0;a<ioGoUser.length;a++) {
                    myLog('ioGoInstanz:'+ ioGoInstanz +' ioGoUser'+a+1+':'+ioGoUser[a]+' length:'+ioGoUser[a].length);
                    sendTo(ioGoInstanz, "send", {
                        user:                   ioGoUser[a],
                        text:                   topic,
                        title:                  msgsingle
                    });
                }
            } else {
                sendTo(ioGoInstanz, "send", {
                    text:                   topic,
                    title:                  msgsingle
                });
            }
        }
        if ((pushdienst & STATE)!=0 ) {
            setState(mirrorMessageState,msgsingle,true);
        }
    }
    if(msgspeak){
        if((pushdienst & HOMETWO)!=0 ){
            for(let a=0;a<idMediaplayer.length;a++) {
                var Url2 = "http://" + idMediaplayer[a] + "/track=4fachgong.mp3|tts=" + msgspeak;
                myLog('Url2 :' + Url2);
                request(Url2);
            }
        }
        if ((pushdienst & SAYIT)!=0) {
            for(let a=0;a<idSayIt.length;a++) {
                setState(idSayIt[a], sayItVolumen[a] + ";" + msgspeak);
            }
        }
        if ((pushdienst & ALEXA)!=0) {
            for(let a=0;a<idAlexaSerial.length;a++) {
                // Wenn auf Gruppe keine Lautstärken regelung möglich
                if (extendedExists(getFullId(idAlexaVolumen,idAlexaSerial[a]))) setState(getFullId(idAlexaVolumen,idAlexaSerial[a]), alexaVolumen[a]);
                setState(getFullId(idAlexa,idAlexaSerial[a]), msgspeak);
            }
        }
    }
    if (msgall &&(pushdienst & EMAIL)!=0) {
        let nMsg = msgall[0].toUpperCase()+msgall.substring(1);
        let nTopic = topic+':';
        if (empfaengerEmailID.length>0) {
            for (let a=0;a<empfaengerEmailID.length;a++) {
                sendTo(emailInstanz, senderEmailID[0]? {
                    from: senderEmailID[0], to: empfaengerEmailID[a], subject: nTopic, html: nMsg
                }:{
                    to: empfaengerEmailID[a], subject: nTopic, html: nMsg
                });
            }
        } else {
            sendTo(emailInstanz, senderEmailID[0]?{from: senderEmailID[0], subject: nTopic, text: nMsg}:{subject: nTopic, html: nMsg});
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
function dataSubscribe(){
    if (subDWDhandler) unsubscribe(subDWDhandler);
    if ( MODE&DWD) {
        let r = getRegEx(dwdPath,'^');
        r +='.*\.object$';
        myLog('subscribe path:'+r);
        subDWDhandler = subscribe({id:new RegExp(r), change:'ne'}, onChangeDWD);
    }
    if (subUWZhandler) unsubscribe(subUWZhandler);
    if (MODE&UWZ) {
        let r = getRegEx(uwzPath,'^');
        r +='.*\.object$';
        myLog('subscribe path:'+r);
        subUWZhandler = subscribe({id:new RegExp(r), change:'ne'}, onChangeUWZ);
    }
    if (subNINAhandler) unsubscribe(subNINAhandler);
    if (MODE&NINA) {
        let r = getRegEx(ninaPath,'^');
        r +='.*.rawJson$';
        myLog('subscribe path:'+r);
        subNINAhandler = subscribe({id:new RegExp(r), change:'ne'}, onChangeNina);
    }
}

function onChangeDWD(dp){
    myLog('onchange DWD');
    onChange(dp,DWD);
}
function onChangeUWZ(dp){
    myLog('onchange UWZ');
    onChange(dp,UWZ);
}
function onChangeNina(dp){
    myLog('onchange NINA');
    onChange(dp,NINA);
}

// funktion die von on() aufgerufen wird
function onChange(dp, mode) {
    removeDatabaseDataID(dp.id);
    addDatabaseData(dp.id, dp.state.val, mode, false);
    if(timer) clearTimeout(timer);
    if (autoSendWarnings) timer = setTimeout(checkWarningsMain, 10000);
}

/* *************************************************************************
* Datenquelle Trigger  ENDE
/* ************************************************************************* */

// Erstes befüllen der Database
function InitDatabase(first){
    if (first) warnDatabase={new:[],old:[]};
    if ( MODE&DWD) {
        var idAll = $('state[state.id='+dwdPath+'.*.object$]');
        for (let a=0;a<idAll.length;a++) {
            let id = idAll[a];
            addDatabaseData(id, getState(id).val, DWD, first);
        }
    } else {
        warnDatabase.new = warnDatabase.new.filter(function(j){return j.mode != DWD;});
    }

    if ( MODE&UWZ) {
        var idAll = $('state[state.id='+uwzPath+'.*.object$]');
        for (let a=0;a<idAll.length;a++) {
            let id = idAll[a];
            addDatabaseData(id, getState(id).val, UWZ, first);
        }
    } else {
        warnDatabase.new = warnDatabase.new.filter(function(j){return j.mode != UWZ;});
    }
    if ( MODE&NINA) {
        var idAll = $('state[state.id='+ninaPath+'.*.rawJson$]');
        myLog('nina idAll: '+JSON.stringify(idAll));
        for (let a=0;a<idAll.length;a++) {
            let id = idAll[a];
            myLog('nina rawJsonId: '+id);
            addDatabaseData(id, getState(id).val, NINA, first);
        }
    } else {
        warnDatabase.new = warnDatabase.new.filter(function(j){return j.mode != NINA;});
    }
    if (!first) removeDuplicateHash();
}

// für Objekt zur Database hinzu
function addDatabaseData(id, value, mode, old) {
    var warn = null;
    if (value && value != {} && value !== undefined && value != '{}') value=JSON.parse(value);
    else return null;
    myLog('ID + JSON:'+ id + ' '+JSON.stringify(value));
    if (mode != NINA) value['info']=[value];
    if (value.info === undefined || !Array.isArray(value.info)) return null;
    for (let a=0; a<value.info.length; a++) {
        warn = getDatabaseData(value.info[a], mode);
        if (warn) {
            warn.id=id;
            if (mode == UWZ) {
                warn.areaID=getRegionName(id);
                warn.hash = JSON.stringify(warn).hashCode();
            }
            else if (mode == DWD) {
                warn.areaID=' für ' + warn.areaID;
                warn.hash = JSON.stringify(warn).hashCode();
            }
            else if (mode == NINA) {
                warn.identifier = value.identifier === undefined ? '' : value.identifier;
                warn.sender = value.sender === undefined ? '' : value.sender;
                warn.hash = JSON.stringify(warn).hashCode();
                if (uAutoNinaFilterList.indexOf(warn.sender) != -1 && warn.level <= warnlevel) {
                    old = true;
                    myLog('Filter: \'' + warn.sender + '\' ist in uAutoNinaFilterList');
                }
            }
            warnDatabase.new.push(warn);
            if (old) warnDatabase.old.push(warn);
        }
    }
}

// Wandelt den Datensatz in ein internes Format um
function getDatabaseData(warn, mode){
    if (!warn || warn === undefined || typeof warn !== 'object' || warn === {} || warn =='{}') return null;
    let result={};
    if (mode === DWD) {
        if (
            warn.altitudeStart>maxhoehe
            || (warn.altitudeEnd && warn.altitudeEnd<minhoehe)
            || warn.level < minlevel
        ) {myLog('Übergebenens Json DWD verworfen');return null;}
        result['mode'] = DWD;
        result['description'] = warn.description === undefined ? '' : warn.description;
        result['headline'] = warn.headline === undefined ? '' : warn.headline;
        result['start'] = warn.start === undefined ? null : warn.start||null;
        result['end'] = warn.end === undefined ? null : warn.end||null;
        result['instruction'] = warn.instruction === undefined ? '' : warn.instruction;
        result['type'] = warn.type === undefined ? -1 : warn.type;
        result['level'] = warn.level === undefined ? -1 : warn.level;
        result['areaID'] = warn.regionName === undefined ? '' : warn.regionName;
    } else if (mode === UWZ) {
        if (
            warn.payload === undefined
            || warn.payload.altMin>maxhoehe
            || (warn.payload.altMax && warn.payload.altMax<minhoehe)
            || warn.level < minlevel

        ) {myLog('Übergebenens Json UWZ verworfen');return null;}

        result['mode'] = UWZ;
        result['description'] = warn.payload.translationsLongText.DE === undefined ? '' : warn.payload.translationsLongText.DE;
        result['start'] = warn.dtgStart === undefined ? null : warn.dtgStart*1000||null;
        result['end'] = warn.dtgEnd === undefined ? null : warn.dtgEnd*1000||null;
        result['instruction'] = warn.instruction === undefined ? '' : warn.instruction;
        result['type'] = warn.type === undefined ? -1 : warn.type;
        result['level'] = warn.payload.levelName === undefined ? -1 : getUWZLevel(warn.payload.levelName);
        result['headline'] = warn.type === undefined ? '' : 'Warnung vor '+warningTypesString['UWZ'][result.type];
        result['areaID'] = warn.areaID === undefined ? '' : warn.areaID;
        result['color'] = getLevelColor(result.level);
    } else if (mode === NINA) {
        // level 2,3,4
        let ninaLevel=['Minor','Severe','Extreme']
        let web='';
        web = warn.web === undefined || !warn.web? '' : '<br>'+warn.web+'<br>';
        result['mode'] = NINA;
        //result['identifier'] = warn.identifier === undefined ? '' : warn.identifier;
        //result['sender'] = warn.sender === undefined ? '' : warn.sender;
        result['description'] = warn.description === undefined ? '' : removeHtml(warn.description);
        result['start'] = warn.effective === undefined ? null : getDateObject(warn.effective).getTime()||null;
        result['end'] = warn.expires === undefined ? null : getDateObject(warn.expires).getTime()||null;
        result['instruction'] = warn.instruction === undefined ? '' : removeHtml(warn.instruction);
        result['typename'] = warn.event === undefined ? '' : removeHtml(warn.event);
        result['type'] = result.typename.hashCode();
        //result['urgency'] = warn.urgency === undefined ? '' : warn.urgency;
        result['severity'] = warn.severity === undefined ? '' : warn.severity;
        //result['certainty'] = warn.certainty === undefined ? '' : warn.certainty;
        result['headline'] = warn.headline === undefined ? '' : removeHtml(warn.headline);
        result['areaID'] = warn.area === undefined || warn.area[0].areaDesc === undefined? '' : removeHtml(warn.area[0].areaDesc);
        result['level'] = warn.severity === undefined ? -1 : (ninaLevel.indexOf(warn.severity)+1);
        result['color'] = getLevelColor(result.level);
        result['html'] = {};
        result['html']['instruction'] = warn.instruction === undefined ? '' : warn.instruction;
        result['html']['headline'] = warn.headline === undefined ? '' : warn.headline;
        result['html']['description'] = warn.description === undefined ? '' : warn.description+web;
        myLog(JSON.stringify(result));
    }
    result['color'] = getLevelColor(result.level);
    result['id']='';
    result['hash'] = 0;
    myLog('result: ' + JSON.stringify(result));
    return result;
    // Gibt Farben für die level zurück
    function getLevelColor(level) {
        var color = [
            '#00ff00', // 0 - Grün
            '#009b00', // 1 - Dunkelgrün
            '#ffff00', // 2 - Gelb Wetterwarnungen (Stufe 2)
            '#ffb400', // 3 - Orange Warnungen vor markantem Wetter (Stufe 3)
            '#ff0000', // 4 - Rot Unwetterwarnungen (Stufe 4) // im grunde höchste Stufe in diesem Skript.
            '#ff00ff', // 5 - Violett Warnungen vor extremem Unwetter (nur DWD/ Weltuntergang nach aktueller Erfahrung)
        ];
        if (level>=0 && level<=5) return color[level];
        return null;
    }
    function getUWZLevel (warnName){
        var result = -1; // -1 is an error!
        var alert = warnName.split("_");
        var colors = {
            color:["green","darkgreen","yellow","orange","red","violet"],
            level:[0,0,1,2,3,4] // um 1 level reduziert, sond nicht mit DWD vergleichbar nach Erfahrungen
        };
        if (alert[0]=="notice") { result = 1; }
        else if (alert[1] == "forewarn") { result = 1; }
        else {
            result = colors.level[colors.color.indexOf(alert[2])];
        }
        return result;
    }
}
function removeHtml(a) {
    let b = a.replace(/<br\/>/ig,'\n');
    b = b.replace(/(&nbsp;|<([^>]+)>)/ig,'');
    myLog('removeHtml:'+a+' after: '+b);
    return b;
}

// Überprüfe wegen Nina-Adapter häufig die DB ob Einträge obj.ids gelöscht wurden.
schedule('*/1 * * * *', function(){
    let c = false;
    for (let a=0; a<warnDatabase.new.length;a++) {
        if (!extendedExists(warnDatabase.new[a].id)) {
            warnDatabase.new.splice(a--,1);
            c=true;
        }
    }
    if (c && autoSendWarnings) checkWarningsMain();
});

// entferne Eintrag aus der Database
function removeDatabaseDataID(id) {
    if (!id || (typeof id !== 'string')) return;
    if (warnDatabase.new && warnDatabase.new.length > 0) {
        let i=-2;
        while (i!=-1) {
            i = warnDatabase.new.findIndex(function(j){return j.id==id});
            if (i!=-1) warnDatabase.new.splice(i,1);
        }
    }
}
function removeDuplicateHash() {
    if (warnDatabase.new && warnDatabase.new.length > 0) {
        warnDatabase.new = warnDatabase.new.filter(function(j, i){
            let b = (-1 == warnDatabase.new.findIndex(function(j2, i2){
                return i>i2 && j.mode == j2.mode && j.hash == j2.hash;
            }));
            if (!b) myLog('new filtere:'+JSON.stringify(j));
            return b;}
        )
    }
    if (warnDatabase.old && warnDatabase.old.length > 0) {
        warnDatabase.old = warnDatabase.old.filter(function(j, i){
            let b = (-1 == warnDatabase.old.findIndex(function(j2, i2){
                return i>i2 && j.mode == j2.mode && j.hash == j2.hash;
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

function artikelMode(mode, speak=false) {
    let r = ' ';
    if (mode&DWD) r+=(DEBUG ? 'des DWD(ALPHA) ' : 'des DWD ');
    if (mode&UWZ) {
        if (r.length > 1) r+='und ';
        if (speak) r+= (DEBUG ? 'der Unwetterzentrale(ALPHA) ' : 'der Unwetterzentrale ');
        else r+= (DEBUG ? 'der UWZ(ALPHA) ' : 'der UWZ ');
    }
    if (mode&NINA) {
        if (r.length > 1) r+='und ';
        r+= (DEBUG ? 'von Nina(ALPHA) ' : 'von Nina ');
    }
    return r;
}

// Gibt einen fertigen Zähler string zurück. 1/3 wenn es Sinn macht und manuelle Auslösung
function getStringWarnCount(i, c) {
    return ' Insgesamt '+(i&&!onClickCheckRun&&c>1?i+'/':'')+(c==1 ?'eine gültige Warnung.':c+' gültige Warnungen.');
}

function buildHtmlEmail(mailMsg, headline, msg, color, last) {
    if (!mailMsg) mailMsg='<table border="1" cellpadding="0" cellspacing="0" width="100%">';
    if (headline) {
        if (color) mailMsg+='<tr><td style="padding: 5px 0 5px 0;" bgcolor=\"'+color+'\"><b>'+headline+'</b></td></tr>';
        else mailMsg+='<tr><td style="padding: 5px 0 5px 0;"><b>'+headline+'</b></td></tr>';
    }
    if (msg) mailMsg+='<tr><td style="padding: 5px 0 20px 0;">'+msg+'</td></tr>';
    if (last) mailMsg+='</table>';
    return mailMsg;
}

/* Entfernt "°C" und anders aus Sprachmeldung und ersetzt es durch "Grad" */
/* noch nicht für UWZ angepasst */
function replaceTokenForSpeak(beschreibung) {
    var rueckgabe;
    rueckgabe = beschreibung;
    try {

        rueckgabe = rueckgabe.replace(/\°C/g, "Grad");
        rueckgabe = rueckgabe.replace(/km\/h/g, "Kilometer pro Stunde");
        rueckgabe = rueckgabe.replace(/l\/m\²/g, "Liter pro Quadratmeter");
        rueckgabe = rueckgabe.replace(/\d{1,2}\.\d{1,2}\.\d{4}../gi, function(x){
            return getFormatDateSpeak(x);
        })
        rueckgabe = rueckgabe.replace(/\d{1,2}\.\d{1,2}\.../gi, function(x){
            return getFormatDateSpeak(x);
        })
        if (!windForceDetailsSpeak) {
            rueckgabe = rueckgabe.replace(/\([0-9]+.m\/s..[0-9]+kn..Bft.[0-9]+../g, "");
        } else {
            rueckgabe = rueckgabe.replace(/kn/g, " Knoten");
            rueckgabe = rueckgabe.replace(/Bft/g, " Windstärke");
            rueckgabe = rueckgabe.replace(/m\/s/g, " Meter pro Sekunde");
        }
    }
    catch(e) {log(e,'warn');}
    return rueckgabe;
}

// Formatiere Date zu string
function getFormatDate(a) {
    if (!a || !(typeof a === 'number')) return '';
    return formatDate(new Date (a).getTime(), formatierungString);
}
// hilffunktion für Zeitausgabe über Sprache
// @PARAM Rückgabe von getFormatDate
function getFormatDateSpeak(a) {
    if (!a || a === '') return '';
    let b = a.split('.');
    let m = '';
    switch (b[1]) {
        case '01': m='Januar';break;
        case '02': m='Februar';break;
        case '03': m='März';break;
        case '04': m='April';break;
        case '05': m='Mai';break;
        case '06': m='Juni';break;
        case '07': m='Juli';break;
        case '08': m='August';break;
        case '09': m='September';break;
        case '10': m='Oktober';break;
        case '11': m='November';break;
        case '12': m='Dezember';break;
        default: m='';
    }
    //  if (Number(b[0])<10) b[0]=b[0].slice(1,1);
    // Das geht echt einfacher  *g*
    b[0]=Number(b[0]).toString();
    b[1]=m; // setze Monatsname
    // entferne Jahr
    let c = b[2].split(' ');
    c[0]='';
    b[2] = c.join(' ');
    return b.join(' ');
}

// vergleich regionName und die Obj.id und gib den benutzerfreundlichen Namen zurück.
function getRegionName(id) {
    if (!Array.isArray(regionName) || regionName.length==0) return '';
    for (let a=0; a<regionName.length;a++) {
        if (id.includes(regionName[a][0])) {
            return 'für '+regionName[a][1];
        }
    }
    return '';
}
/* *************************************************************************
* Aufbereitung von Texten für die verschiedenen Pushmöglichkeiten ENDE
/* ************************************************************************* */
/* *************************************************************************
* Anfrage über Telegramm mit Ww? und WetterWarnungen?
/* ************************************************************************* */

if ((uPushdienst&TELEGRAM) != 0 ) {
    on({id: telegramInstanz+'.communicate.request',change:"any",ack:false}, function(obj){
        var msg = obj.state.val;
        var user = msg.substring(1,msg.indexOf(']'));
        msg = msg.substring(msg.indexOf(']')+1,msg.length);
        if (msg.includes('Ww?')||msg.includes('Wetterwarnungen?')) {
            setState(mainStatePath+'commands.'+konstanten[0].name,true);
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
onStop(function(callback){
    if (extendedExists(aliveState)) {
        if (!getState(aliveState).val) {
            myLog('wird neugestartet!');
            setState(aliveState, false, true, function(){
                setTimeout(function(){
                    startScript(scriptName);
                    myLog('Neustart wurde ausgeführt');
                },1000)
            });
        } else {
            myLog('wurde beendet!');
            setState(aliveState,false, true);
        }
    }
    callback();
},200)

// stop das Skript und setzt den Alivestatus
function restartScript() {
    setTimeout(function(){
        setState(aliveState, false, false, function(){
            myLog('Wird über restartScript() beendet.!');
            stopScript();
        });
    },200);
}
/* *************************************************************************
* Restartfunktion
*           ENDE
/* ************************************************************************* */
/* *************************************************************************
* Erstellung von States incl. 0_userdata & Zugehöriges
/* ************************************************************************* */

// gibt die ersten beiden Teile von ID zurück
function getCustomRoot(id){
    let sRoot = id.split('.');
    if (!Array.isArray(sRoot)) {
        log('Fehler: '+id+' ist fehlerhaft. Es fehlt ein . ','error');
        stopScript();
    }
    if(sRoot[0]==='0_userdata') sRoot = '0_userdata.0';
    else sRoot = 'javascript.'+ id.split('.')[1];
    return sRoot;
}
// gibt das zurück was nicht zu getCustomRoot() gehört
function getEndOfState(id){
    return id.replace(getCustomRoot(id)+'.','');
}

// erweiterte existsState() funktion
function extendedExists(id){
    let r = ($(id).length > 0) && (existsState(id));
    return r;
}

// verhält sich wie createState()
function createCustomState(id, def, type, callback = undefined) {
    if (!extendedExists(id)) {
        myLog('getCustomRoot: ' +getCustomRoot(id));
        myLog('getEndOfState: ' + getEndOfState(id));
        if (def == null && type.type == 'string') type.def = '';
        else type.def = def ;
        createUserStates(getCustomRoot(id),false,[
            [getEndOfState(id), type ],
        ], callback);
        // Restart Skript nach dem States erzeugt wurden
        // Nutze Timeout um erst am Ende aller CreateStates das Skript neuzustarten
        if (timeoutFromCreateState) clearTimeout(timeoutFromCreateState);
        timeoutFromCreateState = setTimeout(function(){
            restartScript();
        },400);
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
// gibt aktuell die Alexa ID zurück
function getFullId(a,b) {
    return a.replace(placeHolder,b)
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
