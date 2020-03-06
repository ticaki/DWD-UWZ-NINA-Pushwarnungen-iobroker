//Version 0.86
/*
/* ************************************************************************* */
/*             Script zum Übertragen der DWD/UWZ-Gefahrenwarnungen über        */
/*             Telegram, Pushover, Home24-Mediaplayer, SayIt, Alexa          */
/*             eMail oder ioGo                                               */
/*             Pushnachrichten können manuell ausgelöst werden               */
/*                    Stand: 04032020    ticaki                              */
/*                                                                           */
/*                                                                           */
/* ************************************************************************* */

/* BETA das Script ist wegen der geringen Warnungen aktuell schlecht zu testen.
- manuelles auslösen ist getestet mit telegram, email und alexa2
- Alle Warnungen aufgehoben ist getestet.


Unterstützt:
- Telegram, Pushover, Home24-Mediaplayer, SayIt, Alexa, Datenpunkt, eMail oder ioGo
- NINA
- Gefahrenwarnung
- Gefahrenentwarnung

Funktionen:
- Automatischer Versand und/oder manueller Nachrichtenversand
- Zeitschaltuhr für Sprachausgabe
- Unterstützung für 0_userdata
- Datenpunkthauptpfade sind konfigurierbar
- Gefahrenwarnungen werden von alleine nach dem Ablaufen entfernt
- Texte werden für die Sprachausgabe verbessert

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
var NINA = 'NINA';
/* ************************************************************************* */
/*                       Konfiguration ab hier                               */
/* ************************************************************************* */
//StatePfad um Mitteilungen auszulösen darunter werden jeweils Punkte für jede Ausgabemöglichkeit erstellt.
var onClickMessageState = 'javascript.0.NINA_Script.'; // abschließender Punkt . nicht vergessen

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
var regionName = [[]];
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


// Filtereinstellungen z.B. CAP@dwd.de eintragen mehrere mit Trennzeichen oder Leerzeichen
var excludeSender =',';

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
var telegramInstanz='telegram.0';
var pushoverInstanz='pushover.0';
var ioGoInstanz='iogo.0';
var alexaInstanz='alexa2.0';
var emailInstanz='email';
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
autoMode = !!autoMode;
forcedSpeak = !!forcedSpeak;
windForceDetailsSpeak = !!windForceDetailsSpeak;

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
var artikelMode = 'von NINA';
var jNinaID = {
    description:'description', headline:'headline', end:'expires' , start:'effective'
    , instruction:'instruction' , type:'event' , level:'severity' , identifier:'identifier', sender:'sender'
}

/* *************************************************************************
* Überprüfe Nutzerkonfiguration
/* ************************************************************************* */

testValueTypeLog(pushdienst&(SPEAK+PUSH+ALLMSG), 'pushdienst', 'number', true);
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
/* erstmaliges Befüllen der arrays */
InitDatabase();

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

    //SetAlertState();
    warnDatabase.new.sort(function(a,b) {return a.begin-b.begin;})

    /* Bereich für 'Alle Gefahrenwarnungen wurden aufgehoben' */
    if(warnDatabase.new.length==0 && (warnDatabase.old.length>0 || onClickCheckRun)) {
        let PushMsg = 'Achtung' + '  .  ' + 'Alle Warnmeldungen '+artikelMode+' wurden aufgehoben';

        /* Bereich für Sprachausgabe über SayIt & Alexa & Home24*/
        if ( forceSpeak || compareTime(START, ENDE, 'between')){                  // Ansage über Sayit nur im definierten Zeitbereich
            sendMessage(pushdienst&SPEAK,'','',PushMsg,'');
        }
        PushMsg = 'Alle Warnmeldungen '+artikelMode+' wurden aufgehoben';
        sendMessage(pushdienst&PUSH,'Gefahrenentwarnung',PushMsg,'','');
        sendMessage(pushdienst&ALLMSG,'Gefahrenentwarnung '+artikelMode+'(iobroker)','','',PushMsg);

        /* alle Sicherungen Gefahrenwarnung löschen */
        warnDatabase.old = cloneObj(warnDatabase.new);
        return;
    }
    let allEmailMsg='';
    let allEmailMsgDelete='';
    let speakMsgTemp=[];

    /* Bereich für 'Gefahrenwarnung gültig bis wurde aufgehoben' */
    for(let i = 0; i < warnDatabase.old.length; i++) {
        let description = warnDatabase.old[i].description;
        let headline = warnDatabase.old[i].headline;
        let identifier = warnDatabase.old[i].identifier;
        if(description && headline && warnDatabase.new.findIndex(function(j){return j.identifier == identifier;}) == -1 ) {
            let end = getFormatDate(warnDatabase.old[i].end.getTime());

            let pushmsg = "Die Gefahrenentwarnung " +"'"+ headline +" gültig bis " + end + "Uhr'" + " wurde aufgehoben.";
            allEmailMsgDelete+=pushmsg+'\n\n';
            pushmsg += getStringWarnCount(warnDatabase.new.length);
            sendMessage(pushdienst&PUSH,'Gefahrenentwarnung',pushmsg,'','');

            /* Sprache: Verknüpfen aller aufgehobenen Gefahrenwarnungen */
            pushmsg = headline + ' gültig bis ' + getFormatDateSpeak(end) + ' Uhr wurde aufgehoben' + '  .  ';
            speakMsgTemp.push(pushmsg);
        }
    }
    //    let gefahr = false;
    /* Bereich für 'Neue Amtliche Gefahrenwarnung' */
    for(let i = 0; i < warnDatabase.new.length; i++) {
        let headline = warnDatabase.new[i].headline;
        let description = warnDatabase.new[i].description;
        let level = warnDatabase.new[i].level;
        let instruction = warnDatabase.new[i].instruction;
        let identifier = warnDatabase.new[i].identifier;
        if(identifier && warnDatabase.old.findIndex(function(j){return j.identifier == identifier;}) == -1 ) {
            let begin = getFormatDate(new Date (warnDatabase.new[i].start).getTime());
            let end = getFormatDate(warnDatabase.new[i].end.getTime());
            let MeldungNew = headline + "\ngültig vom " + begin + " Uhr bis " + end + " Uhr\n" + description;
            if (!!instruction && typeof instruction === 'string' && instruction.length > 2) MeldungNew+='\nHandlungsanweisungen: '+instruction;

            // Anzahl Meldungen erst am Ende zu email hinzufügen
            allEmailMsg+=MeldungNew+'\n\n';
            if (warnDatabase.new.length>1) MeldungNew += getStringWarnCount(warnDatabase.new.length);
            /* ab Level 4 zusätzlicher Hinweis */
            let topic = 'Gefahrenwarnung';

            sendMessage(pushdienst&PUSH,topic,MeldungNew,'','');
            /* Sprache: Verknüpfen aller neuen Warnmeldungen */

            var replaceDescription0 = entferneDatenpunkt(description);
            MeldungNew = headline + " gültig vom " + getFormatDateSpeak(begin) + " Uhr, bis " + getFormatDateSpeak(end) + " Uhr. " + replaceDescription0 + '  .  ';
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
            //ersetze Datumsangaben durch Tag Monatsname
            speakMsgTemp[0] = speakMsgTemp[0].replace(/\d{1,2}\.\d{1,2}\.\d{4}../gi, function(x){
                return getFormatDateSpeak(x);
            })
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
        sendMessage(pushdienst&ALLMSG,gefahr?"Wichtige Gefahrenwarnungen "+artikelMode+"(iobroker)":"Gefahrenwarnungen "+artikelMode+"(iobroker)",'','',allEmailMsg);
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
    warnDatabase={new:[],old:[]};
    var idAll = $('channel[state.id=nina.0.*.identifier$]');
    if (DEBUG) log('idAll: '+JSON.stringify(idAll));
    for (let a=0;a<idAll.length;a++) {
        let id = idAll[a];
        if (DEBUG) log('extendedExists(id): '+extendedExists(id)+' '+id)
        if (extendedExists(id)) addDatabaseData(id, getState(id).val, true);
    }

}

schedule("*/5 * * * *", onSUpdate);

on(new RegExp("^nina\.0\..*\.identifierList$"), onUpdate);


on(new RegExp("^nina\.0\..*\.identifier$"), onChange);

// funktion die von on() aufgerufen wird
function onChange(dp) {
    removeDatabaseDataID(dp.state.val);
    addDatabaseData(dp.id, dp.state.val, false);
    if(timer) clearTimeout(timer);
    if (autoMode) timer = setTimeout(check, 10000);
}
function onSUpdate(obj){onUpdate(null);};
function onUpdate(obj) {
    let c = false;
    for (let a=0; a<warnDatabase.new.length;a++) {
        let j = warnDatabase.new[a];
        if (obj && getCustomState(j.id+'.identifier','')!=j.identifier) {
            warnDatabase.new.splice(a--,1);
            c=true;
            continue;
        }
        /*if (!compareTime(new Date(1), j.end, 'between')) {
            warnDatabase.new.splice(a--,1);
            c=true;
            continue;
        }*/
        if (c) {
            if (timer) clearTimeout(timer);
            if (autoMode) timer = setTimeout(check, 10000);
        }
    }
}
// entferne Eintrag aus der Database
function removeDatabaseDataID(identifier) {
    if (!identifier || (typeof identifier !== 'string')) return;
    if (warnDatabase.new && warnDatabase.new.length > 0) {
        let i = warnDatabase.new.findIndex(function(j){return j.identifier==identifier});
        if (i!=-1) warnDatabase.new.splice(i,1);
    }
}

// für Objekt zur Database hinzu
function addDatabaseData(id, identifier, old) {
    if (old === undefined) old=false;
    let a=0;
    let baseId = getNinaWarningId(id);
    log('baseId: '+baseId);
    let warn = {};
    while (++a) {
        let b;
        if (a<10) b='0'+a;
        else b=''+a;
        let infoId=baseId+'.info'+b;
        log('infoId +.+jNinaID.headline: '+infoId +'.'+jNinaID.headline);
        if (extendedExists(infoId +'.'+jNinaID.headline)) {
            let warn = getDatabaseData(infoId, identifier);
            if (DEBUG) log('warn: '+warn);
            if (warn) {
                warn.sender = getCustomState(baseId+'.'+jNinaID.sender);
                if (DEBUG) log('!excludeSender.includes(warn.sender): '+!excludeSender.includes(warn.sender));
                if (DEBUG) log('compareTime(new Date(1), warn.end, "between"): '+compareTime(new Date(1), warn.end, 'between'));
                if ( !excludeSender.includes(warn.sender) && compareTime(new Date(1), warn.end, 'between')) {
                    if (DEBUG) log('warn: '+JSON.stringify(warn));
                    warnDatabase.new.push(warn);
                    if (old) warnDatabase.old.push(cloneObj(warn)); //
                }
            }
        } else {
            break;
        }
    }
}

// Wandelt den Datensatz in ein internes Format um
function getDatabaseData(id,identifier){
    let result={};
    result['mode'] = NINA;
    result['description'] = getCustomState(id+'.'+jNinaID.description,'');
    result['headline'] = getCustomState(id+'.'+jNinaID.headline,'');
    result['start'] = getDateObject(getCustomState(id+'.'+jNinaID.start,null));
    result['end'] = getDateObject(getCustomState(id+'.'+jNinaID.end,null));
    log(result.start);
    log(result.end);
    result['instruction'] = getCustomState(id+'.'+jNinaID.instruction,'');
    result['type'] =getCustomState(id+'.'+jNinaID.type,'');
    result['level'] = getCustomState(id+'.'+jNinaID.level,-1);
    result['areaID'] = '';//warn.regionName === undefined ? '' : warn.regionName;
    result['identifier']=identifier;
    result['id'] = id;
    if(!result.description && !result.headline) return null;
    return result;
}

function getNinaWarningId(id) {
    id = id.split('.');
    id.splice(id.length-1,1);
    id = id.join('.');
    return id;
}

function getCustomState(id, value) {
    if (extendedExists(id)) return getState(id).val;
    return value;
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
                sendTo(emailInstanz, senderEmailID[0]?{from: senderEmailID[0], to: empfaengerEmailID[a], subject: topic, text: msgall}:{to: empfaengerEmailID[a], subject: topic, text: msgall});
            }
        } else {
            sendTo(emailInstanz, senderEmailID[0]?{from: senderEmailID[0], subject: topic, text: msgall}:{subject: topic, text: msgall});
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
