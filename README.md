# DWD-UWZ-Pushwarnungen-iobroker
stable: dwd_uwz_script_iobroker.js

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

Dank an:
- Mic für die createUserStates() Funktionen
- CruziX der diese eingebaut hat.
- crunchip, sigi234, Latzi fürs Testen und Ideen
- die ursprünglichen Authoren siehe Scriptheader
- dwm für UWZ Script


Im Ordner Test finde ihr die Version an der aktuell gearbeitet wird. 

Support: https://forum.iobroker.net/topic/30616/script-dwd-uwz-warnungen-als-pushnachrichten/
