# DWD-UWZ-NINA-Pushwarnungen-iobroker

## Support
Supportthread: [Iobroker Forum](https://forum.iobroker.net/topic/30616/script-dwd-uwz-nina-warnungen-als-push-sprachnachrichten/217)

## Änderungen
Änderungen ab V0.96  
- 0.96.1 eMail wird falsch dargestellt (behoben)  
- 0.96.2 Logausgabe wird alle 5 Minuten erstellt (behoben)  
- 0.96.3 Aufgehoben Meldung für einzelne Mitteilung wurde verschickt, wenn keine weitere nicht ignorierte Warnung vorhanden war. (Behoben) Allgemein gehaltene Entwarnung wird gesendet.
- 0.96.3 Scriptfehler bei ausfiltert von Datensätzen (DWD UWZ)  Betrifft minlevel und Höhenangaben.
- 0.97.0 Symbole zu Nachrichten hinzugefügt. Datenzweig .alert angepasst muß bei Update gelöscht werden.
- 0.97.1 Fehler in Warnungsverlängerung behoben.
- 0.97.2 Konfigurationsoption "const uFilterDuplicate" entfernt, kann ab 123456 kopiert werden.
- 0.97.2 Aufgehobene Warnungen per Sprachausgabe hielten sich nicht an die Zeitschaltuhr.
- 0.97.2.1 Doppeltes Symbole in aufgehobenen Einzelentwarnungen (Textnachricht) behoben.
- 0.97.3 var konstanten angepasst. Bei Update bin übernehmen, sonst normales kopieren
- s.o. Telegram & Pushover & Alexa & SayIt maximale Zeichenzahl hinzugefügt. Ländere Nachrichten werden aufgeteilt.
- s.o. Urls werden überprüft und verworfen, wenn sie nicht ins Muster passen.

## Scriptbeschreibung
Mit diesem Script kannst du Warnungen des Deutschen Wetterdienstes, der Unwetterzentrale oder von Nina (Notfallinformationssystem der BRD) als Text oder Sprachausgabe über verschiedene Wege ausgeben. Dieses geschieht entweder automatisch nach dem Eintreffen oder nach Betätigen eines Schalters.
Für DWD und UWZ gibt es Datenpunkte um bei bestimmten Gefahren selbst gesteuerte Aktionen auszuführen. Letzteres nutze ich z.B. um bei Sturm/Regen und offenen Fenstern auf diese hinzuweisen.

Unterstützt:
- Telegram, Pushover, Home24-Mediaplayer, SayIt, Alexa, Datenpunkt, eMail oder ioGo
- DWD-Adapter & Unwetterzentrale-Script & NINA-Adapter V0.0.22
- Wetterwarnung
- Wetterentwarnung

Funktionen:
- Filter die Warnungen nach doppelt, Gefahr(level) und Höhe
- Umschalten über iobroker zwischen DWD/UWZ/NINA
- Automatischer Versand und/oder manueller Nachrichtenversand
- Zeitschaltuhr für Sprachausgabe
- Datenpunkte mit der Startzeit, Endzeit, Type, Schlagzeile, Beschreibung, Farbe für Level(bgcolor) und höchstem Warnlevel dieses Typs
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
- Autorestart bei Datenpunkterstellung
- Alexa und SayIt mit Lautstärkeeinstellung. Alexagruppen unterstützen keine Lautstärke trotzdem konfigurieren.
- Zusätzliche Hervorhebung konfigurierbar über attentionWarningLevel (im Betreff/Ansage)
- Filter für Nina-sender
- Namesbezeichner für Nina verfügbar, diese werden benötigt, falls in der Warnung Ort genannt wird, das auszugeben und damit die Bedeutung der Warnung hervorzuheben.

Dank an:
- Mic für die createUserStates() Funktionen
- CruziX der diese eingebaut hat.
- crunchip, sigi234, Latzi fürs Testen und Ideen
- die ursprünglichen Authoren s.o.

Bedeutung der Farben:
- 0 - Grün
- 1 - Dunkelgrün
- 2 - Gelb Wetterwarnungen (Stufe 2)
- 3 - Orange Warnungen vor markantem Wetter (Stufe 3)
- 4 - Rot Unwetterwarnungen (Stufe 4).
- 5 - Violett Warnungen vor extremem Unwetter (DWD -> Weltuntergang nach aktueller Erfahrung und Nina -> höchste Stufe

## Konfiguration in ioBroker/Objekte unter mainStatePath.config
1. DWD/UWZ/NINA auf true stellen um den jeweiligen Modus zu aktiveren.
2. Mode ist aus Kompatibilitätsgründen drin und kann als Zeichenkette UWZ usw enthalten.
3. Punkte unter .auto aktiveren oder deaktivieren den automatischen Versand von Warnmeldungen.
- .on schaltet den kompletten automatischen Versand an/aus.
- die Restlichen schalten für einen bestimmten Modus eine bestimmte Art an oder aus.
4. Punkte unter manuell schalten für das manuelle Auslösen in einem bestimmten Modus die Möglichkeit an oder aus. (z.B. UWZ über alexa aber NINA nicht).

### Vorbereitung bei der Verwendung von NINA
- mindestens v0.0.22
- in der Adapterkonfiguration diesen Punkt aktivieren: **Json der Warnung in den State rawJson speichern (erhöhter Speicherbedarf)**

### Konfigurationsparameter NACH dem ersten Start
- DWD/UWZ/NINA muß gesetzt werden, ist alles deaktiviert.


## Konfigurationsparameter Script

### Konfigurationsparameter vor dem ersten Start
1. Der Datenpfad zu allen von diesem Script erstellten Datenpunkten.
```javascript
var mainStatePath = 'javascript.0.wetterwarnung_test.';
// oder
var mainStatePath = '0_userdata.0.wetterwarnung.';
```

2. Aktiveren der Ausgabemöglichkeiten. Es muß mindestens 1 Punkt aktiviert sein.
Zu den jeweiligen Optionen muß der entsprechende Adapter installiert werden und eventuell im folgenden noch weitere Konfigurationen vorgenommen werden.

```javascript
//uPushdienst+= TELEGRAM;          
//uPushdienst+= PUSHOVER;          
//uPushdienst+= EMAIL;             
//uPushdienst+= SAYIT;             
//uPushdienst+= HOMETWO;  // kein Adapter nötig        
//uPushdienst+= ALEXA;             
//uPushdienst+= STATE;    // kein Adapter nötig         
//uPushdienst+= IOGO;              
```
Um einen Punkt zu aktiveren entferne die //
z.B.
```javascript
uPushdienst+= TELEGRAM;
```
### Konfigurationsparameter Allgemein
- Stellt uLogAusgabe auf false wenn alles so läuft wie ihr euch das vorstellt.
```javascript
var uLogAusgabe=        true; // auf false gibt es überhaupt keine Ausgabe beim normalen Betrieb.
```

#### Sprachausgabe weitere Einstellungen
- Wenn die Sprachausgabe manuell ausgelöst wird, kann die Sprachausgabewarteschlage gelöscht (true) oder die abgerufenen Nachrichten angehangen werden (false).
```javascript
var uManuellClickClearSpeakMessageList = true;
```
- Die Sprachausgabe kann die Details zur Windgeschwindigkeit ausblenden (false) oder aussprechen (true)
```javascript
var windForceDetailsSpeak   = false;
```
#### Zeitschaltuhr für Sprachausgabe
- Ab wieviel Uhr darf die Sprachausgabe verwendet werden (Mo-Fr)
```javascript
var startTimeSpeak =        '6:45';
```
- Ab wieviel Uhr darf die Sprachausgabe am Wochenende verwendet werden (Sa-So)
```javascript
var startTimeSpeakWeekend = '9:00';
```
- Wann endet die Sprachausgabeabends
```javascript
var endTimeSpeak =          '22:30';
```
- Das manuelle Auslösen der Sprachausgabe berücksichtigt die Zeitschaltuhr (false) es ignoriert sie (true)
```javascript
var forcedSpeak             = true;
```
#### Filtermöglichkeiten für Warnungen
1. minlevel hiermit bestimmt man ab welchem Level Warnungen von diesem Skript berücksichtigt werden. Dieser Wert sollte nicht höher als 3 eingestellt sein.
```javascript
const minlevel                      =    1
```
2. attentionWarningLevel Warnungen gleich/über diesem Wert werden extra hervorgehoben. Die Überschriften zeigen auf Gefahr hin. Pushover-Nachrichten werden mit höherer Prioritätversand. Alle internen nicht einstellbaren Filter/ Filter die im 2. Konfigurationsabschnitt stehen übergehen diese Warnung.
```javascript
const attentionWarningLevel         =    4
```
3. Warnungen von DWD und UWZ kommen gelegentlich mit einer von/bis Höhenangabe.
- Tragt bitte hier die Höhe des tiefesten Punktes in eurem Gebiet ein, den ihr in eurem täglichen Leben aufsucht. In meiner Region kommen Meldungen eher selten mit dem "bis" Eintrag.
```javascript
const minhoehe                      =    0
```
- Hier den höchsten Punkt. Dieser wird mit dem "von" Eintrag verglichen. Ich nehme die Höhe meines Ortes 350m +/- 100m
```javascript
const maxhoehe                      =    5000
```

### Konfigurationsparameter für Pushmöglichkeiten
- optionale Punkte brauchen nicht angepasst zu werden, wenn die Möglichkeit oben aktiviert wurde.
- nicht optionale Punkte **müssen** angepasst/überprüft werden, wenn die Möglichkeit oben aktiviert wurde.

3. Einstellungen zu Telegram:  **(optional)**
- Stelle hier Optional bestimmte Nutzer oder ChatID ein. Einzelnutzer ['Hans']; Multinutzer ['Hans', 'Gretel']; Nutzer vom Adapter übernehmen [];
- Die Instanz nur anpassen, wenn deine davon abweicht. Das gilt für jede Instanzeinstellung
```javascript
var telegramUser        = [''];
var telegramChatId      = [''];
var telegramInstanz     = 'telegram.0';
```

4. eMail:  **(optional)**
- Stelle hier Optional 1 Emailadresse ein, von der versendet wird, und mehrere Emailadressen die empfangen sollen.
```javascript
var senderEmailID       =   [""];// 1 Eintrag erlaubt [] oder ["email1"]
var empfaengerEmailID   =   [""];// Mehrere Empfänger möglich. [] oder ["email1"] oder ["email1","email2"]
var emailInstanz        =   'email.0';
```

5. Pushover:  **(optional)**
- DeviceName, hier könnt ihr eines der angemeldeten Gerät bestimmen, das die Nachrichten erhalten soll. Ist kein Gerät bestimmt bekommen alle die Nachricht.
- uPushoverSound bietet euch die Möglichkeit einen eigenen Sound für die Nachricht auszuwählen. Was ihr dort eintragen könnt findet ihr dort: https://pushover.net/api#sounds
```javascript
var uPushoverDeviceName     = '';
var uPushoverSound          = '';  
var pushoverInstanz         = 'pushover.0';
```
6. ioGo **(optional)**
- ioGoUser: Tragt keinen, einen, oder mehrere "ID des Gerätes" ein.
```javascript
var ioGoUser = [''];
```

6. Home24:
- Das ist ungetestet, benutzt besser SayIt. Eingabe IP-Adresse incl. Port für Home24-Mediaplayer mehrere möglich
```javascript
var idMediaplayer       = ["192.168.178.x:Port"]; // (muß einen sinnvollen Wert beinhalten, wenn aktiviert)
```
7. SayIt
- idSayIt muß korrekt ausgefüllt sein, mit dem Datenpfad zum .text Datenpunkt, mehrere möglich.
- sayItVolumen muß die gleiche Anzahl an Einträgen haben wie idSayIt 0-100
```javascript
var idSayIt             = ["sayit.0.tts.text"]; // (muß einen sinnvollen Wert beinhalten, wenn aktiviert)
var sayItVolumen        = [30]; // gleiche Anzahl wie idSayIt
```
8 Alexa
- idAlexaSerial beinhaltet die Seriennummer deines Echos/deiner Echos. var idAlexaSerial =['G090RV32984110Y', 'G090RV32984110Y'];
- alexaVolumen 0-100 die gleiche Anzahl wie idAlexaSerial z.B. [30,30];
```javascript
var idAlexaSerial       = [''];
var alexaVolumen        = [30];
var alexaInstanz        = 'alexa2.0';
```
### Konfigurationsparameter zu den Modi DWD, UWZ, NINA
1. Einstellungen zur Unwetterzentrale/UWZ:  
Hier gibts du die UWZ RegionID an. Also z.B. UWZDE12345 und den Namen deines Ortes z.B. Entenhausen.
```javascript
var regionName          = [['UWZDE12345','Entenhausen']];
```
2. Einstellungen zu Nina
- Hier stellt bitte euren Ort und euren Landkreis ohne (Kreis, Landkreis, etc) ein. Warnungen von Nina kommen mit Aufgelisteten Orten, das Skript sucht dort drin nach euren Bezeichnern und gibt den gefundenen in der Warnung mit aus.
```javascript
var uGemeinde = '';
var uLandkreis = '';
```
## Support
- Findet ihr: https://forum.iobroker.net/topic/30616/script-dwd-uwz-nina-warnungen-als-push-sprachnachrichten/216
