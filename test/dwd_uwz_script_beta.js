//Version 0.86
/*
/* ************************************************************************* */
/*             Script zum Übertragen der DWD/UWZ-Wetterwarnungen über        */
/*             Telegram, Pushover, Home24-Mediaplayer, SayIt, Alexa          */
/*             Datenpunkt, eMail oder ioGo                                   */
/*             Pushnachrichten können manuell ausgelöst werden               */
/*             höchstes Warnlevel pro Warnungstyp is als State vorhanden     */
/*     mit freundlicher Unterstützung von Paul53 (Tausend Dank nochmals)     */
/*                    Stand: 13022017    PrinzEisenherz1                     */
/*                    Stand: 03032020    ticaki                              */
/*                                                                           */
/*                                                                           */
/* ************************************************************************* */

/*
Unterstützt:
- Telegram, Pushover, Home24-Mediaplayer, SayIt, Alexa, Datenpunkt, eMail oder ioGo
- DWD & Unwetterzentrale
- Wetterwarnung
- Wetterentwarnung

Funktionen:
- Filter die Warnungen nach Gefahr (level) und Höhe
- Automatischer Versand und/oder manueller Nachrichtenversand
- Zeitschaltuhr für Sprachausgabe
- Datenpunkte mit der Startzeit, Endzeit und höchsten Warnlevel dieses Typs
- Unterstützung für 0_userdata
- Datenpunkthauptpfade sind konfigurierbar

/* ************************************************************************* */
/* NICHT EDITIEREN */
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
var pushdienst=0;
var DWD = 'DWD';
var UWZ = 'UWZ';
/* ************************************************************************* */
/*                       Konfiguration ab hier                               */
/* ************************************************************************* */
var MODE = UWZ; // DWD oder UWZ
//StatePfad um Mitteilungen auszulösen darunter werden jeweils Punkte für jede Ausgabemöglichkeit erstellt.
var onClickMessageState = 'javascript.0.'+MODE+'_Script_test.'; // abschließender Punkt . nicht vergessen

/* Konfiguration der zu nutzenden Ausgabe um //pushdienst+= PUSHOVER; zu aktivieren, bitte die // enfernen, also pushdienst+= PUSHOVER; */
//pushdienst+= TELEGRAM;          // Auskommentieren zum aktivieren
//pushdienst+= PUSHOVER;          // Auskommentieren zum aktivieren
//pushdienst+= EMAIL;             // Auskommentieren zum aktivieren. Einstellungen nicht vergessen
//pushdienst+= SAYIT;             // Auskommentieren zum aktivieren. Einstellungen nicht vergessen
//pushdienst+= HOMETWO;           // Auskommentieren zum aktivieren. Einstellungen nicht vergessen
//pushdienst+= ALEXA;             // Auskommentieren zum aktivieren. Einstellungen nicht vergessen
//pushdienst+= STATE;             // Auskommentieren zum aktivieren. State befindet sich unter onClickMessageState.message
//pushdienst+= IOGO;              // Auskommentieren zum aktivieren. Einstellungen nicht vergessen

/* ************************************************************************* */
/*                       Beispiele zur Konfiguration                         */
/* ************************************************************************* */
// kein oder einen Eintrag möglich:
//var senderEmailID = ["max@mustermann.de"];

// kein oder mehrfach nach gleichem Muster [1,2,3] bzw. ['1','2','3'] Einträge
// '' ist das selbe wie "", jedoch nicht mischen.
//var empfaengerEmailID = ["max@musterman.de","max2@musterman.de"];
//var telegramUser = []; // leer
//var telegramUser = ['']; // leer
//var telegramUser = ['Hans']; // User mit Namen Hans
//var telegramUser = ['Hans','Gretel']; // User mit Namen Hans und User mit Namen Gretel
//var idSayIt = ["sayit.0.tts.text"];
//var sayItVolumen = [60]; // Zahl ohne ''
//var idSayIt = ["sayit.0.tts.text","sayit.1.tts.text"];
//var sayItVolumen = [60,30]; // mehrfach Zahl ohne ''
//var ioGoUser = ['max@musterman.de'];
//var idAlexaSerial =['G090RV32984110Y','G090RZ3345643XR'];
//var alexaVolumen = [40,30]; // Lautstärke die gleiche Anzahl an Einträgen wie bei idAlexaSerial
/* ************************************************************************* */
/*                                                                           */
/* ************************************************************************* */

/* für UWZ Regionnamen eingeben "Warnung der Unwetterzentrale für XXXX" */
/* var regionName = ['UWZDE12345','Entenhausen'] */
var regionName = [['','']];
/* Einstellungen zur Emailbenachrichtigung*/
var senderEmailID = [""]; // mit Sender Emailadresse füllen. email Adapter muß installiert sein. 1 Eintrag erlaubt [] oder ["email1"]
var empfaengerEmailID = [""];// mit Empfänger Emailadresse füllen. Mehrere Empfänger möglich. [] oder ["email1"] oder ["email1","email2"]

/* Konfiguration Sprachausgabe über Home24-Mediaplayer */
//var idMediaplayer = ["192.168.178.x:Port"];
var idMediaplayer = ["192.168.178.68:50000"]; // Eingabe IP-Adresse incl. Port für Home24-Mediaplayer mehrere Möglich - ungetestet

/* Konfiguration Telegram */
var telegramUser = ['']; // Einzelnutzer ['Hans']; Multinutzer ['Hans','Gretel']; Nutzer vom Adapter übernehmen [];
var telegramChatId =[''];

/* Konfiguration Sprachausgabe über SayIt */
var idSayIt = ["sayit.0.tts.text"]; // mehrfach Einträge möglich
var sayItVolumen = [60]; // gleiche Anzahl wie idSayIt

/* Konfiguration Sprachausgabe über Alexa
/* mehrere Einträge möglich, bei mir ging nur der Echo, 2 dots 2.Gen reagieren nicht auf announcement. */
var idAlexaSerial =['']; // die reine Seriennummer des Echos z.B.: var idAlexaSerial =['G090RV32984110Y','G090RV32984110Y']
var alexaVolumen = [20]; // Lautstärke die gleiche Anzahl an Einträgen wie bei idAlexaSerial

//Konfiguration von ioGo
var ioGoUser = ['']; // // Einzelnutzer ['Hans']; Multinutzer ['Hans','Gretel']; Nutzer vom Adapter übernehmen [];


// Filtereinstellungen
const minlevel = 0 // Warnungen gleich oder unterhalb dieses Levels nicht senden;

const warnlevel = 3 // Warnung oberhalb dieses Levels mit zusätzlichen Hinweisen versehen DWD 3 UWZ 8-12

const minhoehe = 1 // Warnung für eine Höhe unterhalb dieses Wertes nicht senden
const maxhoehe = 12000 // Warnung für eine Höhe oberhalb dieses Wertes nicht senden

//Formatierungsstring für Datum/Zeit Alternative "TT.MM.YYYY SS:mm" KEINE Anpassung nötig
const formatierungString = "TT.MM.YY SS:mm";

// Sprachausgabe Zeiten
// Für durchgehende Sprachausgabe die Einstellung der Zeiten auf '' setzen. z.B. var startTimeSpeak = '';
var startTimeSpeak = '6:45';// Zeiten mo-fr ab der Sprachausgaben ok sind. Nicht unter 6 Uhr gehen oder den Schedule ändern
var startTimeSpeakWeekend = '9:00';// sa + so Bemerkung siehe oben
var endTimeSpeak = '22:30'; // ab diesem Zeitpunkt gibt es keine Sprachausgabe

// Automatikmodus auschalten
var autoMode = true;
//Auslösen der Pushnachricht über States ignoriert Sprachausgabezeiten
var forcedSpeak = true;
// keine Ansage über m/s Knoten und Windstärke. Die Angabe mit Kilometer pro Stunde wird angesagt
var windForceDetailsSpeak = false;

/* ************************************************************************* */
/*                       Nur Anpassen wenn nötig                             */
/* ************************************************************************* */
var uwzPath = 'javascript.0.UWZ';
var dwdPath = 'dwd.0';


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
var DEBUG = true;

// Wandel Usereingabe in True/False um
autoMode = !!autoMode;
forcedSpeak = !!forcedSpeak;
windForceDetailsSpeak = !!windForceDetailsSpeak;

// Variable nicht konfigurierbar
var SPEAK = ALEXA+HOMETWO+SAYIT;
var PUSH = TELEGRAM+PUSHOVER+IOGO+STATE;
var ALLMSG = EMAIL;
var DWD = 'DWD';
var UWZ = 'UWZ';
var placeHolder = 'XXXXPLACEHOLDERXXXX';
var idAlexa = 'alexa2.0.Echo-Devices.'+placeHolder+'.Commands.announcement';
var idAlexaVolumen = 'alexa2.0.Echo-Devices.'+placeHolder+'.Commands.speak-volume';
var forceSpeak = false;
var timer = null;
var onClickCheckRun = false;
var warnDatabase = {new:[],old:[]};
var artikelMode = MODE == DWD?'des DWD' : 'der Unwetterzentrale';
if (DEBUG) artikelMode = MODE == DWD?'des DWD(ALPHA)' : 'der Unwetterzentrale(ALPHA)';

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

if (MODE === undefined || !MODE || (MODE !== DWD && MODE !== UWZ)) {
    let errorLog = 'Konfiguration enthält Fehler. var MODE = UWZ; oder var MODE = DWD; fehlt!';
    log(errorLog,'error');
    stopScript();
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
        stopScript();
    }
    for (let a=0;a<idAlexaSerial.length;a++) {
        if (!extendedExists(getFullId(idAlexa,idAlexaSerial[a]))) {
            log('Alexa-Serial '+idAlexaSerial[a]+' ist fehlerhaft. Überpüfen!','error');
            stopScript();
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
            stopScript();
        }
    }
}
if ((pushdienst&EMAIL) != 0) {
    if (senderEmailID.length>1) {
        log('eMail-Konfiguration ist fehlerhaft. Nur 1 Eintrag in senderEmailID erlaubt!','error');
        stopScript();
    }
}

if(onClickMessageState[onClickMessageState.length-1] != '.') onClickMessageState += '.';



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
/* ************************************************************************* */

// Warning types
var warningTypesString =[];
if (MODE == DWD) {
    warningTypesString = [
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
} else if (MODE == UWZ) {
    warningTypesString = [
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
}

/* erstmaliges Befüllen der arrays */
InitDatabase();


// State der Pushnachrichten über pushover/telegram spiegelt
const mirrorMessageState = onClickMessageState+'message';
if (!extendedExists(mirrorMessageState)) {
    createCustomState(mirrorMessageState,'', {
        read: true,
        write: false,
        desc: "Beschreibung",
        type: "string",
    });
}

// State über den man gesonderte Aktionen auslösen kann, gibt die höchste Warnstufe aus.
const stateAlert = // Änderungen auch in SetAlertState() anpassen
[
    {"name":'level',"default":-1,"type":{ read: true, write: false, type: "number",name:''}},
    {"name":'type',"default":-1,"type":{ read: true, write: false, type: "number",name:''}},
    {"name":'start',"default":null,"type":{ read: true, write: false, role: "value.datetime",type: "string",name:''}},
    {"name":'end',"default":null,"type":{ read: true, write: false, role: "value.datetime",type: "string", name:''}},
]
{
    let stateAlertId = onClickMessageState+'alert.';
    let allStateExist = true;
    for (let b=0;b<warningTypesString.length;b++) {
        for (let a=0;a<stateAlert.length;a++)
        {
            let stateAlertIdFull = stateAlertId+warningTypesString[b]+'.'+stateAlert[a].name;
            stateAlert[a].type.name = stateAlert[a].name;
            if (!extendedExists(stateAlertIdFull)) {
                createCustomState(stateAlertIdFull,stateAlert[a].default, stateAlert[a].type);
                allStateExist=false;
            }
        }
    }
    if (allStateExist) SetAlertState();
}

// Nachrichtenversand per Click States erzeugen und subscript
for (var a=0;a<konstanten.length;a++){
    if (!extendedExists(onClickMessageState+'Commands.'+konstanten[a].name)) {
        createCustomState(onClickMessageState+'Commands.'+konstanten[a].name,false, {
            read: true,
            write: true,
            desc: "Beschreibung",
            type: "boolean",
            role: "button",
            def: false
        });
    }
    if (extendedExists(onClickMessageState+'Commands.'+konstanten[a].name)){
        subscribe({id: onClickMessageState+'Commands.'+konstanten[a].name},function(obj){
            if (!obj.state.val) return;
            setState(obj.id,false,true);
            let b = obj.id.split('.');
            let d = konstanten.findIndex(function(c){return (c.name===b[b.length-1]);})
            if (d == -1) {log('Fehler. State nicht in Konstanten enthalten','error'); return;}
            if ((pushdienst & konstanten[d].value) == 0) return;
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

    SetAlertState();
    warnDatabase.new.sort(function(a,b) {return a.begin-b.begin;})

    /* Bereich für 'Alle Wetterwarnungen wurden aufgehoben' */
    if(warnDatabase.new.length==0 && (warnDatabase.old.length>0 || onClickCheckRun)) {
        let PushMsg = 'Achtung' + '  .  ' + 'Alle Warnmeldungen '+artikelMode+' wurden aufgehoben';

        /* Bereich für Sprachausgabe über SayIt & Alexa & Home24*/
        if ( forceSpeak || compareTime(START, ENDE, 'between')){                  // Ansage über Sayit nur im definierten Zeitbereich
            sendMessage(pushdienst&SPEAK,'','',PushMsg,'');
        }
        PushMsg = 'Alle Warnmeldungen '+artikelMode+' wurden aufgehoben';
        sendMessage(pushdienst&PUSH,'Wetterentwarnung',PushMsg,'','');
        sendMessage(pushdienst&ALLMSG,'Wetterentwarnung '+artikelMode+'(iobroker)','','',PushMsg);

        /* alle Sicherungen Wetterwarnung löschen */
        warnDatabase.old = cloneObj(warnDatabase.new);
        return;
    }
    let allEmailMsg='';
    let allEmailMsgDelete='';
    let speakMsgTemp=[];

    /* Bereich für 'Wetterwarnung gültig bis wurde aufgehoben' */
    for(let i = 0; i < warnDatabase.old.length; i++) {
        let description = warnDatabase.old[i].description;
        let headline = warnDatabase.old[i].headline;
        let hash = warnDatabase.old[i].hash;
        let area = warnDatabase.old[i].areaID;
        if(description && headline && warnDatabase.new.findIndex(function(j){return j.hash == hash;}) == -1 ) {
            let end = getFormatDate(warnDatabase.old[i].end);

            let pushmsg = "Die Wetterwarnung " +"'"+ headline+area+" gültig bis " + end + "Uhr'" + " wurde aufgehoben.";
            allEmailMsgDelete+=pushmsg+'\n\n';
            pushmsg += getStringWarnCount(warnDatabase.new.length);
            sendMessage(pushdienst&PUSH,'Wetterentwarnung',pushmsg,'','');

            /* Sprache: Verknüpfen aller aufgehobenen Wetterwarnungen */
            pushmsg = headline + area + ' gültig bis ' + getFormatDateSpeak(end) + ' Uhr wurde aufgehoben' + '  .  ';
            speakMsgTemp.push(pushmsg);
        }
    }
    let gefahr = false;
    /* Bereich für 'Neue Amtliche Wetterwarnung' */
    for(let i = 0; i < warnDatabase.new.length; i++) {
        let headline = warnDatabase.new[i].headline;
        let description = warnDatabase.new[i].description;
        let level = warnDatabase.new[i].level;
        let instruction = warnDatabase.new[i].instruction;
        let hash = warnDatabase.new[i].hash;
        let area = warnDatabase.new[i].areaID;
        if(hash && warnDatabase.old.findIndex(function(j){return j.hash == hash;}) == -1 ) {
            let begin = getFormatDate(warnDatabase.new[i].start);
            let end = getFormatDate(warnDatabase.new[i].end);
            let MeldungNew = headline + area + "\ngültig vom " + begin + " Uhr bis " + end + " Uhr\n" + description;
            if (!!instruction && typeof instruction === 'string' && instruction.length > 2) MeldungNew+='\nHandlungsanweisungen: '+instruction;

            // Anzahl Meldungen erst am Ende zu email hinzufügen
            allEmailMsg+=MeldungNew+'\n\n';
            if (warnDatabase.new.length>1) MeldungNew += getStringWarnCount(warnDatabase.new.length);
            /* ab Level 4 zusätzlicher Hinweis */
            if (!gefahr) gefahr=level>warnlevel;
            let topic = (level>warnlevel)?'Wichtige Wetterwarnung':'Wetterwarnung';

            sendMessage(pushdienst&PUSH,topic,MeldungNew,'','');
            /* Sprache: Verknüpfen aller neuen Warnmeldungen */

            var replaceDescription0 = entferneDatenpunkt(description);
            MeldungNew = ((level>warnlevel)?'Achtung Unwetter ':'') + headline + " gültig vom " + getFormatDateSpeak(begin) + " Uhr, bis " + getFormatDateSpeak(end) + " Uhr. " + replaceDescription0 + '  .  ';
            if (instruction && typeof instruction === 'string' && instruction.length > 2) MeldungNew+=' Handlungsanweisungen: '+instruction;
            speakMsgTemp.push(MeldungNew);
        }
    }
    /* Bereich für Sprachausgabe */
    if (onClickCheckRun) {
        if (speakMsgTemp.length==0) speakMsgTemp.push('Es liegen keine Warnmeldungen '+artikelMode+' vor.');
    }
    if (speakMsgTemp.length>0 && (forceSpeak || compareTime(START, ENDE, 'between')) && (pushdienst & (HOMETWO+SAYIT+ALEXA))!=0 ) {
        let a=1000;
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
            a+=60000;
            b+=45000;
            c+=30000;
            speakMsgTemp.shift();
        }
    }

    allEmailMsg+=allEmailMsgDelete;
    if ((pushdienst & ALLMSG)!=0 && allEmailMsg != '') {
        allEmailMsg += getStringWarnCount(warnDatabase.new.length);
        sendMessage(pushdienst&ALLMSG,gefahr?"Wichtige Wetterwarnungen "+artikelMode+"(iobroker)":"Wetterwarnungen "+artikelMode+"(iobroker)",'','',allEmailMsg);
    }

    /* Neue Werte sichern */
    warnDatabase.old = cloneObj(warnDatabase.new);
}

// Gibt einen fertigen Zähler string zurück
function getStringWarnCount(count) {
    return ' Insgesamt '+(count==1 ?'eine gültige Warnung.':count+' gültige Warnungen.');
}

/* Entfernt "°C" und anders aus Sprachmeldung und ersetzt es durch "Grad" */
/* noch nicht für UWZ angepasst */
function entferneDatenpunkt(beschreibung) {
    var rueckgabe;
    rueckgabe = beschreibung;
    try {

        rueckgabe = rueckgabe.replace(/\°C/g, "Grad");
        rueckgabe = rueckgabe.replace(/km\/h/g, "Kilometer pro Stunde");
        if (!windForceDetailsSpeak) {
            rueckgabe = rueckgabe.replace(/[0-9]+.m\/s..[0-9]+kn..Bft.[0-9]+/g, "");
        } else {
            rueckgabe = rueckgabe.replace(/kn/g, " Knoten");
            rueckgabe = rueckgabe.replace(/Bft/g, " Windstärke");
            rueckgabe = rueckgabe.replace(/m\/s/g, " Meter pro Sekunde");
        }
    }
    catch(e) {log(e,'warn');}
    return rueckgabe;
}

// Erstes befüllen der Database
function InitDatabase(){
    if ( MODE === DWD) {
        warnDatabase={new:[],old:[]};
        var idAll = $('state[state.id='+dwdPath+'.*.object]');
        for (let a=0;a<idAll.length;a++) {
            let id = idAll[a];
            addDatabaseData(id, getState(id).val, true, true);
        }
    } else if ( MODE === UWZ) {
        warnDatabase={new:[],old:[]}
        var idAll = $('state[state.id='+uwzPath+'.*.object]');
        for (let a=0;a<idAll.length;a++) {
            let id = idAll[a];
            addDatabaseData(id, getState(id).val, true, true);
        }
    }
}
// setzt on() für DWD oder UWZ
if ( MODE === DWD) {
    let path = dwdPath.split('.');
    let r = '';
    for (let a=0;a<path.length;a++) {
        if (path[a]) r+=path[a]+'\.';
    }
    r +='.*\.object$';
    on(new RegExp(r), onChange);
} else if (MODE === UWZ) {
    let path = uwzPath.split('.');
    let r = '';
    for (let a=0;a<path.length;a++) {
        if (path[a]) r+=path[a]+'\.';
    }
    r +='.*\.object$';
    on(new RegExp(r), onChange);
}

// funktion die von on() aufgerufen wird
function onChange(dp) {
    removeDatabaseDataID(dp.id);
    addDatabaseData(dp.id, dp.state.val, true);
    if(timer) clearTimeout(timer);
    if (autoMode) timer = setTimeout(check, 10000);
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
function addDatabaseData(id, value, parse, old) {
    if (old === undefined) old=false;
    if (parse === undefined) parse=true;
    var warn = null;
    if (value != '' && value != '{}' && parse) warn = JSON.parse(value);
    warn = getDatabaseData(warn);
    if (warn) {
        warn.id=id;
        warn.areaID=getRegionName(id);
        warnDatabase.new.push(warn);
        if (old) warnDatabase.old.push(cloneObj(warn)); //
    }

}
// Wandelt den Datensatz in ein internes Format um
function getDatabaseData(warn){
    if (!warn || warn === undefined || typeof warn !== 'object' || warn === {}) return null;
    let result={};
    if (MODE === DWD) {
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
        result['areaID'] = '';//warn.regionName === undefined ? '' : warn.regionName;
    } else if (MODE === UWZ) {
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
        result['level'] = warn.severity === undefined ? -1 : warn.severity;
        result['headline'] = warn.type === undefined ? '' : 'Warnung ' +artikelMode+' vor '+warningTypesString[result.type];
        result['areaID'] = warn.areaID === undefined ? '' : warn.areaID;
    }
    result['id']='';
    result['hash'] = JSON.stringify(warn).hashCode();
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
    b[1]=m; // setze Monatsname
    // entferne Jahr
    let c = b[2].split(' ');
    c[0]='';
    b[2] = c.join(' ');
    return b.join(' ');
}
// setzte die Alert States auf die höchste aktuelle Warnstufe
function SetAlertState(){
    let stateAlertid = onClickMessageState+'alert.';
    for (let b=0;b<warningTypesString.length;b++)
    {
        let stateAlertIdFull = stateAlertid+warningTypesString[b]+'.';
        let AlertLevel = -1;
        let AlertIndex = -1;
        for (let c=0;c<warnDatabase.newlength;c++) {
            if (warnDatabase.new[c].type == b && warnDatabase.new[c].level > AlertLevel) {
                AlertLevel=warnDatabase.new[c].level;
                AlertIndex=c;
            }
        }
        if (getState(stateAlertIdFull+stateAlert[0].name).val!=AlertIndex) {
            setState(stateAlertIdFull+stateAlert[0].name,AlertLevel);
            setState(stateAlertIdFull+stateAlert[1].name,b);
            setState(stateAlertIdFull+stateAlert[2].name,(AlertIndex>-1)?formatDate(new Date(warnDatabase.new[AlertIndex].start)):'');
            setState(stateAlertIdFull+stateAlert[3].name,(AlertIndex>-1)?formatDate(new Date(warnDatabase.new[AlertIndex].end)):'');
        }
    }
}

//Versende die Warnungen über die Schienen
function sendMessage(pushdienst, topic, msgsingle, msgspeak, msgall) {
    if (msgsingle) {
        if ((pushdienst & TELEGRAM)!=0) {
            if (telegramUser.length>0) {
                for (let a=0;a<telegramUser.length;a++) {
                    sendTo ("telegram.0", {user: telegramUser[a], text: msgsingle});
                }
            }
            if (telegramChatId.length>0){
                for (let a=0;a<telegramChatId.length;a++) {
                    sendTo ("telegram.0", {ChatId: telegramChatId[a], text: msgsingle});
                }
            }
            if(!(telegramUser.length>0||telegramChatId.length>0)) {
                sendTo ("telegram.0", msgsingle);
            }
        }
        if ((pushdienst & PUSHOVER)!=0) {
            sendTo("pushover.0", msgsingle);
        }
        if ((pushdienst & IOGO)!=0) {
            if (ioGoUser.length>0) {
                for (let a=0;a<ioGoUser.length;a++) {
                    sendTo('iogo.0', "send", {
                        user:                   ioGoUser[a],
                        text:                   topic,
                        title:                  msgsingle
                    });
                }
            } else {
                sendTo('iogo.0', "send", {
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
                sendTo("email", senderEmailID[0]?{from: senderEmailID[0], to: empfaengerEmailID[a], subject: topic, text: msgall}:{to: empfaengerEmailID[a], subject: topic, text: msgall});
            }
        } else {
            sendTo("email", senderEmailID[0]?{from: senderEmailID[0], subject: topic, text: msgall}:{subject: topic, text: msgall});
        }
    }
}

// gibt aktuell die Alexa ID zurück
function getFullId(a,b) {
    return a.replace(placeHolder,b)
}
// Klone das Objekt
function cloneObj(j) {
    return JSON.parse(JSON.stringify(j));
}

// vergleich regionName und die Obj.id und gib den benutzerfreundlichen Namen zurück.
function getRegionName(id) {
    if (!Array.isArray(regionName) || regionName.length==0) return '';
    for (let a=0; a<regionName.length;a++) {
        if (id.includes(regionName[a][0])) {
          return ' für '+regionName[a][1];
      }
    }
    return '';
}

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
        if (DEBUG) log('getCustomRoot: ' +getCustomRoot(id));
        if (DEBUG) log('getEndOfState: ' + getEndOfState(id));
        if(def == null && type.type == 'string')
        type.def = '';
        else
        type.def = def ;
        createUserStates(getCustomRoot(id),false,[
            [getEndOfState(id), type ],
        ], callback);
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
