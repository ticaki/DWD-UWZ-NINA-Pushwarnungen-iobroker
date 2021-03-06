//Version 1.15.9.2
//nachbearbeitet von ticaki
//Stand 02.03.2020
/*
*/
/* ************************************************************************* */
/*             Script zum Übertragen der DWD-Wetterwarnungen über            */
/*             Telegram, Pushover, Home24-Mediaplayer oder SayIt             */
/*     mit freundlicher Unterstützung von Paul53 (Tausend Dank nochmals)     */
/*                    Stand: 130022017    PrinzEisenherz1                    */
/*                                                                           */
/*                                                                           */
/*                                                                           */
/* ************************************************************************* */

//StatePfad um Mitteilungen auszulösen darunter werden jeweils Punkte für jede Ausgabemöglichkeit erstellt.
var onClickMessageState = 'javascript.0.DWD_Script.'; // abschließender Punkt . nicht vergessen

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
/* ************************************************************************* */
/*                       Konfiguration ab hier                               */
/* ************************************************************************* */

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

/* Einstellungen zur Emailbenachrichtigung*/
var senderEmailID = [""]; // mit Sender Emailadresse füllen. email Adapter muß installiert sein. 1 Eintrag erlaubt [] oder ["email1"]
var empfaengerEmailID = [""];// mit Empfänger Emailadresse füllen. Mehrere Empfänger möglich. [] oder ["email1"] oder ["email1","email2"]

/* Konfiguration Sprachausgabe über Home24-Mediaplayer */
//var idMediaplayer = ["192.168.178.x:Port"];
var idMediaplayer = [""]; // Eingabe IP-Adresse incl. Port für Home24-Mediaplayer mehrere Möglich - ungetestet

/* Konfiguration Telegram */
var telegramUser = ['']; // Einzelnutzer ['Hans']; Multinutzer ['Hans','Gretel']; Nutzer vom Adapter übernehmen [];
var telegramChatId =[''];

/* Konfiguration Sprachausgabe über SayIt */
var idSayIt = ["sayit.0.tts.text"]; // mehrfach Einträge möglich
var sayItVolumen = [60]; // gleiche Anzahl wie idSayIt

/* Konfiguration Sprachausgabe über Alexa
/* mehrere Einträge möglich, bei mir ging nur der Echo, 2 dots 2.Gen reagieren nicht auf announcement. */
var idAlexaSerial =['']; // die reine Seriennummer des Echos z.B.: var idAlexaSerial =['G090RV32984110Y','G090RV32984110Y']
var alexaVolumen = [40]; // Lautstärke die gleiche Anzahl an Einträgen wie bei idAlexaSerial

//Konfiguration von ioGo
var ioGoUser = ['']; // // Einzelnutzer ['Hans']; Multinutzer ['Hans','Gretel']; Nutzer vom Adapter übernehmen [];


// Filtereinstellungen
const minlevel = 0 // Warnungen gleich oder unterhalb dieses Levels nicht senden;
const maxhoehe = 2410 // Warnung für eine Höhe oberhalb dieses Wertes nicht senden

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
var WindForceDetailsSpeak = false;

/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */
/*                       Konfiguration Ende                                  */
/* ************************************************************************* */
/*        Keine Anpassungen ab hier, außer du weißt was du tuest             */
/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */
var SPEAK = ALEXA+HOMETWO+SAYIT;
var PUSH = TELEGRAM+PUSHOVER+IOGO+STATE;
var ALLMSG = EMAIL;
var placeHolder = 'XXXXPLACEHOLDERXXXX';
var idAlexa = 'alexa2.0.Echo-Devices.'+placeHolder+'.Commands.announcement';
var idAlexaVolumen = 'alexa2.0.Echo-Devices.'+placeHolder+'.Commands.speak-volume';
var forceSpeak = false;
/* Arrays festlegen */
const InitArraylength = 9;
var newDescriptions = [InitArraylength];
var oldDescriptions = [InitArraylength];
var newHeadlines = [InitArraylength];
var oldHeadlines = [InitArraylength];
var newBegins = [InitArraylength];
var oldBegins = [InitArraylength];
var newEnds = [InitArraylength];
var oldEnds = [InitArraylength];
var newInstruction = [InitArraylength];
var oldData = [InitArraylength];
var newData = [InitArraylength];
var timer = null;
var onClickCheckRun = false;

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
    testValueTypeLog(sayItVolumen[a],'sayItVolumen','number');
}
for (let a=0;a<alexaVolumen.length;a++) {
    testValueTypeLog(alexaVolumen[a],'alexaVolumen','number');
}


function testValueTypeLog(test, teststring, type) {
    if ( typeof test !== type ) {
        let errorLog = 'Konfiguration enthält einen Fehler. Ändere '+teststring+' = [';
        if (type == 'string') {
            errorLog+=test+']; in '+teststring+' = [\''+test+'\'];';
        } else {
            errorLog+='\''+test+'\']; in '+teststring+' = ['+test+'];';
        }
        log(errorLog, 'error');
        stopScript();
    }
}
/* Überpüfe die Konfiguration soweit möglich */
if ((pushdienst&ALEXA) != 0) {
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

/* erstmaliges Befüllen der arrays */
for (let a=0;a<InitArraylength;a++) {
    var id = "dwd.0.warning";
    if (a!=0) id+=a.toString();
    id+='.object';
    var warn = {};
    if (extendedExists(id)) warn = JSON.parse(getState(id).val);
    warn = convertJsonDWD(warn);
    newDescriptions[a] = warn.description;
    oldDescriptions[a] = warn.description;
    newHeadlines[a] = warn.headline;
    oldHeadlines[a] = warn.headline;
    newBegins[a] = warn.start;
    oldBegins[a] = warn.start;
    newEnds[a] = warn.end;
    oldEnds[a] = warn.end;
    newData[a] = {"level":warn.level,"type":warn.type};
    oldData[a] = {"level":warn.level,"type":warn.type};
}

// State der Pushnachrichten über pushover/telegram spiegelt

// Stell sicher, dass sich am Ende ein Punkt befindet
if(onClickMessageState[onClickMessageState.length-1] != '.')
    onClickMessageState += '.';

// Hole Anfangsknoten für createUserStates
function getRoot(){
    let sRoot = '';
    if(onClickMessageState.includes('userdata'))
        sRoot = '0_userdata.0';
    else
        sRoot = 'javascript.'+ onClickMessageState.split('.')[1];
    return sRoot;
}

// Schneide den Anfang ab - z.B. javascript.0.
function getEndOfState(state){
    return state.replace(getRoot()+'.','');
}

// Übernahme vom createUserStates Skript
function extendedExists(id){
    let b = ($(id).length > 0) && (existsState(id));
    return b;
}

const mirrorMessageState = onClickMessageState + 'message';
if (!extendedExists(mirrorMessageState)) {
    log('getRoot: ' +getRoot());
    log('message: ' + getEndOfState(mirrorMessageState));
    createUserStates(getRoot(),false,[
        [getEndOfState(mirrorMessageState), {'type':'string', 'read':true, 'write':false,'desc':'Beschreibung','def':'' }]
    ]);
}

// State über den man gesonderte Aktionen auslösen kann, gibt die höchste Warnstufe aus.
// Warning types
var warningTypesString = [
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
            stateAlert[a].type.name = stateAlertIdFull.toString();
            if (!extendedExists(stateAlertIdFull)) {
                let def;
                if(stateAlert[a].default == null && stateAlert[a].type.type == 'string')
                    def = '';
                else
                    def = stateAlert[a].default ;
                createUserStates(getRoot(),false,[
                    [getEndOfState(stateAlertIdFull), {'type':stateAlert[a].type.type,'def':def}]
                ]);

                allStateExist=false;
            }
        }
    }
    if (allStateExist) SetAlertState();
}

function onClickStates() {
// Nachrichtenversand per Click States erzeugen und subscript
for (var a=0;a<konstanten.length;a++){
    if (!extendedExists(onClickMessageState+'Commands.'+konstanten[a].name)) {
         createUserStates(getRoot(),false,[
            [getEndOfState(onClickMessageState+'Commands.'+konstanten[a].name), {'type':'boolean', 'read':true, 'write':true, 'role':'button', 'def':false,'desc':'Beschreibung' }]
        ]);
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
            for (let i=0;i<oldDescriptions.length;i++) {
                oldHeadlines[i] = '';
                oldDescriptions[i] = '';
                oldBegins[i] = '';
                oldEnds[i] = '';
                oldData[i] = {"type":-1,"level":-1};
            }
            forceSpeak = forcedSpeak;
            onClickCheckRun = true;
            check();
            onClickCheckRun = false;
            forceSpeak = false;
            pushdienst = oldPushdienst;
        })
    }
}};

onClickStates();

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

function convertStringToDate(s) {
    if (typeof s !== 'string' ) return null;
    var e = s.split(':');
    if (!Array.isArray(e) || e.length != 2) return null;
    var d = new Date();
    d.setHours(e[0]);
    d.setMinutes(e[1]);
    d.setSeconds(0);
    return d;
}

function check() {
    if (!forcedSpeak) forceSpeak = (!startTimeSpeakWeekend||!startTimeSpeak||!endTimeSpeak);
    setWeekend();

    SetAlertState();

    var activeCount = 0;
    newDescriptions.forEach((item, i) => {if (item) activeCount++;});

    /* Bereich für 'Alle Wetterwarnungen wurden aufgehoben' */
    if(newDescriptions.findIndex(function(a){return (!!a);})==-1 && oldDescriptions.findIndex(function(a){return (!!a);})!=-1) {
        let MeldungSDWD = 'Achtung' + '  .  ' + 'Alle Warnmeldungen des DWD wurden aufgehoben';

        /* Bereich für Sprachausgabe über SayIt & Alexa & Home24*/
        if ( forceSpeak || compareTime(START, ENDE, 'between')){                  // Ansage über Sayit nur im definierten Zeitbereich
            sendMessage(pushdienst&SPEAK,'','',MeldungSDWD,'');
        }
        let pushmsg = 'Alle Warnmeldungen des DWD wurden aufgehoben';
        sendMessage(pushdienst&PUSH,'Wetterentwarnung',pushmsg,'','');
        sendMessage(pushdienst&ALLMSG,'Wetterentwarnung des DWD(iobroker)','','',pushmsg);

        /* alle Sicherungen Wetterwarnung löschen */
        oldHeadlines = newHeadlines.slice();
        oldDescriptions = newDescriptions.slice();
        oldBegins = newBegins.slice();
        oldEnds = newEnds.slice();
        oldData = newData.slice();
        return;
    }

    /* Variablen für Meldungen Text */
    var MeldungNew = '';
    /* Variablen für Meldungen Sprache */
    var MeldungSpracheDWD = [];
    var MeldungNewSprache = '';
    var MeldungOldSprache = '';
    var AllEmailMsg = '';
    var AllEmailMsgDelete = '';

    var headline;
    var description;
    var begin;
    var end;
    var i;
    var warn;

    /* Bereich für 'Wetterwarnung gültig bis wurde aufgehoben' */
    for(i = 0; i < newDescriptions.length; i++) {
        description = oldDescriptions[i];
        headline = oldHeadlines[i];
        if(description !== undefined && headline !== undefined && description !== '' && newDescriptions.indexOf(description) == -1 ) {
            end = getFormatDate(oldEnds[i]);

            let pushmsg = "Die Wetterwarnung " +"'"+ headline + " gültig bis " + end + "'" + " des DWD wurde aufgehoben.";
            pushmsg += ' Insgesamt '+(activeCount==1 ?'eine gültige Warnung.':activeCount+' gültige Warnungen.');
            AllEmailMsgDelete+=pushmsg+'\n\n';
            sendMessage(pushdienst&PUSH,'Wetterentwarnung',pushmsg,'','');

            /* Sprache: Verknüpfen aller aufgehobenen Wetterwarnungen */
            MeldungOldSprache = headline + ' gültig bis ' + getFormatDateSpeak(end) + ' Uhr wurde aufgehoben' + '  .  ';
            MeldungSpracheDWD.push(MeldungOldSprache);
        }
    }
    let gefahr = false;
    /* Bereich für 'Neue Amtliche Wetterwarnung' */
    for(i = 0; i < newDescriptions.length; i++) {
        headline = newHeadlines[i];
        description = newDescriptions[i];
        let level = newData[i].level;
        var instruction = newInstruction[i];
        if(description !== undefined && description !== "" && oldDescriptions.indexOf(description) == -1 ) {
            begin = getFormatDate(new Date(newBegins[i]));
            end = getFormatDate(new Date(newEnds[i]));
            MeldungNew = headline + "\ngültig vom " + begin + " Uhr bis " + end + " Uhr\n" + description;
            if (!!instruction && typeof instruction === 'string' && instruction.length > 2) MeldungNew+='\nHandlungsanweisungen: '+instruction;
            if (activeCount>1) MeldungNew += ' Insgesamt '+activeCount+' gültige Warnungen.'
            /* ab Level 4 zusätzlicher Hinweis */
            if (!gefahr) gefahr=level>3;
            let topic = (level>3)?'Wichtige Wetterwarnung':'Wetterwarnung';

            sendMessage(pushdienst&PUSH,topic,MeldungNew,'','');
            AllEmailMsg+=MeldungNew+'\n\n';
            /* Sprache: Verknüpfen aller neuen Warnmeldungen */

            var replaceDescription0 = entferneDatenpunkt(description);
            MeldungNewSprache = ((level>3)?'Achtung Unwetter ':'') + headline + " gültig vom " + getFormatDateSpeak(begin) + " Uhr, bis " + getFormatDateSpeak(end) + " Uhr. " + replaceDescription0 + '  .  ';
            if (!!instruction && typeof instruction === 'string' && instruction.length > 2) MeldungNewSprache+=' Handlungsanweisungen: '+instruction;
            MeldungSpracheDWD.push(MeldungNewSprache);
        }
    }
    /* Bereich für Sprachausgabe */
    if (onClickCheckRun) {
        if (MeldungSpracheDWD.length==0) MeldungSpracheDWD.push('Es liegen keine Warnmeldungen des DWD vor.');
    }
    if (MeldungSpracheDWD.length>0 && (forceSpeak || compareTime(START, ENDE, 'between')) && (pushdienst & (HOMETWO+SAYIT+ALEXA))!=0 ) {
        let a=1000;
        let b = a;
        let c = a;
        while (MeldungSpracheDWD.length>0)
        {
            let msgAppend = '';
            if (MeldungSpracheDWD.length > 1) {
                if (MeldungSpracheDWD.length-1==1) {
                    msgAppend = ' Eine weitere neue Warnung.';
                } else {
                    msgAppend = MeldungSpracheDWD.length-1+' weitere neue Warnungen.';
                }
            } else {
                if (activeCount==0) {if ( !onClickCheckRun )msgAppend = ' keine weitere Warnung.';}
                else {
                    if (activeCount==1) msgAppend = ' Insgesamt eine aktive Warnung.';
                    else msgAppend = ' Insgesamt '+activeCount+ ' aktive Warnungen.';
                }
            }
            if((pushdienst & HOMETWO)!=0 ){
                setTimeout(function(msg,msg2){
                    sendMessage(HOMETWO,'','',msg+msg2,'');
                },a,MeldungSpracheDWD[0], msgAppend);
            }
            /* Bereich für Sprachausgabe über SayIt + Alexa */
            if ((pushdienst & SAYIT)!=0) {
                setTimeout(function(msg,msg2){
                    sendMessage(SAYIT,'','',msg+msg2,'');
                },b,MeldungSpracheDWD[0], msgAppend);
            }
            if ((pushdienst & ALEXA)!=0) {
                setTimeout(function(msg,msg2){
                    sendMessage(ALEXA,'','',msg+msg2,'');
                },c,MeldungSpracheDWD[0], msgAppend);
            }
            a+=60000;
            b+=45000;
            c+=30000;
            MeldungSpracheDWD.shift();
        }
    }

    AllEmailMsg+=AllEmailMsgDelete;
    if ((pushdienst & ALLMSG)!=0 && AllEmailMsg != '') {
        sendMessage(pushdienst&ALLMSG,gefahr?"Wichtige Wetterwarnungen des DWD(iobroker)":"Wetterwarnungen des DWD(iobroker)",'','',AllEmailMsg);
    }

    /* Neue Werte sichern */
    oldHeadlines = newHeadlines.slice();
    oldDescriptions = newDescriptions.slice();
    oldBegins = newBegins.slice();
    oldEnds = newEnds.slice();
    oldData = newData.slice();
}

/* Entfernt "°C" aus Sprachmeldung und ersetzt es durch "Grad" */
function entferneDatenpunkt(beschreibung) {
    var rueckgabe;
    rueckgabe = beschreibung;
    try {

        rueckgabe = rueckgabe.replace(/\°C/g, "Grad");
        rueckgabe = rueckgabe.replace(/km\/h/g, "Kilometer pro Stunde");
        if (!WindForceDetailsSpeak) {
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

on(/^dwd\.0\..*\.object$/, function(dp) {
    let i = getIdIndex(dp.id);
    var warn = null;
    if (dp.state.val != '') warn = JSON.parse(dp.state.val);
    warn = convertJsonDWD(warn);
    newDescriptions[i] = warn.description ;
    newHeadlines[i] = warn.headline;
    newBegins[i] = warn.start;
    newEnds[i] = warn.end;
    newInstruction[i] = warn.instruction;
    newData[i].level = warn.level;
    newData[i].type = warn.type;
    if(timer) clearTimeout(timer);
    if (autoMode) timer = setTimeout(check, 10000);
});

function convertJsonDWD(warn) {
    warn = (!warn || warn === ''? {} : warn);
    if (warn != {} && (warn.altitudeStart>maxhoehe || warn.level < minlevel)) warn = {};
    let a = warn.description === undefined ? '' : warn.description;
    let b = warn.headline === undefined ? '' : warn.headline;
    let c = warn.start === undefined ? null : warn.start||null;
    let d = warn.end === undefined ? null : warn.end||null;
    let e = warn.instruction === undefined ? '' : warn.instruction;
    let f = warn.type === undefined ? -1 : warn.type;
    let g = warn.level === undefined ? -1 : warn.level;
    return {"description":a,"headline":b,"start":c,"end":d,"instruction":e,"type":f,"level":g};
}

function getIdIndex(a) {
    a = a.split('.');
    if (a[2].length == 7) return 0
    return a[2][7];
}
function getFormatDate(a) {
    if (!a || a === '') return '';
    return formatDate(a.getTime(), formatierungString);
}
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

function SetAlertState(){
    let stateAlertid = onClickMessageState+'alert.';
    for (let b=0;b<warningTypesString.length;b++)
    {
        let stateAlertIdFull = stateAlertid+warningTypesString[b]+'.';
        let AlertLevel = -1;
        let AlertIndex = -1;
        for (let c=0;c<newData.length;c++) {
            if (newData[c].type == b && newData[c].level > AlertLevel) {
                AlertLevel=newData[c].level;
                AlertIndex=c;
            }
        }
        if (getState(stateAlertIdFull+stateAlert[0].name).val!=AlertIndex) {
            setState(stateAlertIdFull+stateAlert[0].name,AlertLevel);
            setState(stateAlertIdFull+stateAlert[1].name,b);
            setState(stateAlertIdFull+stateAlert[2].name,(AlertIndex>-1)?formatDate(new Date(newBegins[AlertIndex])):'');
            setState(stateAlertIdFull+stateAlert[3].name,(AlertIndex>-1)?formatDate(new Date(newEnds[AlertIndex])):'');
        }
    }
}

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

function getFullId(a,b) {
    return a.replace(placeHolder,b)
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
            if( ($(loopParam[0]).length > 0) && (existsState(loopParam[0])) ) { // Workaround due to https://github.com/ioBroker/ioBroker.javascript/issues/478
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
