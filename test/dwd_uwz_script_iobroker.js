//Version 0.94.2
/*
/* ************************************************************************* */
/*             Script zum Übertragen der DWD/UWZ-Wetterwarnungen über        */
/*             Telegram, Pushover, Home24-Mediaplayer, SayIt, Alexa          */
/*             Datenpunkt, eMail oder ioGo                                   */
/*             Pushnachrichten können manuell ausgelöst werden               */
/*             höchstes Warnlevel pro Warnungstyp is als State vorhanden     */
/*     mit freundlicher Unterstützung von Paul53 (Tausend Dank nochmals)     */
/*                    Stand: 13022017    PrinzEisenherz1                     */
/*                    Stand: 06032020    ticaki                              */
/*                                                                           */
/*                                                                           */
/* ************************************************************************* */

/*
Unterstützt:
- Telegram, Pushover, Home24-Mediaplayer, SayIt, Alexa, Datenpunkt, eMail oder ioGo
- DWD-Adapter & Unwetterzentrale-Script
- Wetterwarnung
- Wetterentwarnung

Funktionen:
- Filter die Warnungen nach doppelt, Gefahr(level) und Höhe
- Umschalten über iobroker zwischen DWD und UWZ oder beides
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

/* ************************************************************************ */
/*            Datenpfad konfigurieren                                       */
/* ************************************************************************ */
/*                                                                          */
/*            0_userdata. möglich                                           */
/*                                                                          */
/* ************************************************************************ */
var mainStatePath = 'javascript.0.wetterwarnung.'; // abschließender Punkt . nicht vergessen
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
var DWD = 'DWD';
var UWZ = 'UWZ';
var autoSendWarnings = true;
const aliveState = mainStatePath+'alive';
const configModeState = mainStatePath+'config.mode';
var timeoutFromCreateState = null;
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
// MODE einstellen UWZ oder DWD oder 'UWZ' 'DWD' 'DWDUWZ' 'UWZDWD'.
var MODE = DWD; // DWD oder UWZ wird von gültigen Einstellungen im Datenpfad überschrieben

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
var idSayIt             = [""]; // mehrfach Einträge möglich
var sayItVolumen        = [60]; // gleiche Anzahl wie idSayIt

/* Konfiguration Sprachausgabe über Alexa
/* mehrere Einträge möglich, bei mir ging nur der Echo, 2 dots 2.Gen reagieren nicht auf announcement. */
var idAlexaSerial       = ['']; // die reine Seriennummer des Echos z.B.: var idAlexaSerial =['G090RV32984110Y','G090RV32984110Y']
var alexaVolumen        = [30]; // Lautstärke die gleiche Anzahl an Einträgen wie bei idAlexaSerial

//Konfiguration von ioGo
var ioGoUser = ['']; // // Einzelnutzer ['Hans']; Multinutzer ['Hans','Gretel']; Nutzer vom Adapter übernehmen [];

// Filtereinstellungen
const minlevel          =    1 // Warnungen unterhalb dieses Levels nicht senden;
const warnlevel         =    3 // Warnung oberhalb dieses Levels mit zusätzlichen Hinweisen versehen
const minhoehe          =    0 // Warnung für eine Höhe unterhalb dieses Wertes nicht senden
const maxhoehe          =    5000 // Warnung für eine Höhe oberhalb dieses Wertes nicht senden

// Filtere Meldungen selben Typs & Datenquelle, die von einer zeitlich längeren Meldung mit gleichem oder höherem Level überdeckt werden.
// gilt nicht für Warnung mit höherem Level als warnlevel. Ab 4 wirds beim DWD gefährlich
const uFilterDuplicate = true; // weshalb? hatte 2 Meldungen alles gleich nur die Uhrzeit ->  von 0:00 - 14:00 und von 6:00 - 14:00

//Formatierungsstring für Datum/Zeit Alternative "TT.MM.YYYY SS:mm" KEINE Anpassung nötig
const formatierungString =  "TT.MM.YY SS:mm";

// Sprachausgabe Zeiten
// Für durchgehende Sprachausgabe die Einstellung der Zeiten auf '' setzen. z.B. var startTimeSpeak = '';
var startTimeSpeak        = '6:45';// Zeiten mo-fr ab der Sprachausgaben ok sind. Nicht unter 6 Uhr gehen oder den Schedule ändern
var startTimeSpeakWeekend = '9:00';// sa + so Bemerkung siehe oben
var endTimeSpeak          = '22:30'; // ab diesem Zeitpunkt gibt es keine Sprachausgabe

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
var uSpeakSpeakPerCharAlexa =   86; // Vorlese Geschwindigkeit pro Zeichen in ms
var uSpeakSpeakPerCharHomeTwo = 90; // Vorlese Geschwindigkeit pro Zeichen in ms
var uSpeakSpeakPerCharSayIt =   85; // Vorlese Geschwindigkeit pro Zeichen in ms

var uwzPath = 'javascript.0.UWZ';
var dwdPath = 'dwd.0';

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

// Wandel Usereingabe in True/False um
autoSendWarnings = !!autoSendWarnings;
forcedSpeak = !!forcedSpeak;
windForceDetailsSpeak = !!windForceDetailsSpeak;
var subDWDhandler = null;
var subUWZhandler = null;

var modeFromState = getModeState();
if (DEBUG) log('Variablen initialisiert. MODE: '+MODE+' modeFromState: '+modeFromState+' mainStatePath: '+mainStatePath);
checkMode(modeFromState);
dataSubscribe();

// Variable nicht konfigurierbar
var SPEAK = ALEXA+HOMETWO+SAYIT;
var PUSH = TELEGRAM+PUSHOVER+IOGO+STATE;
var ALLMSG = EMAIL;
var placeHolder = 'XXXXPLACEHOLDERXXXX';
var idAlexa = alexaInstanz+'.Echo-Devices.'+placeHolder+'.Commands.announcement';
var idAlexaVolumen = alexaInstanz+'.Echo-Devices.'+placeHolder+'.Commands.speak-volume';
var forceSpeak = false;
var timer = null;
var onClickCheckRun = false;
var warnDatabase = {new:[],old:[]};
var pushdienst = uPushdienst;
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

function checkMode(modeFromState) {
    if (modeFromState && typeof modeFromState === 'string' && (modeFromState!=MODE) && (modeFromState.toUpperCase().includes(DWD) || modeFromState.toUpperCase().includes(UWZ))) {
        MODE=modeFromState.toUpperCase();
        if (DEBUG) log('MODE wurde geändert. MODE: '+MODE);
        dataSubscribe();
        setState(configModeState, MODE, true);
    }
}

if (MODE === undefined || !MODE || (typeof MODE !== 'string') ) {
    let errorLog = 'Konfiguration enthält Fehler. var MODE = UWZ; oder var MODE = DWD; fehlt!';
    log(errorLog,'error');
    stopScript(scriptName);
} else if (!MODE.includes(DWD) && !MODE.includes(UWZ)) {
    let mode = MODE;
    MODE = MODE.toUpperCase();
    if (!MODE.includes(DWD) && !MODE.includes(UWZ)) {
        let errorLog = 'Konfiguration enthält Fehler. var MODE = '+mode+'; ist fehlerhaft! Nutze var MODE = UWZ; oder var MODE = DWD; oder var MODE = \'DWDUWZ\';';
        log(errorLog,'error');
        stopScript(scriptName);
    }
}
testValueTypeLog(pushdienst&(SPEAK+PUSH+ALLMSG), 'pushdienst', 'number', true);
testValueTypeLog(uwzPath, 'uwzPath', 'string', true);
testValueTypeLog(dwdPath, 'dwdPath', 'string', true);
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
                stopScript(scriptName);
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
    if ((pushdienst&ALEXA) != 0) {
        testValueTypeLog(idAlexaSerial,'idAlexaSerial','array');
        if (idAlexaSerial.length==0) {
            log('Keine Alexa/Echoseriennummer eingetragen. Überpüfen!','error');
            stopScript(scriptName);
        }
        for (let a=0;a<idAlexaSerial.length;a++) {
            if (!extendedExists(getFullId(idAlexa,idAlexaSerial[a]))) {
                log('Alexa-Serial '+idAlexaSerial[a]+' ist fehlerhaft. Überpüfen!','error');
                stopScript(scriptName);
            }
        }
    }
}

if ((pushdienst&SAYIT) != 0) {
    testValueTypeLog(idSayIt,'idSayIt','array');
    for (let a=0;a<idSayIt.length;a++) {
        if (
            !extendedExists(idSayIt[a])
        ) {
            log('SayIt-Konfiguration ist fehlerhaft. Überpüfen!','error');
            stopScript(scriptName);
        }
    }
}
if ((pushdienst&EMAIL) != 0) {
    if (senderEmailID.length>1) {
        log('eMail-Konfiguration ist fehlerhaft. Nur 1 Eintrag in senderEmailID erlaubt!','error');
        stopScript(scriptName);
    }
}

if(mainStatePath[mainStatePath.length-1] != '.') mainStatePath += '.';

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
        stopScript(scriptName);
    }
    if (typ == 'array') {
        if (!test || !Array.isArray(test)) {
            let errorLog = 'Konfiguration enthält Fehler. Der/Ein Wert von var '+teststring+' ist kein Array. Es fehlen wohl die umschließenden []!';
            log(errorLog,'error');
            stopScript(scriptName);
        }
    } else if ( typeof test !== typ ) {
        let errorLog = 'Konfiguration enthält Fehler. Ändere '+teststring+' = [';
        if (typ == 'string') {
            errorLog+=test+'];//('+typeof test+') in '+teststring+' = [\''+test+'\'];//('+typ+')';
        } else {
            errorLog+='\''+test+'\'];//('+typeof test+') in '+teststring+' = ['+test+'];//('+typ+')';
        }
        log(errorLog, 'error');
        stopScript(scriptName);
    }
    if (need && !test) {
        log('Konfiguration enthält Fehler. Der Wert von var '+teststring+' wird benötigt, ist jedoch nicht konfiguriert!','error');
        stopScript(scriptName);
    }
}

/* *************************************************************************
* Überprüfe Nutzerkonfiguration ENDE
/* ************************************************************************* */

/* erstmaliges Befüllen der arrays */
InitDatabase();

// State der Pushnachrichten über pushover/telegram spiegelt
const mirrorMessageState = mainStatePath+'message';
if (!extendedExists(mirrorMessageState)) {
    createCustomState(mirrorMessageState,'', {read: true, write: false, desc: "Beschreibung", type: "string",});
}

// MODE änderung über Datenpunkte
if (!extendedExists(aliveState)) {
    createCustomState(aliveState, false, {read: true, write: false, desc: "Script läuft", type: "boolean", def: false });
}

// alive anzeige wird benutzt um einen Restart auszulösen;
if (!extendedExists(configModeState)) {
    createCustomState(configModeState,'', {read: true,write: true,desc: "Modusauswahl DWD oder UWZ",type: "string",def: ''
});
} else {
    on({id:configModeState, change:'ne', ack:false}, function(obj){
        if (obj.state.val && typeof obj.state.val === 'string'
        && (obj.state.val.toUpperCase().includes(DWD) || obj.state.val.toUpperCase().includes(UWZ))) {
            //setState(configModeState, MODE,true)
            if ( MODE != obj.state.val.toUpperCase() ) {
                if (DEBUG) log('Modus wird geändert auf: '+obj.state.val);
                checkMode(obj.state.val);
                InitDatabase();
                setAlertState();
            } else {
                setState(configModeState, MODE, true);
            }
        } else {
            setState(configModeState, MODE, true);
        }
    });
    setState(configModeState, MODE, true);
}
{
    let id = mainStatePath+'config.auto.on';
    if (!extendedExists(id)) {
        createCustomState(id, true, {read: true,write: true,desc: "Aktivere automatischen Push bei eintreffen der Warnungen.",type: "boolean",def: true});
    } else {
        on({id:id, change:'ne', ack:false}, function(obj){
            autoSendWarnings = obj.state.val;
            setState(obj.id, autoSendWarnings, true);
        });
        autoSendWarnings = getState(id).val;
        setState(id, autoSendWarnings, true);
    }
}

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
{
    let allStateExist = true;
    let mode = [DWD,UWZ];
    for (let c=0;c<mode.length;c++) {
        let stateAlertId = mainStatePath+'alert.'+mode[c].toLowerCase()+'.';
        for (let b=0;b<warningTypesString[mode[c]].length;b++) {
            for (let a=0;a<stateAlert.length;a++)
            {
                let stateAlertIdFull = stateAlertId+warningTypesString[mode[c]][b]+'.'+stateAlert[a].name;
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
    } else {
        subscribe({id: mainStatePath+'commands.'+konstanten[a].name},function(obj){
            if (!obj.state.val) return;
            setState(obj.id,false,true);
            let b = obj.id.split('.');
            let d = konstanten.findIndex(function(c){return (c.name===b[b.length-1]);})
            if (d == -1) {log('Fehler. State nicht in Konstanten enthalten','error'); return;}
            if ((uPushdienst & konstanten[d].value) == 0) return;
            let oldPushdienst = pushdienst;
            pushdienst = konstanten[d].value*1;
            warnDatabase.old = [];
            forceSpeak = forcedSpeak;
            onClickCheckRun = true;
            check();
            onClickCheckRun = false;
            forceSpeak = false;
            pushdienst = oldPushdienst;
        })
    }
    let oid = mainStatePath+'config.auto.'+konstanten[a].name;
    if (!extendedExists(oid)) {
        createCustomState(oid,((pushdienst&konstanten[a].value)!=0), {read: true,write: true,desc: "Schalte Autopushmöglichkeiten ein/aus",type: "boolean",def: ((pushdienst&konstanten[a].value)!=0)});
    } else {
        setConfigKonstanten(oid, getState(oid).val);
        subscribe({id: oid, change:'ne', ack: false},function(obj){
            setConfigKonstanten(obj.id, obj.state.val);
        })
    }
}

// Hilfsfunktion
function setConfigKonstanten(id, val){
    let b = id.split('.');
    let d = konstanten.findIndex(function(c){return (c.name===b[b.length-1]);})
    if (d == -1) {log('Fehler. State nicht in Konstanten enthalten','error'); return;}
    let value = konstanten[d].value
    if (val) pushdienst |= uPushdienst & value;
    else pushdienst &= ~value;
    setState(id,((pushdienst & value)!=0), true);
}

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

// Hauptfunktion entscheiden was wohin gesendet wird
function check() {
    if (!forcedSpeak) forceSpeak = (!startTimeSpeakWeekend||!startTimeSpeak||!endTimeSpeak);
    setWeekend();

    if (uFilterDuplicate) {
        for(let a=0;a<warnDatabase.new.length;a++) {
            let w = warnDatabase.new[a];
            for(let b=a+1;b<warnDatabase.new.length;b++) {
                let w2 = warnDatabase.new[b];
                if (w.mode !== w2.mode || w.type !== w2.type || w.level > warnlevel || w2.level > warnlevel) continue;
                if (w.start >= w2.start && w.end <= w2.end && w.level<= w2.level) {
                    let i = warnDatabase.old.findIndex(function(j){return w.hash === j.hash});
                    warnDatabase.old.splice(i,1);
                    warnDatabase.new.splice(a--,1);
                    break;
                } else if (w.start <= w2.start && w.end >= w2.end && w.level>= w2.level) {
                    let i = warnDatabase.old.findIndex(function(j){return w2.hash === j.hash});
                    warnDatabase.old.splice(i,1);
                    warnDatabase.new.splice(b--,1);
                    break;
                }
            }
        }
    }

    warnDatabase.new.sort(function(a,b) {return a.level==b.level?b.begin-a.begin:b.level-a.level;})
    setAlertState();
    var collectMode = '';
    /* Bereich für 'Alle Wetterwarnungen wurden aufgehoben' */
    if(warnDatabase.new.length==0 && (warnDatabase.old.length>0 || onClickCheckRun)) {
        for (let a=0;a<warnDatabase.old.length;a++) collectMode+=warnDatabase.old[a].mode;
        let pushMsg = 'Achtung' + '  .  ' + 'Alle Warnmeldungen'+artikelMode(collectMode, true)+'wurden aufgehoben';

        /* Bereich für Sprachausgabe über SayIt & Alexa & Home24*/
        if ( forceSpeak || compareTime(START, ENDE, 'between')){                  // Ansage über Sayit nur im definierten Zeitbereich
            sendMessage(pushdienst&SPEAK,'','',pushMsg,'');
            if (DEBUG) log('Sprache:'+pushMsg);
        }
        pushMsg = 'Alle Warnmeldungen'+artikelMode(collectMode)+'wurden aufgehoben';
        if (DEBUG) log('text:'+pushMsg);
        sendMessage(pushdienst&PUSH,'Wetterentwarnung',pushMsg,'','');
        sendMessage(pushdienst&ALLMSG,'Wetterentwarnung'+artikelMode(collectMode)+'(iobroker)','','',buildHtmlEmail('',null,pushMsg,null,true));

        /* alle Sicherungen Wetterwarnung löschen */
        warnDatabase.old = cloneObj(warnDatabase.new);
        return;
    }
    let emailHtmlWarn='';
    let emailHtmlClear='';
    let speakMsgTemp=[];
    collectMode='';
    /* Bereich für 'Wetterwarnung gültig bis wurde aufgehoben' */
    for(let i = 0; i < warnDatabase.old.length; i++) {
        let description = warnDatabase.old[i].description;
        let headline = warnDatabase.old[i].headline;
        let hash = warnDatabase.old[i].hash;
        let area = warnDatabase.old[i].areaID;
        let mode = warnDatabase.old[i].mode;
        if(description && headline && warnDatabase.new.findIndex(function(j){return j.hash == hash;}) == -1 ) {
            collectMode+=mode;
            let end = getFormatDate(warnDatabase.old[i].end);
            let pushMsg = "Die Wetterwarnung"+artikelMode(mode)+"'"+ headline+area+" gültig bis " + end + "Uhr'" + " wurde aufgehoben.";
            emailHtmlClear+=pushMsg+'<br><br>';
            pushMsg += getStringWarnCount(null, warnDatabase.new.length);
            sendMessage(pushdienst&PUSH,'Wetterentwarnung',pushMsg,'','');
            if (DEBUG) log('text:'+pushMsg);
            /* Sprache: Wetterentwarnungen */
            pushMsg = headline +artikelMode(mode,true)+ area + ' gültig bis ' + getFormatDateSpeak(end) + ' Uhr wurde aufgehoben' + '  .  ';
            speakMsgTemp.push(pushMsg);
            if (DEBUG) log('Sprache:'+pushMsg);
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
            collectMode+=mode;
            count++;
            if (!gefahr) gefahr=level>warnlevel;
            let begin = getFormatDate(warnDatabase.new[i].start);
            let end = getFormatDate(warnDatabase.new[i].end)
            let sTime = "gültig vom " + begin + " Uhr bis " + end + " Uhr";
            let pushMsg =area + "\n"+sTime+"\n" + description;
            let html = sTime+ "<br>" + description;
            let instPush = '';
            if (!!instruction && typeof instruction === 'string' && instruction.length > 2){
                instPush+='\nHandlungsanweisungen:\n '+instruction;
                html+='<br>Handlungsanweisungen:<br>'+instruction;
            }
            // Anzahl Meldungen erst am Ende zu email hinzufügen
            emailHtmlWarn=buildHtmlEmail(emailHtmlWarn,headline+artikelMode(mode)+area,html,color,false);
            /* ab Level 4 zusätzlicher Hinweis */
            let topic = (level>warnlevel)?'Wichtige Wetterwarnung':'Wetterwarnung';
            pushMsg = headline + artikelMode(mode) + pushMsg + instPush;
            if (warnDatabase.new.length>1) pushMsg += getStringWarnCount(count, warnDatabase.new.length);
            sendMessage(pushdienst&PUSH,topic,pushMsg,'','');
            if (DEBUG) log('text:'+pushMsg);
            /* Sprache: Verknüpfen aller aktuellen Warnmeldungen */
            var replaceDescription0 = replaceTokenForSpeak(description);
            topic = ((level>warnlevel)?'Achtung Unwetter ':'');
            sTime = " gültig vom " + getFormatDateSpeak(begin) + " Uhr, bis " + getFormatDateSpeak(end) + " Uhr. ";
            pushMsg = topic + headline+ artikelMode(mode,true)+area + sTime + replaceDescription0 + instPush;
            speakMsgTemp.push(pushMsg);
            if (DEBUG) log('Sprache:'+pushMsg);
        }
    }
    /* Bereich für Sprachausgabe */
    if (speakMsgTemp.length>0 && (forceSpeak || compareTime(START, ENDE, 'between')) && (pushdienst & (HOMETWO+SAYIT+ALEXA))!=0 ) {
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
            if((pushdienst & HOMETWO)!=0 ){
                setTimeout(function(msg,msg2){
                    sendMessage(HOMETWO,'','',msg+msg2,'');
                },a,speakMsgTemp[0], msgAppend);
            }
            /* Bereich für Sprachausgabe über SayIt + Alexa */
            if ((pushdienst & SAYIT)!=0) {
                setTimeout(function(msg,msg2){
                    sendMessage(SAYIT,'','',msg+msg2,'');
                },b,speakMsgTemp[0], msgAppend);
            }
            if ((pushdienst & ALEXA)!=0) {
                setTimeout(function(msg,msg2){
                    sendMessage(ALEXA,'','',msg+msg2,'');
                },c,speakMsgTemp[0], msgAppend);
            }
            a+=uSpeakSpeakPerCharHomeTwo*speakMsgTemp[0].length+2000;
            b+=uSpeakSpeakPerCharSayIt*speakMsgTemp[0].length+2000;
            c+=uSpeakSpeakPerCharAlexa*speakMsgTemp[0].length+2000;
            if (DEBUG) log(speakMsgTemp[0].length.toString());
            speakMsgTemp.shift();
        }
    }
    emailHtmlWarn= buildHtmlEmail(emailHtmlWarn, (emailHtmlClear?'Aufgehobene Warnungen':null),emailHtmlClear,'silver',false);
    if ((pushdienst & ALLMSG)!=0 && emailHtmlWarn != '') {
        emailHtmlWarn = buildHtmlEmail(emailHtmlWarn,null,getStringWarnCount(null, warnDatabase.new.length),null,true);
        sendMessage(pushdienst&ALLMSG,gefahr?"Wichtige Wetterwarnungen "+artikelMode(collectMode)+"(iobroker)":"Wetterwarnungen "+artikelMode(collectMode)+"(iobroker)",'','',emailHtmlWarn);
    }

    /* Neue Werte sichern */
    warnDatabase.old = cloneObj(warnDatabase.new);
}

// Erstes befüllen der Database
function InitDatabase(){
    warnDatabase={new:[],old:[]};
    if ( MODE.includes(DWD)) {
        var idAll = $('state[state.id='+dwdPath+'.*.object]');
        for (let a=0;a<idAll.length;a++) {
            let id = idAll[a];
            addDatabaseData(id, getState(id).val, DWD, true);
        }
    }
    if ( MODE.includes(UWZ)) {
        var idAll = $('state[state.id='+uwzPath+'.*.object]');
        for (let a=0;a<idAll.length;a++) {
            let id = idAll[a];
            addDatabaseData(id, getState(id).val, UWZ, true);
        }
    }
}
// setzt on() für DWD oder UWZ
function dataSubscribe(){
    if (subDWDhandler) unsubscribe(subDWDhandler);
    if ( MODE.includes(DWD)) {
        let path = dwdPath.split('.');
        let r = '';
        for (let a=0;a<path.length;a++) {
            if (path[a]) r+=path[a]+'\.';
        }
        r +='.*\.object$';
        subDWDhandler = subscribe(new RegExp(r), onChangeDWD);
    }
    if (subUWZhandler) unsubscribe(subUWZhandler);
    if (MODE.includes(UWZ)) {
        let path = uwzPath.split('.');
        let r = '';
        for (let a=0;a<path.length;a++) {
            if (path[a]) r+=path[a]+'\.';
        }
        r +='.*\.object$';
        subUWZhandler = subscribe(new RegExp(r), onChangeUWZ);
    }
}

function onChangeDWD(dp){
    onChange(dp,DWD);
}
function onChangeUWZ(dp){
    onChange(dp,UWZ);
}
// funktion die von on() aufgerufen wird
function onChange(dp, mode) {
    removeDatabaseDataID(dp.id);
    addDatabaseData(dp.id, dp.state.val, mode, false);
    if(timer) clearTimeout(timer);
    if (autoSendWarnings) timer = setTimeout(check, 10000);
}

// entferne Eintrag aus der Database
function removeDatabaseDataID(id) {
    if (!id || (typeof id !== 'string')) return;
    if (warnDatabase.new && warnDatabase.new.length > 0) {
        let i = warnDatabase.new.findIndex(function(j){return j.id==id});
        if (i!=-1) warnDatabase.new.splice(i,1);
    }
}

// für Objekt zur Database hinzu
function addDatabaseData(id, value, mode, old=false) {
    var warn = null;
    if (value && value != '{}' ) warn = JSON.parse(value);
    warn = getDatabaseData(warn, mode);
    if (warn) {
        warn.id=id;
        if (mode == UWZ) warn.areaID=getRegionName(id);
        else warn.areaID=' für ' + warn.areaID;
        warnDatabase.new.push(warn);
        if (old) warnDatabase.old.push(cloneObj(warn)); //
    }

}
// Wandelt den Datensatz in ein internes Format um
function getDatabaseData(warn, mode){
    if (!warn || warn === undefined || typeof warn !== 'object' || warn === {}) return null;
    let result={};
    if (mode === DWD) {
        if (
            warn !== {}
            && (
                warn.altitudeStart>maxhoehe
                || (warn.altitudeEnd && warn.altitudeEnd<minhoehe)
                || warn.level < minlevel
            )
        ) return null;
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
            warn.payload !== undefined
            && (
                warn.payload.altMin>maxhoehe
                || (warn.payload.altMax && warn.payload.altMax<minhoehe)
                || warn.level < minlevel
            )
        ) return null;

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
    }
    result['color'] = getLevelColor(result.level);
    result['id']='';
    result['hash'] = JSON.stringify(result).hashCode();
    return result;
}

function artikelMode(mode, speak=false) {
    let r = '';
    if (mode.includes(DWD)) r+=(DEBUG ? ' des DWD(ALPHA) ' : ' des DWD ');
    if (mode.includes(UWZ)) {
        if (r) r+='und';
        if (speak) r+= (DEBUG ? ' der Unwetterzentrale(ALPHA) ' : ' der Unwetterzentrale(ALPHA) ');
        else r+= (DEBUG ? ' der UWZ(ALPHA) ' : ' der UWZ ');
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

function getLevelColor(level) {
    var color = [
        '#00ff00', // 0 - Grün
        '#009b00', // 1 - Dunkelgrün
        '#ffff00', // 2 - Gelb Wetterwarnungen (Stufe 1)
        '#ffb400', // 3 - Orange Warnungen vor markantem Wetter (Stufe 2)
        '#ff0000', // 4 - Rot Unwetterwarnungen (Stufe 3)
        '#ff00ff', // 5 - Violett Warnungen vor extremem Unwetter (Stufe 4)
    ];
    if (level>=0 && level<=5)
    return color[level];
    else
    return 0x00ff00;
}

function getUWZLevel (warnName){
    var result = -1; // -1 is an error!
    var alert = warnName.split("_");
    var colors = ["green","darkgreen","yellow","orange","red","violet"];

    if (alert[0]=="notice") { result = 1; }
    else if (alert[1] == "forewarn") { result = 2; }
    else {
        result = colors.indexOf(alert[2]);
    }
    return result;
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
            return ' für '+regionName[a][1];
        }
    }
    return ' ';
}

// setzte die Alert States auf die höchste aktuelle Warnstufe
function setAlertState(){
    let mode=[UWZ,DWD];
    for (let a=0;a<2;a++) {
        if (!MODE.includes(mode[a])) continue;
        let stateAlertid = mainStatePath+'alert.'+mode[a].toLowerCase()+'.';
        for (let b=0;b<warningTypesString[mode[a]].length;b++)
        {
            let stateAlertIdFull = stateAlertid+warningTypesString[mode[a]][b]+'.';
            let AlertLevel = -1;
            let AlertIndex = -1;
            for (let c=0;c<warnDatabase.new.length;c++) {
                if (warnDatabase.new[c].type == b && warnDatabase.new[c].level > AlertLevel) {
                    AlertLevel=warnDatabase.new[c].level;
                    AlertIndex=c;
                }
            }
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
                log('Url2 :' + Url2);
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
        if (empfaengerEmailID.length>0) {
            for (let a=0;a<empfaengerEmailID.length;a++) {
                sendTo(emailInstanz, senderEmailID[0]?{from: senderEmailID[0], to: empfaengerEmailID[a], subject: topic, html: msgall}:{to: empfaengerEmailID[a], subject: topic, html: msgall});
            }
        } else {
            sendTo(emailInstanz, senderEmailID[0]?{from: senderEmailID[0], subject: topic, text: msgall}:{subject: topic, html: msgall});
        }
    }
}

if ((pushdienst&TELEGRAM) != 0 ) {
    on({id: telegramInstanz+'.communicate.request',change:"any",ack:false}, function(obj){
        var msg = obj.state.val;
        var user = msg.substring(1,msg.indexOf(']'));
        msg = msg.substring(msg.indexOf(']')+1,msg.length);
        if (msg.includes('Ww?')||msg.includes('Wetterwarnungen?')) {
            setState(mainStatePath+'commands.'+konstanten[0].name,true);
        }
    });
}

// gibt aktuell die Alexa ID zurück
function getFullId(a,b) {
    return a.replace(placeHolder,b)
}
// Klone das Objekt
function cloneObj(j) {
    return JSON.parse(JSON.stringify(j));
}

function getModeState()
{
    if (extendedExists(configModeState)) {
        return getState(configModeState).val;
    }
    return null;
}

// wenn alive schon false, starte das Skript neu
onStop(function(callback){
    if (extendedExists(aliveState)) {
        if (!getState(aliveState).val) {
            if (DEBUG) log('wird neugestartet!');
            setState(aliveState, false, true, function(){
                setTimeout(function(){
                    startScript(scriptName);
                    if (DEBUG) log('Neustart wurde ausgeführt');
                },1000)
            });
        } else {
            if (DEBUG) log('wurde beendet!');
            setState(aliveState,false, true);
        }
    }
    callback();
},100)

// stop das Skript und setzt den Alivestatus
function restartScript() {
    setTimeout(function(){
        setState(aliveState, false, false, function(){
            if (DEBUG) log('Wird über restartScript() beendet.!');
            stopScript(scriptName);
        });
    },200);
}

// gibt die ersten beiden Teile von ID zurück
function getCustomRoot(id){
    let sRoot = id.split('.');
    if (!Array.isArray(sRoot)) {
        log('Fehler: '+id+' ist fehlerhaft. Es fehlt ein . ','error');
        stopScript(scriptName);
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
        if (DEBUG) log('getCustomRoot: ' +getCustomRoot(id));
        if (DEBUG) log('getEndOfState: ' + getEndOfState(id));
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
