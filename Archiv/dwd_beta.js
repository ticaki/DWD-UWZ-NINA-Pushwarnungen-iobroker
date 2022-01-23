//Version 0.4

/********************* Hier die Warnzellen-Id's eintragen ***************************************************************************/
/* nur Landkreis/Großstädte werden verwendet: https://www.dwd.de/DE/leistungen/opendata/help/warnungen/cap_warncellids_csv.csv?__blob=publicationFile&v=3 */
const warncellid = ['107133000'];
const land = 'nrw';
/************************************************************************************************************************************/

var debuglevel = 1;
var debugchannel = 'info';

var channelId = '0_userdata.0.Wetterwarnung.DWD.'+instance+'.warning';

var intervalMinutes = 10;
var numOfWarnings = 5;


const axios = require('axios');
var url='https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json';


const states = [
    { id:"begin",default:"", options: {name: "Warning begin",type: "number",role: "value.time",read: true,write: true}},
    { id:"description", default:"", options: {name: "Warning description",type: "string",role: "weather.state",read: true,write: true}},
    { id:"end", default:"", options: {name: "Warning end",type: "number",role: "value.time",read: true,write: true}},
    { id:"headline", default:"", options: {name: "Warning description",type: "string",role: "weather.state",read: true,write: true}},
    { id:"level",default: 0, options: {name: "Warning level",type: "number",role: "value.warning",read: true,write: true,states: {1: "Preliminary info",2: "Minor",3: "Moderate",4: "Severe",5: "Extreme"}}},
    { id:"map", default:"", options: {name: "Link to chart",type: "string",role: "weather.chart.url",read: true,write: true}},
    { id:"object", default:"", options: {name: "JSON object with warning",type: "object",role: "weather.json",read: true,write: true}},
    { id:"severity", default: 0, options: {name: "Warning severity",type: "number",role: "value.severity",read: true,write: true,states: {0: "None",1: "Minor",2: "Moderate",3: "Severe",4: "Extreme",9: "Heat Warning",11: "No Warning",19: "UV Warning",49: "Strong Heat",50: "Extreme Heat"}}},
    { id:"text", default: "", options: {name: "Warning text",type: "string",role: "weather.title.short",read: true,write: true}},
    { id:"type", default: 0, options: {name: "Warning type",type: "number",role: "weather.type",read: true,write: true,states: {0: "Thunderstorm",1: "Wind/Storm",2: "Rain",3: "Snow",4: "Fog",5: "Frost",6: "Ice",7: "Thawing",8: "Heat",9: "UV warning"}}}
];


createStates(numOfWarnings);

function extendedExists(id) {
    return (id) && ($(id).length > 0) && (existsState(id));
}

async function createStates(anz) {
    for (let i = 0; i < anz; i++) {
        var baseChannelId = channelId + (i == 0 ? '' : i) + '.';
        for (let a = 0; a < states.length; a++) {
            let dp = states[a];
            let id = baseChannelId + dp.id;
            if (!extendedExists(id)) {
                const tw = await createStateAsync(id, dp.default, dp.options).catch(error =>{log(error);});
            }
        }
    }
    await work();
    setInterval(work, intervalMinutes * 60 * 1000);
}


async function writeResultEntry(warnObj, _i) {
    var baseChannelId = channelId + (_i == 0 ? '' : _i) + '.';
    const oldObject = await getStateAsync(baseChannelId + "object");
    if (oldObject && JSON.stringify(warnObj) == JSON.stringify(oldObject.val)) {
        dwmlog('Datensatz ' + (_i+1) + ' ist schon vorhanden', 4);
        return;
    }

    const maps = ['gewitter', 'sturm', 'regen', 'schnee', 'nebel', 'frost', 'glatteis', 'tauwetter', 'hitze', 'uv'];
    let tempObj = {};
    tempObj[states[0].id] = warnObj.start || Number("");
    tempObj[states[1].id] = warnObj.description || '';
    tempObj[states[2].id] = warnObj.end || Number("");
    tempObj[states[3].id] = warnObj.headline || '';
    tempObj[states[4].id] = warnObj.level === undefined || warnObj.level === null ? -1 : parseInt(warnObj.level, 10);
    tempObj[states[6].id] = warnObj;
    tempObj[states[7].id] = warnObj.level > 1 ? warnObj.level - 1 : 0;
    tempObj[states[8].id] = warnObj.event || '';
    tempObj[states[9].id] = warnObj.type === undefined || warnObj.type === null ? -1 : parseInt(warnObj.type, 10);
    if (warnObj.type !== undefined && warnObj.type !== null) {
        tempObj[states[5].id] = 'https://www.dwd.de/DWD/warnungen/warnapp_gemeinden/json/warnungen_gemeinde_map_' + land + '_' + maps[warnObj.type] + '.png';
    } else {
        tempObj[states[5].id] = '';
    }
    for (let a = 0; a < states.length; a++) {
        let dp = states[a];
        if (extendedExists(baseChannelId + dp.id)) setState(baseChannelId + dp.id, tempObj[dp.id], true);
    }
}



function processData(area, thedata) {
    if (!thedata) {
        return;
    }
    var jsonString = String(thedata);
    var newString = jsonString.replace('warnWetter.loadWarnings(', '');
    newString = newString.replace(');', '');
    var newJSON = JSON.parse(newString);
    var anz = newJSON.warnings.hasOwnProperty(area) ? newJSON.warnings[area].length : 0;
    for (var i = 0; i < numOfWarnings; i++) {
        if (i >= anz || !newJSON.warnings[area][i].hasOwnProperty("headline")) writeResultEntry({}, i);
        else writeResultEntry(newJSON.warnings[area][i], i);
    }
    dwmlog(anz ? JSON.stringify(newJSON.warnings[area]) : '{}', 2);
}
async function work() {
    for (var i = 0; i < warncellid.length; i++) {
        await axios.get(url)
            .then(results => {
                dwmlog("AREA: " + warncellid[i], 4);
                dwmlog("UWZ Body: " + JSON.stringify(results.data), 4);
                dwmlog("Status: " + results.status, 4);
                if (!results) log ('!results');
                if (results === undefined) log('results === undefined')
                if (results.status == 200) {
                    processData(+warncellid[i], results.data);
                } else {
                    dwmlog('Keine Daten empfangen', 1);
                }
            })
            .catch(error => {
                if (error == undefined) {
                    dwmlog('Fehler im Datenabruf ohne Errorlog',1)
                } else if (error.response == undefined) {
                    dwmlog(error, 1);
                } else if (error.response.status == 404) {
                    dwmlog(error.message, 1);
                } else {
                    dwmlog(error.response.data, 1);
                    dwmlog(error.response.status, 1);
                    dwmlog(error.response.headers, 1);
                }
            })
    }
}

function dwmlog(message, level, channel) {
    if (channel === undefined) {
        channel = debugchannel;
    }
    if (level === undefined) {
        level = debuglevel;
    }
    if (debuglevel >= level) {
        log(message, channel);
    }
}
