//Version 0.82
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
var MODE = 'DWD'; // DWD oder UWZ
//StatePfad um Mitteilungen auszulösen darunter werden jeweils Punkte für jede Ausgabemöglichkeit erstellt.
var onClickMessageState = 'javascript.0.'+MODE+'_Script_alpha.'; // abschließender Punkt . nicht vergessen

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
var idSayIt = [""]; // mehrfach Einträge möglich
var sayItVolumen = [60]; // gleiche Anzahl wie idSayIt

/* Konfiguration Sprachausgabe über Alexa
/* mehrere Einträge möglich, bei mir ging nur der Echo, 2 dots 2.Gen reagieren nicht auf announcement. */
var idAlexaSerial =['']; // die reine Seriennummer des Echos z.B.: var idAlexaSerial =['G090RV32984110Y','G090RV32984110Y']
var alexaVolumen = [40]; // Lautstärke die gleiche Anzahl an Einträgen wie bei idAlexaSerial

//Konfiguration von ioGo
var ioGoUser = ['']; // // Einzelnutzer ['Hans']; Multinutzer ['Hans','Gretel']; Nutzer vom Adapter übernehmen [];


// Filtereinstellungen
const minlevel = 0 // Warnungen gleich oder unterhalb dieses Levels nicht senden;
const maxhoehe = 1410 // Warnung für eine Höhe oberhalb dieses Wertes nicht senden

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
/* ************************************************************************* */
/* ************************************************************************* */
/*                       Konfiguration Ende                                  */
/* ************************************************************************* */
/*        Keine Anpassungen ab hier, außer du weißt was du tuest             */
/* ************************************************************************* */
/* ************************************************************************* */
/* ************************************************************************* */


// Wandel Usereingabe in True/False um
autoMode = !!autoMode;
forcedSpeak = !!forcedSpeak;
windForceDetailsSpeak = !!windForceDetailsSpeak;

// Variable nicht konfigurierbar
var SPEAK = ALEXA+HOMETWO+SAYIT;
var PUSH = TELEGRAM+PUSHOVER+IOGO+STATE;
var ALLMSG = EMAIL;
var placeHolder = 'XXXXPLACEHOLDERXXXX';
var idAlexa = 'alexa2.0.Echo-Devices.'+placeHolder+'.Commands.announcement';
var idAlexaVolumen = 'alexa2.0.Echo-Devices.'+placeHolder+'.Commands.speak-volume';
var forceSpeak = false;
/* Arrays festlegen */
var timer = null;
var onClickCheckRun = false;
var warnDatabase = {new:[],old:[]};

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
        if (!existsState(getFullId(idAlexa,idAlexaSerial[a]))) {
            log('Alexa-Serial '+idAlexaSerial[a]+' ist fehlerhaft. Überpüfen!','error');
            stopScript();
        }
    }
}

if ((pushdienst&SAYIT) != 0) {
    for (let a=0;a<idSayIt.length;a++) {
        if (
            !existsState(idSayIt[a])
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
InitDatabase();


// State der Pushnachrichten über pushover/telegram spiegelt
const mirrorMessageState = onClickMessageState+'message';
if (!existsState(mirrorMessageState)) {
    createState(mirrorMessageState,'', {
        read: true,
        write: false,
        desc: "Beschreibung",
        type: "string",
    });
}

// State über den man gesonderte Aktionen auslösen kann, gibt die höchste Warnstufe aus.
// Warning types
var warningTypesString =[];
if (MODE == 'DWD') {
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
} else if (MODE == 'UWZ') {
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
            if (!existsState(stateAlertIdFull)) {
                createState(stateAlertIdFull,stateAlert[a].default, stateAlert[a].type);
                allStateExist=false;
            }
        }
    }
    if (allStateExist) SetAlertState();
}

// Nachrichtenversand per Click States erzeugen und subscript
for (var a=0;a<konstanten.length;a++){
    if (!existsState(onClickMessageState+'Commands.'+konstanten[a].name)) {
        createState(onClickMessageState+'Commands.'+konstanten[a].name,false, {
            read: true,
            write: true,
            desc: "Beschreibung",
            type: "boolean",
            role: "button",
            def: false
        });
    }
    if (existsState(onClickMessageState+'Commands.'+konstanten[a].name)){
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

var artikelMODE = MODE == 'DWD'?'des DWD' : 'der UWZ';
function check() {
    if (!forcedSpeak) forceSpeak = (!startTimeSpeakWeekend||!startTimeSpeak||!endTimeSpeak);
    setWeekend();

    SetAlertState();
    warnDatabase.new.sort(function(a,b) {return a.begin-b.begin;})

    /* Bereich für 'Alle Wetterwarnungen wurden aufgehoben' */
    if(warnDatabase.new.length==0 && warnDatabase.old.length>0) {
        let PushMsg = 'Achtung' + '  .  ' + 'Alle Warnmeldungen '+artikelMODE+' wurden aufgehoben';

        /* Bereich für Sprachausgabe über SayIt & Alexa & Home24*/
        if ( forceSpeak || compareTime(START, ENDE, 'between')){                  // Ansage über Sayit nur im definierten Zeitbereich
            sendMessage(pushdienst&SPEAK,'','',PushMsg,'');
        }
        PushMsg = 'Alle Warnmeldungen '+artikelMODE+' wurden aufgehoben';
        sendMessage(pushdienst&PUSH,'Wetterentwarnung',PushMsg,'','');
        sendMessage(pushdienst&ALLMSG,'Wetterentwarnung '+artikelMODE+'(iobroker)','','',PushMsg);

        /* alle Sicherungen Wetterwarnung löschen */
        warnDatabase.old = cloneObj(warnDatabase.new);
      return;
    }
    let AllEmailMsg='';
    let AllEmailMsgDelete='';
    let MeldungSpracheDWD=[];

    /* Bereich für 'Wetterwarnung gültig bis wurde aufgehoben' */
    for(let i = 0; i < warnDatabase.old.length; i++) {
        let description = warnDatabase.old[i].description;
        let headline = warnDatabase.old[i].headline;
        let hash = warnDatabase.old[i].hash;
        if(description && headline && warnDatabase.new.findIndex(function(j){return j.hash == hash;}) == -1 ) {
            let end = getFormatDate(warnDatabase.old[i].end);

            let pushmsg = "Die Wetterwarnung " +"'"+ headline + " gültig bis " + end + "'" + " des DWD wurde aufgehoben.";
            pushmsg += ' Insgesamt '+(warnDatabase.new.length==1 ?'eine gültige Warnung.':warnDatabase.new.length+' gültige Warnungen.');
            AllEmailMsgDelete+=pushmsg+'\n\n';
            sendMessage(pushdienst&PUSH,'Wetterentwarnung',pushmsg,'','');

            /* Sprache: Verknüpfen aller aufgehobenen Wetterwarnungen */
            pushmsg = headline + ' gültig bis ' + getFormatDateSpeak(end) + ' Uhr wurde aufgehoben' + '  .  ';
            MeldungSpracheDWD.push(pushmsg);
        }
    }
    let gefahr = false;
    /* Bereich für 'Neue Amtliche Wetterwarnung' */
    for(i = 0; i < warnDatabase.new.length; i++) {
        let headline = warnDatabase.new[i].headline;
        let description = warnDatabase.new[i].description;
        let level = warnDatabase.new[i].level;
        let instruction = warnDatabase.new[i].instruction;
        let hash = warnDatabase.new[i].hash;
        if(hash && warnDatabase.old.findIndex(function(j){return j.hash == hash;}) == -1 ) {
            let begin = getFormatDate(warnDatabase.new[i].start);
            let end = getFormatDate(warnDatabase.new[i].end);
            let MeldungNew = headline + "\ngültig vom " + begin + " Uhr bis " + end + " Uhr\n" + description;
            if (!!instruction && typeof instruction === 'string' && instruction.length > 2) MeldungNew+='\nHandlungsanweisungen: '+instruction;
            if (warnDatabase.new.length>1) MeldungNew += ' Insgesamt '+warnDatabase.new.length+' gültige Warnungen.'
            /* ab Level 4 zusätzlicher Hinweis */
            if (!gefahr) gefahr=level>3;
            let topic = (level>3)?'Wichtige Wetterwarnung':'Wetterwarnung';

            sendMessage(pushdienst&PUSH,topic,MeldungNew,'','');
            AllEmailMsg+=MeldungNew+'\n\n';
            /* Sprache: Verknüpfen aller neuen Warnmeldungen */

            var replaceDescription0 = entferneDatenpunkt(description);
            MeldungNew = (level>3)?'Achtung Unwetter ':'' + headline + " gültig vom " + getFormatDateSpeak(begin) + " Uhr, bis " + getFormatDateSpeak(end) + " Uhr. " + replaceDescription0 + '  .  ';
            if (instruction && typeof instruction === 'string' && instruction.length > 2) MeldungNew+=' Handlungsanweisungen: '+instruction;
            MeldungSpracheDWD.push(MeldungNew);
        }
    }
    /* Bereich für Sprachausgabe */
    if (onClickCheckRun) {
        if (MeldungSpracheDWD.length==0) MeldungSpracheDWD.push('Es liegen keine Warnmeldungen '+artikelMODE+' vor.');
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
                if (warnDatabase.new.length==0) {if ( !onClickCheckRun )msgAppend = ' keine weitere Warnung.';}
                else {
                    if (warnDatabase.new.length==1) msgAppend = ' Insgesamt eine aktive Warnung.';
                    else msgAppend = ' Insgesamt '+warnDatabase.new.length+ ' aktive Warnungen.';
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
        sendMessage(pushdienst&ALLMSG,gefahr?"Wichtige Wetterwarnungen "+artikelMODE+"(iobroker)":"Wetterwarnungen "+artikelMODE+"(iobroker)",'','',AllEmailMsg);
    }

    /* Neue Werte sichern */
    warnDatabase.old = cloneObj(warnDatabase.new);
}

/* Entfernt "°C" aus Sprachmeldung und ersetzt es durch "Grad" */
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

function InitDatabase(){
    if ( MODE === 'DWD') {
        warnDatabase={new:[],old:[]};
        var idAll = $('state[state.id=dwd.0.*.object]');
        for (let a=0;a<idAll.length;a++) {
            let id = idAll[a];
            addDatabaseData(id, getState(id).val, true, true);
        }
    } else if ( MODE === 'UWZ') {
        warnDatabase={new:[],old:[]}
        var idAll = $('state[state.id=UWZ.0.*.object]');;
        for (let a=0;a<idAll.length;a++) {
            let id = idAll[a];
            addDatabaseData(id, getState(id).val, true, true);
        }
    }
}



if ( MODE === 'DWD') {
    on(/^dwd\.0\..*\.object$/, onChange);
} else if (MODE === 'UWZ') {
    on(/^dwd\.0\..*\.object$/, onChange);
}

function onChange(dp) {
    removeDatabaseDataID(dp.id);
    addDatabaseData(dp.id, dp.state.val, true);
    if(timer) clearTimeout(timer);
    if (autoMode) timer = setTimeout(check, 10000);
}

function removeDatabaseDataID(id) {
    if (!id || (typeof id !== 'string')) return;
    if (warnDatabase.new && warnDatabase.new.length > 0) {
        let i = warnDatabase.new.findIndex(function(j){return j.id==id});
        if (i!=-1) warnDatabase.new.splice(i,1);
    }
}

function addDatabaseData(id, value,parse,old) {
    if (old === undefined) old=false;
    if (parse === undefined) parse=true;
    var warn = null;
    if (value != '' && value != '{}' && parse) warn = JSON.parse(value);
    warn = getDatabaseData(warn);
    if (warn) {
        warn.id=id;
        warnDatabase.new.push(warn);
        if (old) warnDatabase.old.push(cloneObj(warn)); //
    }

}

function getDatabaseData(warn){
    if (!warn || typeof warn !== 'object') return null;
    let result={};
    if (MODE === 'DWD') {
        if (warn != {} && (warn.altitudeStart>maxhoehe || warn.level < minlevel)) return null;
        result['mode'] = 'DWD';
        result['description'] = warn.description === undefined ? '' : warn.description;
        result['headline'] = warn.headline === undefined ? '' : warn.headline;
        result['start'] = warn.start === undefined ? null : warn.start||null;
        result['end'] = warn.end === undefined ? null : warn.end||null;
        result['instruction'] = warn.instruction === undefined ? '' : warn.instruction;
        result['type'] = warn.type === undefined ? -1 : warn.type;
        result['level'] = warn.level === undefined ? -1 : warn.level;
    } else if (MODE === 'UWZ') {
        if (warn != {} && warn.level < minlevel) return null;
        result['mode'] = 'UWZ';
        result['description'] = warn.LongText === undefined ? '' : warn.LongText;
        result['headline'] = warn.ShortText === undefined ? '' : warn.ShortText;
        result['start'] = warn.begin === undefined ? null : warn.begin||null;
        result['end'] = warn.end === undefined ? null : warn.end||null;
        result['instruction'] = warn.instruction === undefined ? '' : warn.instruction;
        result['type'] = warn.type === undefined ? -1 : warn.type;
        result['level'] = warn.severity === undefined ? -1 : warn.severity;

    }
    result['id']='';
    result['hash'] = JSON.stringify(warn).hashCode();
    return result;
}
/*function convertJsonDWD(warn) {
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
}*/
function getFormatDate(a) {
    if (!a || !(typeof a === 'number')) return '';
    return formatDate(new Date (a).getTime(), formatierungString);
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
                if (existsState(getFullId(idAlexaVolumen,idAlexaSerial[a]))) setState(getFullId(idAlexaVolumen,idAlexaSerial[a]), alexaVolumen[a]);
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

function cloneObj(j) {
    return JSON.parse(JSON.stringify(j));
}

/* ************************************************************************* */
/*                       ALPHABEREICH                                        */
/* ************************************************************************* */

/*
/*var userConfig = [
    {name:'Telegram',type:'boolean',init:false,container:'bool'},
    {name:'Pushover',type:'boolean',init:false,container:'bool'},
    {name:'ioGo',type:'boolean',init:false,container:'bool'},
    {name:'Alexa',type:'boolean',init:false,container:'bool'},
    {name:'SayIt',type:'boolean',init:false,container:'bool'},
    {name:'Home24',type:'boolean',init:false,container:'bool'},
    {name:'eMail',type:'boolean',init:false,container:'bool'},
    {name:'Datenpunkt',type:'boolean',init:false,container:'bool'},
    {name:'eMail Sender',type:'string',init:'',container:'string'},
    {name:'eMail Empfänger',type:'string',init:'',container:'array'},
    {name:'Home24 IP',type:'string',init:'',container:'array'},
    {name:'Telegram Nutzer',type:'string',init:'',container:'array'},
    {name:'SayIt Datenpunkt',type:'string',init:'',container:'array'},
    {name:'SayIt Lautstärke',type:'string',init:'',container:'array'},
    {name:'Alexa Echo Seriennummern',type:'string',init:'',container:'array'},
    {name:'Alexa Echo Lautstärke',type:'string',init:'',container:'array'},
    {name:'ioGo Benutzer',type:'string',init:'',container:'array'},
    {name:'Mindest Warnlevel',type:'number',init:0,container:'number'},
    {name:'Maximale Höhe',type:'number',init:'2000',container:'number'},
    {name:'Sprachausgabe Wochentags Startzeit',type:'string',init:'6:30',container:'string'},
    {name:'Sprachausgabe Wochenende Startzeit',type:'string',init:'9:30',container:'string'},
    {name:'Sprachausgabe Endzeit',type:'string',init:'22:30',container:'string'},
    {name:'Automatikmodus',type:'boolean',init:true,container:'bool'},
    {name:'Sprachausgabe Click überschreibt Zeiten',type:'boolean',init:true,container:'bool'},
    {name:'Sprachausgabe alle Windgeschwindigkeiten vorlesen',type:'boolean',init:true,container:'bool'},
];*/
