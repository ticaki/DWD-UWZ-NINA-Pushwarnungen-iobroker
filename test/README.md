In diesem Ordner findet ihr die aktuelle Testverson. Diese Version ist in der Regel als ungetestet anzusehen.



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

Dank an:
- Mic für die createUserStates() Funktionen
- CruziX der diese eingebaut hat.
- crunchip, sigi234, Latzi fürs Testen und Ideen
- die ursprünglichen Authoren s.o.

Bedeutung der Farben:
0 - Grün
1 - Dunkelgrün
2 - Gelb Wetterwarnungen (Stufe 2)
3 - Orange Warnungen vor markantem Wetter (Stufe 3)
4 - Rot Unwetterwarnungen (Stufe 4) // im Grunde höchste Stufe in diesem Skript.
5 - Violett Warnungen vor extremem Unwetter (nur DWD/ Weltuntergang nach aktueller Erfahrung)


**Erläuterung der Konfigurationsparameter:**

1. Der Datenpfad zu allen von diesem Script erstellten Datenpunkten.
```javascript
var mainStatePath = 'javascript.0.wetterwarnung_test.';
// oder
var mainStatePath = '0_userdata.0.wetterwarnung.';
```

2. Aktiveren der Ausgabemöglichkeiten. Zu den jeweiligen Optionen muß der entsprechende Adapter installiert werden und eventuell im folgenden noch weitere Konfigurationen vorgenommen werden.

```javascript
//uPushdienst+= TELEGRAM;          
//uPushdienst+= PUSHOVER;          
//uPushdienst+= EMAIL;             
//uPushdienst+= SAYIT;             
//uPushdienst+= HOMETWO;          
//uPushdienst+= ALEXA;             
//uPushdienst+= STATE;             
//uPushdienst+= IOGO;              
```
Um einen Punkt zu aktiveren entferne die //
z.B.
```javascript
uPushdienst+= TELEGRAM;
```

3. Einstellungen zu Telegram  
Stelle hier Optional bestimmte Nutzer oder ChatID ein. Die Instanz nur anpassen, wenn deine davon abweicht.
```javascript
var telegramUser        = ['']; // Einzelnutzer ['Hans']; Multinutzer ['Hans', 'Gretel']; Nutzer vom Adapter übernehmen [];
var telegramChatId      = [''];
var telegramInstanz=    'telegram.0';
```

4. Einstelungen zu UWZ  
Hier gibts du die UWZ RegionID an. Also z.B. UWZDE12345 und den Namen deines Ortes z.B. Entenhausen
```javascript
var regionName          = [['UWZDE12345','Entenhausen']];
```
Der Pfad der im UWZ Script eingetragen ist.
```javascript
var uwzPath=            'javascript.0.UWZ';
```



```javascript
```
```javascript
```
```javascript
```
