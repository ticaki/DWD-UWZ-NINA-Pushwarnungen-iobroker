//Version 0.97.99.6 Alpha 4
// Erläuterung Update:
// Suche im Script nach 123456 und kopiere/ersetze ab diesem Punkt. So braucht ihr die Konfiguration nicht zu erneuern.
// Das gilt solange die Version nicht im nächsten Abschnitt genannt wird, dann muß man auch die Konfiguration neumachen oder im Forum nach den Änderungen schauen.
// Link: https://forum.iobroker.net/topic/30616/script-dwd-uwz-nina-warnungen-als-push-sprachnachrichten/
//
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
    {'name':'telegram','value':1,count:0, delay:200, maxChar: 4000 },
    {"name":'pushover',"value":2, count:0, delay:1000, maxChar: 1000},
    {"name":'email',"value":4},
    {"name":'sayit',"value":8, count:0, delay:0, maxChar: 940},
    {"name":'home24',"value":16, count:0, delay:0},
    {"name":'alexa',"value":32, count:0, delay:0, maxChar: 940},
    {"name":'state',"value":64},
    {"name":'iogo',"value":128, maxChar: 940, count: 0, delay: 300},
    {"name":'state_html',"value":256}
];
const TELEGRAM = konstanten[0].value;
const PUSHOVER = konstanten[1].value;
const EMAIL = konstanten[2].value;
const SAYIT = konstanten[3].value;
const HOMETWO = konstanten[4].value;
const ALEXA = konstanten[5].value;
const STATE = konstanten[6].value;
const IOGO = konstanten[7].value;
const STATE_HTML = konstanten[8].value;
var uPushdienst = 0;
const DWD = 1;
const UWZ = 2;
const NINA = 4;
const DWD2 = 8; // only for request
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
//uPushdienst+= STATE_HTML;        // Auskommentieren zum aktivieren. State_html befindet sich unter mainStatePath.messageHtml als Tabelle

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
// ohne die kryptischen Zeichen. Das ersetzt nicht den NINA-Adapter
var uGemeinde = ''; // hier steht zum Beispiel, Hamburg, Unterdorf
var uLandkreis = ''; // hier Kreis Bitburg, Landkreis Fürth

/* Einstellungen zur Emailbenachrichtigung*/
var senderEmailID       = [""]; // mit Sender Emailadresse füllen. email Adapter muß installiert sein. 1 Eintrag erlaubt [] oder ["email1"]
var empfaengerEmailID   = [""]; // mit Empfänger Emailadresse füllen. Mehrere Empfänger möglich. [] oder ["email1"] oder ["email1","email2"]

/* Konfiguration Sprachausgabe über Home24 - Mediaplayer */
//var idMediaplayer = ["192.168.178.x:Port"];
var idMediaplayer       = [""]; // Eingabe IP-Adresse incl. Port für Home24-Mediaplayer mehrere Möglich - ungetestet

/* Konfiguration Telegram */
var telegramUser                = ['']; // Einzelnutzer ['Hans']; Multinutzer ['Hans, Gretel']; Nutzer vom Adapter übernehmen [];
var telegramChatId              = ['']; // Mehrfach Einträge möglich ['Gruppe1','Gruppe2']
var uTelegramReplyMarkup        = null; // Falls ihr ein Telegrammmenü verwendet, könnt ihr hier einen Weg zurück definieren z.B.: {keyboard: [['Zurück']], resize_keyboard: true};
var uTelegramAllowNotification  = true; // Erlaube Telegramnotification (Benachrichtigungston/Hinweise auf dem Empfangsgerät)
var uTelegramUseStdUser         = false; // Verwende immer auch die im Adapter gespeicherten Benutzer.

/* Konfiguration Pushover */
var uPushoverDeviceName     = ''; // ein bestimmtes Gerät z.B: ['droid4'];
var uPushoverSound          = ''; // Sounds siehe: https://pushover.net/api#sounds

//Konfiguration von ioGo
var ioGoUser = ['']; // // Einzelnutzer ['Hans']; Multinutzer ['Hans', 'Gretel']; Nutzer vom Adapter übernehmen [];
var ioGoExpiry = 0;     // Nachricht wird nach Sekunden entfernt. 0: aus
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

//Formatierungsstring für Datum / Zeit Alternative "TT.MM.YYYY SS:mm" KEINE Anpassung nötig
const formatierungString =  "TT.MM.YY SS:mm";

// Sprachausgabe Zeiten
// Für durchgehende Sprachausgabe die Einstellung der Zeiten auf '' setzen. z.B. var startTimeSpeak = '';
var startTimeSpeak =        '6:45';// Zeiten mo - fr ab der Sprachausgaben ok sind. Nicht unter 6 Uhr gehen oder den Schedule ändern
var startTimeSpeakWeekend = '9:00';// sa + so Bemerkung siehe oben
var endTimeSpeak =          '22:30'; // ab diesem Zeitpunkt gibt es keine Sprachausgabe

// Ein manuellen Auslösen von Sprachnachrichten, löscht alle noch nicht ausgegebenen Sprachnachrichten aus der Liste.
var uManuellClickClearSpeakMessageList = true;
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

// Mit diesen Optionen verringert man die Nachrichtenlänge in dem Beschreibung oder Handlungsanweisungen
// nicht der Nachricht hinzugefügt werden.
var uHtmlMitBeschreibung            = true; // gilt für Email
var uHtmlMitAnweisungen             = true; // uHtmlMitBeschreibung muß evenfalls true sein um Anweisungen zu erhalten
var uTextMitBeschreibung            = true; // gilt nicht für Email, aber für alle anderen Textnachrichten
var uTextMitAnweisungen             = true; // uTextMitBeschreibung muß evenfalls true sein um Anweisungen zu erhalten
var uSpracheMitBeschreibung         = true; // gilt für alle Sprachnachrichten
var uSpracheMitAnweisungen          = true; // uSpracheMitBeschreibung muß evenfalls true sein um Anweisungen zu erhalten

// Obergrenze an Zeichen die über Sprachausgabe ausgegeben werden, bei überschreitung wird nur die Schlagzeile ausgegebenen
var uMaxCharToSpeak = 0; // 0 = aus - Zahl größer als 0 = maximal Zeichenanzahl (1000 sind rund 86 Sekunden bla bla)

// Automodus Filter um Warnungen unterhalb attentionWarningLevel von DWD, UWZ oder NINA zu unterdrücken
// Sprachausgabe bei auto und manuell unterdrückt.
// Diese Warnungen sind vorhanden, sie werden nur in den benannten Fällen ausgeblendet.
// Ist eine feste Vorgabe überschreibt alles andere
var uFilterList               = 0;   // generelles Filter für den AutoModus ( = DWD + UWZ; oder = NINA; oder = 0;), außer Warnungslevel ist gleich/über attentionWarningLevel
var uAutoNinaFilterList       = ['CAP@hochwasserzentralen.de']; //Nina only. Filter diesen Sender raus s.o. - mehrere ['abc','cde'];

var uwzPath=            'javascript.0.UWZ';
var dwdPath=            'dwd.0';
var ninaPath=           'nina.0'

// Standalone Datenquelle
/* nur Gemeinde/Landkreis/Großstädte werden verwendet: https://www.dwd.de/DE/leistungen/opendata/help/warnungen/cap_warncellids_csv.csv?__blob=publicationFile&v=3 */
var dwdWarncellId = ''; // Deaktivieren mit ''
var dwdBundesland = ''; // 3 Buchstaben

//UWZ - Landeskennung - Postleitzahl UWZDE12345
var uwzWarncellId = ''; // Deaktivieren mit ''

// Instanzen im ioBroker
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

var DEBUGINGORESTART = false // die Datenbank wird beim Start nicht befüllt Test von Standalone UWZ/DWD

var uTelegramMessageShort = 'Ww?';
var uTelegramMessageLong  = 'Wwww';

// Aus diesen Elementen wird die html warnung zusammengesetzt.
// Prefix wird als ersten eingefügt, dann mehrfach html_headline und html_message, wenn verfügbar. Zum Schluß kommt html_end
// html_headline_color wird verwendet wenn eine Farbe angegeben ist und bildet hier die Hintergrundfarbe.
// Jede einzelne Warnung wird mit Headline, Message und Farbe(optional) aufgerufen, wenn headline oder message leer ist, wird
// die Zeichenkette nicht hinzugefügt. ###color###, ###message###, ###headline### sind Platzhalter für die jeweilgen Zeichenketten. Farbe ist
// ein hexdezimaler Wert als Zeichenkette.

var html_prefix = '<table border="1" cellpadding="0" cellspacing="0" width="100%">';
var html_headline_color = '<tr><td style="padding: 5px 0 5px 0;" bgcolor=\"' + '###color###' + '\"><b>' + '###headline###' + '</b></td></tr>';
var html_headline = '<tr><td style="padding: 5px 0 5px 0;"><b>' + '###headline###' + '</b></td></tr>';
var html_message = '<tr><td style="padding: 5px 0 20px 0;">' + '###message###' + '</td></tr>';
var html_end = '</table>';

// Debughilfe
if (DEBUG) uLogAusgabe = true;

// MODE einstellen über Datenpunkte, das hier hat keine auswirkungen
// nur für ersten Lauf nötig, ab dann überschreiben States diesen Wert
var MODE = 0; // DWD oder UWZ wird von gültigen Einstellungen im Datenpfad überschrieben

// Wandel Usereingabe in sauberes True / False um
forcedSpeak = !!forcedSpeak;
windForceDetailsSpeak = !!windForceDetailsSpeak;

//Vorgezogene Tests
checkConfigVariable('dwdWarncellId');
checkConfigVariable('dwdBundesland');
checkConfigVariable('uwzWarncellId');
checkConfigVariable('DWD2');

// Variable nicht konfigurierbar
const SPEAK = ALEXA + HOMETWO + SAYIT;
const PUSH = TELEGRAM + PUSHOVER + IOGO + STATE;
const ALLMSG = EMAIL | STATE_HTML;
const ALLMODES = DWD | UWZ | NINA;
const CANHTML = EMAIL + STATE_HTML;
const CANPLAIN = PUSH + EMAIL;
const placeHolder = 'XXXXPLACEHOLDERXXXX';
const configModeState = mainStatePath + 'config.mode';
const mirrorMessageState = mainStatePath + 'message';
const mirrorMessageStateHtml = mainStatePath + 'messageHtml';
const SPACE = ' ';
const NEWLINE = '\n';
const axios = require('axios');

var intervalMinutes = 10; // die Daten bei DWD werden alle 10 Minuten aktualisiert.
var numOfWarnings = 5;
var enableInternDWD = false;
var enableInternDWD2 = false;
const internDWDUrl='https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json';
const internDWD2Url = 'https://maps.dwd.de/geoserver/dwd/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dwd%3AWarnungen_Gemeinden&maxFeatures=50&outputFormat=application%2Fjson';
var internalDWDPath = mainStatePath + 'data.dwd.warning';
var internalDWDInterval = null;

var enableInternUWZ = false;
var internUWZUrl='http://feed.alertspro.meteogroup.com/AlertsPro/AlertsProPollService.php?method=getWarning&language=de&areaID=' + uwzWarncellId;
var internalUWZPath = mainStatePath + 'data.uwz.warning';

var START = new Date();
var ENDE = new Date();
var idAlexa = alexaInstanz + '.Echo-Devices.' + placeHolder + '.Commands.announcement';
var idAlexaVolumen = alexaInstanz + '.Echo-Devices.' + placeHolder + '.Commands.speak-volume';
var autoSendWarnings = true;
var forceSpeak = false;
var timer = null;
var onClickCheckRun = false;
var onClickCheckRunCmd = '';
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
var firstRun = true;
var _speakToArray = [{ speakEndtime: new Date() }]; // muß immer 1 Element enthalten
var _speakToInterval = null;
var deviceList = 		{};
var onChangeTimeoutObj = {};
var onStopped = false;
const randomID = Math.random()*10000;

// Warning types
var warningTypesString = [];
warningTypesString[DWD] = [
    ['Gewitter', '⚡'],
    ['Sturm', '🌪'],
    ['Regen', '🌧'],
    ['Schnee', '🌨'],
    ['Nebel', '🌁'],//59
    ['Frost', '🌡'],
    ['Glatteis', '❄'],
    ['Tauwetter', '⛄'],
    ['Hitzewarnungen', '🔥'],
    ['UV_Warnungen', '🔆']
    /*,
        ['Kuestenwarnungen', ''],
        ['Binnenseewarnungen', '']*/
];
{
    let tempwarningTypesString = [
        ['Gewitter', 31,32,33,34,35,36,37,38,39,40,41,91,92,93,94,95,96],//31-49, 91-96
        ['Sturm', 51,52,53,54,55,56,57,58],//51-58
        ['Regen', 61,62,63,64,65,66],//61-66
        ['Schnee', 71,72,73,74,75,76,77,78],//71 - 78
        ['Nebel', 59],//59
        ['Frost', 22,82], //22, 82
        ['Glatteis', 24,84,85,86,87],//24, 84-87
        ['Tauwetter', 88,89,],
        ['Hitzewarnungen',247,248],
        ['UV_Warnungen', 246]
        /*,
            ['Kuestenwarnungen', ''],
            ['Binnenseewarnungen', '']*/
    ];
    warningTypesString[DWD2] = {};
    for (let a = 0; a<tempwarningTypesString.length;a++) {
        for (let b= 1; b<tempwarningTypesString[a].length;b++) {
            warningTypesString[DWD2][String(tempwarningTypesString[a][b])] = a;
        }
    }
}
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

//StatesDefinition für DWD intern
const statesDWDintern = [
    { id:"begin",default:0, options: {name: "Warning begin",type: "number",role: "value.time",read: true,write: false}},
    { id:"description", default:"", options: {name: "Warning description",type: "string",role: "weather.state",read: true,write: false}},
    { id:"end", default:0, options: {name: "Warning end",type: "number",role: "value.time",read: true,write: false}},
    { id:"headline", default:"", options: {name: "Warning description",type: "string",role: "weather.state",read: true,write: false}},
    { id:"level",default: 0, options: {name: "Warning level",type: "number",role: "value.warning",read: true,write: false,states: {1: "Preliminary info",2: "Minor",3: "Moderate",4: "Severe",5: "Extreme"}}},
    { id:"map", default:"", options: {name: "Link to chart",type: "string",role: "weather.chart.url",read: true,write: false}},
    { id:"object", default: null, options: {name: "JSON object with warning", type: "object", role: "weather.json", read: true, write: false}},
    { id:"severity", default: 0, options: {name: "Warning severity",type: "number",role: "value.severity",read: true,write: false,states: {0: "None",1: "Minor",2: "Moderate",3: "Severe",4: "Extreme",9: "Heat Warning",11: "No Warning",19: "UV Warning",49: "Strong Heat",50: "Extreme Heat"}}},
    { id:"text", default: "", options: {name: "Warning text",type: "string",role: "weather.title.short",read: true,write: false}},
    { id:"type", default: 0, options: {name: "Warning type",type: "number",role: "weather.type",read: true,write: false,states: {0: "Thunderstorm",1: "Wind/Storm",2: "Rain",3: "Snow",4: "Fog",5: "Frost",6: "Ice",7: "Thawing",8: "Heat",9: "UV warning"}}},
    { id:"ec_ii_type", default: 0, options: {name: "Warning type EC_II",type: "number",role: "weather.type",read: true,write: false,}}
];

//StatesDefinition für UWZ intern
var wtsObj = {};
for (let a = 0; a < warningTypesString[UWZ].length; a++) {
    wtsObj[String(a)] = warningTypesString[UWZ][a][0];
}
const statesUWZintern = [
    { id:"begin",default:0, options: {name: "Warning begin",type: "number",role: "value.time",read: true,write: false,}},
    { id:"end", default:0, options: {name: "Warning end",type: "number",role: "value.time",read: true,write: false,}},
    { id:"longText", default:"", options: {name: "Warning description",type: "string",role: "weather.state",read: true,write: false,}},
    { id:"shortText", default:"", options: {name: "Warning description",type: "string",role: "weather.state",read: true,write: false,}},
    { id:"uwzLevel",default: 0, options: {name: "Warning level",type: "number",role: "value.warning",read: true,write: false,}},
    { id:"uwzColor", default:-1, options: {name: "Link to chart",type: "number",read: true,write: false,}},
/*6*/    { id:"object", default: null, options: {name: "JSON object with warning", type: "object", role: "weather.json", read: true, write: false,}},
    { id:"severity", default: 0, options: {name: "Warning severity",type: "number",role: "value.severity",read: true,write: false,}},
    { id:"HTMLShort", default: "", options: {name: "Warning text",type: "string",read: true,write: false}},
    { id:"HTMLLong", default: "", options: {name: "Warning text",type: "string",read: true,write: false,}},
    { id:"type", default: 0, options: {name: "Warning type",type: "number",role: "weather.type",read: true,write: false, states: wtsObj,}}
];
// State über den man gesonderte Aktionen auslösen kann, gibt die höchste Warnstufe aus.
const stateAlert = // Änderungen auch in setAlertState() anpassen
[
        { "name": 'level', "default": -1, "type": { read: true, write: false, type: "number", name: '' } },
        { "name": 'type', "default": -1, "type": { read: true, write: false, type: "number", name: '' } },
        { "name": 'begin', "default": 0, "type": { read: true, write: false, role: "value.time", type: "number", name: '' } },
        { "name": 'end', "default": 0, "type": { read: true, write: false, role: "value.time", type: "number", name: '' } },
        { "name": 'current', "default": false, "type": { read: true, write: false, role: "state", type: "boolean", name: '' } },
        { "name": 'headline', "default": '', "type": { read: true, write: false, type: "string", name: '' } },
        { "name": 'description', "default": '', "type": { read: true, write: false, type: "string", name: '' } },
        { "name": 'color', "default": '', "type": { read: true, write: false, type: "string", name: '' } },
        { "name": 'symbol', "default": '', "type": { read: true, write: false, type: "string", name: '' } },
        { "name": 'hash', "default": 0, "type": { read: true, write: false, role: "value", type: "number", name: '' } }
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

if (uLogAusgabe) log('Skripts gestartet: ID:' + randomID);

for (let a = 0; a < konstanten.length; a++) {
    deviceList[konstanten[a].value] = {};
    if (konstanten[a].count !== undefined) deviceList[konstanten[a].value].count = konstanten[a].count;
    if (konstanten[a].delay !== undefined) deviceList[konstanten[a].value].delay = konstanten[a].delay;
    if (konstanten[a].maxChar !== undefined) deviceList[konstanten[a].value].maxChar = konstanten[a].maxChar;
};
/* *************************************************************************
* Überprüfe Nutzerkonfiguration.
/* ************************************************************************* */


{
    testValueTypeLog(dwdWarncellId, 'dwdWarncellId', 'string');
    if (dwdWarncellId) {
        enableInternDWD = true;
        enableInternDWD2 = true;
        dwdWarncellId = [dwdWarncellId];
    }

    testValueTypeLog(uwzWarncellId, 'uwzWarncellId', 'string');
    if (uwzWarncellId) {
        enableInternUWZ = true;
        uwzWarncellId = [uwzWarncellId];
    }
    checkConfigVariable('dwdBundesland');
    testValueTypeLog(dwdBundesland, 'dwdBundesland', 'string');

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
                log('Konfiguration enthält Fehler. var regionName - Eintrag: ' + (b) + ' hat keine 2 Werte [\'UWZxxxxxxx\',\'name\']', 'error');
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
                log('SayIt - Konfiguration ist fehlerhaft. Überpüfen!', 'error');
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

async function changeMode(modeFromState) {
    if (MODE != modeFromState || firstRun) {
        let oldMode = MODE;
        MODE = modeFromState;
        myLog('MODE wurde geändert. MODE: ' + MODE + ' firstRun:' + firstRun);
        if ( MODE == 0 ) log('Alle Benachrichtigungen ausgeschaltet, bitte unter ioBroker - Objektansicht - '+ mainStatePath + '.config - UWZ und/oder DWD und/oder NINA auf true stellen.', 'warn');
        await InitDatabase(firstRun);
        dataSubscribe();
        if (!firstRun) { // überspringe das beim Starten des Scripts
            for (var a = 0; a < konstanten.length; a++) {
                for (let x = 0; x < MODES.length; x++) {
                    let oid = mainStatePath + 'config.auto.' + MODES[x].text.toLowerCase() + '.' + konstanten[a].name;
                    let update = !!((switchFlags(MODE, oldMode, false) & MODES[x].mode));
                    if (extendedExists(oid)) {
                        setState(oid, update || !!(getAutoPushFlags(MODE & MODES[x].mode) & konstanten[a].value));
                    }
                    oid = mainStatePath + 'config.manuell.' + MODES[x].text.toLowerCase() + '.' + konstanten[a].name;
                    if (extendedExists(oid)) {
                        setState(oid, update || !!(getManuellPushFlags(MODE & MODES[x].mode) & konstanten[a].value));
                    }
                }
            }
        }
        if (autoSendWarnings && !firstRun) checkWarningsMain();
        firstRun = false;
    }
    setConfigModeStates(modeFromState);
}
init();
async function init() { // erster fund von create custom
    try {
        // State der Pushnachrichten über pushover / telegram spiegelt
        if (!await existsStateAsync(mirrorMessageState)) {
            createStateAsync(mirrorMessageState, { read: true, write: false, desc: "State der für jede Warnung neu geschrieben wird", type: "string", def:'' });
        }
        if (!await existsStateAsync(mirrorMessageStateHtml)) {
            await createStateAsync(mirrorMessageStateHtml,  { read: true, write: false, desc: "State mit dem selben Inhalt wie die Email", type: "string", def:'' });
        }
        // erstelle Datenpunkte für DWD/UWZ standalone
        for (let i = 0; i < numOfWarnings; i++) {
            var p = internalDWDPath + (i == 0 ? '' : i) + '.';
            for (let a = 0; a < statesDWDintern.length; a++) {
                let dp = statesDWDintern[a];
                let id = p + dp.id;
                if (!await existsStateAsync(id)) {
                    await createStateAsync(id, dp.options,);
                }
            }
            p = internalUWZPath + (i == 0 ? '' : i) + '.';
            for (let a = 0; a < statesUWZintern.length; a++) {
                let dp = statesUWZintern[a];
                let id = p + dp.id;
                if (!await existsStateAsync(id)) {
                    await createStateAsync(id, dp.options,);
                }
            }
        }

        // MODE änderung über Datenpunkte string
        if (!await existsStateAsync(configModeState)) {
            await createStateAsync(configModeState, { read: true, write: true, desc: "Modusauswahl DWD oder UWZ oder Nina", type: "string", def: '' });
        }
        on({ id: configModeState, change: 'ne', ack: false }, function(obj) {
            if (obj.state.val && typeof obj.state.val === 'string' &&
                (obj.state.val.toUpperCase().includes('DWD') || obj.state.val.toUpperCase().includes('UWZ') || obj.state.val.toUpperCase().includes('NINA'))) {
                //setState(configModeState, MODE, true)
                let mode = 0;
                if (firstRun) return;
                mode |= obj.state.val.toUpperCase().includes('DWD') ? DWD : 0;
                mode |= obj.state.val.toUpperCase().includes('UWZ') ? UWZ : 0;
                mode |= obj.state.val.toUpperCase().includes('NINA') ? NINA : 0;
                if (MODE != mode) {
                    myLog('Modus wird geändert von: ' + mode + ' String:' + obj.state.val);
                    changeMode(mode);
                } else {
                    changeMode(MODE);
                }
            } else {
                changeMode(MODE);
            }
        });

        // MODE änderung über Datenpunkte Boolean
        for (let a = 0; a < MODES.length; a++) {
            let tok = MODES[a].text.toLowerCase();
            let id = mainStatePath + 'config.' + tok;
            if (!await existsStateAsync(id)) {
                let mi = !!(MODE & MODES[a].mode);
                await createStateAsync(id, { read: true, write: true, desc: "Aktivere " + tok.toUpperCase() + '.', type: "boolean", def: mi });
            }
            on({ id: id, change: 'ne', ack: false }, function(obj) {
                let arr = obj.id.split('.');
                let tok = arr[arr.length - 1].toUpperCase();
                let mode = MODES[MODES.findIndex(function(j) { return j.text == tok })].mode;
                let oldMode = MODE;
                oldMode = switchFlags(oldMode, mode, obj.state.val);
                myLog('Modus wird geändert von: ' + MODE);
                changeMode(oldMode);
            });
            MODE = switchFlags(MODE, MODES[a].mode, getState(id).val);

        }
        // Automodus ein und ausschalten
        let id = mainStatePath + 'config.auto.on';
        if (!await existsStateAsync(id)) {
            await createStateAsync(id, { read: true, write: true, desc: "Aktivere automatischen Push bei eintreffen der Warnungen.", type: "boolean", def: true });
        }
        autoSendWarnings = getState(id).val;
        await setStateAsync(id, autoSendWarnings, true);

        let mode = [MODES[0], MODES[1]];
        for (let c = 0; c < mode.length; c++) {
            let stateAlertId = mainStatePath + 'alert.' + mode[c].text.toLowerCase() + '.';
            for (let b = 0; b < warningTypesString[mode[c].mode].length; b++) {
                for (let a = 0; a < stateAlert.length; a++) {
                    let stateAlertIdFull = stateAlertId + warningTypesString[mode[c].mode][b][0] + '.' + stateAlert[a].name;
                    stateAlert[a].type.name = stateAlert[a].name;
                    if (!await existsStateAsync(stateAlertIdFull)) {
                        await createStateAsync(stateAlertIdFull, stateAlert[a].type,);
                    }
                }
            }
        }
        // Nachrichtenversand per Click States/ config. und auto . erzeugen und subscript
        for (var a = 0; a < konstanten.length; a++) {
            if ((uPushdienst & konstanten[a].value) != 0) {
                if (!await existsStateAsync(mainStatePath + 'commands.' + konstanten[a].name)) {
                    await createStateAsync(mainStatePath + 'commands.' + konstanten[a].name, { read: true, write: true, desc: "Gebe Warnungen auf dieser Schiene aus", type: "boolean", role: "button", def: false });
                }
                if (!await existsStateAsync(mainStatePath + 'commands.' + konstanten[a].name + '_short')) {
                    await createStateAsync(mainStatePath + 'commands.' + konstanten[a].name + '_short', { read: true, write: true, desc: "Gebe Kurzwarnungen auf dieser Schiene aus", type: "boolean", role: "button", def: false });
                }
                if (!await existsStateAsync(mainStatePath + 'commands.' + konstanten[a].name + '_long')) {
                    await createStateAsync(mainStatePath + 'commands.' + konstanten[a].name + '_long', { read: true, write: true, desc: "Gebe lange Warnungen auf dieser Schiene aus", type: "boolean", role: "button", def: false });
                }
                for (let x = 0; x < MODES.length; x++) {
                    let oid = mainStatePath + 'config.auto.' + MODES[x].text.toLowerCase() + '.' + konstanten[a].name;
                    if (!await existsStateAsync(oid)) {
                        await createStateAsync(oid, ((uPushdienst & konstanten[a].value) != 0), { read: true, write: true, desc: "Schalte Autopushmöglichkeiten ein / aus", type: "boolean", def: ((uPushdienst & konstanten[a].value) != 0) });
                    }
                    setConfigKonstanten(oid, getState(oid).val, true);

                    oid = mainStatePath + 'config.manuell.' + MODES[x].text.toLowerCase() + '.' + konstanten[a].name;
                    if (!await existsStateAsync(oid)) {
                        await createStateAsync(oid, ((uPushdienst & konstanten[a].value) != 0), { read: true, write: true, desc: "Schalte Manuellepushmöglichkeiten ein / aus", type: "boolean", def: ((uPushdienst & konstanten[a].value) != 0) });
                    }
                    setConfigKonstanten(oid, getState(oid).val, false);
                    // letzer fund von Create Custom
                }
            }
        }
        if (firstRun) changeMode(MODE);
        subscribeStates();
        setWeekend();
        activateSchedule();
    }
    catch(error) {
        log(error);
        stopScript();
    }
}

// setzte alle MODE Datenpunkte
function setConfigModeStates(mode) {
    if (extendedExists(configModeState)) setState(configModeState, (mode & DWD ? 'DWD' : '') + (mode & UWZ ? 'UWZ' : '') + (mode & NINA ? 'NINA' : ''), true);
    for (let a = 0; a < MODES.length; a++) {
        let t = MODES[a].text.toLowerCase();
        let id = mainStatePath + 'config.' + t;
        if (extendedExists(id)) setState(id, !!(mode & MODES[a].mode), true);
    }
}


function subscribeStates() {// on() für alles unter config.auto
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
        let msgLength = 0;
        let d = konstanten.findIndex(function(c) { return (c.name === b[b.length - 1]); })
        if (d == -1) {
            d = konstanten.findIndex(function(c) { return (c.name + '_short' === b[b.length - 1]); });
            msgLength = 1;
            if (d == -1) {
                d = konstanten.findIndex(function(c) { return (c.name + '_long' === b[b.length - 1]); });
                msgLength = 2;
                if (d == -1) {
                    return
                }
            }
        }
        let oldA = uTextMitAnweisungen, oldB = uTextMitBeschreibung,
            oldC = uSpracheMitAnweisungen, oldD = uSpracheMitBeschreibung,
            oldE = uHtmlMitAnweisungen, oldF = uHtmlMitBeschreibung;;
        if (msgLength != 0 ) {
            uTextMitAnweisungen     = msgLength == 2;
            uTextMitBeschreibung    = msgLength == 2;
            uSpracheMitAnweisungen  = msgLength == 2;
            uSpracheMitBeschreibung = msgLength == 2;
            uHtmlMitAnweisungen     = msgLength == 2;
            uHtmlMitBeschreibung    = msgLength == 2;
        }

        warnDatabase.old = [];
        let oPd = uPushdienst;
        uPushdienst &= konstanten[d].value;
        forceSpeak = forcedSpeak;
        onClickCheckRun = true;
        onClickCheckRunCmd = obj.id;
        if ((uPushdienst & SPEAK) != 0 && uManuellClickClearSpeakMessageList) _speakToArray = [{ speakEndtime: new Date() }];

        checkWarningsMain();

        uTextMitAnweisungen     = oldA;
        uTextMitBeschreibung    = oldB;
        uSpracheMitAnweisungen  = oldC;
        uSpracheMitBeschreibung = oldD;
        uHtmlMitAnweisungen     = oldE;
        uHtmlMitBeschreibung    = oldF;

        onClickCheckRun = false;
        onClickCheckRunCmd = '';
        forceSpeak = false;
        uPushdienst = oPd;
    });
}
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
            let AlertLevel = -1, AlertIndex = -1;
            for (let c = 0; c < warnDatabase.new.length; c++) {
                if (warnDatabase.new[c].mode == mode[a].mode && warnDatabase.new[c].type == b && warnDatabase.new[c].level > AlertLevel) {
                    AlertLevel = warnDatabase.new[c].level;
                    AlertIndex = c;
                }
            }
            if (extendedExists(stateAlertIdFull + stateAlert[0].name)) {
                if (getState(stateAlertIdFull + stateAlert[0].name).val != AlertLevel ||
                    (AlertIndex > -1 && getState(stateAlertIdFull + stateAlert[8].name).val != warnDatabase.new[AlertIndex].hash)) {
                    let cwarn = false;
                    if (AlertIndex > -1) {
                        let start = warnDatabase.new[AlertIndex].start ? new Date(warnDatabase.new[AlertIndex].start) : new Date(new Date().setHours(new Date().getHours() - 2));
                        let end = warnDatabase.new[AlertIndex].end ? new Date(warnDatabase.new[AlertIndex].end) : new Date(new Date().setHours(new Date().getHours() + 2));
                        cwarn = end.getTime() - start.getTime() > 0 ? timeIsBetween(new Date(), start, end) : false;
                        if (!cwarn && warnDatabase.new[AlertIndex].alerttimeout === undefined) {
                            if (!warnDatabase.new[AlertIndex].alertendtimeout) {
                                if (end && end.getTime() - (new Date().getTime()) > 0) {
                                    warnDatabase.new[AlertIndex].alertendtimeout = setTimeout(setAlertState, end.getTime() - (new Date().getTime())+100);
                                }
                                if (start && start.getTime() - (new Date().getTime()) > 0) {
                                    warnDatabase.new[AlertIndex].alertstarttimeout = setTimeout(setAlertState, start.getTime() - (new Date().getTime())+100)
                                }
                            }
                        }
                    }
                    setState(stateAlertIdFull + stateAlert[0].name, AlertLevel, true);
                    setState(stateAlertIdFull + stateAlert[1].name, b, true);
                    setState(stateAlertIdFull + stateAlert[2].name, (AlertIndex > -1 ? new Date(warnDatabase.new[AlertIndex].start).getTime() : 0), true);
                    setState(stateAlertIdFull + stateAlert[3].name, (AlertIndex > -1 ? new Date(warnDatabase.new[AlertIndex].end).getTime() : 0), true);
                    setState(stateAlertIdFull + stateAlert[4].name, (AlertIndex > -1 ? cwarn : false), true);
                    setState(stateAlertIdFull + stateAlert[5].name, (AlertIndex > -1 ? warnDatabase.new[AlertIndex].headline : ''), true);
                    setState(stateAlertIdFull + stateAlert[6].name, (AlertIndex > -1 ? warnDatabase.new[AlertIndex].description : ''), true);
                    setState(stateAlertIdFull + stateAlert[7].name, (AlertIndex > -1 ? warnDatabase.new[AlertIndex].color : ''), true);
                    setState(stateAlertIdFull + stateAlert[8].name, (AlertIndex > -1 ? warnDatabase.new[AlertIndex].picture : ''), true);
                    setState(stateAlertIdFull + stateAlert[9].name, (AlertIndex > -1 ? warnDatabase.new[AlertIndex].hash : 0), true);
                }
            }
        }
    }
}

function timeIsBetween(fTime,start,ende) {//Dateobjekt,hh:mm,hh:mm
    var eTime = new Date(), sTime = new Date();
    if (typeof start == 'object') {
        sTime = new Date(start);
    } else {
        start = start.split(':');
        sTime.setHours(parseInt(start[0]), parseInt(start[1]), 0);
    }
    if (typeof ende === 'object') {
        eTime = new Date(ende);
    } else {
        ende = ende.split(':');
        eTime.setHours(parseInt(ende[0]), parseInt(ende[1]), 0);
    }
    if (sTime.getTime()>eTime.getTime()) {
        if (fTime.getTime() < eTime.getTime()) sTime.setDate(eTime.getDate()-1);
        if (fTime.getTime() > sTime.getTime()) eTime.setDate(sTime.getDate()+1);
    }
    if ( compareTime(sTime, eTime, 'between', fTime) ) return true;
    return false;
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

// b: true - g add f / false - g remove f
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
    myLog('start checkWarningsMain()')
    if (!forcedSpeak) forceSpeak = (!startTimeSpeakWeekend || !startTimeSpeak || !endTimeSpeak);
    setWeekend();
    let DebugMail = '';
    if (DEBUGSENDEMAIL) {
        for (a = 0; a < warnDatabase.new.length; a++) DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.new' + a, JSON.stringify(warnDatabase.new[a]));
        for (a = 0; a < warnDatabase.old.length; a++) DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.old' + a, JSON.stringify(warnDatabase.old[a]));
        DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.new.length', warnDatabase.new.length.toString(), null);
        DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.old.length', warnDatabase.old.length.toString(), null);
    }

    let ignoreWarningCount = 0;
    // Enferne neue Einträge die doppelt sind sortiert nach level und Höhe
    for (let a = 0; a < warnDatabase.new.length; a++) {
        let w = warnDatabase.new[a];
        for (let b = 0; b < warnDatabase.new.length; b++) {
            let w2 = warnDatabase.new[b];
            if (
                (
                    w.mode !== DWD ||
                    w2.mode !== DWD ||
                    w.type !== w2.type ||
                    a == b ||
                    w2.start > w.start ||
                    w2.end > w.end
                )
                && w2.start < w.end
            ) continue;
            if (w.level > w2.level) {
                warnDatabase.new.splice(b, 1);
                myLog('Nr 3 Remove Msg with headline:' + w2.headline + ' hold:' + w.headline);
                if (a >= b--) {
                    a--;
                    break;
                }
            } else if (w.altitudeStart > w2.altitudeStart && w.level == w2.level) {
                w.altitudeStart = w2.altitudeStart;
                warnDatabase.new.splice(b, 1);
                myLog('Nr 4 Remove Msg with headline:' + w2.headline + ' hold:' + w.headline);
                if (a >= b--) {
                    a--;
                    break;
                }
            }
        }
    }
    // Entferne Einträge die verlängert wurden in OldDB
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
            if (w2.end <= w.end && w2.end >= w.start) {
                if (w2.level >= w.level) {
                    w.repeatCounter += w2.repeatCounter + 1;
                }
                if (w.repeatCounter > 30) {
                    log('reset repeatCounter... push message.');
                    w.repeatCounter = 0;
                }
                let i = getIndexOfHash(warnDatabase.new, w2.hash);
                if (i != -1) {
                    warnDatabase.new.splice(i, 1);
                    if (i <= a) --a;
                }
                myLog('Nr 5 Remove Msg with headline:' + w2.headline);
                warnDatabase.old.splice(b--, 1);
                break;
            }
        }
    }
    for (let a = 0; a < warnDatabase.new.length; a++) {
        let w = warnDatabase.new[a];
        if (isWarnIgnored(w)) {
            ignoreWarningCount++
        }
    }

    warnDatabase.new.sort(function(a, b) {
        return a.level == b.level ? b.begin - a.begin : b.level - a.level;
    })
    var collectMode = 0;
    let emailHtmlWarn = '';
    let emailHtmlClear = '';
    let speakMsgTemp = [];
    collectMode = 0;
    let debugdata = '';
    /* Bereich für 'Wetterwarnung gültig bis wurde aufgehoben' */
    myLog('Nr 6 Build messages');
    for (let i = 0; i < warnDatabase.old.length; i++) {
        let entry = warnDatabase.old[i];
        let description = entry.description;
        let headline = entry.headline;
        let hash = entry.hash;
        let area = entry.areaID;
        let mode = entry.mode;
        let count = 0;
        let picture = entry.picture ? entry.picture + SPACE : '';
        if (isWarnIgnored(entry)) continue;
        if (DEBUGSENDEMAIL) debugdata += i + SPACE + mode + SPACE + hash + SPACE + getIndexOfHash(warnDatabase.new, hash) + SPACE + (getPushModeFlag(mode) & PUSH).toString(2) + '<br';
        if (headline && getIndexOfHash(warnDatabase.new, hash) == -1 && (warnDatabase.new.length > ignoreWarningCount)) {
            myLog('Old Msg with headline:' + headline + ' onClickCheckRun:' + onClickCheckRun +' hash:' +hash);
            let prefix = ''
            let end = entry.end ? getFormatDate(entry.end) : null;
            collectMode |= mode;
            // Text Entwarnungen
            if (mode === NINA) {
                prefix = 'Die Warnung';
            } else {
                prefix = 'Die Wetterwarnung';
            }
            let pushMsg = picture + prefix + getArtikelMode(mode) + "'" + headline + SPACE + area + (end ? " gültig bis " + end + "Uhr'" : '') + " wurde aufgehoben.";
            // EMAIL
            emailHtmlClear += pushMsg + '<br>';
            // PUSH
            // Insgesamt x... anhängen
            pushMsg += getStringWarnCount(null, warnDatabase.new.length);
            sendMessage(getPushModeFlag(mode) & PUSH, picture + (mode == NINA ? 'Entwarnung' : 'Wetterentwarnung') + SPACE + (i + 1), pushMsg);
            myLog('text old:' + pushMsg);
            // SPEAK
            pushMsg = headline + getArtikelMode(mode, true) + area + (end ? ' gültig bis ' + getFormatDateSpeak(end) + ' Uhr' : '') + ' wurde aufgehoben' + '  .  ';
            if (forceSpeak || compareTime(START, ENDE, 'between')) {
                sendMessage(getPushModeFlag(mode) & SPEAK, '', pushMsg, entry);
            }
            myLog('Sprache old:' + pushMsg);
        }
    }
    if (DEBUGSENDEMAIL) DebugMail = buildHtmlEmail(DebugMail, 'Index Mode Hash Index-New Flags', debugdata, null);
    let gefahr = false;
    let count = 0;
    /* Bereich für 'Neue Amtliche Wetterwarnung' */
    for (let i = warnDatabase.new.length - 1; i >= 0; i--) {
        let entry = warnDatabase.new[i];
        if (entry.repeatCounter > 1 && !onClickCheckRun) continue;
        let headline = entry.headline;
        let description = entry.description;
        let level = entry.level;
        let instruction = entry.instruction;
        let hash = entry.hash;
        let area = entry.areaID;
        let color = entry.color;
        let mode = entry.mode;
        let picture = entry.picture ? entry.picture + SPACE : '';
        if (DEBUGSENDEMAIL) debugdata += i + SPACE + mode + SPACE + hash + SPACE + getIndexOfHash(warnDatabase.old, hash) + SPACE + (getPushModeFlag(mode)).toString(2) + SPACE + isWarnIgnored(entry) + '<br';
        myLog('New Msg with headline:' + headline + ' isWarnIgnored:' + isWarnIgnored(entry) + ' onClickCheckRun:' + onClickCheckRun +' hash:' + hash);
        if (isWarnIgnored(entry) && !onClickCheckRun) continue;
        if (hash) {
            let isNewMessage = getIndexOfHash(warnDatabase.old, hash) == -1;
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
                let prefix = isNewMessage && !onClickCheckRun ? 'Neu: ' : '';
                if (entry.html !== undefined) {
                    let html = entry.html;
                    if (html.headline) he = prefix + html.headline;
                    else he = prefix + headline;
                    if (uHtmlMitBeschreibung) {
                        if (html.description) de = html.description;
                        else de = description;
                        if (uHtmlMitAnweisungen) {
                            if (html.instruction && html.instruction.length > 2) de += '<br><br>Handlungsanweisungen:<br>' + html.instruction;
                            else if (instruction && instruction.length > 2) de += '<br><br>Handlungsanweisungen:<br>' + instruction;
                        }
                        if (entry.html.web) de += '<br><br>' + entry.html.web;
                    }
                } else {
                    he = prefix + headline;
                    if (uHtmlMitBeschreibung) {
                        de = description;
                        if (uHtmlMitAnweisungen && instruction && instruction.length > 2) de += '<br><br>Handlungsanweisungen:<br>' + instruction;
                    }
                }
                let html = (bt ? sTime + '<br>' : '') + de;
                html = html[0].toUpperCase() + html.substring(1);
                he += getArtikelMode(mode) + area + ':';
                if (entry.repeatCounter == 1 && !onClickCheckRun) he += ' wurde verlängert.';
                emailHtmlWarn = buildHtmlEmail(emailHtmlWarn, picture + he, html, color, false);
                if (entry.repeatCounter == 1 && !onClickCheckRun) html = he;
                else html = he + html;
                if (warnDatabase.new.length > 1) html += getStringWarnCount(count, warnDatabase.new.length);
                let b = getPushModeFlag(mode) & CANHTML & ~EMAIL & ~STATE_HTML;
                sendMessage(b, picture + getTopic(mode), html, entry);
                todoBitmask &= ~b & ~EMAIL & ~STATE_HTML;
            }
            if (!isNewMessage) continue;
            // Plain text
            if ((getPushModeFlag(mode) & CANPLAIN & todoBitmask) != 0) {
                let pushMsg = headline + getArtikelMode(mode) + area;
                if (entry.repeatCounter == 1 && !onClickCheckRun) {
                    pushMsg += ' wurde verlängert.';
                } else {
                    pushMsg += (bt ? NEWLINE + sTime : '');
                    if (uTextMitBeschreibung) {
                        pushMsg += NEWLINE + NEWLINE + description;
                        if (uTextMitAnweisungen && !!instruction && typeof instruction === 'string' && instruction.length > 2) {
                            pushMsg += NEWLINE + 'Handlungsanweisungen:' + NEWLINE + instruction;
                        }
                    }

                    // Anzahl Meldungen erst am Ende zu email hinzufügen
                    if (todoBitmask & (EMAIL | STATE_HTML)) emailHtmlWarn = buildHtmlEmail(emailHtmlWarn, headline + getArtikelMode(mode) + area + ':', pushMsg, color, false);
                    /* ab Level 4 zusätzlicher Hinweis */
                }

                if (warnDatabase.new.length > 1) pushMsg += getStringWarnCount(count, warnDatabase.new.length);
                let b = getPushModeFlag(mode) & CANPLAIN & todoBitmask & PUSH;
                sendMessage(b, picture + getTopic(mode) + SPACE + count, picture + pushMsg, entry);
                myLog('text new:' + pushMsg);
                todoBitmask &= ~b;
            }
            // Sprache
            if ((getPushModeFlag(mode) & SPEAK) != 0) {
                sTime = SPACE;
                let speakMsg = getTopic(mode, true) + headline + getArtikelMode(mode, true) + area;
                if (entry.repeatCounter == 1 && !onClickCheckRun) {
                    speakMsg += ' wurde verlängert.';
                } else {
                    if (begin || end) sTime += "gültig ";
                    if (begin) sTime += "vom " + getFormatDateSpeak(begin) + " Uhr";
                    if ((begin && end)) sTime += " ";
                    if (end) sTime += "bis " + getFormatDateSpeak(end) + " Uhr";
                    speakMsg += SPACE + sTime + '.' + SPACE;
                    if (uSpracheMitAnweisungen && !!instruction && typeof instruction === 'string' && instruction.length > 2) {
                        description += SPACE + SPACE + 'Handlungsanweisungen:' + NEWLINE + instruction;
                    }
                    description = replaceTokenForSpeak(description);
                    if (uMaxCharToSpeak === 0 || (speakMsg + description).length <= uMaxCharToSpeak) {
                        if (uSpracheMitBeschreibung) speakMsg += description;
                    } else speakMsg += ' Weiterführende Informationen sind vorhanden.';
                }
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
        if (!getPushModeFlag(collectMode)) log('Keine erlaubten Versandmöglichkeiten im ' + (onClickCheckRun ? 'manuellen Modus über ID: ' + onClickCheckRunCmd : 'Automatikmodus') + ' gefunden!', 'warn');

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
    myLog('done');
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
        myLog('send Msg with Telegram');
        let nMsg = {};
        if (entry && entry.web && entry.webname) nMsg.reply_markup = { inline_keyboard: [[{ text: entry.webname, url: entry.web }]] };
        if (uTelegramReplyMarkup) nMsg.reply_markup = uTelegramReplyMarkup;
        if (!uTelegramAllowNotification) nMsg.disable_notification = true;
        if (!(telegramUser.length > 0 || telegramChatId.length > 0) || uTelegramUseStdUser) {
            _sendSplitMessage(TELEGRAM, msg.slice(), nMsg, function(msg, opt) {
                opt.text = msg;
                _sendTo(TELEGRAM, telegramInstanz, opt);
            });
        }
        if (telegramUser.length > 0) {
            let nMsg2 = cloneObj(nMsg);
            nMsg2.user = telegramUser.join(',');
            _sendSplitMessage(TELEGRAM, msg.slice(), nMsg2, function(msg, opt) {
                opt.text = msg;
                _sendTo(TELEGRAM, telegramInstanz, opt);
            });
        }
        if (telegramChatId.length > 0) {
            let c = 0;
            telegramChatId.forEach(function(chatid) {
                let nMsg2 = cloneObj(nMsg);
                nMsg2.chatId = chatid;
                _sendSplitMessage(TELEGRAM, msg.slice(), nMsg2, function(msg, opt) {
                    opt.text = msg;
                    _sendTo(TELEGRAM, telegramInstanz, opt);
                });
            });
        }
    }
    if ((pushdienst & PUSHOVER) != 0) {
        myLog('send Msg with Pushover');
        let newMsg = { html: 1 };
        let usesound = ((deviceList[PUSHOVER].count == undefined || deviceList[PUSHOVER].count == 0) || !(!entry || entry.level < attentionWarningLevel));
        newMsg.message = msg;
        newMsg.title = topic;
        if (entry) {
            if (entry.web && entry.web.length < 512) {
                newMsg.url = entry.web;
                newMsg.url_title = entry.webname;
            }
            newMsg.message = msg.replace(entry.headline, '<font color="' + entry.color + '">' + entry.headline + '</font>');
            if (entry.level >= attentionWarningLevel) newMsg.priority = 1;
        }
        if (!usesound) newMsg.sound = 'none';
        else if (uPushoverSound) newMsg.sound = uPushoverSound;
        if (uPushoverDeviceName) newMsg.device = uPushoverDeviceName;
        _sendSplitMessage(PUSHOVER, newMsg.message.slice(), newMsg, function(msg, opt, c) {
            opt.message = msg;
            if (c > 1) { opt.title += ' Teil ' + c;
                opt.sound = 'none'; }
            _sendTo(PUSHOVER, pushoverInstanz, opt);
        });
    }
    if ((pushdienst & IOGO) != 0) {
        myLog('send Msg with Iogo');
        let j = {};
        j.text = msg;
        j.title = topic;
        if (ioGoExpiry > 0 ) j.expiry = ioGoExpiry;
        if (ioGoUser.length > 0) {
            j.user = ioGoUser[0];
            for (let a = 1; a < ioGoUser.length; a++) {
                j.user += ',' + ioGoUser[a];
            }
        }
        _sendSplitMessage(IOGO, j.text.slice(), j, function(msg, opt, c) {
            opt.text = msg;
            _sendTo(IOGO, ioGoInstanz, opt);
        });
    }
    if ((pushdienst & STATE) != 0) {
        setState(mirrorMessageState, msg, true);
    }
    if ((pushdienst & STATE_HTML) != 0) {
        setState(mirrorMessageStateHtml, msg, true);
    }
    if ((pushdienst & SPEAK) != 0) {
        myLog('send Msg with Speak');
        _speakTo(pushdienst & SPEAK, msg);
    }
    if ((pushdienst & EMAIL) != 0) {
        myLog('send Msg with Email');
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
        myLog('send Msg _sendTo dienst:' + dienst);
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
                    if (entry.part > 1) entry.msg = 'Teil ' + entry.part + ':  ' + entry.msg;
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
            let len = arr.slice(1).filter(function(a, b) { return (!!(a.dienst & dienst)) && a.part === 1; }).length - 1;
            if (len > 0) {
                if (len == 1) {
                    msgAppend = ' Eine weitere neue Warnung.';
                } else {
                    msgAppend = ' Es gibt ' + (len) + ' weitere neue Warnungen.';
                }
            } else {
                if (warnDatabase.new.length == 0) {
                    if (!onClickCheckRun) msgAppend = ' keine weitere Warnung.';
                } else {
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
                arr = __addItem(arr, a, HOMETWO, m, 1)
            }
            if ((dienst & SAYIT) != 0) {
                arr = _sendSplitMessage(SAYIT, a.slice(), arr, _splitedSpeakMessage);
            }
            if ((dienst & ALEXA) != 0) {
                arr = _sendSplitMessage(ALEXA, a.slice(), arr, _splitedSpeakMessage);
            }
            return arr;
            // Hilfsunktion
            function __addItem(arr, a, dienst, m, count) {
                let t = null;
                for (let a = arr.length - 1; a >= 0; a--) {
                    if (dienst == arr[a].dienst) { t = arr[a].endTimeSpeak; break; }
                }
                t = t || new Date();
                let nt = new Date(t);
                nt.setMilliseconds(t.getMilliseconds() + m);
                arr.push({ msg: a, dienst: dienst, endTimeSpeak: nt, startTimeSpeak: t, part: count });
                return arr;
            }

            function _splitedSpeakMessage(dienst, str, c, opt) {
                let m = deviceList[dienst].delay * str.length + 2000;
                return __addItem(opt, str, dienst, m, c);
            }
        }
    }

    function _sendSplitMessage(dienst, str, opt, callback) {
        let text = '\n* Warnung wurde aufgeteilt *';
        let index = deviceList[dienst].maxChar !== undefined ? deviceList[dienst].maxChar - text.length : 0;
        let e = 0;
        let c = 1;
        do {
            let msg = str;
            e = 0;
            if (index != 0 && index < msg.length) {
                e = _getLastIndexToSplit(msg, index);
                msg = str.substring(0, e) + text;
            }
            if (dienst & SPEAK) {
                opt = callback(dienst, msg, c++, opt);
            } else {
                callback(msg, cloneObj(opt), c++);
            }
            if (e != 0) str = str.substring(e).trimLeft();
        } while (e != 0)
        return opt;
    }

    function _getLastIndexToSplit(str, index) {
        let f = str.substring(0, index).match(/..\n|..<br>|[a-zA-Z][a-z][\.\!\?\:](?= [A-Z])|[a-zA-Z][a-z]\.(?=[A-Z][a-zA-Z]{3})/gi);
        let e = index;
        if (f && f.length > 0) e = str.lastIndexOf(f[f.length - 1], index) + f[f.length - 1].length;
        return e;
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
    if (MODE & DWD && (!enableInternDWD || !enableInternDWD2)) {
        let r = getRegEx(dwdPath, '^');
        r += '.*\.object$';
        myLog('subscribe path:' + r);
        subDWDhandler = subscribe({ id: new RegExp(r), change: 'ne' }, onChangeDWD);
    }
    if (subUWZhandler) unsubscribe(subUWZhandler);
    if (MODE & UWZ && !enableInternUWZ) {
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
    if (onChangeTimeoutObj[dp.id]) clearTimeout(onChangeTimeoutObj[dp.id]);
    onChangeTimeoutObj[dp.id] = setTimeout( function(dp) {
        onChangeTimeoutObj[dp.id] = null;
        myLog('onchange DWD id:' + dp.id);
        onChange(dp, DWD);
    },500, dp);
}

function onChangeUWZ(dp) {
    if (onChangeTimeoutObj[dp.id]) clearTimeout(onChangeTimeoutObj[dp.id]);
    onChangeTimeoutObj[dp.id] = setTimeout( function(dp) {
        onChangeTimeoutObj[dp.id] = null;
        myLog('onchange UWZ id:' + dp.id);
        onChange(dp, UWZ);
    },500, dp);
}

function onChangeNina(dp) {
    if (onChangeTimeoutObj[dp.id]) clearTimeout(onChangeTimeoutObj[dp.id]);
    onChangeTimeoutObj[dp.id] = setTimeout( function(dp) {
        onChangeTimeoutObj[dp.id] = null;
        myLog('onchange NINA ' + dp.id);
        onChange(dp, NINA);
    },500, dp);
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
async function InitDatabase(first) {
    myLog('InitDatabase() first: ' + first);
    if (first) {
        warnDatabase = { new: [], old: [] };
        if ((enableInternDWD || enableInternDWD2) && !internalDWDInterval && first) {
            if (!DEBUG && DEBUGINGORESTART) await getDataFromServer(first);
            internalDWDInterval = setInterval(getDataFromServer, intervalMinutes * 60 * 1000);
        }
    }
    if (MODE & DWD && !(enableInternDWD || enableInternDWD2)) {
        _helper($("state[state.id=" + dwdPath + ".*.object]"), DWD, first);
    }
    if (MODE & UWZ && !enableInternUWZ) {
        _helper($("state[state.id=" + uwzPath + ".*.object]"), UWZ, first);
    }
    if (MODE & NINA) {
        _helper($("state[state.id=" + ninaPath + ".*.rawJson]"), NINA, first);
    }
    warnDatabase.new = warnDatabase.new.filter(function(j) {
        return (j.mode & MODE);
    });
    if (!first) {
        warnDatabase.new = _filter(warnDatabase.new);
        warnDatabase.old = _filter(warnDatabase.old);
    }
    return;

    function _helper(arr, mode, first) {
        for (let a = 0; a < arr.length; a++) {
            let id = arr[a];
            addDatabaseData(id, getState(id).val, mode, first);
        }
    }
    function _filter(database) {
        if (database && database.length > 0) {
            database = database.filter(function(j, i){
                let b = (-1 == database.findIndex(function(j2, i2){
                    return i > i2 && j.mode == j2.mode && j.hash == j2.hash;
                }));
                if (!b) myLog('filtere: '+JSON.stringify(j));
                return b;}
            )
        }
        return database;
    }
}
// Daten vom Server abfragen
async function getDataFromServer(first) {
    if (first === undefined) first = false;
    if (enableInternDWD)  _getDataFromServer(internDWDUrl, DWD, first);
    if (enableInternDWD2) _getDataFromServer(internDWD2Url, DWD2, first);
    if (enableInternUWZ)  _getDataFromServer(internUWZUrl, UWZ, first);
    async function _getDataFromServer(url, m, first) {
        myLog('Rufe Daten vom Server ab. ScriptID: ' + randomID + (m & DWD ? ' DWD' : (UWZ & m ? ' UWZ' : 'DWD2')));
        for (var i = 0; i < dwdWarncellId.length; i++) {
            if (onStopped) return;
            await axios.get(url)
                .then(results => {
                    if((DWD|DWD2) & m) myLog("AREA: " + dwdWarncellId[i]);
                    if(UWZ & m) myLog("AREA: " + getAreaFromURI(results.config.url));
                    myLog("Status: " + results.status);
                    myLog("Url: " + url);
                    if (!results) log ('!results');
                    if (results === undefined) log('results === undefined')
                    if (results.status == 200) {
                        if((DWD|DWD2) & m) processData(dwdWarncellId[i], results.data, m, first);
                        else if(UWZ & m) processData(getAreaFromURI(results.config.url), results.data, m, first);
                        else {
                            log('getDataFromServer wrong Mode', 'error');
                            stopScript();
                        }
                    } else {
                        if (uLogAusgabe) log ('getDataFromServer() 1. Status: ' + results.status);
                    }
                })
                .catch(error => {
                    if (error == undefined) {
                        if (uLogAusgabe) log('getDataFromServer() 2. Fehler im Datenabruf ohne Errorlog')
                    } else if (error.response == undefined) {
                        if (uLogAusgabe) log('getDataFromServer() 3. ' + error);
                    } else if (error.response.status == 404) {
                        if (uLogAusgabe) log('getDataFromServer() 4. ' + error.message);
                    } else {
                        if (uLogAusgabe) log('getDataFromServer() 5. ' + error.response.data);
                        if (uLogAusgabe) log(error.response.status);
                        if (uLogAusgabe) log(error.response.headers);
                    }
                })
        }
    }

    async function processData(area, thedata, m, first) {
        if (!thedata) {
            return;
        }
        var newOBJ = null;
        if ((DWD & m)) {
            let jsonString = String(thedata);
            let newString = jsonString.replace('warnWetter.loadWarnings(', '');
            newString = newString.replace(');', '');
            newOBJ = JSON.parse(newString);
            if (newOBJ.warnings.hasOwnProperty(area)) {
                newOBJ = newOBJ.warnings[area];
                enableInternDWD2 = false;
                if (uLogAusgabe) log('DWD2 ausgeschaltet')
            }
            else newOBJ = [];
        } else if (UWZ & m) {
            newOBJ = thedata.results;
            if (newOBJ.length) newOBJ.sort(a, b => a.severity - b.severity);
        } else if (DWD2 & m) {
            let tempOBJ = thedata;
            let data = {};
            newOBJ = [];
            for (data in tempOBJ.features) {
                if (tempOBJ.features[data].properties.WARNCELLID == area) {
                    newOBJ.push(tempOBJ.features[data].properties);
                }
            }
            if (newOBJ.length) {
                enableInternDWD = false;
                m |= DWD;
                if (uLogAusgabe) log('DWD ausgeschaltet')
            }
            thedata = null;
        }
        let count = newOBJ.length;
        for (var i = 0; i < numOfWarnings; i++) {
            if (i < count) await writeResultEntry(newOBJ[i], i, m, first);
            else await writeResultEntry({}, i, m, first);
        }
        myLog('processData():' + count ? JSON.stringify(newOBJ) : '{}');
    }

    async function writeResultEntry(warnObj, _i, m, first) {
        var baseChannelId = ''
        if (DWD & m) baseChannelId = internalDWDPath;
        else if (UWZ & m) baseChannelId = internalUWZPath;
        baseChannelId += (_i == 0 ? '' : _i) + '.';

        const oldObject = await getStateAsync(baseChannelId + "object");
        if (!first && oldObject && JSON.stringify(warnObj) == JSON.stringify(oldObject.val)) {
            myLog('Datensatz ' + (_i+1) + ' ist schon vorhanden');
            return;
        }
        let tempObj = {};
        if (MODE & DWD && DWD2 & m) {
            if(addDatabaseData(baseChannelId + statesDWDintern[6].id, warnObj, DWD2, first)) {
                if (timer) clearTimeout(timer);
                if (autoSendWarnings) timer = setTimeout(checkWarningsMain, 20000);
                if (uLogAusgabe) log('DWD2 Warnung gefunden');
            }
            const maps = ['gewitter', 'sturm', 'regen', 'schnee', 'nebel', 'frost', 'glatteis', 'tauwetter', 'hitze', 'uv'];

            tempObj[statesDWDintern[0].id] = warnObj.ONSET !== undefined ? getDateObject(warnObj.ONSET).getTime() : Number("");
            tempObj[statesDWDintern[1].id] = warnObj.DESCRIPTION || '';
            tempObj[statesDWDintern[2].id] = warnObj.EXPIRES !== undefined ? getDateObject(warnObj.EXPIRES).getTime() : Number("");
            tempObj[statesDWDintern[3].id] = warnObj.HEADLINE || '';
            tempObj[statesDWDintern[4].id] = warnObj.SEVERITY === undefined || warnObj.SEVERITY === '' ? -1 : getCapLevel(warnObj.SEVERITY);
            tempObj[statesDWDintern[5].id] = '';
            tempObj[statesDWDintern[6].id] = warnObj;
            tempObj[statesDWDintern[7].id] = tempObj[statesDWDintern[4].id] > 0 ? tempObj[statesDWDintern[4].id] : 0;
            tempObj[statesDWDintern[8].id] = warnObj.EC_GROUP || '';
            if (warnObj.EC_II !== undefined) {
                if (warningTypesString[DWD2][String(warnObj.EC_II)] !== undefined) {
                    tempObj[statesDWDintern[9].id] = warningTypesString[DWD2][String(warnObj.EC_II)];
                }
            }
            tempObj[statesDWDintern[10].id] = warnObj.EC_II === undefined || warnObj.EC_II === null ? -1 : parseInt(warnObj.EC_II, 10);
            for (let a = 0; a < statesDWDintern.length; a++) {
                let dp = statesDWDintern[a];
                if (extendedExists(baseChannelId + dp.id)) setState(baseChannelId + dp.id, tempObj[dp.id], true);
            }
        }
        if (MODE & DWD & m && !(DWD2 & m)) {
            if(addDatabaseData(baseChannelId + statesDWDintern[6].id, warnObj, DWD, first)) {
                if (timer) clearTimeout(timer);
                if (autoSendWarnings) timer = setTimeout(checkWarningsMain, 20000);
                if (uLogAusgabe) log('DWD Warnung gefunden');
            }

            const maps = ['gewitter', 'sturm', 'regen', 'schnee', 'nebel', 'frost', 'glatteis', 'tauwetter', 'hitze', 'uv'];

            tempObj[statesDWDintern[0].id] = warnObj.start || Number("");
            tempObj[statesDWDintern[1].id] = warnObj.description || '';
            tempObj[statesDWDintern[2].id] = warnObj.end || Number("");
            tempObj[statesDWDintern[3].id] = warnObj.headline || '';
            tempObj[statesDWDintern[4].id] = warnObj.level === undefined || warnObj.level === null ? -1 : parseInt(warnObj.level, 10);
            tempObj[statesDWDintern[6].id] = warnObj;
            tempObj[statesDWDintern[7].id] = warnObj.level > 1 ? warnObj.level - 1 : 0;
            tempObj[statesDWDintern[8].id] = warnObj.event || '';
            tempObj[statesDWDintern[9].id] = warnObj.type === undefined || warnObj.type === null ? -1 : parseInt(warnObj.type, 10);
            tempObj[statesDWDintern[10].id] = warnObj.EC_II === undefined || warnObj.EC_II === null ? -1 : parseInt(warnObj.EC_II, 10);
            if (warnObj.type !== undefined && warnObj.type !== null) {
                let land = enableInternDWD && (DWD & m) ? dwdBundesland : '';
                tempObj[statesDWDintern[5].id] = 'https://www.dwd.de/DWD/warnungen/warnapp_gemeinden/json/warnungen_gemeinde_map_' + land + '_' + maps[warnObj.type] + '.png';
            } else {
                tempObj[statesDWDintern[5].id] = '';
            }
            for (let a = 0; a < statesDWDintern.length; a++) {
                let dp = statesDWDintern[a];
                if (extendedExists(baseChannelId + dp.id)) setState(baseChannelId + dp.id, tempObj[dp.id], true);
            }
        }
        if (MODE & UWZ & m) {
            if (addDatabaseData(baseChannelId + statesUWZintern[6].id, warnObj, m, first)){
                if (timer) clearTimeout(timer);
                if (autoSendWarnings) timer = setTimeout(checkWarningsMain, 20000);
            }
            tempObj[statesUWZintern[6].id] = warnObj;

            tempObj[statesUWZintern[0].id] = warnObj.dtgStart !== undefined ? new Date(warnObj.dtgStart * 1000) : Number('');
            tempObj[statesUWZintern[1].id] = warnObj.dtgEnd !== undefined ? new Date(warnObj.dtgEnd * 1000) : Number('');
            tempObj[statesUWZintern[7].id] = warnObj.severity || 0;
            tempObj[statesUWZintern[10].id] = warnObj.type || 0;
            if (warnObj.payload !== undefined) {
                tempObj[statesUWZintern[2].id] = warnObj.payload.translationsLongText.DE;
                tempObj[statesUWZintern[3].id] = warnObj.payload.translationsShortText.DE;
                tempObj[statesUWZintern[4].id] = _getUWZLevel(warnObj.payload.levelName);
                tempObj.uwzUrgency = _getUWZUrgency(warnObj.payload.levelName);
                tempObj[statesUWZintern[5].id] = _getLevelColor(tempObj.uwzLevel);
                tempObj[statesUWZintern[8].id] = _createHTMLShort(tempObj);
                tempObj[statesUWZintern[9].id] = _createHTMLLong(tempObj);
            } else {
                tempObj[statesUWZintern[2].id] = '';
                tempObj[statesUWZintern[3].id] = '';
                tempObj[statesUWZintern[4].id] = 0;
                tempObj.uwzUrgency = 0;
                tempObj[statesUWZintern[5].id] = 0;
                tempObj[statesUWZintern[8].id] = '';
                tempObj[statesUWZintern[9].id] = '';
            }
            for (let a = 0; a < statesUWZintern.length; a++) {
                let dp = statesUWZintern[a];
                if (extendedExists(baseChannelId + dp.id)) setState(baseChannelId + dp.id, tempObj[dp.id], true);
            }
            function _getUWZLevel(warnName) {
                var result = -1; // -1 is an error!
                var alert = warnName.split("_");
                var colors = ["green", "darkgreen", "yellow", "orange", "red", "violet"];

                if (alert[0] == "notice") {
                    result = 1;
                } else if (alert[1] == "forewarn") {
                    result = 2;
                } else {
                    result = colors.indexOf(alert[2]);
                }
                return result;
            }

            function _getUWZUrgency(warnName) {
                var result = 0;

                var alert = warnName.split("_");
                if (alert[1] == "forewarn") {
                    result = 1;
                } else {
                    result = 2; // immediate;
                }
                return result;
            }

            function _getLevelColor(uwzLevel) {
                var uwzColor = [
                   0x00ff00, // 0 - Grün
                   0x009b00, // 1 - Dunkelgrün
                   0xffff00, // 2 - Gelb Wetterwarnungen (Stufe 1)
                   0xffb400, // 3 - Orange Warnungen vor markantem Wetter (Stufe 2)
                   0xff0000, // 4 - Rot Unwetterwarnungen (Stufe 3)
                   0xff00ff, // 5 - Violett Warnungen vor extremem Unwetter (Stufe 4)
               ];
                if (uwzLevel >= 0 && uwzLevel <= 5)
                    return uwzColor[uwzLevel];
                else
                    return 0;
            }

            function _createHTMLShort(w) {
                var html = '<div style="background: #' + w.uwzColor.toString(16) + '" border:"10px">';

                var theData = JSON.parse(w.object);

                html += '<h3>';
                if (w.uwzUrgency == 1) html += "Vorwarnung vor ";
                else html += "Warnung vor ";
                html += warningTypesString[UWZ][w.type];
                html += "</h3>";
                html += "<p>Zeitraum von " + formatDate(new Date(theData.dtgStart * 1000), "WW, DD. OO YYYY hh:mm") + " Uhr bis " + formatDate(new Date(theData.dtgEnd * 1000), "WW, DD. OO YYYY hh:mm") + " Uhr </p>";
                html += '<p>' + w.ShortText + '</p>';
                html += "</div>";
                return html;
            }

            function _createHTMLLong(w) {
                var html = '<div style="background: #' + w.uwzColor.toString(16) + '" border:"10px">';

                var theData = JSON.parse(w.object);

                html += '<h3>';
                if (w.uwzUrgency == 1) html += "Vorwarnung vor ";
                else html += "Warnung vor ";
                html += warningTypesString[UWZ][w.type];
                html += "</h3>";
                html += "<p>Zeitraum von " + formatDate(new Date(theData.dtgStart * 1000), "WW, DD. OO YYYY hh:mm") + " Uhr bis " + formatDate(new Date(theData.dtgEnd * 1000), "WW, DD. OO YYYY hh:mm") + " Uhr </p>";
                html += '<p>' + w.LongText + '</p>';
                html += "</div>";
                return html;
            }
        }
    }
    function getAreaFromURI(uri) {
        var searchstr = "&areaID=";
        var n = uri.search(searchstr);
        var result = uri.slice(n + searchstr.length, uri.length);
        return result;
    }
}

// für Objekt zur Database hinzu
function addDatabaseData(id, value, mode, old) {
    var warn = null;
    let change = false;
    // value muß ein Object sein, value: String/Object, abfrage auf Null/undefiniert ist nur zur Sicherheit.
    if (!value || value === undefined ) value = {};
    // Kompatibilität zur Stableversion
    if (typeof value === 'string' ) value = JSON.parse(value);
    myLog("1. addDatabaseData() ID + JSON:" + id + ' - ' + JSON.stringify(value));
    if (mode == UWZ || mode == DWD || DWD2) {
        let i = warnDatabase.new.findIndex(function(j){return j.id == id});
        let hash = null;
        if (i > -1) hash = warnDatabase.new[i].hash;
        change = removeDatabaseDataID(id);
        if (JSON.stringify(value) != '{}' ) {
            warn = getDatabaseData(value, mode);
            if (warn) {
                if (mode == UWZ) {
                    warn.areaID = getRegionNameUWZ(id);
                } else {
                    warn.areaID = "für " + warn.areaID;
                }
                warn.hash = JSON.stringify(warn).hashCode();
                warn.id = id;
                warnDatabase.new.push(warn);
                if (old) warnDatabase.old.push(warn);
                change = hash != warn.hash;
                if (uLogAusgabe) {
                    if (!change) log("No change! id: " + id + " headline: " + warn.headline);
                    else log("Add UWZ/DWD warning to database. id: " + id + " headline: " + warn.headline);
                }
            }
        } else if (uLogAusgabe && change) log("Remove Warning UWZ/DWD with id: " + id);
    } else if (mode == NINA) {
        // Nina benutzt keine eindeutigen Ids für Warnungen, so dass das löschen woanders erfolgen muß.
        if (value.info === undefined || !Array.isArray(value.info))
        return false;
        let tempArr = [];
        let grouphash = 0;
        // sammele die neuen Daten
        for (let a = 0; a < value.info.length; a++) {
            warn = getDatabaseData(value.info[a], mode);
            // Warnungen nur aufnehmen wenn sie nicht beendet sind. Null berücksichtigt.
            if (warn && (!warn.end || new Date(warn.end) > new Date())) {
                warn.identifier     = value.identifier  === undefined ? "" : value.identifier;
                warn.sender         = value.sender      === undefined ? "" : value.sender;
                warn.hash           = JSON.stringify(warn).hashCode();
                // setzte start auf das Sendungsdatum, aber nicht im Hash berücksichtigen, ist keine neue Nachricht nur weil sich das datum ändert.
                warn.start          = warn.start || value.sent === undefined     ? warn.start    : getDateObject(value.sent).getTime();
                warn.id             = id;
                // davon ausgehend das die Nachrichten immer gleich sortiert sind und der NINA-Adapter das nicht umsortiert sollte der Hash der ersten Nachrichten
                // immer der selbe sein. Benutze diesen um die Gruppe an Nachrichten zu identifizieren.
                if (!grouphash) grouphash = warn.hash;
                warn.grouphash = grouphash;
                tempArr.push(warn);
                myLog("Added to tempdatabase");
            }
        }
        // Vergleiche vorhandene und neue Daten wenn hash = hash aktualisiere ID, wenn nicht und ID = ID setzte ID auf null
        if (tempArr.length > 0) {
            for (let a = 0; a < tempArr.length; a++) {
                for (let b = 0; b < warnDatabase.new.length; b++) {
                    if (tempArr[a].hash == warnDatabase.new[b].hash) {
                        if (uLogAusgabe && warnDatabase.new[b].id != tempArr[a].id) {
                            log( "Update database Nina warning old id<>new id. headline: " +warn.headline );
                        }
                        warnDatabase.new[b].id = tempArr[a].id;
                        tempArr.splice(a--, 1);
                        break;
                    } else if (
                        tempArr[a].id == warnDatabase.new[b].id &&
                        tempArr[a].grouphash != warnDatabase.new[b].grouphash
                    ) {
                        myLog(
                            "warnDatabase.new set id to null - duplicate id and wrong grouphash: " +
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
                if (uLogAusgabe) {
                    log(
                        "Add Nina warning to database. headline: " +
                        warn.headline
                    );
                }
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

function getIndexOfHash(db, hash) {
    return db.findIndex(function(j) {
        return j.hash === hash;
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
        result['picture']        = result.type === -1                ? ''    : warningTypesString[DWD][result.type][1];
    } else if (mode === DWD2) {
        if (
            warn.RESPONSETYPE != 'Prepare'
            || warn.STATUS == 'Test'
            || getCapLevel(warn.SEVERITY) < minlevel
        ) {myLog('Übergebenens Json DWD verworfen');return null;}
        result['mode'] = DWD;
        result['description']   = warn.DESCRIPTION === undefined 	? '' 	: warn.DESCRIPTION;
        result['headline']      = warn.HEADLINE === undefined 		? '' 	: warn.HEADLINE;
        result['start']         = warn.ONSET === undefined 			? null 	: getDateObject(warn.ONSET).getTime() || null;
        result['end']           = warn.EXPIRES === undefined 		? null 	: getDateObject(warn.EXPIRES).getTime() || null;
        result['instruction']   = warn.INSTRUCTION === undefined 	? '' 	: warn.INSTRUCTION;
        result['type']          = warn.EC_II === undefined 			? -1 	: warn.EC_II;
        if (result.type != -1) {
            if (warningTypesString[DWD2][result.type] === undefined) {
                log('Bitte das Json im Forum posten: EC: ' + warningTypesString[DWD2][result.type] ,'warn')
                log(warn, 'warn');
                log(warningTypesString[DWD2]);
            } else {
                result.type = warningTypesString[DWD2][String(result.type)];
                result['picture']        = result.type === -1                ? ''    : warningTypesString[DWD][result.type][1];
            }
        }
        result['level']         = warn.SEVERITY === undefined 		? -1 	: getCapLevel(warn.SEVERITY);
        result['areaID'] 		= warn.AREADESC === undefined 	    ? '' 	: warn.AREADESC;
        result['web'] 			= '';
        result['webname'] 		= '';
        //result['picture']       = result.type === -1                ? ''    : warningTypesString[DWD][result.type][1];
    } else if (mode === UWZ) {
        if (
            warn.payload === undefined
            || warn.payload.altMin > maxhoehe
            || (warn.payload.altMax && warn.payload.altMax < minhoehe)

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
        result['web'] 			= '';
        result['webname'] 		= '';
        result['picture']        = result.type === -1                                    ? ''    : warningTypesString[UWZ][result.type][1];
        if ( result.level < minlevel ) {myLog('Übergebenens Json UWZ verworfen');return null;}
    } else if (mode === NINA) {
        // level 2, 3, 4
        let web='';
        web = warn.web === undefined || !warn.web || !isValidUrl(warn.web)? '' : '<br>'+warn.web+'<br>';
        result['mode'] = NINA;
        //result['identifier'] = warn.identifier === undefined ? '' : warn.identifier;
        //result['sender'] = warn.sender === undefined ? '' : warn.sender;
        result['web'] 					= warn.web === undefined || !warn.web || !isValidUrl(warn.web)        ? '' 	: warn.web.replace(/(\<a href\=\")|(\"\>.+\<\/a\>)/ig,'');
        result['webname'] 				= warn.web === undefined || !warn.web || !isValidUrl(warn.web)	      ? ''	: warn.web.replace(/(\<a href\=\".+\"\>)|(\<\/a\>)/ig,'');
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
        result['level'] 				= warn.severity === undefined 			      ? -1	: getCapLevel(warn.severity, result.typename);
        result['html'] 					= {};
        result['html']['web'] 			= warn.web === undefined || !warn.web || !isValidUrl(warn.web)	      ? '' 	: warn.web;
        result['html']['instruction'] 	= warn.instruction === undefined 		      ? '' 	: warn.instruction;
        result['html']['headline'] 		= warn.headline === undefined 			      ? '' 	: warn.headline;
        result['html']['description'] 	= warn.description === undefined 		      ? '' 	: warn.description;
        result['picture']                = '';
        if ( result.level < minlevel ) return null;
    }
    result['color'] = getLevelColor(result.level);
    result['id']='';
    result['pending'] = 0;
    result['hash'] = 0;
    result['repeatCounter'] = 0;
    myLog('2. getDatabaseData(warn, mode) result: ' + JSON.stringify(result));
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
        else return color[0];
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
// gibt Nina level zurück
function getCapLevel(str, type) {
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

function removeHtml(a) {
    let b = a.replace(/<br\/>/ig, NEWLINE);
    b = b.replace(/(&nbsp;|<([^>]+)>)/ig, '');
    return b;
}
// Überprüfe wegen Nina - Adapter häufig die DB ob obj.ids gelöscht wurden.
// Dachte ich zuerst, die Server sind aber sehr unzuverlässig und Meldungen werden laufend nicht ausgeliefert.
// Folglich werden Entwarnung raus geschickt. Jetzt warten wir 20 * 5 = 100 Minuten entwarnen erst dann.
// Abgelaufene Meldungen werden aufgeräumt.
function activateSchedule() {
    schedule('30 19,39,59 * * * *', function() {
        let c = false;
        for (let a = 0; a < warnDatabase.new.length; a++) {
            let w = warnDatabase.new[a];
            if (!extendedExists(w.id)) {
                if (warnDatabase.new[a].pending++ >= 4) { //  9 Durchläufe
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
}

// entferne Eintrag aus der Database
function removeDatabaseDataID(id) {
    if (!id || (typeof id !== 'string')) return false;
    let change = false;
    if (warnDatabase.new && warnDatabase.new.length > 0) {
        let i = warnDatabase.new.findIndex(function(j){return j.id == id});
        if (i!=-1) {
            warnDatabase.new.splice(i, 1);
            change = true;
        }
    }
    return change;
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
    if (!mailMsg) mailMsg = html_prefix;
    if (headline) {
        if (color) mailMsg += html_headline_color.replace('###color###', color).replace('###headline###', headline);
        else mailMsg += html_headline.replace('###headline###', headline);
    }
    if (msg) mailMsg += html_message.replace('###message###', msg);
    if (last) mailMsg += html_end;
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
    } catch (e) { log('replaceTokenForSpeak' + e, 'warn'); }
    return rueckgabe;
}
// Formatiere Date zu string
function getFormatDate(a) {
    if (!a || (!(typeof a === 'number')) && !(typeof a === 'object')) return '';
    return formatDate(new Date(a).getTime(), formatierungString);
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
    on({ id: telegramInstanz + '.communicate.request', change: "any"}, function(obj) {
        var msg = obj.state.val;
        var user = msg.substring(1, msg.indexOf(']'));
        myLog('Telegramnachricht erhalten. Nutzer: ' + user + ' Nachricht: ' + msg);
        msg = msg.substring(msg.indexOf(']') + 1, msg.length);
        if (DEBUG && msg.includes('Wwdmail')) {
            let olddebug = DEBUGSENDEMAIL;
            DEBUGSENDEMAIL = true;
            setState(mainStatePath + 'commands.' + konstanten[2].name, true, function() {
                setTimeout(function() {
                    DEBUGSENDEMAIL = olddebug;
                }, 200);
            });
        } else if (msg.includes('Wwdon') || msg == 'DWDUZWNINA#!§$debugan') {
            DEBUG = true;
        } else if (msg.includes('Wwdoff') || msg == 'DWDUZWNINA#!§$debugaus') {
            DEBUG = false;
        } else if (msg === uTelegramMessageLong || msg === 'DWDUZWNINA#!§$LONG' || msg === uTelegramMessageShort || msg.includes('Wetterwarnungen?') || msg == 'DWDUZWNINA#!§$TT') {
            warnDatabase.old = [];
            let oPd = uPushdienst;
            uPushdienst &= TELEGRAM;
            forceSpeak = forcedSpeak;
            onClickCheckRun = true;
            onClickCheckRunCmd = 'Textnachricht über Telegram'
            let oldA = uTextMitAnweisungen, oldB = uTextMitBeschreibung;
            let long = true;
            if ( msg === uTelegramMessageShort || msg.includes('Wetterwarnungen?') || msg == 'DWDUZWNINA#!§$TT') long = false;
            uTextMitAnweisungen = long;
            uTextMitBeschreibung = long;

            checkWarningsMain();

            uTextMitAnweisungen = oldA;
            uTextMitBeschreibung = oldB;
            onClickCheckRun = false;
            onClickCheckRunCmd = '';
            forceSpeak = false;
            uPushdienst = oPd;
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

onStop(function (callback) {
    onStopped = true;
    if (uLogAusgabe) log('Skripts gestoppt: ID:' + randomID);
    if (internalDWDInterval) clearInterval(internalDWDInterval);
    callback();
})
/* *************************************************************************
* Restartfunktion
*           ENDE
/* ************************************************************************* */
/* *************************************************************************
* Erstellung von States incl. 0_userdata & Zugehöriges
/* ************************************************************************* */
// gibt die ersten beiden Teile von ID zurück
// erweiterte existsState() funktion
function extendedExists(id) {
    return (id) && ($(id).length > 0) && (existsState(id));
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
        log('DEBUG: ' + msg,channel);
    }
}
function checkConfigVariable(v) {
    try {
        if (eval(v)) {t = ''};
    } catch (e) {
        let m = 'Variable in der Konfiguration fehlt: "' + v +'" bitte auf Github nachlagen und die Konfigzeile in dein lokales Skript kopieren.';
        log(m, 'warn');
        stopScript();
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

function isValidUrl(str) {
   var pattern = new RegExp('^((ft|htt)ps?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name and extension
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?'+ // port
  '(\\/[-a-z\\d%@_.~+&:]*)*'+ // path
  '(\\?[;&a-z\\d%@_.,~+&:=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return pattern.test(str.replace(/(\<a href\=\")|(\"\>.+\<\/a\>)/ig,''));
}

/* *************************************************************************
* Hilffunktion sonstiges
*           ENDE
/* ************************************************************************* */
