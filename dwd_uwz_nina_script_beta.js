//Version 1.1.5.d
// Erläuterung Update:
// Suche im Script nach 123456 und kopiere/ersetze ab diesem Punkt. So braucht ihr die Konfiguration nicht zu erneuern.
// Link: https://forum.iobroker.net/topic/30616/script-dwd-uwz-nina-warnungen-als-push-sprachnachrichten/
//
// 1.1.0 Neue Konfigurationsoption ganzes Skript ersetzten, für Fortgeschrittene von Zeile 89-144 sind in diesem Skript änderungen in der Config.
//          - State Plain enthält alle aktiven Warnungen in reinem Text.
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
- DWD-Adapter & Unwetterzentrale-Script & NINA-Adapter ab V0.0.22
- Eigener Datenabruf für DWD Kreiswarnungen (wie Adapter), DWD Gemeindeegene, UWZ, Nina (ausgenommen Hochwasser), Zamg
- Wetterwarnung
- Wetterentwarnung

Funktionen:
- Filter die Warnungen nach doppelt, Gefahr(level) und Höhe
- Umschalten über iobroker zwischen DWD/UWZ/NINA
- Automatischer Versand und/oder manueller Nachrichtenversand
- Zeitschaltuhr für Sprachausgabe
- Datenpunkte mit der Startzeit, Endzeit, Type, Schlagzeile, Beschreibung, Farbe für Level(bgcolor) und höchstem Warnlevel dieses Typs
- Unterstützung für 0_userdata
- Datenpunkthauptpfade sind konfigurierbar incl. 0_userdata
- Konfigurationsprüfung soweit möglich
- Automodus und einzelne Pushdienste über iobroker schaltbar, sowohl für Automodus als auch Manuell
- Optimierte Sprachausgabe

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
0 - Grün // sollte es nicht geben
1 - Dunkelgrün
2 - Gelb Wetterwarnungen (Stufe 2)
3 - Orange Warnungen vor markantem Wetter (Stufe 3)
4 - Rot Unwetterwarnungen (Stufe 4) // im Grunde höchste Stufe in diesem Skript.
5 - Violett Warnungen vor extremem Unwetter (sollte es nicht geben)



Dank an:
- crunchip, sigi234, Latzi, CruziX fürs Testen und Ideen
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



var mainStatePath = '0_userdata.0.wetterwarnung.';



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
    {"name":'state_html',"value":256},
    {"name":'state_plain',"value":512}
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
const STATE_PLAIN = konstanten[9].value;
var uPushdienst = 0;
const DWD = 1;
const UWZ = 2;
const NINA = 4;
const DWD2 = 8; // only for request
const ZAMG = 16;
const MODES = [{mode:DWD, text:'DWD'},{mode:UWZ, text:'UWZ'},{mode:NINA, text:'NINA'}, {mode: ZAMG, text:'ZAMG'}];
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
//uPushdienst+= STATE_PLAIN;        // Auskommentieren zum aktivieren. States mit allen aktivien Warnungen

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

/* ************************************************************************* */
/*                                Datenabruf intern                          */
/* ************************************************************************* */

/* für UWZ Regionnamen eingeben "Warnung der Unwetterzentrale für XXXX" */
/* Durch das auffüllen wird der Datenabruf der UWZ aktiviert*/
/* Textbeispiel anstatt Entenhausen: 'Stadt / Dorfname' 'Berlin' oder 'den Regionsbezeichnung' 'den Schwarzwald' ''*/
/* UWZ - Für Deutschland: UWZDE + PLZ (UWZDE12345) */
/* var regionName = ['UWZDE13245', 'Entenhausen'] */
/* zum Deaktivieren [[]] oder [['','']]*/
var regionName          = [['','']];

// Standalone Datenquelle
// entnehme ZAHL aus CSV
/* nur Gemeinde/Landkreis/Großstädte werden verwendet: https://www.dwd.de/DE/leistungen/opendata/help/warnungen/cap_warncellids_csv.csv?__blob=publicationFile&v=3 */
var dwdWarncellId = ''; // Deaktivieren mit '' einzel: '2334535354' mehrere: ['23423424','23423423']

// Koordinaten [{laengen:13.05501,breiten:47.80949},{breiten:46.6247200, laengen:14.3052800},{breiten:48.332741,laengen:14.62274}];.
var zamgCoordinates = []; // [] ist deaktiviert
var uZAMGMitMeteoinformationen = true; // gibt die Wetterinformationen mit der Beschreibung aus: z.B Eine Kaltfront und ein Italientief sorgen im Warnzeitraum...

// für Nina gebt die Koordinaten für euren Ort ein.
ninaCoordinates = [] //   ninaCoordinates = [{breiten:51.2277, laengen:6.7735, text:'dadrüben'}, {breiten:53.0511000, laengen:8.6309100, text:'Delmenhorst'}];

/* ************************************************************************* */
/*         Datenabruf über Adapter oder externes Skript                      */
/* ************************************************************************* */

// für Nina wird die Gemeinde und der Landkreis benötigt. Am besten von hier kopieren: https://warnung.bund.de/assets/json/suche_channel.json
// ohne die kryptischen Zeichen. Das ersetzt nicht den NINA-Adapter
var uGemeinde = ''; // hier steht zum Beispiel, Hamburg, Unterdorf
var uLandkreis = ''; // hier Kreis Bitburg, Landkreis Fürth

/* ************************************************************************* */
/*                                Sonstige                                   */
/* ************************************************************************* */

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
uTelegramReplyMarkupInline      = true   // Bei Nachrichten die nicht mit volle Länge angefragt wurde, gibt es eine Schalfläche in der man die Langversion anfordern kann.

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
alexaMultiroomParentsOff = false; // pausiere alle mit den IDs verknüpfte Multiroomgruppen

// Filtereinstellungen über Objekte einstellen
var minlevel                      =    1 // Warnungen unterhalb dieses Levels nicht senden; (DWD und Nina level 1-4  / UWZ 0-5)
var attentionWarningLevel         =    3 // Warnung gleich oder oberhalb dieses Levels mit zusätzlichen Hinweisen versehen
var minhoehe                      =    0 // Warnung für eine Höhe unterhalb dieses Wertes nicht senden
var maxhoehe                      =    5000 // Warnung für eine Höhe oberhalb dieses Wertes nicht senden

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

// Über Objekte einzustellen
uLogLevel = 1 // 0:OFF, 1:INFO, 2:ADVANCE, 4:DEBUG
/* ************************************************************************* */
/*                       Nur Anpassen wenn nötig                             */
/* ************************************************************************* */

//Formatierungsstring für Datum / Zeit Alternative "TT.MM.YYYY SS:mm" KEINE Anpassung nötig
const formatierungString =  "TT.MM.YY SS:mm";

var scriptOverrides = false; // Die Einstellung im Skript überschreiben bei jedem Start die Einstellungen in den Objekten (punkte unter Basiskonfiguration außer warnzelle.


// Die Geschwindigkeit gibt an wie lange das Skript wartet bevor es eine neue Nachricht an die Sprachausgabe sendet.
konstanten[3].delay /*SayIt*/       = 86; // Vorlese Geschwindigkeit pro Zeichen in ms
konstanten[4].delay /*Home24*/      = 90; // Vorlese Geschwindigkeit pro Zeichen in ms
konstanten[5].delay /*Alexa*/       = 88; // Vorlese Geschwindigkeit pro Zeichen in ms

// Mit diesen Optionen verringert man die Nachrichtenlänge in dem Beschreibung oder Handlungsanweisungen
// nicht der Nachricht hinzugefügt werden.
// über Objekte einzustellen
var uHtmlMitBeschreibung            = true; // gilt für Email
var uHtmlMitAnweisungen             = true; // uHtmlMitBeschreibung muß evenfalls true sein um Anweisungen zu erhalten
var uTextMitBeschreibung            = true; // gilt nicht für Email, aber für alle anderen Textnachrichten
var uTextMitAnweisungen             = true; // uTextMitBeschreibung muß evenfalls true sein um Anweisungen zu erhalten
var uSpracheMitBeschreibung         = true; // gilt für alle Sprachnachrichten
var uSpracheMitAnweisungen          = true; // uSpracheMitBeschreibung muß evenfalls true sein um Anweisungen zu erhalten
var uSpracheMitOhneAlles            = true; // super kurz überschreibt die anderen Einstellungen
uTextHtmlMitOhneAlles               = false // super kurz für Text und Html

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

var intervalMinutes = 5; // die Daten bei DWD werden alle 10 Minuten aktualisiert.

// Instanzen im ioBroker
var telegramInstanz=    'telegram.0';
var pushoverInstanz=    'pushover.0';
var ioGoInstanz=        'iogo.0';
var alexaInstanz=       'alexa2.0';
var emailInstanz=       'email.0';

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
var DEBUGSENDEMAIL = false;
var DEBUG_VARS = false;
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
var html_headline_color = '<tr><td style="padding: 5px 0 5px 0;" bgcolor=\"' + '###color###' + '\"><b><font color=#000000>' + '###headline###' + '</font></b></td></tr>';
var html_headline = '<tr><td style="padding: 5px 0 5px 0;"><b>' + '###headline###' + '</b></td></tr>';
var html_message = '<tr><td style="padding: 5px 0 20px 0;">' + '###message###' + '</td></tr>';
var html_end = '</table>';

var ninaCoordinates;
if (ninaCoordinates === undefined) ninaCoordinates = []
if ( DEBUG_VARS) {
    ninaCoordinates = [{breiten:51.2277, laengen:6.7735, text:'dadrüben'}, {breiten:53.0511000, laengen:8.6309100, text:'Delmenhorst'}];
    zamgCoordinates = [{laengen:13.05501,breiten:47.80949},{breiten:46.6247200, laengen:14.3052800},{breiten:48.332741,laengen:14.62274}];
    regionName.push(['UWZAT00810', 'sig']);
}
// MODE einstellen über Datenpunkte, das hier hat keine auswirkungen
// nur für ersten Lauf nötig, ab dann überschreiben States diesen Wert
var MODE = 0; // DWD oder UWZ wird von gültigen Einstellungen im Datenpfad überschrieben

// Wandel Usereingabe in sauberes True / False um
forcedSpeak = !!forcedSpeak;
windForceDetailsSpeak = !!windForceDetailsSpeak;

//Vorgezogene Tests
checkConfigVariable('uZAMGMitMeteoinformationen');
checkConfigVariable('ZAMG');
checkConfigVariable('zamgCoordinates');
checkConfigVariable('DEBUGINGORESTART');
checkConfigVariable('dwdWarncellId');
checkConfigVariable('DWD2');

// Variable nicht konfigurierbar
const SPEAK = ALEXA + HOMETWO + SAYIT;
const PUSH = TELEGRAM + PUSHOVER + IOGO + STATE;
const ALLMSG = EMAIL | STATE_HTML | STATE_PLAIN;
const ALLMODES = DWD | UWZ | NINA | ZAMG;
const CANHTML = EMAIL + STATE_HTML;
const CANPLAIN = PUSH + EMAIL + STATE_PLAIN;
const placeHolder = 'XXXXPLACEHOLDERXXXX';
const configModeState = mainStatePath + 'config.mode';
const mirrorMessageState = mainStatePath + 'message';
const mirrorMessageStateFull = mainStatePath + 'messagePlain';
const mirrorMessageStateHtml = mainStatePath + 'messageHtml';
const totalWarningCountState = mainStatePath + 'totalWarnings';
const SPACE = ' ';
const NEWLINE = '\n';
const axios = require('axios');
var numOfWarnings = 5;
var enableInternDWD = false;
var enableInternDWD2 = false;
//const internDWDUrl='https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json';
const internDWD2Url = 'https://maps.dwd.de/geoserver/dwd/ows?service=WFS&version=1.2.0&CQL_FILTER=WARNCELLID%20IN%20(%27'+ placeHolder +'%27)&request=GetFeature&typeName=dwd%3AWarnungen_Gemeinden&maxFeatures=50&outputFormat=application%2Fjson';
const interngetNameDWD2Url = 'https://maps.dwd.de/geoserver/dwd/ows?service=WFS&version=1.2.0&CQL_FILTER=WARNCELLID%20IN%20(%27'+ placeHolder +'%27)&request=GetFeature&typeName=dwd%3AWarngebiete_Gemeinden&maxFeatures=50&outputFormat=application%2Fjson';
var internalDWDPath = mainStatePath + 'data.dwd.';
var internalWarningEnd = '.warning';
var standaloneInterval = null;

const statesIntern = {[DWD]:{}, [UWZ]:{}, [ZAMG]:{}, [NINA]:{}};

statesIntern[DWD].path = internalDWDPath
var sendNoMessgesOnInit = false;
var enableInternUWZ = false;
var internUWZUrl='http://feed.alertspro.meteogroup.com/AlertsPro/AlertsProPollService.php?method=getWarning&language=de&areaID=';
var internalUWZPath = mainStatePath + 'data.uwz-id.';
statesIntern[UWZ].path = internalUWZPath
var internZamgUrl = "https://warnungen.zamg.at/wsapp/api/getWarningsForCoords?lon=" + placeHolder+"&lat=" + placeHolder+"1&lang=de"
var internalZamgPath = mainStatePath + 'data.zamg.';
statesIntern[ZAMG].path = internalZamgPath
var internMowasUrl = ["https://warnung.bund.de/bbk.mowas/gefahrendurchsagen.json", 'https://warnung.bund.de/bbk.biwapp/warnmeldungen.json', 'https://warnung.bund.de/bbk.katwarn/warnmeldungen.json'];
var internalMowasPath = mainStatePath + 'data.nina.';
statesIntern[NINA].path = internalMowasPath

var START = new Date();
var ENDE = new Date();
var idAlexa = alexaInstanz + '.Echo-Devices.' + placeHolder + '.Commands.announcement';
var idAlexaVolumen = alexaInstanz + '.Echo-Devices.' + placeHolder + '.Commands.speak-volume';
var idAlexaState = alexaInstanz + '.Echo-Devices.' + placeHolder + '.Player.currentState'
var idAlexaPause = alexaInstanz + '.Echo-Devices.' + placeHolder + '.Player.controlPause'
var idAlexaPlay  = alexaInstanz + '.Echo-Devices.' + placeHolder + '.Player.controlPlay'
var idAlexaParents = alexaInstanz +  '.Echo-Devices.' + placeHolder + '.Info.multiroomParents'
var idAlexaLastState = []

var autoSendWarnings = true;
var forceSpeak = false;
var timer = null;
var onClickCheckRun = false;
var onClickCheckRunCmd = '';
var warnDatabase = { new: [], old: [] };
var subDWDhandler = null;
var subUWZhandler = null;
var subNINAhandler = null;

let nPushdienst = {auto:{}, man:{}}
for (let a=0; a<MODES.length;a++) {
    if (MODES[a][0] == DWD2) continue;
    nPushdienst.auto[MODES[a][0]] = uPushdienst;
    nPushdienst.man[MODES[a][0]] = uPushdienst;
}
var firstRun = true;
var _speakToArray = [{ speakEndtime: new Date() }]; // muß immer 1 Element enthalten
var _speakToInterval = null;
var deviceList = 		{};
var onChangeTimeoutObj = {};
var removeSchedule = null
var onStopped = true;
var setAlertStateTimeout = null;
var setAlertStateCount = 0;
var ninaIdentifier = {};
var warncells = {};
var blockGetDataFromServer = 0;
warncells[DWD] = [];
warncells[UWZ] = [];
warncells[ZAMG] = [];
warncells[NINA] = [];

const randomID = Math.random()*10000;
var templist = {};
templist[DWD] = {};
templist[UWZ] = {};
templist[ZAMG] = {};

var uLogLevel;
if (uLogLevel === undefined) uLogLevel = 1;

var uTextHtmlMitOhneAlles

if (uTextHtmlMitOhneAlles === undefined)  uTextHtmlMitOhneAlles = false;

var uTelegramReplyMarkupInline
if (uTelegramReplyMarkupInline === undefined) uTelegramReplyMarkupInline = false;

var alexaMultiroomParentsOff

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
    ['Hitze', '🔥'],
    ['UV Belastung', '🔆'],
    ['Kuestenwarnungen', '?'],
    ['Binnenseewarnungen', '?'],
    ['Gewitter+', '⚡🌪🌧']
];
{
    let _temp = {
        "0": [33,34,36,38,40,41,42,44,45,46,48,49,31,95,96],
        "1": [33,36,38,40,41,44,45,48,49,51,52,53,54,55,56,96],
        "2": [42,45,46,48,49,61,62,63,64,65,66,95,96]
    }

    var specialWarningTypesString = {}
    for (let a in _temp) {
        let data = _temp[a]
        for (let b = 0; b < data.length;b++) {
            if (specialWarningTypesString[data[b]] == undefined) specialWarningTypesString[data[b]] = {}
            specialWarningTypesString[data[b]][a] = true
        }
    }
}
{
    let tempwarningTypesString = [
        ['Gewitter', 31,32,33,34,35,36,37,38,39,40,41,91,92,93,94,95,96],//31-49, 91-96
        ['Sturm', 51,52,53,54,55,56,57,58],//51-58
        ['Regen', 61,62,63,64,65,66],//61-66
        ['Schnee', 70,71,72,73,74,75,76,77,78],//71 - 78
        ['Nebel', 59],//59
        ['Frost', 22,82], //22, 82
        ['Glatteis', 24,84,85,86,87],//24, 84-87
        ['Tauwetter', 88,89,],
        ['Hitzewarnungen',247,248],
        ['UV_Warnungen', 246],
        ['Kuestenwarnungen', -2],
        ['Binnenseewarnungen', -2],
        ['Gewitter+', 46,48]   
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
    ['Sturm', '🌪'],
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

warningTypesString[ZAMG] = [
    ['unbekannt1', ''],
    ['Sturm', '🌪'],
    ['Regen', '🌧'],
    ['Schnee', '🌨'],
    ['Glatteis', '❄'],
    ['Gewitter', '⚡'],
    ['Hitze', '🔆'],
    ['Kälte', '❄'],
    ['unbekannt2', '❄'],
];

warningTypesString[NINA] = [

];

//StatesDefinition für DWD intern
// https://isabel.dwd.de/DE/leistungen/opendata/help/warnungen/cap_dwd_profile_de_pdf_1_11.pdf?__blob=publicationFile&v=3
const statesDWDintern = [
    { id:"begin",default:0, options: {name: "Warning begin",type: "number",role: "value.time",read: true,write: false}},
    { id:"description", default:"", options: {name: "Warning description",type: "string",role: "weather.state",read: true,write: false}},
    { id:"end", default:0, options: {name: "Warning end",type: "number",role: "value.time",read: true,write: false}},
    { id:"headline", default:"", options: {name: "Warning description",type: "string",role: "weather.state",read: true,write: false}},
    { id:"level",default: 0, options: {name: "Warning level",type: "number",role: "value.warning",read: true,write: false,states: {1: "Minor",2: "Moderate",3: "Severe",4: "Extreme"}}},
    { id:"map", default:"", options: {name: "Link to chart",type: "string",role: "weather.chart.url",read: true,write: false}},
    { id:"object", default: null, options: {name: "JSON object with warning", type: "object", role: "weather.json", read: true, write: false}},
    { id:"severity", default: 0, options: {name: "Warning severity",type: "number",role: "value.severity",read: true,write: false,states: {0: "None",1: "Minor",2: "Moderate",3: "Severe",4: "Extreme",9: "Heat Warning",11: "No Warning",19: "UV Warning",49: "Strong Heat",50: "Extreme Heat"}}},
    { id:"text", default: "", options: {name: "Warning text",type: "string",role: "weather.title.short",read: true,write: false}},
    { id:"type", default: 0, options: {name: "Warning type",type: "number",role: "weather.type",read: true,write: false,states: {0: "Thunderstorm",1: "Wind/Storm",2: "Rain",3: "Snow",4: "Fog",5: "Frost",6: "Ice",7: "Thawing",8: "Heat",9: "UV warning"}}},
    { id:"ec_ii_type", default: 0, options: {name: "Warning type EC_II",type: "number",role: "weather.type",read: true,write: false,}},
    { id:"urgency", default: "", options: {name: "Warning urgency",type: "string",read: true,write: false}},
    { id:"responseType", default: "", options: {name: "Warning responseType",type: "string",read: true,write: false}},
    { id:"certainty", default: "", options: {name: "Warning certainty",type: "string",read: true,write: false}},
    { id:"altitude", default: 0, options: {name: "Start Höhenlage der Warnung",type: "number",read: true,write: false}},
    { id:"ceiling", default: 3000, options: {name: "End Höhenlage der Warnung",type: "number",read: true,write: false}},
    { id:"color", default:'', options: {name: "Farbe",type: "string",read: true,write: false,}},
    { id:"HTMLShort", default: "", options: {name: "Warning text html",type: "string",read: true,write: false}},
    { id:"HTMLLong", default: "", options: {name: "Warning text html",type: "string",read: true,write: false,}},
    { id:"HTMLVeryLong", default: "", options: {name: "Warning text very long html",type: "string",read: true,write: false,}},
    { id:"instruction", default: "", options: {name: "Warning instruction text html",type: "string",read: true,write: false,}}
];

const statesNINAintern = {
    onset: { id:"begin",default:0, options: {name: "Warnungsstart",type: "number",role: "value.time",read: true,write: false}},
    description: { id:"description", default:"", options: {name: "Beschreibung",type: "string",role: "weather.state",read: true,write: false}},
    expires: { id:"end", default:0, options: {name: "Warnungsende",type: "number",role: "value.time",read: true,write: false}},
    headline: { id:"headline", default:"", options: {name: "Schlagzeile",type: "string",role: "weather.state",read: true,write: false}},
    level: { id:"level",default: 0, options: {name: "Level",type: "number",role: "value.warning",read: true,write: false,states: {1: "Minor",2: "Moderate",3: "Severe",4: "Extreme"}}},
    object: { id:"object", default: null, options: {name: "JSON object with warning", type: "object", role: "weather.json", read: true, write: false}},
    serverity: { id:"severity", default: '', options: {name: "Warning severity",type: "string",role: "value.severity",read: true,write: false,states: {0: "None",1: "Minor",2: "Moderate",3: "Severe",4: "Extreme",9: "Heat Warning",11: "No Warning",19: "UV Warning",49: "Strong Heat",50: "Extreme Heat"}}},
    type: { id:"type", default: 0, options: {name: "Warning type",type: "number",role: "weather.type",read: true,write: false}},
    urgency:{ id:"urgency", default: "", options: {name: "Warning urgency",type: "string",read: true,write: false}},
    sent: { id:"sent", default: 0, options: {name: "Veröffentlichung",type: "number",role: "value.time",read: true,write: false}},
    certainty: { id:"certainty", default: "", options: {name: "Warning certainty",type: "string",read: true,write: false}},
    event: { id:"event", default: "", options: {name: "",type: "string",read: true,write: false}},
    eventCode: { id:"eventCode", default: [], options: {name: "",type: "array",read: true,write: false}},
    web: { id:"web", default: "", options: {name: "Webadresse",type: "string",read: true,write: false}},
    contact: { id:"contact", default: "", options: {name: "Kontakt",type: "string",read: true,write: false}},
    parameter: { id:"parameter", default: '[]', options: {name: "",type: "string",read: true,write: false}},
    areaDesc: { id:"areaDesc", default: "", options: {name: "Bereich der Warnung",type: "string",read: true,write: false}},
    category: { id:"category", default: [], options: {name: "Array von Kategorien",type: "array",read: true,write: false}}
};

//StatesDefinition für UWZ intern
var wtsObj = {};
for (let a = 0; a < warningTypesString[UWZ].length; a++) {
    wtsObj[String(a)] = warningTypesString[UWZ][a][0];
}
const statesUWZintern = [
    { id:"begin",default:Number(''), options: {name: "Warning begin",type: "number",role: "value.time",read: true,write: false,}},
    { id:"end", default:Number(''), options: {name: "Warning end",type: "number",role: "value.time",read: true,write: false,}},
    { id:"longText", default:"", options: {name: "Warning description",type: "string",role: "weather.state",read: true,write: false,}},
    { id:"shortText", default:"", options: {name: "Warning description",type: "string",role: "weather.state",read: true,write: false,}},
    { id:"uwzLevel",default: 0, options: {name: "Warning level",type: "number",role: "value.warning",read: true,write: false,}},
    { id:"color", default:'', options: {name: "Link to chart",type: "string",read: true,write: false,}},
/*6*/    { id:"object", default: {}, options: {name: "JSON object with warning", type: "object", role: "weather.json", read: true, write: false,}},
    { id:"severity", default: 0, options: {name: "Warning severity",type: "number",role: "value.severity",read: true,write: false,}},
    { id:"HTMLShort", default: "", options: {name: "Warning text",type: "string",read: true,write: false}},
    { id:"HTMLLong", default: "", options: {name: "Warning text",type: "string",read: true,write: false,}},
    { id:"type", default: 0, options: {name: "Warning type",type: "number",role: "weather.type",read: true,write: false, states: wtsObj,}},
    { id:"headline", default:'', options: {name: "headline",type: "string",read: true,write: false,}},
    { id:"HTMLVeryLong", default: "", options: {name: "Warning text very long html",type: "string",read: true,write: false,}}
];

const statesZAMGintern = [
    { id:"begin", default:null, options: {name: "Warnung start",type: "number",role: "value.time",read: true,write: false,}},
    { id:"end",  default:null, options: {name: "Warnung ende",type: "number",role: "value.time",read: true,write: false,}},
    { id:"auswirkungen", json:'auswirkungen', default:"", options: {name: "Warnung Auswirkungen",type: "string",role: "weather.state",read: true,write: false,}},
    { id:"empfehlungen", json:'empfehlungen', default:"", options: {name: "Warnung Empfehlungen",type: "string",role: "weather.state",read: true,write: false,}},
    { id:"meteotext", json:'meteotext', default:"", options: {name: "Warnung Wettertext",type: "string",role: "weather.state",read: true,write: false,}},
    { id:"text", json:'text', default:"", options: {name: "Warnung description",type: "string",role: "weather.state",read: true,write: false,}},
/*6*/    { id:"object", default: {}, options: {name: "JSON object with warning", type: "object", role: "weather.json", read: true, write: false,}},
    { id:"type", default:-1, options: {name: "Warnung Type",type: "number",read: true,write: false,}},
    { id:"level", json:'warnstufeid', default: 0, options: {name: "Warnung level",type: "number",role: "value.severity",read: true,write: false,}},
    { id:"warntype", default: '', options: {name: "Warnung type",type: "string",role: "weather.type",read: true,write: false,}},
    { id:"area", default: '', options: {name: "Warnung area",type: "string",role: "weather.area",read: true,write: false,}},
    { id:"HTMLShort", default: "", options: {name: "Warning text html",type: "string",read: true,write: false}},
    { id:"HTMLLong", default: "", options: {name: "Warning text html",type: "string",read: true,write: false,}},
    { id:"color", default:"", options: {name: "Link to chart",type: "string",read: true,write: false,}},
    { id:"headline", default:'', options: {name: "headline",type: "string",read: true,write: false,}},
    { id:"HTMLVeryLong", default: "", options: {name: "Warning text very long html",type: "string",read: true,write: false,}}
];

statesIntern[DWD].states = statesDWDintern
statesIntern[UWZ].states = statesUWZintern
statesIntern[ZAMG].states = statesZAMGintern
statesIntern[NINA].states = statesNINAintern
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
        { "name": 'hash', "default": 0, "type": { read: true, write: false, role: "value", type: "number", name: '' } },
        { "name": 'ec_ii_type', "default": -1, "type": { read: true, write: false, type: "number", name: '' } }
];

const configObj = {
    0: {id: 'basiskonfiguration.auto-nachrichtenlänge.html.beschreibung', typ:'boolean', setObj: async function (){setStateAsync(configObj.path + configObj[0].id, uHtmlMitBeschreibung, true)}, def: uHtmlMitBeschreibung, on: function(obj) {uHtmlMitBeschreibung = obj.state.val; setState(obj.id,obj.state.val,true);}},
    1: {id: 'basiskonfiguration.auto-nachrichtenlänge.html.anweisungen', typ:'boolean', setObj: async function (){setStateAsync(configObj.path + configObj[1].id, uHtmlMitAnweisungen, true)}, def: uHtmlMitAnweisungen,on: function(obj) {uHtmlMitAnweisungen = obj.state.val; setState(obj.id,obj.state.val,true);}},
    2: {id: 'basiskonfiguration.auto-nachrichtenlänge.text.beschreibung', typ:'boolean', setObj: async function (){setStateAsync(configObj.path + configObj[2].id, uTextMitBeschreibung, true)}, def: uTextMitBeschreibung,on: function(obj) {uTextMitBeschreibung = obj.state.val; setState(obj.id,obj.state.val,true);}},
    3: {id: 'basiskonfiguration.auto-nachrichtenlänge.text.anweisungen', typ:'boolean', setObj: async function (){setStateAsync(configObj.path + configObj[3].id, uTextMitAnweisungen, true)}, def: uTextMitAnweisungen,on: function(obj) {uTextMitAnweisungen = obj.state.val; setState(obj.id,obj.state.val,true);}},
    4: {id: 'basiskonfiguration.auto-nachrichtenlänge.sprache.beschreibung', typ:'boolean', setObj: async function (){setStateAsync(configObj.path + configObj[4].id, uHtmlMitAnweisungen, true)}, def: uSpracheMitBeschreibung,on: function(obj) {uSpracheMitBeschreibung = obj.state.val; setState(obj.id,obj.state.val,true);}},
    5: {id: 'basiskonfiguration.auto-nachrichtenlänge.sprache.anweisungen', typ:'boolean', setObj: async function (){setStateAsync(configObj.path + configObj[5].id, uSpracheMitBeschreibung, true)}, def: uSpracheMitAnweisungen,on: function(obj) {uSpracheMitAnweisungen = obj.state.val; setState(obj.id,obj.state.val,true);}},
    6: {id: 'basiskonfiguration.auto-nachrichtenlänge.sprache.erzwinge_kurzform', typ:'boolean', setObj: async function (){setStateAsync(configObj.path + configObj[6].id, uSpracheMitOhneAlles, true)}, def: uSpracheMitOhneAlles,on: function(obj) {uSpracheMitOhneAlles = obj.state.val; setState(obj.id,obj.state.val,true);}},
    7: {id: 'basiskonfiguration.auto-nachrichtenlänge.zamg.wetterinformationen', typ:'boolean', setObj: async function (){setStateAsync(configObj.path + configObj[7].id, uZAMGMitMeteoinformationen, true)}, def: uZAMGMitMeteoinformationen,on: function(obj) {uZAMGMitMeteoinformationen = obj.state.val; setState(obj.id,obj.state.val,true);}},
    8: {id: 'basiskonfiguration.filter.level_minimum', typ:'number', setObj: async function (){setStateAsync(configObj.path + configObj[8].id, minlevel, true)}, def: minlevel,on: function(obj) {minlevel = obj.state.val; setState(obj.id,obj.state.val,true);}},
    9: {id: 'basiskonfiguration.filter.level_hervorheben', typ:'number', setObj: async function (){setStateAsync(configObj.path + configObj[9].id, attentionWarningLevel, true)}, def: attentionWarningLevel,on: function(obj) {attentionWarningLevel = obj.state.val; setState(obj.id,obj.state.val,true);}},
    10: {id: 'basiskonfiguration.filter.mindest_höhe', typ:'number', setObj: async function (){setStateAsync(configObj.path + configObj[10].id, minhoehe, true)}, def: minhoehe,on: function(obj) {minhoehe = obj.state.val; setState(obj.id,obj.state.val,true);}},
    11: {id: 'basiskonfiguration.filter.maximale_höhe', typ:'number', setObj: async function (){setStateAsync(configObj.path + configObj[11].id, maxhoehe, true)}, def: maxhoehe,on: function(obj) {maxhoehe = obj.state.val; setState(obj.id,obj.state.val,true);}},
    12: {id: 'basiskonfiguration.log.erweitert', typ:'boolean', setObj: async function (){setStateAsync(configObj.path + configObj[12].id, !!(uLogLevel & 2), true)}, def: !!(uLogLevel & 2),on: function(obj) {uLogLevel = switchFlags(uLogLevel,2,obj.state.val); setState(obj.id,!!(uLogLevel & 2),true);}},
    13: {id: 'basiskonfiguration.log.debug', typ:'boolean', setObj: async function (){setStateAsync(configObj.path + configObj[13].id, !!(uLogLevel & 4), true)}, def: !!(uLogLevel & 4),on: function(obj) {uLogLevel = switchFlags(uLogLevel,4,obj.state.val); setState(obj.id,!!(uLogLevel & 4),true);}},
    14: {id: 'basiskonfiguration.log.ausgabe', typ:'boolean', setObj: async function (){setStateAsync(configObj.path + configObj[14].id, !!(uLogLevel & 1), true)}, def: !!(uLogLevel & 1),on: function(obj) {uLogLevel = switchFlags(uLogLevel,1,obj.state.val); setState(obj.id,!!(uLogLevel & 1),true);}},
    15: {id: 'basiskonfiguration.senden_bei_start', name:'Sende Nachrichten beim Script start', typ:'boolean', setObj: async function (){setStateAsync(configObj.path + configObj[15].id, !sendNoMessgesOnInit, true)}, def: !sendNoMessgesOnInit,on: function(obj) {sendNoMessgesOnInit = !obj.state.val; setState(obj.id,obj.state.val,true);}},
    16: {id: 'basiskonfiguration.auto-nachrichtenlänge.erzwinge_kurzform_text_html', typ:'boolean', setObj: async function (){setStateAsync(configObj.path + configObj[6].id, uTextHtmlMitOhneAlles, true)}, def: uTextHtmlMitOhneAlles,on: function(obj) {uTextHtmlMitOhneAlles = obj.state.val; setState(obj.id,obj.state.val,true);}},
    length: 17,
    path: mainStatePath + 'config.'
};

// hash erzeugen
String.prototype.hashCode = function() {
    let hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

ticaLog(1, 'Skripts gestartet: ID:' + randomID);

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
    if (dwdWarncellId) {
        enableInternDWD = false;
        enableInternDWD2 = true;
        if (Array.isArray(dwdWarncellId)){
            let b = 0;
            for(let a = 0; a < dwdWarncellId.length; a++) {
                b++
                if (!dwdWarncellId[a]) {
                    dwdWarncellId.splice(a--, 1)
                    ticaLog(0,' var dwdWarncellId:  Eintrag ' + b + ' ist leer, wird entfernt')
                } else {
                    warncells[DWD].push({id:dwdWarncellId[a],text:'', area:''})
                }
            }
        } else warncells[DWD].push({id:dwdWarncellId, text:''});
    }

   if (zamgCoordinates) {
        if (Array.isArray(zamgCoordinates)){
            for(let a = 0; a < zamgCoordinates.length; a++) {
                zamgCoordinates[a].text = '';
                let id = zamgCoordinates[a].breiten + '/' + zamgCoordinates[a].laengen;
                id = id.replace(/\./g,'#');
                zamgCoordinates[a].id = id;
                warncells[ZAMG].push(zamgCoordinates[a]);
            }
        }
    }

    if (ninaCoordinates) {
        if (Array.isArray(ninaCoordinates)){
            for(let a = 0; a < ninaCoordinates.length; a++) {
                let id = ninaCoordinates[a].breiten + '/' + ninaCoordinates[a].laengen;
                id = id.replace(/\./g,'#');
                ninaCoordinates[a].id = id;
                warncells[NINA].push(ninaCoordinates[a]);
            }
        }
    }

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

    //testValueDWD2();


    if (!Array.isArray(regionName[0])) {
        regionName = [regionName];
    }
    let b = 0;
    for (let a = 0; a < regionName.length; a++) {
        b++;
        if (Array.isArray(regionName) && regionName[a].length != 0) {
            if (regionName[a].length != 2) {
                ticaLog(0,'Konfiguration enthält Fehler. var regionName - Eintrag: ' + (b) + ' hat keine 2 Werte [\'UWZxxxxxxx\',\'name\']', 'error');
                stopScript(scriptName);
            } else {
                if (!regionName[a][0] || !regionName[a][1]) {
                    regionName.splice(a--, 1)
                    ticaLog(0,' var regionName:  Eintrag ' + b + ' ist teilweise oder ganz leer, wird entfernt')
                }
                else {
                    testValueTypeLog(regionName[a][0], 'regionName Wert: ' + (b) + '.01', 'string', true);
                    testValueTypeLog(regionName[a][1], 'regionName Wert: ' + (b) + '.02', 'string');
                }
            }
        } else {
            regionName.splice(a--, 1)
        }
    }
    if (regionName.length > 0 ) {
        enableInternUWZ = true;
        if (Array.isArray(regionName)){
            for(let a = 0; a < regionName.length; a++) warncells[UWZ].push({id:regionName[a][0],text:regionName[a][1], area:''})
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
            ticaLog(0,'Keine Alexa / Echoseriennummer eingetragen. Überpüfen!', 'error');
            stopScript(scriptName);
        }
        for (let a = 0; a < idAlexaSerial.length; a++) {
            if (!extendedExists(replacePlaceholder(idAlexa, idAlexaSerial[a]))) {
                ticaLog(0,'Alexa - Serial ' + idAlexaSerial[a] + ' ist fehlerhaft. Überpüfen! Object ID:' + replacePlaceholder(idAlexa, idAlexaSerial[a]), 'error');
                stopScript(scriptName);
            }
            idAlexaLastState[a] = {}
        }
    }

    if ((uPushdienst & SAYIT) != 0) {
        testValueTypeLog(idSayIt, 'idSayIt', 'array');
        for (let a = 0; a < idSayIt.length; a++) {
            if (
                !extendedExists(idSayIt[a])
            ) {
                ticaLog(0,'SayIt - Konfiguration ist fehlerhaft. Überpüfen!', 'error');
                stopScript(scriptName);
            }
        }
    }
    if ((uPushdienst & EMAIL) != 0) {
        if (senderEmailID.length > 1) {
            ticaLog(0,'eMail - Konfiguration ist fehlerhaft. Nur 1 Eintrag in senderEmailID erlaubt!', 'error');
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
        ticaLog(0,errorLog, 'error');
        stopScript(scriptName);
    }
    if (typ == 'array') {
        if (!test || !Array.isArray(test)) {
            let errorLog = 'Konfiguration enthält Fehler. Der / Ein Wert von var ' + teststring + ' ist kein Array. Es fehlen wohl die umschließenden []!';
            ticaLog(0,errorLog, 'error');
            stopScript(scriptName);
        }
    } else if (typeof test !== typ) {
        let errorLog = 'Konfiguration enthält Fehler. Ändere ' + teststring + ' = [';
        if (typ == 'string') {
            errorLog += test + '];//(' + typeof test + ') in ' + teststring + ' = [\'' + test + '\'];//(' + typ + ')';
        } else {
            errorLog += '\'' + test + '\'];//(' + typeof test + ') in ' + teststring + ' = [' + test + '];//(' + typ + ')';
        }
        ticaLog(0,errorLog, 'error');
        stopScript(scriptName);
    }
    if (need && !test) {
        ticaLog(0,'Konfiguration enthält Fehler. Der Wert von var ' + teststring + ' wird benötigt, ist jedoch nicht konfiguriert!', 'error');
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
        ticaLog(2, 'MODE wurde geändert. MODE: ' + MODE + ' firstRun:' + firstRun);
        if ( MODE == 0 ) ticaLog(0,'Alle Benachrichtigungen ausgeschaltet, bitte unter ioBroker - Objektansicht - '+ mainStatePath + '.config - UWZ und/oder DWD und/oder NINA auf true stellen.', 'warn');
        await InitDatabase(sendNoMessgesOnInit);
        dataSubscribe();
        if (!firstRun) { // überspringe das beim Starten des Scripts
            for (let a = 0; a < konstanten.length; a++) {
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
        if (autoSendWarnings && (!sendNoMessgesOnInit)) {
            checkWarningsMain()
        }
        firstRun = false;
        sendNoMessgesOnInit = false;
    }
    setConfigModeStates(modeFromState);
}

async function init() { // erster fund von create custom
    onStopped = false
    ticaLog(0, 'Starte Initialisierung! - Bitte warten. Das dauert beim ersten Start etwas länger. - Das Skript in dieser Phase nicht Neustarten, wenn doch bitte Javascript Instanz ebenfalls neustarten')
    ticaLog(0, 'Datenpunkte werden überprüft')
    try {

        // State der Pushnachrichten über pushover / telegram spiegelt
        if (!await existsStateAsync(mirrorMessageState)) {
            createStateAsync(mirrorMessageState, { read: true, write: false, desc: "State der für jede Warnung neu geschrieben wird", type: "string", def:'' });
        }
        if (!await existsStateAsync(mirrorMessageStateFull)) {
            createStateAsync(mirrorMessageStateFull, { read: true, write: false, desc: "State der alle aktuellen Warnungen enthält", type: "string", def:'' });
        }
        if (!await existsStateAsync(mirrorMessageStateHtml)) {
            await createStateAsync(mirrorMessageStateHtml,  { read: true, write: false, desc: "State mit dem selben Inhalt wie die Email", type: "string", def:'' });
        }
        if (!await existsStateAsync(totalWarningCountState)) {
            await createStateAsync(totalWarningCountState,  { read: true, write: false, desc: "Anzahl der aktiven Warnung nach Filter", type: "number", def:0});
        }
    }
    catch(error) {
            ticaLog(0,'Fehler in CreateStates #1');
            ticaLog(0,error);
            stopScript();
    }
    // erstelle Datenpunkte für DWD/UWZ standalone
    for (let c = 0; c < MODES.length; c++) {
        if (onStopped) return;
        let warncellid = mainStatePath + 'config.basiskonfiguration.warnzelle.' + MODES[c].text.toLowerCase() ;
        try {
            let app = [];
            switch(MODES[c].mode) {
                case DWD: {
                    app[0] = '.add#';
                    break;
                }
                case UWZ: {
                    app[0] = '.addName#';
                    app[1] = '.addId#';
                    break;
                }
                case ZAMG: {
                    app[0] = '.addLat#';
                    app[1] = '.addLong#';
                    break;
                }
                case NINA: {
                    app[0] = '.addLat#';
                    app[1] = '.addLong#';
                    app[2] = '.addName#';
                    break;
                }
                default:
                continue;
            }
            for (let x = 0; x<app.length;x++) {
                await createStateCustomAsync(warncellid + app[x], '', {name: "Füge ein Warncelle ein",type: "string",read: true,write: true},);
                on ({id: warncellid + app[x], ack:false}, addWarncell);
            }
            await createStateCustomAsync(warncellid + '.refresh#',false ,{name: "Starte das Skript neu",type: "boolean", role: "button", read: true,write: true},);
            setTimeout( function(warncellid) {
                on({id: warncellid + '.refresh#', change:'any', ack:false}, function(obj) {startScript();});
            }, 20000, warncellid);
        } catch(error) {
            ticaLog(0,'Fehler in CreateStates #2');
            ticaLog(0,error);
            stopScript();
        }
        let mode = MODES[c].mode;
        if (warncells[mode].length > 0) {
            for (let a = 0; a < warncells[mode].length; a++) {
                await addWarncell(warncells[mode][a].id, c);
            }
        }
        let st = $('state(state.id='+mainStatePath +'config.basiskonfiguration.warnzelle.' + MODES[c].text.toLowerCase()+'.*)');
        for (let a = 0; a < st.length; a++) {
            let val = getEndfromID(st[a]);
            if (val == 'add#' || val == 'refresh#' || val == 'addName#' || val == 'addId#' || val == 'addLat#' || val == 'addLong#') continue;
            let wIndex = warncells[mode].findIndex(w => val == w.id);
            if (wIndex == -1 && getState(st[a]).val) await addWarncell(val, c);
            else if (wIndex > -1 && getState(st[a]).val == '') warncells[mode].splice(wIndex, 1);
        }
        on(new RegExp(getRegEx(mainStatePath +'config.basiskonfiguration.warnzelle.', '^')+'.*'), function(obj) {
            let val = getEndfromID(obj.id);
            if (val == 'add#' || val == 'refresh#' || val == 'addName#' || val == 'addId#' || val == 'addLat#' || val == 'addLong#') return;
            setState(obj.id, obj.state.val, true);
            let modetext = getPreEndfromID(obj.id);
            let c = MODES.findIndex((a) => a.text.toLowerCase() == modetext);
            let mode = MODES[c].mode;
            let wIndex = warncells[mode].findIndex(w => val == w.id);
            if (wIndex == -1 && obj.state.val) addWarncell(val, c);
            else if (wIndex > -1 && obj.state.val == '') warncells[mode].splice(wIndex, 1);
        });
    }

        for (let w = 0; w < warncells[DWD].length; w++) {
            for (let i = 0; i < numOfWarnings; i++) {
                let p = internalDWDPath + warncells[DWD][w].id + internalWarningEnd + (i == 0 ? '' : i) + '.';
                for (let a = 0; a < statesDWDintern.length; a++) {
                    if (onStopped) return;
                    let dp = statesDWDintern[a];
                    let id = p + dp.id;
                    try {
                        await createStateCustomAsync(id, dp.default,dp.options);
                    }
                    catch (e) {
                        ticaLog(0,'error in .data.dwd create ' + e, 'error');
                    }
                }
            }
        }
        for (let w = 0; w < warncells[UWZ].length; w++) {
            for (let i = 0; i < numOfWarnings; i++) {
                let p = internalUWZPath + warncells[UWZ][w].id + internalWarningEnd + (i == 0 ? '' : i) + '.';
                for (let a = 0; a < statesUWZintern.length; a++) {
                    let dp = statesUWZintern[a];
                    let id = p + dp.id;
                    try {
                        await createStateCustomAsync(id, dp.default,dp.options);
                    }
                    catch (e) {
                        ticaLog(0,'error in .data.uwz create ' + e, 'error');
                    }
                }
            }
        }
        for (let w = 0; w < warncells[NINA].length; w++) {
            for (let i = 0; i < numOfWarnings; i++) {
                let p = internalMowasPath + warncells[NINA][w].id + internalWarningEnd + (i == 0 ? '' : i) + '.';
                for (let a in statesNINAintern) {
                    if (onStopped) return;
                    let dp = statesNINAintern[a];
                    let id = p + dp.id;
                    try {
                        await createStateCustomAsync(id, dp.default,dp.options);
                    }
                    catch (e) {
                        ticaLog(0,'error in .data.nina create ' + e, 'error');
                    }
                }
            }
        }

    try {
        // MODE änderung über Datenpunkte string
        await createStateCustomAsync(configModeState, '', { read: true, write: true, desc: "Modusauswahl DWD, UWZ, Nina oder Zamg", type: "string"});

        on({ id: configModeState, change: 'ne', ack: false }, function(obj) {
            if (obj.state.val && typeof obj.state.val === 'string' &&
                (obj.state.val.toUpperCase().includes('DWD') || obj.state.val.toUpperCase().includes('UWZ') || obj.state.val.toUpperCase().includes('NINA') || obj.state.val.toUpperCase().includes('ZAMG'))) {
                //setState(configModeState, MODE, true)
                let mode = 0;
                if (firstRun) return;
                for (let a = 0; a < MODES.length; a++) mode |= obj.state.val.toUpperCase().includes(MODES[a].text) ? MODES[a].mode : 0;
                if (MODE != mode) {
                    ticaLog(4, 'Modus wird geändert von: ' + mode + ' String:' + obj.state.val);
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
                await createStateCustomAsync(id, mi, { read: true, write: true, desc: "Aktivere " + tok.toUpperCase() + '.', type: "boolean" });
            }
            on({ id: id, change: 'ne', ack: false }, function(obj) {
                let arr = obj.id.split('.');
                let tok = arr[arr.length - 1].toUpperCase();
                let mode = MODES[MODES.findIndex(function(j) { return j.text == tok })].mode;
                let oldMode = MODE;
                oldMode = switchFlags(oldMode, mode, obj.state.val);
                ticaLog(4, 'Modus wird geändert von: ' + MODE);
                changeMode(oldMode);
            });
            MODE = switchFlags(MODE, MODES[a].mode, getState(id).val);

        }
        // Automodus ein und ausschalten
        let id = mainStatePath + 'config.auto.on';
        await createStateCustomAsync(id, true, { read: true, write: true, desc: "Aktivere automatischen Push bei eintreffen der Warnungen.", type: "boolean" });

        autoSendWarnings = getState(id).val;
        await setStateAsync(id, !!(autoSendWarnings), true);

        for (let a = 0; a < configObj.length; a++) {
            if (onStopped) return;
            let p = mainStatePath + 'config.' + configObj[a].id
            if (!await existsStateAsync(p)) {
                let n = configObj[a].name !== undefined ? configObj[a].name : configObj[a].id;
                let def = configObj[a].def;
                await createStateAsync(p, {read:true, write:true, def: def, type:configObj[a].typ, name:n});
            }
            if (scriptOverrides) {
                await configObj[a].setObj();
            } else {
                const v = await getStateAsync(p);
                configObj[a].on({id:p, state:{val:v.val}});
            }
            on(p, configObj[a].on);
        }
        // Nachrichtenversand per Click States/ config. und auto . erzeugen und subscript
        for (let a = 0; a < konstanten.length; a++) {
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
                if (!await existsStateAsync(mainStatePath + 'commands.' + konstanten[a].name + '_veryshort')) {
                    await createStateAsync(mainStatePath + 'commands.' + konstanten[a].name + '_veryshort', { read: true, write: true, desc: "Gebe sehr kurze Warnungen auf dieser Schiene aus", type: "boolean", role: "button", def: false });
                }
                for (let x = 0; x < MODES.length; x++) {
                    let oid = mainStatePath + 'config.auto.' + MODES[x].text.toLowerCase() + '.' + konstanten[a].name;
                    await createStateCustomAsync(oid, true, { read: true, write: true, desc: "Schalte Autopushmöglichkeiten ein / aus", type: "boolean" });
                    setConfigKonstanten(oid, getState(oid).val, true);

                    oid = mainStatePath + 'config.manuell.' + MODES[x].text.toLowerCase() + '.' + konstanten[a].name;
                    await createStateCustomAsync(oid, true, { read: true, write: true, desc: "Schalte Manuellepushmöglichkeiten ein / aus", type: "boolean" });
                    setConfigKonstanten(oid, getState(oid).val, false);
                    // letzer fund von Create Custom
                }
            }
        }
        ticaLog(0, 'Abonniere Konfigurationsdatenpunkte')
        subscribeStates();
        setWeekend();
        activateSchedule();
        ticaLog(0, 'Setzte Modus, Inialisiere Datenbank, starte Datenabruf(asynchron)')
        if (firstRun) changeMode(MODE)
        ticaLog(0, 'Initialisierung abgeschlossen')
    } catch(error) {
        ticaLog(0,'Fehler in CreateStates #5');
        ticaLog(0,error);
        stopScript();
    }
}

// setzte alle MODE Datenpunkte
function setConfigModeStates(mode) {
    let m = (mode & DWD ? 'DWD' : '') + (mode & UWZ ?  mode & DWD ? '/UWZ' : 'UWZ' : '') + (mode & NINA ? mode & (DWD|UWZ) ? '/NINA' : 'NINA' : '') + (mode & ZAMG ? mode & (DWD|UWZ|NINA) ? '/ZAMG' : 'ZAMG' : '')
    if (extendedExists(configModeState)) setState(configModeState, m , true);
    for (let a = 0; a < MODES.length; a++) {
        let t = MODES[a].text.toLowerCase();
        let id = mainStatePath + 'config.' + t;
        if (extendedExists(id)) setState(id, !!(mode & MODES[a].mode), true);
    }
}


function subscribeStates() {// on() für alles unter config.auto
    subscribe({ id: new RegExp(getRegEx(mainStatePath + 'config.auto', '^') + '.*'), ack: false }, function(obj) {
        if (obj.state.val == obj.oldState.val) {
            setState(obj.id, obj.state.val, true);
            return;
        }
        if (obj.id == mainStatePath + 'config.auto.on') {
            ticaLog(4, 'Auto trigger: ' + obj.id + ' Value:' + obj.state.val);
            autoSendWarnings = !!obj.state.val;
            setState(obj.id, autoSendWarnings, true);
            for (let a = 0; a < konstanten.length; a++) {
                for (let x = 0; x < MODES.length; x++) {
                    let oid = mainStatePath + 'config.auto.' + MODES[x].text.toLowerCase() + '.' + konstanten[a].name;
                    if (extendedExists(oid)) {
                        setState(oid, obj.state.val);
                    }
                }
            }
        } else {
            ticaLog(4, 'else auto trigger: ' + obj.id + ' Value:' + obj.state.val);
            setConfigKonstanten(obj.id, obj.state.val, true);
        }
    });
    // on() für alles unter config.manuell
    subscribe({ id: new RegExp(getRegEx(mainStatePath + 'config.manuell', '^') + '.*'), ack: false }, function(obj) {
        if (obj.state.val == obj.oldState.val) {
            setState(obj.id, obj.state.val, true);
            return;
        }
        ticaLog(4, 'Manuell trigger: ' + obj.id + ' Value:' + obj.state.val);
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
                    d = konstanten.findIndex(function(c) { return (c.name + '_veryshort' === b[b.length - 1]); });
                    msgLength = 3;
                    if (d == -1) {
                        return
                    }
                }
            }
        }
        let oldA = uTextMitAnweisungen, oldB = uTextMitBeschreibung,
            oldC = uSpracheMitAnweisungen, oldD = uSpracheMitBeschreibung,
            oldE = uHtmlMitAnweisungen, oldF = uHtmlMitBeschreibung,
            oldG = uSpracheMitOhneAlles, oldH = uTextHtmlMitOhneAlles
        if (msgLength != 0 ) {
            uTextMitAnweisungen         = msgLength == 2;
            uTextMitBeschreibung        = msgLength == 2;
            uSpracheMitAnweisungen      = msgLength == 2;
            uSpracheMitBeschreibung     = msgLength == 2;
            uHtmlMitAnweisungen         = msgLength == 2;
            uHtmlMitBeschreibung        = msgLength == 2;
            uTextHtmlMitOhneAlles       = msgLength == 3;
            uSpracheMitOhneAlles        = msgLength == 3;
        }
        warnDatabase.old = [];
        let oPd = uPushdienst;
        uPushdienst &= konstanten[d].value;
        forceSpeak = forcedSpeak;
        onClickCheckRun = true;
        onClickCheckRunCmd = obj.id;
        if ((uPushdienst & SPEAK) != 0 && uManuellClickClearSpeakMessageList) _speakToArray = [{ speakEndtime: new Date() }];
        ticaLog(1, 'Sendwarnings manuell uPushdienst: '  +uPushdienst)
        checkWarningsMain(true);

        uTextMitAnweisungen     = oldA;
        uTextMitBeschreibung    = oldB;
        uSpracheMitAnweisungen  = oldC;
        uSpracheMitBeschreibung = oldD;
        uHtmlMitAnweisungen     = oldE;
        uHtmlMitBeschreibung    = oldF;
        uSpracheMitOhneAlles    = oldG
        uTextHtmlMitOhneAlles   = oldH

        onClickCheckRun = false;
        onClickCheckRunCmd = '';
        forceSpeak = false;
        uPushdienst = oPd;
    });
}
// Hilfsfunktion zu on()
function setConfigKonstanten(id, val, auto) {
    try {
        let b = id.split('.');
        let m1 = b[b.length - 2];
        let m = MODES.findIndex(function(c) { return (c.text.toLocaleLowerCase() == m1); });
        if (m == -1) return;
        m = MODES[m].mode;
        let d = konstanten.findIndex(function(c) { return (c.name === b[b.length - 1]); });
        if (d == -1) return;
        let value = konstanten[d].value
        let tp = 0;
        let typ = auto ? 'auto' : 'man';
        if (MODE & m) {
            nPushdienst[typ][m] = switchFlags(nPushdienst[typ][m], value, val);
            setState(id, val, true);
        }
    }
    catch(e) {
        ticaLog(0,'Fehler in setConfigKonstanten() ' + e)
    }
}

// setzte die Alert States auf die höchste aktuelle Warnstufe
async function setAlertState(go = false) {
    if (setAlertStateTimeout) clearTimeout(setAlertStateTimeout)
    if ( !go ) {
        setAlertStateTimeout = setTimeout(function(){setAlertState(true)},15000);
        return;
    }
    if (++setAlertStateCount > 1) { // lasse keine mehrfach Aufrufe zu
        setAlertStateCount = 2;
        return;
    }
    let mode = [MODES[0], MODES[1], MODES[3]];
    let sA = mainStatePath + 'alert.';
    let tempExistIds = [];
    for (let a = 0; a < mode.length; a++) {

        if (!(MODE & mode[a].mode)) continue;
        let stateAlertid = sA + mode[a].text.toLowerCase() + '.';
        for (let wcIndex = 0; wcIndex < warncells[mode[a].mode].length; wcIndex++) {
            let area = warncells[mode[a].mode][wcIndex].area;
            if (area === undefined) continue;
            let stateAlertIdArea = stateAlertid + area.split(' ').join('_') + '.'
            for (let b = 0; b < warningTypesString[mode[a].mode].length; b++) {
                let stateAlertIdFull = stateAlertIdArea + warningTypesString[mode[a].mode][b][0] + '.';
                let AlertLevel = -1, AlertIndex = -1;
                for (let c = 0; c < warnDatabase.new.length; c++) {
                    let entry = warnDatabase.new[c];
                    let typ = entry.type
                    if (entry.hasOwnProperty('ec_ii_type') 
                        && specialWarningTypesString.hasOwnProperty(entry.ec_ii_type) 
                        && specialWarningTypesString[entry.ec_ii_type][b] === true) 
                    {
                        typ = b
                        log('wer ist das:' + b + ' area:' + entry.area)
                    }
                    if (entry.mode == mode[a].mode && typ == b && entry.level > AlertLevel && entry.area == area && !entry.ignored) {
                        AlertLevel = warnDatabase.new[c].level;
                        AlertIndex = c;
                    }
                }

                tempExistIds.push(stateAlertIdFull);
                if (!await existsStateAsync(stateAlertIdFull + stateAlert[0].name) || getState(stateAlertIdFull + stateAlert[0].name).val != AlertLevel ||
                    (AlertIndex > -1 && (!await existsStateAsync(stateAlertIdFull + stateAlert[9].name) || getState(stateAlertIdFull + stateAlert[9].name).val != warnDatabase.new[AlertIndex].hash))) {
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

                    let ci = 0
                    try {
                        let data = []
                        data[0] = AlertLevel;
                        data[1] = b;
                        data[2] = (AlertIndex > -1 ? new Date(warnDatabase.new[AlertIndex].start).getTime() : 0)
                        data[3] = (AlertIndex > -1 ? new Date(warnDatabase.new[AlertIndex].end).getTime() : 0)
                        data[4] = (AlertIndex > -1 ? cwarn : false);
                        data[5] = (AlertIndex > -1 ? warnDatabase.new[AlertIndex].headline : '')
                        data[6] = (AlertIndex > -1 ? warnDatabase.new[AlertIndex].description : '')
                        data[7] = (AlertIndex > -1 ? warnDatabase.new[AlertIndex].color : '')
                        data[8] = (AlertIndex > -1 ? warnDatabase.new[AlertIndex].picture : '')
                        data[9] = (AlertIndex > -1 ? warnDatabase.new[AlertIndex].hash : 0)
                        data[10] = (AlertIndex > -1 ? (warnDatabase.new[AlertIndex].ec_ii_type !== undefined ? warnDatabase.new[AlertIndex].ec_ii_type : -1) : -1)
                        for (let index=0; index < data.length; index++) {
                            if (onStopped) return;
                            if (await extendedExistsAsync(stateAlertIdFull + stateAlert[index].name)) await setStateAsync(stateAlertIdFull + stateAlert[index].name, data[index], true)
                            else {
                                try {
                                    await createStateCustomAsync(stateAlertIdFull + stateAlert[index].name, data[index], stateAlert[index].type);
                                } catch(error) {
                                    ticaLog(0,'Fehler in setAlertState #2 id:' + stateAlertIdFull + stateAlert[index].name);
                                    ticaLog(0,error);
                                    stopScript();
                                    return;
                                }
                            }
                        }
                    } catch(error) {
                        ticaLog(0,'Fehler in setAlertState #3 id:' + stateAlertIdFull + stateAlert[ci].name + ' Index:' + ci, 'error');
                        ticaLog(0,error);
                        stopScript();
                        return;
                    }
                }
            }
        }
    }
    let tempDelIds = $('state(state.id='+sA+'*)')
    for (let i=0;i<tempDelIds.length;i++) {
        if (onStopped) return;
        let t = tempExistIds.findIndex((a) => {
            if (tempDelIds[i].includes(a)) return true;
        })
        try {
            if (t == -1 && await existsStateAsync(tempDelIds[i])) await deleteStateAsync(tempDelIds[i]);
        } catch (e) {
            ticaLog(0, 'Fehler setAlertState(): id' + tempDelIds[i], 'error')
        }
    }
    ticaLog(4, 'Alert States wurden gesetzt');
    if (setAlertStateCount > 1) { // rufe sich selbst auf, wenn während der Verarbeitung ein weiterer Aufruf stattfand
        setAlertStateCount = 0
        setAlertState();
    } else setAlertStateCount = 0
}

function timeIsBetween(fTime,start,ende) {//Dateobjekt,hh:mm,hh:mm
    let eTime = new Date(), sTime = new Date();
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
    if (onClickCheckRun) return getManuellPushMode(mode, 'man');
    else return getManuellPushMode(mode, 'auto');
}

function getManuellPushMode(mode, typ) {
    if (!onClickCheckRun) typ = 'auto';
    if (typ === undefined) typ = 'man';
    if (mode !== undefined) {
        let result;
        for (let a=0; a<MODES.length;a++) {
            if (!(mode & MODES[a].mode) || MODES[a].mode == DWD2) continue;
            result = switchFlags(mode, MODES[a].mode, !!(uPushdienst & nPushdienst[typ][MODES[a].mode]))
        }
        return result;
    }
    ticaLog(4, 'getManuellPushMode() mode unbekannt!', 'error');
    return 0;
}

function getAutoPushFlags(mode) {
    if (onClickCheckRun) return getManuellPushFlags(mode, 'man');
    else return getManuellPushFlags(mode, 'auto');
}

function getManuellPushFlags(mode, typ) {
    if (!onClickCheckRun) typ = 'auto';
    if (typ === undefined) typ = 'man';
    if (mode !== undefined) {
        let m = 0;
        for (let a=0; a<MODES.length;a++) {
            if (!(mode & MODES[a].mode) || MODES[a].mode == DWD2) continue;
            m |= uPushdienst & nPushdienst[typ][MODES[a].mode]
        }
        return m;
    }
    ticaLog(4, 'getManuellPushFlags() mode unbekannt!', 'error');
    return 0;
}

// b: true - g add f / false - g remove f
function switchFlags(g, f, b) {
    if (b) g |= f;
    else g &= ~f;
    return g;
}

/*function getModeState() {
    if (extendedExists(configModeState)) {
        let value = getState(configModeState).val;
        let mode = 0;
        mode |= value.toUpperCase().includes('DWD') ? DWD : 0;
        mode |= value.toUpperCase().includes('UWZ') ? UWZ : 0;
        mode |= value.toUpperCase().includes('NINA') ? NINA : 0;
        return mode;
    }
    return null;
}*/
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
        START = startTimeSpeakWeekend ? convertStringToDate(startTimeSpeakWeekend) : 0;
    } else {
        START = startTimeSpeak ? convertStringToDate(startTimeSpeak) : 0;
    }
    ENDE = endTimeSpeak ? convertStringToDate(endTimeSpeak) : 0;
}
// Hilsfunktion
function convertStringToDate(s) {
    if (typeof s !== 'string' ) return null;
    let e = s.split(':');
    if (!Array.isArray(e) || e.length != 2) return null;
    let d = new Date();
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
function checkWarningsMain(instant, hashForced) {
    if (instant === undefined || !instant) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(function() {checkWarningsMain(true)}, 20000)
        return;
    }
    ticaLog(4, 'start checkWarningsMain()')
    if (!forcedSpeak) forceSpeak = (!startTimeSpeakWeekend || !startTimeSpeak || !endTimeSpeak);
    setWeekend();
    let DebugMail = '';
    if (DEBUGSENDEMAIL) {
        for (let a = 0; a < warnDatabase.new.length; a++) DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.new' + a, JSON.stringify(warnDatabase.new[a]));
        for (let a = 0; a < warnDatabase.old.length; a++) DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.old' + a, JSON.stringify(warnDatabase.old[a]));
        DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.new.length', warnDatabase.new.length.toString(), null);
        DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.old.length', warnDatabase.old.length.toString(), null);
    }
    let ignoreWarningCount = 0;
    let ignoreWarningCountOld = 0;
    for (let a = 0; a < warnDatabase.new.length; a++) warnDatabase.new[a].ignored = false
    // Enferne neue Einträge die doppelt sind sortiert nach level und Höhe
    for (let a = 0; a < warnDatabase.new.length; a++) {
        let w = warnDatabase.new[a];
        for (let b = 0; b < warnDatabase.new.length; b++) {
            let w2 = warnDatabase.new[b];
            if (
                (w.mode | w2.mode) & NINA || w.ignored || w2.ignored ||
                w.mode !== w2.mode ||
                w.type !== w2.type ||
                w.wcID === w2.wcID ||
                w.level < w2.level ||
                a == b
            ) continue;
            if ( w2.start >= w.start &&
                w2.end <= w.end && !w2.favorit) {
                let test = w.messageHash == w2.messageHash ? 1 : ((w.areaGroup == w2.areaGroup && w.areaID != w2.areaID) ? 2 : 0)
                ticaLog(4, w.areaGroup +' == ' + w2.areaGroup + ' && ' + w.areaID + ' != ' + w2.areaID + ' = test:' + test)
                if (test != 0) {
                    w.useAreaGroup = true;
                    ticaLog(2, 'Nr 2: '+ (test == 1 ? 'gleicher Hash' : 'Favorit') + ' - Behalte Warnung mit Headline: ' + w.headline + ' Level: ' + w.level + ' Ort: ' + w.areaID+ ' Ignoriere: ' + w2.headline +' Level:' + w2.level + ' Ort: ' + w2.areaID );
                    w2.ignored = true;
                }
            }
            if (
                w2.start < w.start ||
                w2.end > w.end ||
                w.areaID != w2.areaID ||
                w2.favorit && w.favorit
            ) continue
            if (w.level > w2.level) {
                ticaLog(1, 'Nr 3 Behalte Warnung wegen Überschneidung und höherem Level mit Headline: ' + w.headline + ' Level:' + w.level + ' Ignoriere: ' + w2.headline +' Level:' + w2.level  );
                w2.ignored = true;
            } else if (w.altitudeEnd !== undefined && w2.altitudeEnd !== undefined && w.altitudeEnd > w2.altitudeEnd && w.level == w2.level) {
                if (w.altitudeStart !== undefined && w2.altitudeStart !== undefined && w.altitudeStart > w2.altitudeStart ) w.altitudeStart = w2.altitudeStart;
                w.repeatCounter = w2.rerepeatCounter
                ticaLog(1, 'Nr 4 (Level gleich - Höhen unterschiedlich) Behalte Warnung mit Headline:' + w.headline + ' Ignoriere:' + w2.headline);
                w2.ignored = true;
            }
        }
    }
    // Entferne Einträge die verlängert wurden in OldDB
    if (!onClickCheckRun) {
        for (let a = 0; a < warnDatabase.new.length; a++) {
            let w = warnDatabase.new[a];
            if (w.mode === NINA) continue
            if (getIndexOfHash(warnDatabase.old, w.hash) != -1) continue; // nur neue Einträge betrachten
            for (let b = 0; b < warnDatabase.old.length; b++) {
                let w2 = warnDatabase.old[b];
                if (
                    w.mode !== w2.mode || w.ignored || w2.ignored ||
                    w.type !== w2.type ||
                    w2.end > w.end  ||
                    w.level >= attentionWarningLevel ||
                    w2.level >= attentionWarningLevel ||
                    w.hash == w2.hash ||
                    w.areaID != w2.areaID ||
                    Math.abs(w2.end - w.end) > 43200000 // Verlängern ignorieren wenn 12 Stunden zwischen den Warnungen liegen.
                ) continue;
                if (w2.end >= w.start) {
                    if (w.repeatCounter > 30) {
                        ticaLog(1, 'Nr 5 reset repeatCounter... push message with headline: ' + w.headline);
                        w.repeatCounter = 0;
                    }
                    if (w2.level == w.level) {
                        w.repeatCounter += w2.repeatCounter + 1;
                        let i = getIndexOfHash(warnDatabase.new, w2.hash);
                        if (w.start > w2.start) w.start = w2.start
                        warnDatabase.old.splice(b--, 1);
                        ticaLog(1, 'Nr 5 Entferne Warnung zwecks Verlängerung mit Headline:' + w2.headline);
                        if (i != -1) {
                            warnDatabase.new.splice(a--, 1);
                            if (i <= a) --a;
                            break;
                        }
                    }
                }
            }
        }
    }
    for (let a = 0; a < warnDatabase.new.length; a++) {
        let w = warnDatabase.new[a];
        if (isWarnIgnored(w) || w.ignored) {
            ignoreWarningCount++
        }
    }
    for (let a = 0; a < warnDatabase.old.length; a++) {
        let w = warnDatabase.old[a];
        if (isWarnIgnored(w) || w.ignored) {
            ignoreWarningCountOld++
        }
    }

    warnDatabase.new.sort(function(a, b) {
        return a.level == b.level ? a.start - b.start : b.level - a.level;
    })
    let collectMode = 0;
    let emailHtmlWarn = '';
    let emailHtmlClear = '';
    let emailPlainEmail = '';
    let emailSend = onClickCheckRun;
    collectMode = 0;
    let debugdata = '';
    /* Bereich für 'Wetterwarnung gültig bis wurde aufgehoben' */
    ticaLog(4, 'Nr 6 Build messages');
    for (let i = 0; i < warnDatabase.old.length; i++) {
        let entry = warnDatabase.old[i];
        let headline = entry.headline;
        let hash = entry.hash;
        let area = entry.useAreaGroup !== undefined ? entry.areaGroup : entry.areaID;
        let mode = entry.mode;
        let picture = entry.picture ? entry.picture + SPACE : '';
        if (isWarnIgnored(entry) || entry.ignored) continue;
        if (DEBUGSENDEMAIL) debugdata += i + SPACE + mode + SPACE + hash + SPACE + getIndexOfHash(warnDatabase.new, hash) + SPACE + (getPushModeFlag(mode) & PUSH).toString(2) + '<br';
        if (headline && getIndexOfHash(warnDatabase.new, hash) == -1 && (warnDatabase.new.length > ignoreWarningCount)) {
            ticaLog(4, 'Old Msg with headline:' + headline + ' onClickCheckRun:' + onClickCheckRun +' hash:' +hash);
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
            if (getPushModeFlag(mode) & EMAIL) {
                emailHtmlClear += pushMsg + '<br>';
                emailSend = true;
            }
            // PUSH
            // Insgesamt x... anhängen
            pushMsg += getStringWarnCount(null, warnDatabase.new.length);
            if ( uTextHtmlMitOhneAlles && mode != NINA ) pushMsg = getShortVersion(entry, true);
            sendMessage(getPushModeFlag(mode) & PUSH, picture + (mode == NINA ? 'Entwarnung' : 'Wetterentwarnung') + SPACE + (i + 1), pushMsg);
            ticaLog(4, 'text old:' + pushMsg);
            // SPEAK
            pushMsg = headline + (!uSpracheMitOhneAlles ?  getArtikelMode(mode, true) + area + (end ? ' gültig bis ' + getFormatDateSpeak(end) + ' Uhr' : ''): '') + ' wurde aufgehoben' + '  .  ';
            if ( uSpracheMitOhneAlles && mode != NINA ) pushMsg = getShortVersion(entry, true) + ', ';
            if (forceSpeak || compareTime(START, ENDE, 'between')) {
                sendMessage(getPushModeFlag(mode) & SPEAK, '', pushMsg, entry);
            }
            ticaLog(4, 'Sprache old:' + pushMsg);
        }
    }
    if (DEBUGSENDEMAIL) DebugMail = buildHtmlEmail(DebugMail, 'Index Mode Hash Index-New Flags', debugdata, null);
    let gefahr = false;
    let count = 0;
    /* Bereich für 'Neue Amtliche Wetterwarnung' */
    for (let i = 0; i < warnDatabase.new.length; i++) {
        let entry = warnDatabase.new[i];

        if ( hashForced !== undefined && entry.hash != hashForced.hash) continue

        if (entry.repeatCounter > 1 && !onClickCheckRun) continue;
        let headline = entry.headline;
        let description = entry.description;
        let level = entry.level;
        let instruction = entry.instruction;
        let hash = entry.hash;
        let area = entry.useAreaGroup === true ? entry.areaGroup : entry.areaID;
        let color = entry.color;
        let mode = entry.mode;
        let meteo = entry.meteo || '';
        let picture = entry.picture ? entry.picture + SPACE : '';
        if (DEBUGSENDEMAIL) debugdata += i + SPACE + mode + SPACE + hash + SPACE + getIndexOfHash(warnDatabase.old, hash) + SPACE + (getPushModeFlag(mode)).toString(2) + SPACE + isWarnIgnored(entry) + '<br';
        ticaLog(4, 'New Msg with headline:' + headline + ' isWarnIgnored:' + isWarnIgnored(entry) + ' onClickCheckRun:' + onClickCheckRun +' hash:' + hash + ' level:' + level);
        if ((isWarnIgnored(entry) && !onClickCheckRun) || entry.ignored) continue;
        if (hash) {
            let isNewMessage = getIndexOfHash(warnDatabase.old, hash) == -1;
            let todoBitmask = uPushdienst;
            collectMode |= mode;
            count++;
            if (!gefahr) gefahr = level >= attentionWarningLevel;
            let isLong = (uHtmlMitBeschreibung && uHtmlMitAnweisungen && (!(mode & ZAMG ) || uZAMGMitMeteoinformationen)) && !uTextHtmlMitOhneAlles;
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
                let html = ''
                let he = '',
                    de = '';
                let prefix = isNewMessage && !onClickCheckRun ? 'Neu: ' : '';
                if (uTextHtmlMitOhneAlles) {
                    he = prefix + getShortVersion(entry);
                } else {
                    if (entry.html !== undefined) {
                        let html = entry.html;
                        if (html.headline) he = prefix + html.headline;
                        else he = prefix + headline;
                        if (uHtmlMitBeschreibung) {
                            if (html.description) de = html.description;
                            else if (entry.htmldesc) de = entry.htmldesc;
                            else de = description;
                            if (meteo && uZAMGMitMeteoinformationen) de += meteo ? '<br><br>Wetterinformation:<br>' + meteo.replace("/n", '<br>') : '';
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
                            if (meteo && uZAMGMitMeteoinformationen) de += meteo ? '<br><br>Wetterinformation:<br>' + meteo.replace("/n", '<br>') : '';
                            if (uHtmlMitAnweisungen && instruction && instruction.length > 2) {
                                de += '<br><br>Handlungsanweisungen:<br>' + instruction;
                            }
                        }
                    }
                    html = (bt ? sTime + '<br>' : '') + de;
                    html = html.length > 0 ? html[0].toUpperCase() + html.substring(1) : html;
                    he += getArtikelMode(mode) + area + ':';
                }
                if (entry.repeatCounter == 1 && !onClickCheckRun) he += ' wurde verlängert.';
                emailHtmlWarn = buildHtmlEmail(emailHtmlWarn, picture + he, html, color, false);
                if (entry.repeatCounter == 1 && !onClickCheckRun) html = he;
                else html = he + html;
                if (warnDatabase.new.length > 1) html += getStringWarnCount(count, warnDatabase.new.length);
                let b = getPushModeFlag(mode) & CANHTML & ~EMAIL & ~STATE_HTML;
                if (isNewMessage && getPushModeFlag(mode) & EMAIL){
                    emailSend = true;
                }
                sendMessage(b, picture + getTopic(mode, level, false, entry.urgency), html, entry, {isLong:isLong, isAnswer: hashForced && hashForced.isAnswer});
                todoBitmask &= ~b & ~EMAIL & ~STATE_HTML;
            }
            if (!isNewMessage) continue;
            // Plain text

            if ((getPushModeFlag(mode) & CANPLAIN & todoBitmask) != 0) {
                let pushMsg = '';
                if (uTextHtmlMitOhneAlles) {
                    pushMsg = getShortVersion(entry);
                    if (todoBitmask & (EMAIL | STATE_HTML)) emailHtmlWarn = buildHtmlEmail(emailHtmlWarn, pushMsg, '', color, false);
                    if (todoBitmask & (EMAIL | STATE_PLAIN)) emailPlainEmail += pushMsg + SPACE
                } else {
                    pushMsg = headline + getArtikelMode(mode) + area;
                    if (entry.repeatCounter == 1 && !onClickCheckRun) {
                        pushMsg += ' wurde verlängert.';
                    } else {
                        pushMsg += (bt ? NEWLINE + sTime : '');
                        if (uTextMitBeschreibung) {
                            pushMsg += NEWLINE + NEWLINE + description;
                            if (meteo && uZAMGMitMeteoinformationen) pushMsg += meteo ? NEWLINE + NEWLINE + 'Wetterinformation: ' + meteo : '';
                            if (uTextMitAnweisungen && !!instruction && typeof instruction === 'string' && instruction.length > 2) {
                                pushMsg += NEWLINE + 'Handlungsanweisungen:' + NEWLINE + instruction;
                            }
                        }
                    }
                    // Anzahl Meldungen erst am Ende zu email hinzufügen
                    if (todoBitmask & (EMAIL | STATE_HTML)) emailHtmlWarn = buildHtmlEmail(emailHtmlWarn, headline + getArtikelMode(mode) + area + ':', pushMsg, color, false);
                    if (todoBitmask & (EMAIL | STATE_PLAIN)) emailPlainEmail += pushMsg + SPACE
                    /* ab Level 4 zusätzlicher Hinweis */
                    if (warnDatabase.new.length > 1) pushMsg += getStringWarnCount(count, warnDatabase.new.length);
                }

                let b = getPushModeFlag(mode) & CANPLAIN & todoBitmask & PUSH;
                sendMessage(b, picture + getTopic(mode, level, false, entry.urgency) + SPACE + count, picture + pushMsg, entry, {isLong:isLong, isAnswer: hashForced && hashForced.isAnswer})
                ticaLog(4, 'text new:' + pushMsg);
                todoBitmask &= ~b;
            }
            // Sprache
            if ((getPushModeFlag(mode) & SPEAK) != 0) {
                let speakMsg = '';
                if ( !uSpracheMitOhneAlles || mode == NINA ) {
                    sTime = SPACE;
                    speakMsg = getTopic(mode, level, true, entry.urgency) + headline + getArtikelMode(mode, true) + area;
                    if (entry.repeatCounter == 1 && !onClickCheckRun) {
                        speakMsg += ' wurde verlängert.';
                    } else {
                        if (begin || end) sTime += "gültig ";
                        if (begin) sTime += "vom " + getFormatDateSpeak(begin) + " Uhr";
                        if ((begin && end)) sTime += " ";
                        if (end) sTime += "bis " + getFormatDateSpeak(end) + " Uhr";
                        speakMsg += SPACE + sTime + '.' + SPACE;
                        if (meteo && uZAMGMitMeteoinformationen) description += meteo ? SPACE + SPACE + 'Wetterinformation: ' + meteo : '';
                        if (uSpracheMitAnweisungen && !!instruction && typeof instruction === 'string' && instruction.length > 2) {
                            description += SPACE + SPACE + 'Handlungsanweisungen:' + NEWLINE + instruction;
                        }
                        description = replaceTokenForSpeak(description);
                        if (uMaxCharToSpeak === 0 || (speakMsg + description).length <= uMaxCharToSpeak) {
                            if (uSpracheMitBeschreibung) speakMsg += description;
                        } else speakMsg += ' Weiterführende Informationen sind vorhanden.';
                    }
                } else {
                    speakMsg = getShortVersion(entry) + ', ';
                }
                if (!entry.ignored && !isWarnIgnored(entry) && (forceSpeak || compareTime(START, ENDE, 'between')) && (getPushModeFlag(mode) & SPEAK) != 0) {
                    sendMessage(getPushModeFlag(mode) & SPEAK, '', speakMsg, entry);
                }
                ticaLog(4, 'Sprache new:' + speakMsg + ' isWarnIgnored():' + isWarnIgnored(entry)) + 'entry.ignored: ' +entry.ignored;
            }
        }
    }
    if (DEBUGSENDEMAIL) DebugMail = buildHtmlEmail(DebugMail, 'Index Mode Hash Index-old Flags ignored', debugdata, null);
    if ((getPushModeFlag(collectMode) & ALLMSG) != 0 && emailPlainEmail) {
        sendMessage(getPushModeFlag(collectMode) & STATE_PLAIN, (gefahr ? "Wichtige Warnungen" : "Warnungen") + getArtikelMode(collectMode) + "(iobroker)", emailPlainEmail);
    }
    if ((getPushModeFlag(collectMode) & ALLMSG) != 0 && (emailHtmlWarn + emailHtmlClear) && emailSend) {
        emailHtmlWarn = buildHtmlEmail(emailHtmlWarn, (emailHtmlClear ? 'Aufgehobene Warnungen' : null), emailHtmlClear, 'silver', false);
        emailHtmlWarn = buildHtmlEmail(emailHtmlWarn, null, getStringWarnCount(null, warnDatabase.new.length), null, true);
        sendMessage(getPushModeFlag(collectMode) & ALLMSG, (gefahr ? "Wichtige Warnungen" : "Warnungen") + getArtikelMode(collectMode) + "(iobroker)", emailHtmlWarn);
    }
    /* Bereich für 'Alle Wetterwarnungen wurden aufgehoben' */
    if (!emailHtmlWarn && warnDatabase.new.length == ignoreWarningCount && (warnDatabase.old.length > ignoreWarningCountOld || onClickCheckRun)) {
        //let notAllDone = onClickCheckRun
        for (let a = 0; a < warnDatabase.old.length; a++) {
            collectMode |= warnDatabase.old[a].mode;
            //if (getIndexOfHash(warnDatabase.new, warnDatabase.old[a].hash, true)) notAllDone = true;
        }

        let pushMsg = 'Alle Warnmeldungen' + getArtikelMode(collectMode) + 'wurden aufgehoben.' + getStringIgnoreCount(ignoreWarningCount);

        // Einen Mode ermitteln der aktiv ist und der das Versenden erlauben würde.
        if (!getPushModeFlag(collectMode)) collectMode = getPushModeFlag(switchFlags(ALLMODES, collectMode, false) & MODE, true);
        if (!getPushModeFlag(collectMode)) ticaLog(0,'Keine erlaubten Versandmöglichkeiten im ' + (onClickCheckRun ? 'manuellen Modus über ID: ' + onClickCheckRunCmd : 'Automatikmodus') + ' gefunden!', 'warn');

        /* Bereich für Sprachausgabe über SayIt & Alexa & Home24*/
        if (forceSpeak || compareTime(START, ENDE, 'between')) { // Ansage über Sayit nur im definierten Zeitbereich
            sendMessage(getPushModeFlag(collectMode) & SPEAK, '', pushMsg);
        }
        ticaLog(4, 'all all:' + pushMsg + ' PUSH' + (getPushModeFlag(collectMode) & PUSH).toString(3) + ' ALLMSG:' + (getPushModeFlag(collectMode) & ALLMSG).toString(3));

        let topic = ((collectMode & NINA || !collectMode) ? 'Entwarnungen' : 'Wetterentwarnung');
        sendMessage(getPushModeFlag(collectMode) & PUSH, topic, pushMsg, );
        sendMessage(getPushModeFlag(collectMode) & ALLMSG & CANHTML, '', buildHtmlEmail('', topic + getArtikelMode(collectMode) + '(iobroker)', pushMsg, 'silver', true));
        sendMessage(getPushModeFlag(collectMode) & ALLMSG & CANPLAIN, topic + getArtikelMode(collectMode) + "(iobroker)", pushMsg);
    }
    if (DEBUGSENDEMAIL) {
        let a;
        DebugMail = buildHtmlEmail(DebugMail, 'uPushdienst', 'Binär:' + uPushdienst.toString(2) + ' Decimal:' + uPushdienst.toString(), null);
        for (a = 0; a < warnDatabase.new.length; a++) DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.new' + a, JSON.stringify(warnDatabase.new[a]));
        for (a = 0; a < warnDatabase.old.length; a++) DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.old' + a, JSON.stringify(warnDatabase.old[a]));
        DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.new.length', warnDatabase.new.length.toString(), null);
        DebugMail = buildHtmlEmail(DebugMail, 'warnDatabase.old.length', warnDatabase.old.length.toString(), null, true);
        if (DEBUGSENDEMAIL) sendMessage(uPushdienst & EMAIL, 'Debug checkWarningsMain() ' + scriptName, DebugMail);
        //ticaLog(0,DebugMail);
    }
    /* Neue Werte sichern */
    ticaLog(4, 'done');
    setState(totalWarningCountState, warnDatabase.new.length - ignoreWarningCount, true);
    warnDatabase.old = cloneObj(warnDatabase.new);

    function getTopic(mode, level, s, urg) {
        if (s == undefined) s = false;
        let topic = mode === NINA ? 'Warnung' : 'Wetterwarnung';
        if (urg !== undefined && urg == 1) topic = mode === NINA ? 'Vorwarnung' : 'Wettervorwarnung'
        let result = '';
        result = (level >= attentionWarningLevel) ? 'Wichtige '+topic : s ? '' : topic;
        return result;
    }
    function getShortVersion(entry, removed) { // kurzform
        let speakMsg =''
        if (removed) speakMsg = entry.typename + 'warnung aufgehoben'
        else {
            speakMsg = getTopic(entry.mode, entry.level, false, entry.urgency)
            speakMsg +=' vor ' + entry.typename;
        }
        speakMsg +=', ' + (entry.useAreaGroup ? entry.areaID : entry.areaGroup)
        if (removed) speakMsg +='('
        else speakMsg +=', Stufe ';
        let color = '';
        switch (entry.level) {
            case 0:
            case 1:
            color = 'grün';
            break;
            case 2:
            color = 'gelb';
            break;
            case 3:
            color = 'orange';
            break;
            case 4:
            color = 'rot';
            speakMsg = 'Achtung! Achtung! Lebensgefahr! ' + speakMsg
            break;
            case 5:
            default:
            color = 'violet';
        }
        speakMsg += color;
        if (removed) return speakMsg + ')';
        let e = new Date(entry.start);
        let d = e.getDate() - new Date().getDate();
        let s = e.getHours();
        let pre = '';
        if (s < 5 || s >= 22) pre = 'nacht ';
        else if (s < 10)  pre = 'früh ';
        else if (s < 12)  pre = 'vormittag ';
        else if (s < 14)  pre = 'mittag ';
        else if (s < 18)  pre = 'nachmittag ';
        else if (s < 22)  pre = 'abend ';
        let day = ''
        switch (d) {
            case -2:
            day = ', seit vorgestern ';
            break;
            case -1:
            day = ', seit gestern ';
            break;
            case 0:
            day = ', ab heute ';
            break;
            case 1:
            day = ', ab morgen ';
            break;
            case 2:
            day = ', ab übermorgen ';
            break;
            case 3:
            case 4:
            case 5:
            day = ', in ' + d + ' Tagen ';
            pre = '';
            break;
            default:
            day = getFormatDateSpeak(getFormatDate(entry.start)) + " Uhr ";
            pre = '';
        }
        speakMsg += '' + day + pre
        return speakMsg;
    }
}
/* *************************************************************************
* Hauptfunktion zur Auswahl der Warnungen zum Versenden und Aufbereiten der
* Nachrichten ENDE
/* ************************************************************************* */
/* *************************************************************************
* Senden der Nachricht über die verschiedenen Möglichkeiten
/* ************************************************************************* */
//Versende die Warnungen über die Schienen
function sendMessage(pushdienst, topic, msg, entry = null, msgFull = null) {
    if ((pushdienst & TELEGRAM) != 0) {
        ticaLog(4, 'send Msg with Telegram');
        let edit = false;
        let nMsg = {text:''};
        if (entry) {
            if (msgFull && !msgFull.isLong && uTelegramReplyMarkupInline){
                nMsg.reply_markup = {
                inline_keyboard: [[{ text: 'mehr', callback_data: '#$WarnscriptLong%&' + String(entry.hash)}]]
                };
            } else if (msgFull && msgFull.isLong && uTelegramReplyMarkupInline){
                nMsg.reply_markup = {
                inline_keyboard: [[{ text: 'weniger', callback_data: '#$WarnscriptShort%&' + String(entry.hash)}]]
                };
            }

            if (entry.web && entry.webname) {
                if (nMsg.reply_markup !== undefined) nMsg.reply_markup.inline_keyboard.push = [{ text: entry.webname, url: entry.web }]
                else nMsg.reply_markup = { inline_keyboard: [[{ text: entry.webname, url: entry.web }]] };
            }
        }
        if (uTelegramReplyMarkupInline && msgFull && msgFull.isAnswer) {
            let options = {}
            edit = true
            let tempMsg = getState(telegramInstanz + '.communicate.request').val
            nMsg.user = tempMsg.substring(1, tempMsg.indexOf(']'));
            options.chat_id = getState(telegramInstanz + ".communicate.requestChatId").val
            options.message_id = getState(telegramInstanz + ".communicate.requestMessageId").val
            if (nMsg.reply_markup !== undefined) options.reply_markup = nMsg.reply_markup
            nMsg.editMessageText = {options}
            log('editMessageText: Text:' + msg + ' hash:' + (entry ? entry.hash : 'null') )
        }
        if (!uTelegramReplyMarkupInline) {
            if (nMsg.reply_markup === undefined) nMsg.reply_markup = {};
            nMsg.reply_markup.keyboard = uTelegramReplyMarkup.keyboard;
        }
        if (!uTelegramAllowNotification) nMsg.disable_notification = true;
        if (!(telegramUser.length > 0 || telegramChatId.length > 0) || uTelegramUseStdUser || edit) {
            _sendSplitMessage(TELEGRAM, msg.slice(), nMsg, function(msg, opt) {
                opt.text = msg;
                _sendTo(TELEGRAM, telegramInstanz, opt);
            });
        }
        if (telegramUser.length > 0 && !edit) {
            let nMsg2 = cloneObj(nMsg);
            nMsg2.user = telegramUser.join(',');
            _sendSplitMessage(TELEGRAM, msg.slice(), nMsg2, function(msg, opt) {
                opt.text = msg;
                _sendTo(TELEGRAM, telegramInstanz, opt);
            });
        }
        if (telegramChatId.length > 0 && !edit) {
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
        ticaLog(4, 'send Msg with Pushover');
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
        ticaLog(4, 'send Msg with Iogo');
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

    if ((pushdienst & STATE_PLAIN) != 0) {
        setState(mirrorMessageStateFull, msg, true);
    }

    if ((pushdienst & STATE_HTML) != 0) {
        setState(mirrorMessageStateHtml, msg, true);
    }
    if ((pushdienst & SPEAK) != 0) {
        ticaLog(4, 'send Msg with Speak');
        _speakTo(pushdienst & SPEAK, msg);
    }
    if ((pushdienst & EMAIL) != 0) {
        ticaLog(4, 'send Msg with Email');
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
        ticaLog(4, 'send Msg _sendTo dienst:' + dienst);
        if (deviceList[dienst].count == undefined) {
            sendTo(a, b);
            ticaLog(2,'Dienst: ' + a + ' Nachricht: ' + b)
        } else {
            setTimeout(function(dienst, a, b) {
                sendTo(a, b);
                ticaLog(2,'Dienst: ' + a + ' Nachricht: ' + b)
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
                    let nTime = new Date(new Date().getTime() + (deviceList[entry.dienst].delay * (entry.msg + _getMsgCountString(_speakToArray, entry.dienst)).length)+1900);
                    let value = nTime.getTime() - new Date(entry.endTimeSpeak).getTime();
                    for (let a = 1; a < _speakToArray.length; a++) {
                        if (entry.dienst == _speakToArray[a].dienst) {
                            _speakToArray[a].endTimeSpeak = new Date(_speakToArray[a].endTimeSpeak.getTime() + value);
                            if (a != 1 || value < 0) _speakToArray[a].startTimeSpeak = new Date(_speakToArray[a].startTimeSpeak.getTime() + value);
                        }
                    }
                    if (entry.dienst == HOMETWO) {
                        for (let a = 0; a < idMediaplayer.length; a++) {
                            let Url2 = "http://" + idMediaplayer[a] + "/track = 4fachgong.mp3|tts=" + entry.msg + _getMsgCountString(_speakToArray, entry.dienst);
                            ticaLog(4, 'Url2 :' + Url2);
                            axios.get(Url2)
                        }
                    } else if (entry.dienst == SAYIT) {
                        for (let a = 0; a < idSayIt.length; a++) {
                            setState(idSayIt[a], sayItVolumen[a] + ";" + entry.msg + _getMsgCountString(_speakToArray, entry.dienst));
                            ticaLog(2,'Dienst: ' + idSayIt[a] + ' Nachricht: ' + sayItVolumen[a] + ";" + entry.msg + _getMsgCountString(_speakToArray, entry.dienst))
                        }
                    } else if (entry.dienst == ALEXA) {
                        for (let a = 0; a < idAlexaSerial.length; a++) {
                            if (idAlexaLastState[a].ids === undefined) idAlexaLastState[a].ids = {}
                            // Wenn auf Gruppe, keine Lautstärkenregelung möglich
                            let textids = extendedExists(replacePlaceholder(idAlexaParents, idAlexaSerial[a])) ? getState(replacePlaceholder(idAlexaParents, idAlexaSerial[a])).val : null
                            let ids = null
                            if (textids) ids = textids.split(',')
                            if (extendedExists(replacePlaceholder(idAlexaState, idAlexaSerial[a]))
                                && getState(replacePlaceholder(idAlexaState, idAlexaSerial[a])).val) {
                                idAlexaLastState[a].play = true
                                setState(replacePlaceholder(idAlexaPause, idAlexaSerial[a]), true)
                            } else if (alexaMultiroomParentsOff && Array.isArray(ids)) {
                                for (let b=0; b<ids.length;b++) {
                                    if (idAlexaLastState[a].ids[ids[b]] === undefined && getState(replacePlaceholder(idAlexaState, ids[b])).val) {
                                        idAlexaLastState[a].ids[ids[b]] = true;
                                        setState(replacePlaceholder(idAlexaPause, ids[b]), true)
                                    }
                                }
                            }
                            if (alexaVolumen[a] && extendedExists(replacePlaceholder(idAlexaVolumen, idAlexaSerial[a]))) {
                                if (idAlexaLastState[a].volumen === undefined) idAlexaLastState[a].volumen = getState(replacePlaceholder(idAlexaVolumen, idAlexaSerial[a])).val
                                if (idAlexaLastState[a].volumen != alexaVolumen[a]) setState(replacePlaceholder(idAlexaVolumen, idAlexaSerial[a]), alexaVolumen[a]);
                            }
                            if (idAlexaLastState[a].timeout) clearTimeout(idAlexaLastState[a].timeout)

                            idAlexaLastState[a].timeout = setTimeout(function(a){
                                if (idAlexaLastState[a].play) setState(replacePlaceholder(idAlexaPlay, idAlexaSerial[a]), true)
                                if (alexaVolumen[a] && idAlexaLastState[a].volumen !== undefined && idAlexaLastState[a].volumen != alexaVolumen[a]) setState(replacePlaceholder(idAlexaVolumen, idAlexaSerial[a]), idAlexaLastState[a].volumen);
                                let textids = extendedExists(replacePlaceholder(idAlexaParents, idAlexaSerial[a])) ? getState(replacePlaceholder(idAlexaParents, idAlexaSerial[a])).val : null
                                let ids = [];
                                if (alexaMultiroomParentsOff && textids) {
                                    ids = textids.split(',')
                                    for (let b=0; b<ids.length;b++) {
                                        if (idAlexaLastState[a].ids[ids[b]]) {
                                            setState(replacePlaceholder(idAlexaPlay, ids[b]), true)
                                        }
                                    }
                                }
                                idAlexaLastState[a] = {ids:{}};
                            }, nTime.getTime() - new Date().getTime() + 500, a)

                            if (alexaVolumen[a]) setState(replacePlaceholder(idAlexa, idAlexaSerial[a]), entry.msg + _getMsgCountString(_speakToArray, entry.dienst));
                            ticaLog(2,'Dienst: ' + replacePlaceholder(idAlexa, idAlexaSerial[a]) + ' Nachricht: ' + entry.msg + _getMsgCountString(_speakToArray, entry.dienst))
                        }
                    }
                    ticaLog(4, 'Länge der auszugebenen Sprachnachricht: ' + (entry.endTimeSpeak.getTime() - entry.startTimeSpeak));
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
    if (MODE & DWD && !(enableInternDWD || enableInternDWD2)) {
        ticaLog(1, 'Nutze Datenabruf für DWD über States in ' + dwdPath);
        let r = getRegEx(dwdPath, '^');
        r += '.*\.object$';
        ticaLog(4, 'subscribe path:' + r);
        subDWDhandler = subscribe({ id: new RegExp(r), change: 'ne' }, onChangeDWD);
    }
    if (subUWZhandler) unsubscribe(subUWZhandler);
    if (MODE & UWZ && !enableInternUWZ) {
        ticaLog(1, 'Nutze Datenabruf für UWZ über States in ' + uwzPath);
        let r = getRegEx(uwzPath, '^');
        r += '.*\.object$';
        ticaLog(4, 'subscribe path:' + r);
        subUWZhandler = subscribe({ id: new RegExp(r), change: 'ne' }, onChangeUWZ);
    }
    if (subNINAhandler) unsubscribe(subNINAhandler);
    if (MODE & NINA && warncells[NINA].length == 0) {
        ticaLog(1, 'Nutze Datenabruf für NINA über States in ' + ninaPath);
        let r = getRegEx(ninaPath, '^');
        r += '.*.rawJson$';
        ticaLog(4, 'subscribe path:' + r);
        subNINAhandler = subscribe({ id: new RegExp(r), change: 'ne' }, onChangeNina);
    }
}

function onChangeDWD(dp) {
    if (onChangeTimeoutObj[dp.id]) clearTimeout(onChangeTimeoutObj[dp.id]);
    onChangeTimeoutObj[dp.id] = setTimeout( function(dp) {
        onChangeTimeoutObj[dp.id] = null;
        ticaLog(4, 'onchange DWD id:' + dp.id);
        onChange(dp, DWD);
    },500, dp);
}

function onChangeUWZ(dp) {
    if (onChangeTimeoutObj[dp.id]) clearTimeout(onChangeTimeoutObj[dp.id]);
    onChangeTimeoutObj[dp.id] = setTimeout( function(dp) {
        onChangeTimeoutObj[dp.id] = null;
        ticaLog(4, 'onchange UWZ id:' + dp.id);
        onChange(dp, UWZ);
    },500, dp);
}

function onChangeNina(dp) {
    if (onChangeTimeoutObj[dp.id]) clearTimeout(onChangeTimeoutObj[dp.id]);
    onChangeTimeoutObj[dp.id] = setTimeout( function(dp) {
        onChangeTimeoutObj[dp.id] = null;
        ticaLog(4, 'onchange NINA ' + dp.id);
        onChange(dp, NINA);
    },500, dp);
}

// funktion die von on() aufgerufen wird
function onChange(dp, mode) {
    if (addDatabaseData(dp.id, dp.state.val, mode, false)) {
        ticaLog(4, 'Datenbank wurde geändert - checkWarningsMain():' + autoSendWarnings + ' id:' + dp.id + ' Mode:' + mode);
        checkWarningsMain()
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
    ticaLog(1, 'InitDatabase() - first run: ' + first);
    if (firstRun) {
        setState(totalWarningCountState, 0, true);
        warnDatabase = { new: [], old: [] };
        if ((enableInternDWD)) ticaLog(1,'Standalone DWD Datenabruf aktiviert');
        if ((enableInternDWD2)) ticaLog(1,'Standalone DWD2 Datenabruf aktiviert');
        if ((enableInternUWZ)) ticaLog(1,'Standalone UWZ Datenabruf aktiviert');
        if (warncells[ZAMG].length > 0) ticaLog(1,'Standalone ZAMG Datenabruf aktiviert');
        if (warncells[NINA].length > 0) ticaLog(1,'Standalone NINA Datenabruf aktiviert');
        if (!((uLogLevel & 4) && DEBUGINGORESTART)) await getDataFromServer(first);
        if (standaloneInterval) clearSchedule(standaloneInterval);
        let sec = 18 + Math.round(Math.random()*30);
        standaloneInterval = schedule(sec + ' */'+intervalMinutes+' * * * *', getDataFromServer);
    }
    if (MODE & DWD && !(enableInternDWD || enableInternDWD2)) {
        _helper($("state[state.id=" + dwdPath + ".*.object]"), DWD, first);
    }
    if (MODE & UWZ && !enableInternUWZ) {
        _helper($("state[state.id=" + uwzPath + ".*.object]"), UWZ, first);
    }
    if (MODE & NINA && warncells[NINA].length == 0) {
        _helper($("state[state.id=" + ninaPath + ".*.rawJson]"), NINA, first);
    }
    warnDatabase.new = warnDatabase.new.filter(function(j) {
        return (j.mode & MODE);
    });
    if (!firstRun) {
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
                if (!b) ticaLog(4, 'filtere: '+JSON.stringify(j));
                return b;}
            )
        }
        return database;
    }
}
// Daten vom Server abfragen
async function getDataFromServer(first) {
    if (onStopped) {
        if (standaloneInterval) clearSchedule(standaloneInterval);
        return;
    }
    if (blockGetDataFromServer > 6) blockGetDataFromServer = 0;
    if (blockGetDataFromServer++ > 0) return;
    if (first === undefined) first = false;
    if (enableInternDWD2 && warncells[DWD].length == 0) {
        enableInternDWD2 = false;
        enableInternDWD = false;
        ticaLog(0,'DWD deaktivieren, keine Warncell vorhanden');
    } else if (!enableInternDWD2 && warncells[DWD].length > 0) {
        enableInternDWD2 = true;
        enableInternDWD = false;
        ticaLog(0,'DWD aktivieren, Warncell vorhanden');
    }
    for (let a = 0; a < warncells[DWD].length; a++) {
        //if (warncells[DWD][a][DWD2] === undefined)  await _getDataFromServer([internDWDUrl], DWD, first, warncells[DWD][a].id, a);
        if (warncells[DWD][a][DWD] === undefined) await _getDataFromServer([replacePlaceholder(internDWD2Url, warncells[DWD][a].id)], DWD2, first, warncells[DWD][a].id, a);
    }
    if (enableInternUWZ && warncells[UWZ].length == 0) {
        enableInternUWZ = false;
        ticaLog(0,'UWZ deaktivieren, keine Warncell vorhanden');
    } else if (!enableInternUWZ && warncells[UWZ].length > 0) {
        enableInternUWZ = true;
        ticaLog(0,'UWZ aktivieren, Warncell vorhanden');
    }
    for (let a = 0; a < warncells[UWZ].length; a++) {
        if (enableInternUWZ)  await _getDataFromServer([internUWZUrl + warncells[UWZ][a].id], UWZ, first, warncells[UWZ][a].id, a);
    }

    for (let a = 0; a < warncells[ZAMG].length; a++) {
        let url = replacePlaceholder(internZamgUrl,warncells[ZAMG][a].laengen,warncells[ZAMG][a].breiten);
        await _getDataFromServer([url], ZAMG, first, warncells[ZAMG][a].text, a);
    }
    if (warncells[NINA].length) {
        //internMowasUrl, warncells[NINA][a].laengen,warncells[NINA][a].breiten);
        await _getDataFromServer(internMowasUrl, NINA, first, '', 0);
    }
    await writeRawWarningCount()
    blockGetDataFromServer = 0;

    async function _getDataFromServer(url, m, first, area, wcIndex) {
        ticaLog(2, 'Rufe Daten vom Server ab -' + (m & DWD ? ' DWD' : (UWZ & m ? ' UWZ' : (DWD2 & m ? ' DWD2' : (ZAMG & m ? ' ZAMG' : ' NINA')))) + ' Area: ' + area);
        let results = [];
        for (let a=0; a<url.length; a++) {
            if (onStopped) return;
            const result = await axios.get(url[a])
                .then(results => {
                    ticaLog(4, "Status: " + results.status);
                    ticaLog(4, "Url: " + url);
                    if (!results) ticaLog(0,'!results');
                    if (results === undefined) ticaLog(0,'results === undefined')
                    if (results.status == 200) {
                        return results.data
                    } else {
                        ticaLog(1,'getDataFromServer() 1. Status: ' + results.status);
                    }
                    return null;
                })
                .catch(error => {
                    if (error == undefined) {
                        ticaLog(1, 'getDataFromServer() 2. Fehler im Datenabruf ohne Errorlog')
                    } else if (error.response == undefined) {
                        ticaLog(1, 'getDataFromServer() 3. ' + error + ' Maybe internet is down!', 'warn');
                    } else if (error.response.status == 404) {
                        ticaLog(1, 'getDataFromServer() 4. ' + error.message + ' ' + error.response.data.msg + ' url:' + url);
                    } else {
                        ticaLog(1, 'getDataFromServer() 5. ')
                        ticaLog(1, error.response.data);
                        ticaLog(1, error.response.status);
                        ticaLog(1, error.response.headers);
                    }
                    return null;
                })
            if (onStopped) return;
            if((DWD|DWD2) & m) ticaLog(4, "AREA: " + area);
            if(UWZ & m) ticaLog(4, "AREA: " + getAreaFromURI(url[a]));
            if((DWD|DWD2|ZAMG) & m) await processData(area, result, m, first, wcIndex);
            else if(UWZ & m) await processData(getAreaFromURI(url[a]), result, m, first, wcIndex);
            else if(NINA & m) {
                results = results.concat(result);
            }
            else {
                ticaLog(0,'getDataFromServer wrong Mode', 'error');
                stopScript();
            }
        }
        if (onStopped) return;
        if(NINA & m) {
            await processData(area, results, m, first, wcIndex);
        }
    }


    async function processData(area, thedata, m, first, wcIndex) {
        let newOBJ = [];
        if (thedata) {
            if ((DWD & m)) {
                if (!enableInternDWD) return;
                let jsonString = String(thedata);
                let newString = jsonString.replace('warnWetter.loadWarnings(', '');
                newString = newString.replace(/\);$/sg, ''); // damit findet es diesen String nur am Ende
                try {
                let tOBJ = JSON.parse(newString);
                if (tOBJ.warnings.hasOwnProperty(area)) {
                    warncells[DWD][wcIndex][DWD] = true;
                    newOBJ = tOBJ.warnings[area];
                }
                else newOBJ = [];
                } catch(e) {
                    console.warn('Fehlerhaftes Json: ' + e)
                }
            } else if (UWZ & m) {
                newOBJ = thedata.results;
                if (newOBJ.length) newOBJ.sort((a, b) => b.severity - a.severity);
            } else if (ZAMG & m) {
                if (thedata.properties !== undefined) {
                    newOBJ = thedata.properties.warnings;
                    let areaname = thedata.properties.location.properties.name;

                    let ind = warncells[ZAMG].findIndex((a) => a.text == areaname);
                    if (ind === -1) {
                        ticaLog(0,'ZAMG Area: '+ area +' nicht gefunden ')
                        return
                    }
                    area = warncells[ZAMG][ind].id;

                    for (let a= 0; a<newOBJ.length;a++) {
                        newOBJ[a].area = warncells[ZAMG][ind].text;
                    }
                    if (newOBJ.length) newOBJ.sort((a, b) => {
                        let result = b.properties.warnstufeid - a.properties.warnstufeid;
                        if (result) return result;
                        result = a.properties.rawinfo.start - b.properties.rawinfo.start;
                        if (result) return result;
                        result = a.properties.warnid - b.properties.warnid;
                        return result;
                    });
                }
            } else if (DWD2 & m) {
                if (!enableInternDWD2) return;
                let tempOBJ = Object(thedata);
                for(let data in tempOBJ.features) {
                    if (tempOBJ.features[data].properties.WARNCELLID == area) {
                        warncells[DWD][wcIndex][DWD2] = true;
                        newOBJ.push(tempOBJ.features[data].properties);
                    }
                }
                if (newOBJ.length) {
                    newOBJ.sort(function(a,b) {
                        let result = getCapLevel(b.SEVERITY) - getCapLevel(a.SEVERITY);
                        if (result) return result;
                        if (b.ONSET === undefined) result = -1;
                        if (a.ONSET === undefined) result += 1;
                        if (result) return result;
                        result = getDateObject(a.ONSET).getTime() - getDateObject(b.ONSET).getTime();
                        if (result) return result;
                        return JSON.stringify(a).hashCode() - JSON.stringify(b).hashCode();
                    });
                }
            } else if (NINA & m ) {
                for (let ni in ninaIdentifier) {
                    if (ninaIdentifier[ni].id < 0) delete ninaIdentifier[ni];
                    else if (ninaIdentifier[ni].id > 0) ninaIdentifier[ni].id = -1;

                }
                newOBJ[0]={};
                let tempOBJ = Object(thedata);
                for (let a=0; a< tempOBJ.length; a++) {
                    let obj = tempOBJ[a];
                    if (!obj || obj.info === undefined) continue;
                    for (let b=0; b<obj.info.length; b++) {
                        let info = obj.info[b];
                        if (info.area === undefined) continue;
                        for (let d=0; d<info.area.length; d++) {
                            // benutze einen Cache um das polygon nicht mehr als notwendig zu durchlaufen.
                            if (ninaIdentifier[obj.identifier + obj.sent] === undefined) ninaIdentifier[obj.identifier + obj.sent] = {id:1};
                            if (ninaIdentifier[obj.identifier + obj.sent].id == -1 ) {
                                area = ninaIdentifier[obj.identifier + obj.sent].area;
                            }
                            else {
                                let poly = info.area[d].polygon;
                                area = await isAreaInPolygon(warncells[NINA], poly);
                                ninaIdentifier[obj.identifier + obj.sent].area = area;
                                if (area != '') ticaLog(1, info.area[d].areaDesc + ' gefunden für Warnzelle: ' + area + ' obj.identifier: ' + obj.identifier);
                                info.area[d].polygon = undefined;
                            }
                            info.area[d].polygon = undefined
                            delete info.area[d].polygon;
                            ninaIdentifier[obj.identifier + obj.sent].id = 1;
                            if (area != '') {
                                info.area.areaDesc = info.area[d].areaDesc
                                info.identifier = obj.identifier
                                info.sent = obj.sent;
                                if (newOBJ[0][area]){
                                    newOBJ[0][area].push(info);
                                } else {
                                    newOBJ[0][area] = [info];
                                }
                                break;
                            }
                        }
                    }
                }
                // speicher frei geben
                thedata = undefined;
                tempOBJ = undefined;
            }
        }
        let count = 0;
        if (NINA & m) {
            for (let w = 0; w < warncells[NINA].length; w++) {
                count = 0;
                area = warncells[NINA][w].text
                if (newOBJ[0][area] !== undefined) count = newOBJ[0][area].length;
                for (let i = 0; i < numOfWarnings; i++) {
                    if (i < count) {
                        newOBJ[0][area][i].warncellObj = warncells[NINA][w].id;
                        await  writeResultEntry(newOBJ[0][area][i], i, m, first, warncells[NINA][w].id);
                    }
                    else await writeResultEntry({}, i, m, first, warncells[NINA][w].id);
                }
            }
        }
        else {
            count = newOBJ.length;
            for (let i = 0; i < numOfWarnings; i++) {
                if (i < count) {
                    let mode = m !== DWD2 ? m : DWD;
                    newOBJ[i].warncellObj = warncells[mode][wcIndex];
                    await writeResultEntry(newOBJ[i], i, m, first, area);
                }
                else await writeResultEntry({}, i, m, first, area);
            }
        }
        ticaLog(4, 'processData():' + count ? JSON.stringify(newOBJ) : '{}');
    }
    async function isAreaInPolygon (posarr, polygonArr) {
        for (let b=0;b<posarr.length;b++) {
            const x = posarr[b].breiten; const y = posarr[b].laengen;
            for (let a=0;a<polygonArr.length;a++) {
                if (onStopped) return '';
                if ( await pointInPolygonwithDelay(polygonArr[a].split(' '), [x, y]) ) {
                    return posarr[b].text
                }
            }
        }
        return '';
    };

    function pointInPolygonwithDelay(polygon, point) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                //log('Polygon auswertung Nina' + ++xyz)
                resolve(pointInPolygon (polygon, point));
            }, 10);
        });
    }
    function pointInPolygon (polygon, point) {
        //A point is in a polygon if a line from the point to infinity crosses the polygon an odd number of times
        let odd = false;
        polygon[polygon.length - 1] = polygon[polygon.length - 1].split(',');
        let x = polygon[polygon.length - 1][0];
        polygon[polygon.length - 1][0] = Number(polygon[polygon.length - 1][1])
        polygon[polygon.length - 1][1] = Number(x)
        //For each edge (In this case for each point of the polygon and the previous one)
        for (let i = 0, j = polygon.length - 1; i < polygon.length; i++) {
            if (!Array.isArray(polygon[i])) {
                polygon[i] = polygon[i].split(',');
                let x = polygon[i][0];
                polygon[i][0] = Number(polygon[i][1])
                polygon[i][1] = Number(x)
            }
            //If a line from the point into infinity crosses this edge
            if (((polygon[i][1] > point[1]) !== (polygon[j][1] > point[1])) // One point needs to be above, one below our y coordinate
                // ...and the edge doesn't cross our Y corrdinate before our x coordinate (but between our x coordinate and infinity)
                && (point[0] < ((polygon[j][0] - polygon[i][0]) * (point[1] - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0]))) {
                // Invert odd
                odd = !odd;
            }
            j = i;

        }
        //If the number of crossings was odd, the point is in the polygon
        return odd;
    };


    async function writeResultEntry(warnObj, _i, m, first, area, wcIndex) {
        let baseChannelId = ''
        if (DWD & m || DWD2 & m) baseChannelId = internalDWDPath + area + internalWarningEnd;
        else if (UWZ & m) baseChannelId = internalUWZPath + area + internalWarningEnd;
        else if (ZAMG & m) baseChannelId = internalZamgPath + area + internalWarningEnd;
        else if (NINA & m ) baseChannelId = internalMowasPath + area + internalWarningEnd;
        baseChannelId += (_i == 0 ? '' : _i) + '.';

        const oldObject = await getStateAsync(baseChannelId + "object");
        if (!firstRun && oldObject && JSON.stringify(warnObj) == JSON.stringify(oldObject.val)) {
            ticaLog(4, 'Datensatz ' + (_i+1) + ' ist schon vorhanden');
            return;
        }
        let tempObj = {};
        if (m & NINA) {
            if(addDatabaseData(baseChannelId + statesNINAintern.object.id , {info:[warnObj]}, NINA, first)) {
                ticaLog(1, 'NINA Warnung gefunden oder entfernt.' + 'RID: ' + randomID);
                checkWarningsMain()
            }
            tempObj[statesNINAintern.onset.id] = warnObj.onset !== undefined ? getDateObject(warnObj.onset).getTime() : Number("");
            tempObj[statesNINAintern.description.id] = warnObj.description || '';
            tempObj[statesNINAintern.expires.id] = warnObj.expires !== undefined ? getDateObject(warnObj.expires).getTime() : Number("");
            tempObj[statesNINAintern.headline.id] = warnObj.headline || '';
            tempObj[statesNINAintern.level.id] = warnObj.serverity === undefined || warnObj.serverity === '' ? -1 : getCapLevel(warnObj.serverity);
            tempObj[statesNINAintern.serverity.id] = warnObj.serverity === undefined ? '' : warnObj.serverity;
            tempObj[statesNINAintern.type.id] = -1;
            tempObj[statesNINAintern.object.id] = warnObj;
            tempObj[statesNINAintern.urgency.id] = warnObj.urgency || '';
            tempObj[statesNINAintern.certainty.id] = warnObj.certainty || '';
            tempObj[statesNINAintern.event.id] = warnObj.event|| '';

            tempObj[statesNINAintern.eventCode.id] = warnObj.eventCode === undefined ? [] : warnObj.eventCode;
            tempObj[statesNINAintern.web.id] = warnObj.web || '';
            tempObj[statesNINAintern.contact.id] = warnObj.RESPONSETYPE === undefined ? '' : warnObj.RESPONSETYPE;
            tempObj[statesNINAintern.parameter.id] = JSON.stringify(warnObj.parameter) || JSON.stringify([]);
            tempObj[statesNINAintern.areaDesc.id] = warnObj.area && warnObj.area.areaDesc ? warnObj.area.areaDesc : '';
            tempObj[statesNINAintern.sent.id] = warnObj.sent !== undefined ? getDateObject(warnObj.sent).getTime() : Number("");
            tempObj[statesNINAintern.category.id] = warnObj.category !== undefined ? warnObj.category : [];

            for (let a in statesNINAintern) {
                let dp = statesNINAintern[a];
                if (extendedExists(baseChannelId + dp.id)) setState(baseChannelId + dp.id, tempObj[dp.id], true);
            }
        }
        if (MODE & DWD && DWD2 & m) {
            if(addDatabaseData(baseChannelId + statesDWDintern[6].id , warnObj, DWD2, first)) {
                ticaLog(1, 'DWD2 Warnung gefunden oder entfernt.' + 'RID: ' + randomID);
                checkWarningsMain()
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
            tempObj[statesDWDintern[9].id] = -1;
            if (warnObj.EC_II !== undefined) {
                if (warningTypesString[DWD2][String(warnObj.EC_II)] !== undefined) {
                    tempObj[statesDWDintern[9].id] = warningTypesString[DWD2][String(warnObj.EC_II)];
                }
            }
            tempObj[statesDWDintern[10].id] = warnObj.EC_II === undefined || warnObj.EC_II === null ? -1 : parseInt(warnObj.EC_II, 10);
            tempObj[statesDWDintern[11].id] = warnObj.URGENCY === undefined ? '' : warnObj.URGENCY;
            tempObj[statesDWDintern[12].id] = warnObj.RESPONSETYPE === undefined ? '' : warnObj.RESPONSETYPE;
            tempObj[statesDWDintern[13].id] = warnObj.CERTAINTY === undefined ? '' : warnObj.CERTAINTY;
            tempObj[statesDWDintern[14].id] = warnObj.ALTITUDE === undefined ? 0 : Math.round(warnObj.ALTITUDE * 0.3048);
            tempObj[statesDWDintern[15].id] = warnObj.CEILING === undefined ? 3000 : Math.round(warnObj.CEILING * 0.3048);
            tempObj[statesDWDintern[20].id] = warnObj.INSTRUCTION === undefined || warnObj.INSTRUCTION === null ? '' : warnObj.INSTRUCTION
            tempObj[statesDWDintern[16].id] = tempObj.level !== -1 ? getLevelColor(tempObj.level) : '';
            tempObj[statesDWDintern[17].id] = tempObj.headline ? _createHTMLtext(tempObj, tempObj.headline, '') : '';
            tempObj[statesDWDintern[18].id] = tempObj.headline ? _createHTMLtext(tempObj, tempObj.headline, [tempObj.description]) : '';
            tempObj[statesDWDintern[19].id] = tempObj.headline ? _createHTMLtext(tempObj, tempObj.headline, [tempObj.description, tempObj.instruction]) : '';
            let a
            try {
                for (a = 0; a < statesDWDintern.length; a++) {
                    let dp = statesDWDintern[a];
                    if (extendedExists(baseChannelId + dp.id)) await setStateAsync(baseChannelId + dp.id, tempObj[dp.id], true);
                }
            } catch (e) {
                ticaLog(0, 'Fehler in SetState() #1 ' + e +' index' + a)
                ticaLog(0, 'Fehler in SetState() #1 Obj:' + tempObj)
            }
        }
        if (MODE & DWD & m) {
            if(addDatabaseData(baseChannelId + statesDWDintern[6].id, warnObj, DWD, first)) {
                ticaLog(1, 'DWD Warnung gefunden oder entfernt.' + 'RID: ' + randomID);
                checkWarningsMain()
            }

            const maps = ['gewitter', 'sturm', 'regen', 'schnee', 'nebel', 'frost', 'glatteis', 'tauwetter', 'hitze', 'uv'];

            tempObj[statesDWDintern[0].id] = warnObj.start || Number("");
            tempObj[statesDWDintern[1].id] = warnObj.description || '';
            tempObj[statesDWDintern[2].id] = warnObj.end || Number("");
            tempObj[statesDWDintern[3].id] = warnObj.headline || '';
            tempObj[statesDWDintern[4].id] = warnObj.level === undefined || warnObj.level === null ? -1 : parseInt(warnObj.level, 10)-1;
            tempObj[statesDWDintern[6].id] = warnObj;
            tempObj[statesDWDintern[7].id] = warnObj.level > 1 ? warnObj.level - 1 : 0;
            tempObj[statesDWDintern[8].id] = warnObj.event || '';
            tempObj[statesDWDintern[9].id] = warnObj.type === undefined || warnObj.type === null ? -1 : parseInt(warnObj.type, 10);
            tempObj[statesDWDintern[10].id] = warnObj.EC_II === undefined || warnObj.EC_II === null ? -1 : parseInt(warnObj.EC_II, 10);

            tempObj[statesDWDintern[5].id] = '';

            tempObj[statesDWDintern[11].id] = warnObj.URGENCY === undefined ? '' : warnObj.URGENCY;
            tempObj[statesDWDintern[12].id] = warnObj.RESPONSETYPE === undefined ? '' : warnObj.RESPONSETYPE;
            tempObj[statesDWDintern[13].id] = warnObj.CERTAINTY === undefined ? '' : warnObj.CERTAINTY;
            tempObj[statesDWDintern[14].id] = warnObj.altitudeStart === undefined || warnObj.altitudeStart == null ? 0 : warnObj.altitudeStart;
            tempObj[statesDWDintern[15].id] = warnObj.altitudeEnd === undefined || warnObj.altitudeEnd == null? 3000 : warnObj.altitudeEnd;
            tempObj[statesDWDintern[20].id] = warnObj.instruction === undefined || warnObj.instruction == null? '' : warnObj.instruction;
            tempObj[statesDWDintern[16].id] = tempObj.level !== -1 ? getLevelColor(tempObj.level) : '';
            tempObj[statesDWDintern[17].id] = tempObj.headline ? _createHTMLtext(tempObj, tempObj.headline, '') : '';
            tempObj[statesDWDintern[18].id] = tempObj.headline ? _createHTMLtext(tempObj, tempObj.headline, [tempObj.description]) : '';
            tempObj[statesDWDintern[19].id] = tempObj.headline ? _createHTMLtext(tempObj, tempObj.headline, [tempObj.description, tempObj.instruction]) : '';
            for (let a = 0; a < statesDWDintern.length; a++) {
                let dp = statesDWDintern[a];
                if (extendedExists(baseChannelId + dp.id)) setState(baseChannelId + dp.id, tempObj[dp.id], true);
            }
        }
        if (MODE & ZAMG & m) {
            if (addDatabaseData(baseChannelId + statesZAMGintern[6].id, warnObj, m, first)){
                ticaLog(1, 'ZAMG Warnung gefunden oder entfernt.' + 'RID: ' + randomID);
                checkWarningsMain()
            }
            tempObj[statesZAMGintern[6].id] = warnObj;
            tempObj[statesZAMGintern[10].id] = warnObj.area === undefined ? '' : warnObj.area ;
            let plainWarnObj = Object.entries(warnObj);
            if (plainWarnObj.length > 0) {
                tempObj[statesZAMGintern[7].id] = warnObj.properties.warntypid;
                tempObj[statesZAMGintern[9].id] = warningTypesString[ZAMG][warnObj.properties.warntypid][0];
                tempObj[statesZAMGintern[0].id] = Number(warnObj.properties.rawinfo.start)*1000;
                tempObj[statesZAMGintern[1].id] =  Number(warnObj.properties.rawinfo.end)*1000;
            } else {
                tempObj[statesZAMGintern[7].id] = -1
                tempObj[statesZAMGintern[9].id] = 'n/a';
                tempObj[statesZAMGintern[0].id] = Number('');
                tempObj[statesZAMGintern[1].id] = Number('');
            }

            for (let a = 0; a < statesZAMGintern.length; a++) {
                let data = statesZAMGintern[a];
                if (statesZAMGintern[a].json !== undefined) {
                    let def = null;
                    if (data.options.type == 'string') def = '';
                    else if (data.options.type == 'object') def = {};
                    else if (data.options.type == 'number') def = Number('');
                    else def = null;
                    try {
                        tempObj[data.id] = warnObj.properties !== undefined && warnObj.properties[data.json] !== undefined && warnObj.properties[data.json] ? warnObj.properties[data.json] : def;
                    }
                    catch(e) {
                        ticaLog(0,warnObj,'error');
                    }
                }
            }
            if (tempObj.level) tempObj.level += 1
            tempObj[statesZAMGintern[13].id] = getLevelColor(tempObj.level, ZAMG);
            tempObj[statesZAMGintern[14].id] = tempObj.type === -1  ? '' 	: 'Warnung vor ' + warningTypesString[ZAMG][tempObj.type][0];
            tempObj[statesZAMGintern[11].id] = plainWarnObj.length == 0 ? '' : _createHTMLtext(tempObj,tempObj.headline,null);
            let text = [tempObj.auswirkungen !== '' ? '</br>' + (tempObj.text + '</br>' + tempObj.auswirkungen).replace(/\\n\*/g, '*').replace(/\*/g, '<br>*').replace(/\\n/g, '<br>') : ''];
            tempObj[statesZAMGintern[12].id] = plainWarnObj.length == 0 ? '' : _createHTMLtext(tempObj, tempObj.headline, text);
            text.push (tempObj.empfehlungen !== '' ? '</br>' + tempObj.empfehlungen.replace(/\\n\*/g, '*').replace(/\*/g, '<br>*').replace(/\\n/g, '<br>') : '')
            text.push (tempObj.meteotext !== '' ?'</br>' + tempObj.meteotext.replace(/\\n\*/g, '*').replace(/\*/g, '<br>*').replace(/\\n/g, '<br>'):'');
            tempObj[statesZAMGintern[15].id] = plainWarnObj.length == 0 ? '' : _createHTMLtext(tempObj, tempObj.headline, text);
            for (let a = 0; a < statesZAMGintern.length; a++) {
                let dp = statesZAMGintern[a];
                if (extendedExists(baseChannelId + dp.id)) setState(baseChannelId + dp.id, tempObj[dp.id], true);
            }
        }
        if (MODE & UWZ & m) {
            if (addDatabaseData(baseChannelId + statesUWZintern[6].id, warnObj, m, first)){
                ticaLog(1, 'UWZ Warnung gefunden oder entfernt.' + 'RID: ' + randomID);
                checkWarningsMain()
            }
            tempObj[statesUWZintern[6].id] = warnObj;

            tempObj[statesUWZintern[0].id] = warnObj.dtgStart !== undefined ? warnObj.dtgStart * 1000 : Number('');
            tempObj[statesUWZintern[1].id] = warnObj.dtgEnd !== undefined ? warnObj.dtgEnd * 1000 : Number('');
            tempObj[statesUWZintern[7].id] = warnObj.severity || 0;
            tempObj[statesUWZintern[10].id] = warnObj.type || 0;
            if (warnObj.payload !== undefined) {
                tempObj[statesUWZintern[2].id] = warnObj.payload.translationsLongText.DE;
                tempObj[statesUWZintern[3].id] = warnObj.payload.translationsShortText.DE;
                tempObj[statesUWZintern[4].id] = _getUWZLevel(warnObj.payload.levelName);
                tempObj.urgency = _getUWZUrgency(warnObj.payload.levelName);
                tempObj[statesUWZintern[5].id] = getLevelColor(warnObj.severity, UWZ);
                let headline = '';
                if (tempObj.urgency !== undefined && tempObj.urgency == 1) headline += "Vorwarnung vor ";
                else headline += "Warnung vor ";
                headline += warningTypesString[UWZ][tempObj.type];
                tempObj[statesUWZintern[11].id] = headline;
                tempObj[statesUWZintern[8].id] = _createHTMLtext(tempObj, headline, [warnObj.payload.translationsShortText.DE]);
                tempObj[statesUWZintern[9].id] = _createHTMLtext(tempObj, headline, [warnObj.payload.translationsLongText.DE]);
                tempObj[statesUWZintern[12].id] = _createHTMLtext(tempObj, headline, [warnObj.payload.translationsLongText.DE]);
            } else {
                tempObj[statesUWZintern[2].id] = '';
                tempObj[statesUWZintern[3].id] = '';
                tempObj[statesUWZintern[4].id] = 0;
                tempObj.uwzUrgency = 0;
                tempObj[statesUWZintern[5].id] = '';
                tempObj[statesUWZintern[8].id] = '';
                tempObj[statesUWZintern[9].id] = '';
                tempObj[statesUWZintern[11].id] = '';
                tempObj[statesUWZintern[12].id] = '';
            }
            for (let a = 0; a < statesUWZintern.length; a++) {
                let dp = statesUWZintern[a];
                if (extendedExists(baseChannelId + dp.id)) setState(baseChannelId + dp.id, tempObj[dp.id], true);
            }
            function _getUWZLevel(warnName) {
                let result = -1; // -1 is an error!
                let alert = warnName.split("_");
                let colors = ["green", "darkgreen", "yellow", "orange", "red", "violet"];

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
                let result = 0;

                let alert = warnName.split("_");
                if (alert[1] == "forewarn") {
                    result = 1;
                } else {
                    result = 2; // immediate;
                }
                return result;
            }
        }
        function _createHTMLtext(w, headline, text) {
            let html = '<div style="background: ' + w.color.toString(16) + '" border:"10px">';
            html += '<font color=#000000><h3>';
            html += headline;
            html += "</h3>";
            html += "<p>Zeitraum von " + formatDate(new Date(w.begin), "WW, DD. OO YYYY hh:mm") + " Uhr bis " + formatDate(new Date(w.end), "WW, DD. OO YYYY hh:mm") + " Uhr </p>";
            if (text !== undefined && Array.isArray(text)) {
                for (let a = 0; a<text.length;a++) {
                    if (text[a] !== undefined && text[a] !== '' ){
                        html += '<p>' + text + '</p>';
                    }
                }
            }
            html += "</font></div>";
            return html;
        }

    }
    function getAreaFromURI(uri) {
        let searchstr = "&areaID=";
        let n = uri.search(searchstr);
        let result = uri.slice(n + searchstr.length, uri.length);
        return result;
    }
}

async function writeRawWarningCount () {
    let warnObjs = $('state(state.id=' + mainStatePath + 'data.*.object)');
    if (warnObjs.length>0) {
        let countObj = {};
        let mpath =  mainStatePath + 'data';
        for (let a = 0; a < warnObjs.length;a++){
            let id = warnObjs[a];
            let has = false;
            const theData = await getStateAsync(id);
            if (theData && theData.val) {
                has = Object.entries(theData.val).length > 0;
            }
            let x = 0;
            id = id.substr(0,id.lastIndexOf('.'));
            while (mpath !== id && x++ <4) {
                id = id.substr(0,id.lastIndexOf('.'));
                countObj[id] = (countObj[id] === undefined ? 0 : countObj[id]) + (has ? 1 : 0);
            }
        }
        for (let id in countObj) {
            if (onStopped) return;
            try {
                let nid = id + '.rawTotalWarnings'
                if (!extendedExists(nid)) {
                    await createStateAsync(nid,{ read:true, write:false, type:'number', name:'Gesamtwarnungsanzahl der Unterebenen'});
                }
                setState(nid, countObj[id], true);
            } catch(e) {
                ticaLog(0,'Fehler in getDataFromServer()', 'error');
            }
        }
    }
}

async function addWarncell(obj, i){
    let wc = '';
    let id = '';
    let restart = false;
    let wcname = ''
    if ((typeof(obj) === 'object')) {
        if (obj.state.ack) return;
        let e = obj.id.split('.');
        i = MODES.findIndex((a) => a.text.toLowerCase() == e[e.length-2])
        wc = obj.state.val
        id = obj.id;
        restart = true;
    } else {
        wc = obj;
    }
    let warncellid = mainStatePath + 'config.basiskonfiguration.warnzelle.';

    let index=-1;
    let folder = ''
    let breiten = 0, laengen = 0;
    switch (MODES[i].mode) {
        case DWD:
        wcname = await testValueDWD2(wc);
        if (!wcname) {
            if(id) setState(id,'Fehler', true);
            return;
        }

        warncellid += MODES[i].text.toLowerCase() +'.'+ wc;
        folder = internalDWDPath;
        if ((index=warncells[DWD].findIndex(w => wc == w.id)) == -1 ) {
            warncells[DWD].push({id:wc, text:wcname, area:''});
            index = warncells[DWD].length-1;
        }
        else warncells[DWD][index].text = wcname;
        break;
        case UWZ:
            if (id) {
                let t = id.split('.');
                if (getEndfromID(id) == 'addId#') {
                    t[t.length-1] = 'addName#';
                    wcname = getState(t.join('.')).val;
                    if (!wcname || wcname == 'Fehler') {
                        return;
                    }
                    setState(id,'',true);
                    setState(t.join('.'),'',true);
                } else if (getEndfromID(id) == 'addName#') {
                    t[t.length-1] = 'addId#';
                    wcname = wc;
                    wc = null;
                    wc = getState(t.join('.')).val;
                    if (!wc) {
                        return;
                    }
                    setState(id,'',true);
                    setState(t.join('.'),'',true);
                }
            }
            index=warncells[UWZ].findIndex(w => wc == w.id);
            if (index == -1) {
                warncells[UWZ].push({id:wc, text:wcname, area:''});
                index = warncells[UWZ].length-1
            }
            wcname = warncells[UWZ][index].text;
            warncellid += MODES[i].text.toLowerCase() +'.'+ wc;
            if (!wcname) {
                if (await existsStateAsync(warncellid)) {
                    wcname = getObject(warncellid).common.name;
                }
            }
            if (!wcname) {
                ticaLog(0,'Fehler 2#');
                return;
            }
            folder = internalUWZPath;
        break;
        case ZAMG:
            if (id) {
                let t = id.split('.');
                t[t.length-1] ='addLat#';
                const lat = await getStateAsync(t.join('.'));
                t[t.length-1] = 'addLong#';
                const long = await getStateAsync(t.join('.'));
                if (!lat.val || !long.val || lat.val == 'Fehler' || long.val == 'Fehler') {
                    return;
                }
                breiten = lat.val;
                laengen = long.val;
                wc = breiten + '/' + laengen;
                wc = wc.replace(/\./g,'#');
            } else {
                let ar = wc.replace(/\#/g,'.').split('/');
                breiten = Number(ar[0]);
                laengen = Number(ar[1]);
            }
            wcname = await getZamgName(breiten, laengen);
            if (!wcname || wcname == 'Fehler') {
                if (id) {
                    let t = id.split('.');
                    t[t.length-1] ='addLat#';
                    setState(t.join('.'),'Fehler', true);
                    t[t.length-1] = 'addLong#';
                    setState(t.join('.'),'Fehler', true);
                }
                return;
            } else {
                if (id) {
                    let t = id.split('.');
                    t[t.length-1] ='addLat#';
                    setState(t.join('.'),'', true);
                    t[t.length-1] = 'addLong#';
                    setState(t.join('.'),'', true);
                }
            }
            index=warncells[ZAMG].findIndex(w => wc == w.id);
            if (index == -1) {
                warncells[ZAMG].push({breiten:breiten, laengen:laengen, text:wcname, id:wc, area:''});
                index = warncells[ZAMG].length-1
            }
            warncellid += MODES[i].text.toLowerCase() +'.'+ wc;
            if (!wcname) {
                if (await existsStateAsync(warncellid)) {
                    wcname = getObject(warncellid).common.name;
                }
            }
            if (!wcname) {
                ticaLog(0,'Fehler 3#');
                return;
            }
            warncells[ZAMG][index].text = wcname;

            folder = internalZamgPath;
            for (let i = 0; i < numOfWarnings; i++) {
                let p = folder + wc + internalWarningEnd + (i == 0 ? '' : i) + '.';
                for (let a = 0; a < statesZAMGintern.length; a++) {
                    if (onStopped) return;
                    let dp = statesZAMGintern[a];
                    let id = p + dp.id;
                    if (!await existsStateAsync(id)) {
                        await createStateAsync(id, dp.options,);
                    }
                }
            }
        break;
        case NINA:
            if (id) {
                let t = id.split('.');
                t[t.length-1] ='addLat#';
                const lat = await getStateAsync(t.join('.'));
                t[t.length-1] = 'addLong#';
                const long = await getStateAsync(t.join('.'));
                t[t.length-1] = 'addName#';
                let wn = await getStateAsync(t.join('.'));
                if (!lat.val || !long.val || lat.val == 'Fehler' || long.val == 'Fehler' || !wn.val || wn.val == 'Fehler'  ) {
                    return;
                }
                breiten = lat.val;
                laengen = long.val;
                wcname = wn.val;
                wc = breiten + '/' + laengen;
                wc = wc.replace(/\./g,'#');
            } else {
                let ar = wc.replace(/\#/g,'.').split('/');
                breiten =  Number(ar[0]);
                laengen =  Number(ar[1]);
            }
            index=warncells[NINA].findIndex(w => wc == w.id);

            if (index == -1) {
                warncells[NINA].push({id:wc, breiten:breiten, laengen:laengen, text:wcname, area:''});
                index = warncells[NINA].length-1
            }
            wcname = warncells[NINA][index].text;
            warncellid += MODES[i].text.toLowerCase() +'.'+ wc;
            if (!wcname) {
                if (await existsStateAsync(warncellid)) {
                    wcname = getObject(warncellid).common.name;
                }
            }
            if (!wcname || wcname == 'Fehler') {
                if (id) {
                    let t = id.split('.');
                    t[t.length-1] ='addLat#';
                    setState(t.join('.'),'Fehler', true);
                    t[t.length-1] = 'addLong#';
                    setState(t.join('.'),'Fehler', true);
                    t[t.length-1] = 'addName#';
                    setState(t.join('.'),'Fehler', true);
                }
                return;
            } else {
                if (id) {
                    let t = id.split('.');
                    t[t.length-1] ='addLat#';
                    setState(t.join('.'),'', true);
                    t[t.length-1] = 'addLong#';
                    setState(t.join('.'),'', true);
                    t[t.length-1] = 'addName#';
                    setState(t.join('.'),'', true);
                }
            }

            warncells[NINA][index].text = wcname;
            folder = internalMowasPath;
        break;
        default:
        ticaLog(0,'Unbekannter Mode in addWarncell', 'error');
        return;
    }
    if (index != -1) warncells[MODES[i].mode][index].area = warncells[MODES[i].mode][index].text
    if (!await existsStateAsync(warncellid)) {
        await createStateCustomAsync(warncellid, wcname, {name: wcname,type: "string",def:wcname, read: true,write: true},);
    } else {
        if (getObject(warncellid).common.type !== 'string') {
            await extendObjectAsync(warncellid, {
                common:{
                    type: 'string',
                    def:wcname
                }
            })
            await setStateAsync(warncellid, wcname, true);
        } else {
            warncells[MODES[i].mode][index].area = getState(warncellid).val;
            if (warncells[MODES[i].mode][index].text === undefined) warncells[MODES[i].mode][index].text = warncells[MODES[i].mode][index].area
            if (warncells[MODES[i].mode][index].text.includes(warncells[MODES[i].mode][index].area)
                || warncells[MODES[i].mode][index].area.includes('#')
            ) {
                for (let a = 0; a < warncells[MODES[i].mode].length; a++) warncells[MODES[i].mode][a].favorit = false;
                warncells[MODES[i].mode][index].favorit = true;
                warncells[MODES[i].mode][index].area = warncells[MODES[i].mode][index].area.replace('#','')
                warncells[MODES[i].mode][index].text = warncells[MODES[i].mode][index].text.replace('#','')
            }
            let sfavorit = false;
            for (let a = 0; a < warncells[MODES[i].mode].length; a++) if (warncells[MODES[i].mode][a].favorit) sfavorit = true;
            if (!sfavorit) warncells[MODES[i].mode][0].favorit = true;
        }
    }

    //  setzte den Namen für Datenpunkte unter data
    if (!(await existsObjectAsync(folder + wc)) || getObject(folder + wc).common.name != wcname) {
        await extendObjectAsync (folder + wc, {
            type: 'channel',
            common: {
                name: wcname
            }
        });
    }
};
async function getZamgName(lat, long) {
    ticaLog(2, 'Rufe Zamg Area daten vom Server a');
    if (onStopped) return false;
    const data = await axios.get(replacePlaceholder(internZamgUrl,long,lat))
            .then(results => {
                ticaLog(4, "Status: " + results.status);
                if (!results) ticaLog(0,'!results');
                if (results === undefined) ticaLog(0,'results === undefined')
                if (results.status == 200) {
                    return results.data
                } else {
                    ticaLog(1,'testValueDWD2() 1. Status: ' + results.status);
                    return undefined;
                }
            })
            .catch(error => {
                if (error == undefined) {
                    ticaLog(1, 'getZamgName() 2. Fehler im Datenabruf ohne Errorlog')
                } else if (error.response == undefined) {
                    ticaLog(1, 'getZamgName() 3. ' + error + ' Maybe internet is down!', 'warn');
                } else if (error.response.status == 404) {
                    ticaLog(1, 'getZamgName() 4. ' + error.message);
                } else {
                    ticaLog(1, 'getZamgName() 5. ' + error.response.data);
                    ticaLog(1, error.response.status);
                    ticaLog(1, error.response.headers);
                }
                return undefined;
            })
    if (data === undefined) return false;
    if (data.properties === undefined) return false;
    return data.properties.location.properties.name;
}
async function testValueDWD2 (value) {
    const result = await _testValueDWD2(value);
    templist[DWD].list = undefined;
    return result
}
async function _testValueDWD2 (value) {
    ticaLog(2, 'Rufe DWD Warnzellenbezeichnung vom Server ab');
    if (onStopped) return false;
    if (value === undefined) value = warncells[DWD];
    else value = [{id:value, single: true}];
    for (let a = 0; a < value.length;a++) {
        const result = await axios.get(replacePlaceholder(interngetNameDWD2Url,value[a].id ))
            .then(results => {
                ticaLog(4, "Status: " + results.status);
                if (!results) ticaLog(0,'!results');
                if (results === undefined) ticaLog(0,'results === undefined')
                if (results.status == 200) {
                    return results.data
                } else {
                    ticaLog(1,'testValueDWD2() 1. Status: ' + results.status);
                    return undefined;
                }
            })
            .catch(error => {
                if (error == undefined) {
                    ticaLog(1, 'testValueDWD2() 2. Fehler im Datenabruf ohne Errorlog')
                } else if (error.response == undefined) {
                    ticaLog(1, 'testValueDWD2() 3. ' + error + ' Maybe internet is down!', 'warn');
                } else if (error.response.status == 404) {
                    ticaLog(1, 'testValueDWD2() 4. ' + error.message);
                } else {
                    ticaLog(1, 'testValueDWD2() 5. ' + error.response.data);
                    ticaLog(1, error.response.status);
                    ticaLog(1, error.response.headers);
                }
                return undefined;
        })
        if ((result && result.features
            && result.features.length
            && result.features[0]
            && result.features[0].properties
            && result.features[0].properties.KURZNAME))
        {
            let city = result.features[0].properties.KURZNAME
            if (value[a].single === undefined) {
                warncells[DWD][a].text = city
                ticaLog(1, 'DWD Warncell-Id: ' + warncells[DWD][a].id + ' gefunden: '+ warncells[DWD][a].text );
            }
            else  return city;

        } else {
            if (templist[DWD].list === undefined) {
                templist[DWD].list = await axios.get('https://www.dwd.de/DE/leistungen/opendata/help/warnungen/cap_warncellids_csv.csv?__blob=publicationFile&v=3')
                .then(results => {
                    ticaLog(4, "Status: " + results.status);
                    if (!results) ticaLog(0,'!results');
                    if (results === undefined) ticaLog(0,'results === undefined')
                    if (results.status == 200) {
                        return results.data
                    } else {
                        ticaLog(1,'testValueDWD2() 1. Status: ' + results.status);
                        return undefined;
                    }
                })
                .catch(error => {
                    if (error == undefined) {
                        ticaLog(1, 'testValueDWD2() 6. Fehler im Datenabruf ohne Errorlog')
                    } else if (error.response == undefined) {
                        ticaLog(1, 'testValueDWD2() 7. ' + error + ' Maybe internet is down!', 'warn');
                    } else if (error.response.status == 404) {
                        ticaLog(1, 'testValueDWD2() 8. ' + error.message);
                    } else {
                        ticaLog(1, 'testValueDWD2() 9. ' + error.response.data);
                        ticaLog(1, error.response.status);
                        ticaLog(1, error.response.headers);
                    }
                    return undefined;
                })
            }
            if (templist[DWD].list === undefined) return false;
            let i = -1;
            let data = templist[DWD].list
            if ((i = data.indexOf(value[a].id)) != -1) {
                let b =  data.indexOf(';',i);
                let e = data.indexOf(';',++b);
                let city = data.substr(b, e - b)
                if (value[a].single === undefined) {
                    warncells[DWD][a].text = city
                    ticaLog(1, 'DWD Warncell-Id: ' + warncells[DWD][a].id + ' gefunden: '+ warncells[DWD][a].text );
                }
                else  return city;
            }
            else if (value[a].single !== undefined) {
                ticaLog(0,'Warnzelle '+ value[a].id +' für DWD nicht gefunden.','warn');
                return false;
            }
        }
    }
}

// für Objekt zur Database hinzu
function addDatabaseData(id, value, mode, old) {
    let warn = null;
    let change = false;
    // value muß ein Object sein, value: String/Object, abfrage auf Null/undefiniert ist nur zur Sicherheit.
    if (!value || value === undefined ) value = {};
    // Kompatibilität zur Stableversion
    if (typeof value === 'string' ) value = JSON.parse(value);
    ticaLog(4, "1. addDatabaseData() ID + JSON:" + id + ' - ' + JSON.stringify(value));
    if (mode & (UWZ |DWD | DWD2 | ZAMG)) {
        change = removeDatabaseDataID(id);
        if (Object.entries(value).length > 0 ) {
            warn = getDatabaseData(value, mode);
           if (warn) {
                let m = mode == DWD2 ? DWD : mode;
                warn.areaGroup         = value.warncellObj === undefined   ? ''    : 'für die Region ' + value.warncellObj.area;
                warn.area              = value.warncellObj === undefined   ? ''    :  value.warncellObj.area;
                warn.areaID = "für " + getRegionName(id, m)
                warn.favorit           = value.warncellObj === undefined || value.warncellObj.favorit === undefined  ? false    : value.warncellObj.favorit
                warn.wcID              = value.warncellObj === undefined || value.warncellObj.id === undefined  ? ''    : value.warncellObj.id
                warn.hash = JSON.stringify(warn).hashCode();

                warn.id = id;
                warnDatabase.new.push(warn);
                if (old) warnDatabase.old.push(warn);
                change = warnDatabase.old.findIndex(function(j){return j.hash == warn.hash}) == -1;
                if (!change) {
                    if (old) ticaLog(1, "Init! id: " + id + " headline: " + warn.headline);
                    else ticaLog(2, "No change! id: " + id + " headline: " + warn.headline);
                }
                else ticaLog(1,"Add UWZ/DWD/ZAMG warning to database. id: " + id + " headline: " + warn.headline);
            }
        } else if (change) ticaLog(1,"Remove Warning UWZ/DWD with id: " + id);
    } else if (mode == NINA) {
        // Nina benutzt keine eindeutigen Ids für Warnungen, so dass das löschen woanders erfolgen muß.
        if (value.info === undefined || !Array.isArray(value.info)) return false;
        let tempArr = [];
        let grouphash = 0;
        // sammele die neuen Daten
        for (let a = 0; a < value.info.length; a++) {
            warn = getDatabaseData(value.info[a], mode);
            // Warnungen nur aufnehmen wenn sie nicht beendet sind. Null berücksichtigt.
            if (warn && (!warn.end || new Date(warn.end) > new Date())) {
                warn.identifier     = value.identifier  === undefined ? "" : value.identifier;
                warn.sender         = value.sender      === undefined ? "" : value.sender;
                warn.areaID = "für " + getRegionName(id, NINA)
                warn.hash           = JSON.stringify(warn).hashCode();
                warn['areaGroup']          = ''
                warn['favorit']           = false
                warn['wcID']              = ''
                // setzte start auf das Sendungsdatum, aber nicht im Hash berücksichtigen, ist keine neue Nachricht nur weil sich das datum ändert.
                warn.start          = warn.start || value.sent === undefined     ? warn.start    : getDateObject(value.sent).getTime();
                warn.id             = id;
                // davon ausgehend das die Nachrichten immer gleich sortiert sind und der NINA-Adapter das nicht umsortiert sollte der Hash der ersten Nachrichten
                // immer der selbe sein. Benutze diesen um die Gruppe an Nachrichten zu identifizieren.
                if (!grouphash) grouphash = warn.hash;
                warn.grouphash = grouphash;
                tempArr.push(warn);
                ticaLog(4, "Added to tempdatabase");
            }
        }
        // Vergleiche vorhandene und neue Daten wenn hash = hash aktualisiere ID, wenn nicht und ID = ID setzte ID auf null
        if (tempArr.length > 0) {
            for (let a = 0; a < tempArr.length; a++) {
                for (let b = 0; b < warnDatabase.new.length; b++) {
                    if (warnDatabase.new[b].mode !== NINA) continue
                    if (tempArr[a].hash == warnDatabase.new[b].hash) {
                        if (warnDatabase.new[b].id != tempArr[a].id) {
                            ticaLog(2,"Update database Nina warning old id<>new id. headline: " +warn.headline );
                        }
                        warnDatabase.new[b].id = tempArr[a].id;
                        tempArr.splice(a--, 1);
                        break;
                    } else if (
                        tempArr[a].id == warnDatabase.new[b].id &&
                        tempArr[a].grouphash != warnDatabase.new[b].grouphash
                    ) {
                        if (tempArr[a].messageHash == warnDatabase.new[b].messageHash) {
                            ticaLog(2,"Update database same warning, same id, different dates: " +warn.headline );
                            let i = getIndexOfHash(warnDatabase.old, warnDatabase.new[b].hash);
                            if (i != -1) warnDatabase.old[i] = tempArr[a];
                            warnDatabase.new[b] = tempArr[a];
                            tempArr.splice(a--, 1);
                            break;
                        } else {
                            ticaLog(1,
                                "warnDatabase.new set id to null - duplicate id and wrong grouphash: " +
                                warnDatabase.new[b].headline
                            );
                            warnDatabase.new[b].id = null;
                        }
                    }
                }
            }
        }
        if (tempArr.length > 0) {
            for (let a = 0; a < tempArr.length; a++) {
                warn = tempArr[a];
                warnDatabase.new.push(warn);
                if (old) warnDatabase.old.push(warn);
                ticaLog(1,
                    "Add Nina warning to database. headline: " +
                    warn.headline
                );

            }
            change = true;
        }
    }
    change = old !== undefined && old ? false : change;
    setState(totalWarningCountState, warnDatabase.new.length, true);
    setAlertState()
    return change;

    // vergleich regionName und die Obj.id und gib den benutzerfreundlichen Namen zurück.
    function getRegionName(id, mode) {
        if (!Array.isArray(warncells[mode]) || warncells[mode].length == 0) return "";
        for (let a = 0; a < warncells[mode].length; a++) {
            if (id.includes(warncells[mode][a].id)) {
                return warncells[mode][a].text;
            }
        }
        return "";
    }
}

function isWarnIgnored(warn) {
    if (warn.level < attentionWarningLevel) {
        if ((uFilterList & warn.mode) != 0) return true;
        if ((warn.mode & NINA) != 0) {
            if (uAutoNinaFilterList.indexOf(warn.sender) != -1) {
                ticaLog(4, 'Filter: \'' + warn.sender + '\' ist in uAutoNinaFilterList - level: ' + warn.level);
                return true;
            }
        }
    }
    return false;
}

function getIndexOfHash(db, hash, notIgnored) {
    return db.findIndex(function(j) {
        return j.hash === hash && (notIgnored === undefined || !j.ignored) ;
    });
}

// Wandelt den Datensatz in ein internes Format um
function getDatabaseData(warn, mode){
    if (!warn || warn === undefined || typeof warn !== 'object' || Object.entries(warn).length == 0 || warn === {} || warn =='{}') {
        return null;
    }
    let result={};
    if (mode === DWD) {
        if (
            warn.altitudeStart > maxhoehe
            || (warn.altitudeEnd && warn.altitudeEnd < minhoehe)
            || warn.level < minlevel
        ) {ticaLog(2, 'Übergebenene Warnung DWD verworfen');return null;}
        result['mode'] = DWD;
        result['headline']      = warn.headline === undefined 		? '' 	: warn.headline;
        result['start']         = warn.start === undefined 			? null 	: warn.start || null;
        result['end']           = warn.end === undefined 			? null 	: warn.end || null;
        result['type']          = warn.type === undefined 			? -1 	: warn.type;
        result['level']         = warn.level === undefined 			? 0 	: warn.level-1;
        result['areaID'] 		= warn.regionName === undefined 	? '' 	: warn.regionName;
        result['altitudeStart'] = warn.altitudeStart === undefined 	? 0 	: warn.altitudeStart;
        result['altitudeEnd'] 	= warn.altitudeEnd === undefined 	? 3000 	: warn.altitudeEnd;
        result.messageHash      = JSON.stringify(result).hashCode();
        result['description']   = warn.description === undefined 	? '' 	: warn.description;
        result['instruction']   = warn.instruction === undefined 	? '' 	: warn.instruction;
        result['web'] 			= '';
        result['webname'] 		= '';
        result['picture']        = result.type === -1                ? ''    : warningTypesString[DWD][result.type][1];
        result['typename']       = result.type === -1                ? ''    : warningTypesString[DWD][result.type][0];
    } else if (mode === ZAMG) {
        if (
            warn.properties === undefined ||
            warn.properties.rawinfo.wlevel < minlevel
        ) {ticaLog(1, 'Übergebenene Warnung ZAMG verworfen, level niedriger als minlevel');return null;}
        result['type']          = warn.properties.warntypid === undefined 	    ? -1 	: warn.properties.warntypid;
        result['mode'] = ZAMG;
        result['description']   = !warn.properties.text 	                    ? '' 	: warn.properties.text + ' ';
        result['description']   += !warn.properties.auswirkungen 	            ? '' 	: warn.properties.auswirkungen;
        result['meteo']         = !warn.properties.meteotext 	                ? '' 	: warn.properties.meteotext;
        result['headline']      = result.type === -1 		                    ? '' 	: 'Warnung vor ' + warningTypesString[ZAMG][result.type][0];
        result['start']         = warn.properties.rawinfo.start === undefined 	? null 	: warn.properties.rawinfo.start*1000 || null;
        result['end']           = warn.properties.rawinfo.end === undefined 	? null 	: warn.properties.rawinfo.end*1000 || null;
        result['instruction']   = !warn.properties.empfehlungen  	            ? '' 	: warn.properties.empfehlungen;
        result['level']         = warn.properties.rawinfo.wlevel === undefined  ? 0 	: warn.properties.rawinfo.wlevel + 1;
        result['areaID'] 		= warn.area === undefined 	? '' 	: warn.area;
        result['html'] 					= {};
        result['html']['web'] 			= '';
        result['html']['instruction'] 	= result.instruction.replace(/\\n\*/g, '*').replace(/\*/g, '<br>*').replace(/\\n/g, '<br>');
        result['html']['headline'] 		= result.headline.replace(/\\n\*/g, '*').replace(/\*/g, '<br>*').replace(/\\n/g, '<br>');
        result['html']['description'] 	= result.description.replace(/\\n\*/g, '*').replace(/\*/g, '<br>*').replace(/\\n/g, '<br>');
        result['altitudeStart'] = 0;
        result['altitudeEnd'] 	= 3000;
        result['web'] 			= '';
        result['webname'] 		= '';
        result['picture']        = result.type === -1                ? ''    : warningTypesString[ZAMG][result.type][1];
        result['urgency'] 			= 2;
        if (warningTypesString[ZAMG][result.type][0] == 'unbekannt') {
            ticaLog(0,'Bitte folgende Zeile im Forum posten. Danke', warn);
            ticaLog(0,'Unbekannter Typ: ' + result.type + ' Schlagzeile: ' + result.headline, warn);
        }
        result['typename']       = result.type === -1                ? ''    : warningTypesString[result.mode][result.type][0];

    } else if (mode === DWD2) {
        if (
            warn.RESPONSETYPE != 'Prepare'
            || warn.STATUS == 'Test'
            || getCapLevel(warn.SEVERITY) < minlevel
            || (warn.ALTITUDE && warn.ALTITUDE * 0.3048 > maxhoehe)
            || (warn.CEILING && warn.CEILING * 0.3048 < minhoehe)
        ) {
            let why = warn.RESPONSETYPE != 'Prepare' ? 'Responsetype nicht Prepare - ':'';
            why = warn.STATUS == 'Test' ? 'Testwarnung - ':'';
            why += (warn.ALTITUDE && warn.ALTITUDE * 0.3048 > maxhoehe) ? 'Höhenlage der Warnung ist zu hoch - ':'';
            why += (getCapLevel(warn.SEVERITY) < minlevel) ? 'Level zu niedrig - ':'';
            why += (warn.CEILING && warn.CEILING * 0.3048 < minhoehe) ? 'Höhenlage der Warnung ist zu niedrig - ':'';
            ticaLog(2, why + 'Übergebenene Warnung DWD2 verworfen');
            return null;
        }
        result['mode'] = DWD;
        result['start']         = warn.ONSET === undefined 			? null 	: getDateObject(warn.ONSET).getTime() || null;
        result['end']           = warn.EXPIRES === undefined 		? null 	: getDateObject(warn.EXPIRES).getTime() || null;
        result['ec_ii_type']    = warn.EC_II === undefined 			? -1 	: Number(warn.EC_II);
        result['picture']       = '';
        if (result.ec_ii_type != -1) {
            if (warningTypesString[DWD2][result.ec_ii_type] === undefined) {
                ticaLog(0,'Bitte das Json im Forum posten: EC: ' + warningTypesString[DWD2][result.ec_ii_type] ,'warn')
                ticaLog(0, JSON.stringify(warn), 'warn');
                result.type = -1
            } else {
                result.type = warningTypesString[DWD2][String(result.ec_ii_type)];
                result['picture']        = result.type === -1                ? ''    : warningTypesString[DWD][result.type][1];
            }
        }
        result['level']         = warn.SEVERITY === undefined 		? 0 	: getCapLevel(warn.SEVERITY);
        result['areaID'] 		= warn.AREADESC === undefined 	    ? '' 	: warn.AREADESC;
        result['altitudeStart'] = warn.ALTITUDE === undefined 	    ? 0 	: warn.ALTITUDE * 0.3048;
        result['altitudeEnd']   = warn.CEILING === undefined 	    ? 0 	: warn.CEILING * 0.3048;
        result['web'] 			= '';
        result['webname'] 		= '';
        //result['picture']       = result.type === -1                ? ''    : warningTypesString[DWD][result.type][1];
        result.messageHash      = JSON.stringify(result).hashCode();
        result['typename']       = result.type === -1                ? ''    : warningTypesString[result.mode][result.type][0];
        result['description']   = warn.DESCRIPTION === undefined 	? '' 	: warn.DESCRIPTION;
        result['headline']      = warn.HEADLINE === undefined 		? '' 	: warn.HEADLINE;
        result['instruction']   = warn.INSTRUCTION === undefined 	? '' 	: warn.INSTRUCTION;
        result['urgency'] 		= warn.URGENCY === undefined || warn.URGENCY == 'Immediate' ? 2 : 1;
    } else if (mode === UWZ) {
        if (
            warn.payload === undefined
            || warn.payload.altMin > maxhoehe
            || (warn.payload.altMax && warn.payload.altMax < minhoehe)

        ) {
            let why = warn.payload === undefined ? 'Datensatz unvollständig - ':'';
            why += warn.payload.altMin > maxhoehe ? 'Höhenlage der Warnung ist zu hoch - ':'';
            why += (warn.payload.altMax && warn.payload.altMax < minhoehe) ? 'Höhenlage der Warnung ist zu niedrig - ':'';
            ticaLog(2,why + 'Übergebenene Warnung UWZ verworfen');
            return null;
            }
        result['mode'] = UWZ;
        result['start'] 		= warn.dtgStart === undefined 							? null 	: warn.dtgStart * 1000 || null;
        result['end'] 			= warn.dtgEnd === undefined 							? null 	: warn.dtgEnd * 1000 || null;
        result['type'] 			= warn.type === undefined 								? -1 	: warn.type;
        result['level'] 		= warn.payload.levelName === undefined 					? 0 	: getUWZLevel(warn.payload.levelName);
        result['headline'] 		= warn.type === undefined 								? '' 	: 'Warnung vor '+warningTypesString[UWZ][result.type][0];
        result['areaID'] 		= warn.areaID === undefined 							? '' 	: warn.areaID;
        result['web'] 			= '';
        result.messageHash      = JSON.stringify(result).hashCode();
        result['description'] 	= warn.payload.translationsLongText.DE === undefined 	? '' 	: warn.payload.translationsLongText.DE;
        result['instruction'] 	= warn.instruction === undefined 						? '' 	: warn.instruction;
        result['webname'] 		= '';
        result['picture']        = result.type === -1                                    ? ''    : warningTypesString[UWZ][result.type][1];
        result['typename']       = result.type === -1                ? ''    : warningTypesString[result.mode][result.type][0];
        result['urgency'] 			= 2;
        if ( result.level < minlevel ) {ticaLog(2, 'Level zu niedrig - Übergebenene Warnung UWZ verworfen');return null;}
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
        result['instruction'] 			= warn.instruction === undefined 		      ? '' 	: removeHtml(warn.instruction);
        result['headline'] 				= warn.headline === undefined 			      ? ''	: removeHtml(warn.headline);
        result['typename'] 				= warn.event === undefined 				      ? '' 	: removeHtml(warn.event);
        result['type'] 					= result.typename.hashCode();
        result['severity'] 				= warn.severity === undefined 			      ? '' 	: warn.severity;
        //result['certainty']		 	= warn.certainty === undefined 			      ? ''	: warn.certainty;
        result['areaID'] 				= warn.area === undefined 				      ? ''	: getNinaArea(warn.area);
        result['level'] 				= warn.severity === undefined 			      ? 0	: getCapLevel(warn.severity, result.typename);
        result.messageHash      = JSON.stringify(result).hashCode();
        result['start'] 				= warn.onset === undefined 		              ? null 	: getDateObject(warn.onset).getTime() || null;
        result['end'] 					= warn.expires === undefined 			      ? null	: getDateObject(warn.expires).getTime() || null;
        //result['urgency'] 			= warn.urgency === undefined 			      ? '' 	: warn.urgency;
        result['html'] 					= {};
        result['html']['web'] 			= warn.web === undefined || !warn.web || !isValidUrl(warn.web)	      ? '' 	: warn.web;
        result['html']['instruction'] 	= warn.instruction === undefined 		      ? '' 	: warn.instruction;
        result['html']['headline'] 		= warn.headline === undefined 			      ? '' 	: warn.headline;
        result['html']['description'] 	= warn.description === undefined 		      ? '' 	: warn.description;
        result['picture']                = '';
        result['urgency'] 			= 2;
        if ( result.level < minlevel ) { ticaLog(2, 'Übergebenene Warnung NINA verworfen. Level' + result.level + ' kleiner als minlevel ' + minlevel);return null;}
    }
    result['color']             = getLevelColor(result.level, mode);
    result['id']                ='';
    result['pending']           = 0;
    result['hash']              = 0;
    result['repeatCounter']     = 0;
    result.ignored              = false;
    ticaLog(4, '2. getDatabaseData(warn, mode) result: ' + JSON.stringify(result));
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

    function getUWZLevel(warnName) {
        let result = -1; // -1 is an error!
        let alert = warnName.split("_");
        let colors = {
            color: ["green", "darkgreen", "yellow", "orange", "red", "violet"],
            level: [0, 0, 1, 2, 3, 4] // um 1 level reduziert, sond nicht mit DWD vergleichbar nach Erfahrungen
        };
        if (alert[0] == "notice") { result = 1; } else if (alert[1] == "forewarn") { result = 1; } else {
            result = colors.level[colors.color.indexOf(alert[2])];
        }
        return result;
    }
}

    // Gibt Farben für die level zurück
function getLevelColor(level, typ) {
    let color = [];
    if (typ === undefined) typ = UWZ;
    switch (typ) {
        case NINA:
        case UWZ:
        case DWD:
        case DWD2:
            color = [
                '#00ff00', // 0 - Grün
                '#00ff00', // 1 - Dunkelgrün
                '#fffc04', // 2 - Gelb Wetterwarnungen (Stufe 2) //vorher:#ffff00
                '#ffb400', // 3 - Orange Warnungen vor markantem Wetter (Stufe 3)
                '#ff0000', // 4 - Rot Unwetterwarnungen (Stufe 4) // im grunde höchste Stufe in diesem Skript.
                '#ff00ff', // 5 - Violett Warnungen vor extremem Unwetter (nur DWD/ Weltuntergang nach aktueller Erfahrung)
            ];
            if (level >= 0 && level <= 4) return color[level];
            if (level > 4) return '#ff00ff'
            break;
        case ZAMG:
            color = [
                '#00ff00',
                '#01DF3A',
                '#fffc04',
                '#ffc400',
                '#ff0404'
            ]
            if (level >= 0 && level <= 4) return color[level];
            if (level > 4) return '#ff00ff'
            break;
    }
    return '#00ff00';
}

// gibt Nina level zurück
function getCapLevel(str, type) {
    let ninaLevel = [
        'minor',
        'moderate',
        'severe',
        'extreme'
    ]
    let offset = 1;
    // Hochwassser ist immer Severe das ist im Vergleich denke ich zu hoch.
    //if (type == 'Hochwasserinformation') offset = 0;
    return ninaLevel.indexOf(str.toLowerCase()) + offset;
}

function removeHtml(a) {
    let b = a.replace(/<br\/>/ig, NEWLINE);
    return b.replace(/(&nbsp;|<([^>]+)>)/ig, '');
}
// Überprüfe wegen Nina - Adapter häufig die DB ob obj.ids gelöscht wurden.
// Dachte ich zuerst, die Server sind aber sehr unzuverlässig und Meldungen werden laufend nicht ausgeliefert.
// Folglich werden Entwarnung raus geschickt. Jetzt warten wir 10 * 10 = 100 Minuten entwarnen erst dann.
// Abgelaufene Meldungen werden aufgeräumt.
function activateSchedule() {
    if (removeSchedule) clearSchedule(removeSchedule);
    removeSchedule = schedule('30 */10 * * * *', function() {
        if (onStopped) {
            if (removeSchedule) clearSchedule(removeSchedule);
            return;
        }
        let c = false;
        for (let a = 0; a < warnDatabase.new.length; a++) {
            let w = warnDatabase.new[a];
            if (!extendedExists(w.id)) {
                if (warnDatabase.new[a].pending++ >= 10) { //  9 Durchläufe
                    ticaLog(1, 'Remove old warning with id: ' + warnDatabase.new[a].id + ' and headline: ' + warnDatabase.new[a].headline);
                    warnDatabase.new.splice(a--, 1);
                    c = true;
                }
            } else {
                w.pending = 0;
            }
            if (w.end && new Date(w.end + intervalMinutes * 65000) < new Date()) {
                ticaLog(1, 'Remove expired warning with id: ' + warnDatabase.new[a].id + ', headline: ' + warnDatabase.new[a].headline + ' expire:' + new Date(w.end));
                warnDatabase.new.splice(a--, 1);
                c = true;
            }
        }
        if (c && autoSendWarnings) {
            checkWarningsMain(false)
        }
    });
}

// entferne Eintrag aus der Database
function removeDatabaseDataID(id) {
    if (!id || (typeof id !== 'string')) return false;
    if (warnDatabase.new && warnDatabase.new.length > 0) {
        let i = warnDatabase.new.findIndex(function(j){return j.id == id});
        if (i!=-1) {
            warnDatabase.new.splice(i, 1);
            return true;
        }
    }
    return false;
}
/* *************************************************************************
* Datenbank ENDE
/* ************************************************************************* */
/* *************************************************************************
* Aufbereitung von Texten für die verschiedenen Pushmöglichkeiten
/* ************************************************************************* */
function getArtikelMode(mode, speak = false) {
    let r = SPACE;
    if (mode & DWD) r += ((uLogLevel&4) ? 'des DWD('+scriptName+') ' : 'des DWD ');
    if (mode & ZAMG) r += ((uLogLevel&4) ? 'des ZAMG('+scriptName+') ' : 'des ZAMG ');
    if (mode & UWZ) {
        if (r.length > 1) r += 'und ';
        if (speak) r += ((uLogLevel&4) ? 'der Unwetterzentrale('+scriptName+') ' : 'der Unwetterzentrale ');
        else r += ((uLogLevel&4) ? 'der UWZ('+scriptName+') ' : 'der UWZ ');
    }
    if (mode & NINA) {
        if (r.length > 1) r += 'und ';
        r += ((uLogLevel&4) ? 'von Nina('+scriptName+') ' : 'von Nina ');
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
function replacePlaceholder(str, insertText, insertText2) {
    let result = str;
    if (insertText2 !== undefined) result = result.replace(placeHolder+'1', insertText2)
    result = result.replace(placeHolder, insertText);
    return result;
}
// baut eine html table für Email
function buildHtmlEmail(mailMsg, headline, msg, color, last = false) {
    if (!mailMsg) mailMsg = html_prefix;
    if (headline) {
        if (color) {
            mailMsg += html_headline_color.replace('###color###', color).replace('###headline###', headline);
        }
        else mailMsg += html_headline.replace('###headline###', headline);
    }
    if (msg) mailMsg += html_message.replace('###message###', msg);
    if (last) mailMsg += html_end;
    return mailMsg;
}
/* Entfernt "°C" und anders aus Sprachmeldung und ersetzt es durch "Grad" */
/* noch nicht für UWZ angepasst */
function replaceTokenForSpeak(beschreibung) {
    let rueckgabe = beschreibung;
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
    } catch (e) { ticaLog(0,'replaceTokenForSpeak' + e, 'warn'); }
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
        let msg = obj.state.val;
        let user = msg.substring(1, msg.indexOf(']'));
        ticaLog(4, 'Telegramnachricht erhalten. Nutzer: ' + user + ' Nachricht: ' + msg);
        msg = msg.substring(msg.indexOf(']') + 1, msg.length);
        if ((uLogLevel&4) && msg.includes('Wwdmail')) {
            let olddebug = DEBUGSENDEMAIL;
            DEBUGSENDEMAIL = true;
            setState(mainStatePath + 'commands.' + konstanten[2].name, true, function() {
                setTimeout(function() {
                    DEBUGSENDEMAIL = olddebug;
                }, 200);
            });
        } else if (msg.includes('Wwdon') || msg == 'DWDUZWNINA#!§$debugan') {
            uLogLevel = switchFlags(uLogLevel, 4, true)
            ticaLog(0,'Debugmodus an');
        } else if (msg.includes('Wwdoff') || msg == 'DWDUZWNINA#!§$debugaus') {
            uLogLevel = switchFlags(uLogLevel, 4, false)
            ticaLog(0,'Debugmodus aus');
        } else if (msg.includes('#$WarnscriptLong%&') || msg.includes('#$WarnscriptShort%&')) {
            let long = !!(msg.includes('#$WarnscriptLong%&'))
            let token = long ? '#$WarnscriptLong%&' : '#$WarnscriptShort%&'
            msg = msg.substring(msg.indexOf(token)+ (token).length, msg.length);
            ticaLog(2, 'Telegramm-Detailanfrage erkannt, wird bearbeitet.')
            if ( !msg.isNaN && warnDatabase.new.findIndex((a) => a.hash == msg) != -1) {
                if ( uTelegramReplyMarkupInline ) {
                    sendTo(telegramInstanz, { user: user, answerCallbackQuery: { text: "gefunden", showAlert: false } });
                }
                warnDatabase.old = [];
                let oPd = uPushdienst;
                uPushdienst &= TELEGRAM;
                forceSpeak = forcedSpeak;
                onClickCheckRun = true;
                onClickCheckRunCmd = long ? 'Detailnachricht über Telegram' : 'Kurznachricht über Telegramm'
                let oldA = uTextMitAnweisungen, oldB = uTextMitBeschreibung, oldC = uTextHtmlMitOhneAlles;
                uTextMitAnweisungen = long;
                uTextMitBeschreibung = long;
                uTextHtmlMitOhneAlles = !long;

                checkWarningsMain(true, {hash:msg, isAnswer:true});

                uTextMitAnweisungen = oldA;
                uTextMitBeschreibung = oldB;
                uTextHtmlMitOhneAlles = oldC;
                onClickCheckRun = false;
                onClickCheckRunCmd = '';
                forceSpeak = false;
                uPushdienst = oPd;
            } else {
                if ( uTelegramReplyMarkupInline ) {
                    sendTo(telegramInstanz, { user: user, answerCallbackQuery: { text: "Warnung wurde aufgehoben", showAlert: true } });
                }
            }
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

            checkWarningsMain(true);

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
    ticaLog(1, 'Skripts gestoppt: ID:' + randomID);
    if (standaloneInterval) clearInterval(standaloneInterval);
    if (removeSchedule) clearSchedule(removeSchedule);

    setTimeout(callback, 2000);
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

async function extendedExistsAsync(id) {
    return (id) && ($(id).length > 0) && (existsStateAsync(id));
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
        let arr = [j.length];
        for (let a=0;a<j.length;a++) arr[a]=j[a];
        return arr;
    }
    return JSON.parse(JSON.stringify(j));
}
function ticaLog(loglevel, msg, channel){
    if (typeof loglevel === 'string') {
        channel = msg
        msg = loglevel
        loglevel = 1
    }
    if (loglevel <= uLogLevel || loglevel == 0) {
        if (channel === undefined) channel = 'info';
        let pre = '';
        switch (loglevel) {
            case 0:
            pre = 'always: '
            case 1:
            pre = 'info: '
            break
            case 2:
            pre = 'advance: '
            break
            case 4:
            pre = 'debug: '
            break
        }
        log(pre + msg, channel);
    }
}

function checkConfigVariable(v) {
    try {
        if (eval(v)) {let t = ''};
    } catch (e) {
        let m = 'Variable in der Konfiguration fehlt: "' + v +'" bitte auf Github nachschlagen und die Konfigzeile in dein lokales Skript kopieren.';
        ticaLog(0,m, 'warn');
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

function getEndfromID(id) {
    let arr = id.split('.');
    return arr[arr.length-1];
}
function getPreEndfromID(id) {
    let arr = id.split('.');
    return arr[arr.length-2];
}

function isValidUrl(str) {
   let pattern = new RegExp('^((ft|htt)ps?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name and extension
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?'+ // port
  '(\\/[-a-z\\d%@_.~+&:]*)*'+ // path
  '(\\?[;&a-z\\d%@_.,~+&:=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return pattern.test(str.replace(/(\<a href\=\")|(\"\>.+\<\/a\>)/ig,''));
}

async function createStateCustomAsync(id, def, options) {
    if (options === undefined ) {
        if (typeof(def) === 'object') {
            options = def;
            def = undefined;
        }
    }
    switch (options.type) {
        case 'number':
        options.def = def === undefined || typeof def !== 'number' ? 0 : def;
        break;
        case 'string':
        options.def = def === undefined || typeof def !== 'string' ? '' : def;
        break;
        case 'boolean':
        options.def = def === undefined || typeof def !== 'boolean' ? false : !!(def);
        break;
        default:
        def = def === undefined ? null : def;
        break;
    }
    if (options.def !== undefined) def = undefined
    if (!await existsStateAsync(id)) {
        await createStateAsync(id, options);
        if (def !== undefined) await setStateAsync(id, def, true);
    }
}
/* *************************************************************************
* Hilffunktion sonstiges
*           ENDE
/* ************************************************************************* */

setTimeout(init, 15000);
ticaLog(0,'Warte 15 Sekunden das bei einem eventuellen Restart alles beendet wurde!')
