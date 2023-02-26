const metaPanel = d3.select("#state-metadata");
const fieldUnits = {
    "Temperature": " °F",
    "Precip_intensity": " in/hr",
    "Wind_speed": " mph",
    "Humidity": "%",
    "Cloud_cover": "%",
    "Visibility": " miles",
    "Pressure": " hPa"};
const fieldList = Object.keys(fieldUnits);
const dropdown = d3.select("#selDataset");
const defaultChoice = "All States";
let prevState = defaultChoice;
let stateData = {};
let myMap = L.map("map");
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">\
        OpenStreetMap</a> contributors'
}).addTo(myMap);

////////////////////////////////////////////////////////////////////////////////

// query API, perform initial setup
fetch("/data").then(response => response.json())
    .then(response => init(response));

// Initial setup
function init(response) {
    newState(defaultChoice);

    //console.log(response[0]); // debug
  
    response.forEach(report => {
        let state = report.State;
        if (report.Latitude && report.Longitude && report.Observed) {
            if (!stateData[state]) newState(state);
            addMarker(report);
        }
    });

    // Alphabetize list, keeping the default at the top, for dropdown order
    let stateList = Object.keys(stateData).sort();
    stateList.unshift(stateList.splice(stateList.indexOf(defaultChoice), 1)[0]);

    // Fill out stateData and build dropdown menu
    stateList.forEach(state => stateSetup(state, stateData[state]));

    let firstItem = dropdown.select("option").attr("value");
    optionChanged(firstItem, stateData[firstItem]);
}

function newState(state) {
    stateData[state] = {
        markers: L.markerClusterGroup(),
        seasonCounts: {Spring: 0, Summer: 0, Fall: 0, Winter: 0},
        totalSightings: 0,
        hotspots: [],
        bar: [{type: "bar", x: [], y: []}],
        line: [{x: [], y: []}]
    }

    let objKeys = ["yearCounts", "countyCounts",
        "fieldCounts", "fieldTotals", "fieldAvgs"];
    objKeys.forEach(key => stateData[state][key] = {});

    fieldList.forEach(field => {
        stateData[state].fieldCounts[field] = 0;
        stateData[state].fieldTotals[field] = 0
    });
}

function addMarker(report, state = stateData[defaultChoice]) {
    popText = `<b>${report.Date}, Report #${report.Number}:</b>
        </br>${report.Observed}`;
    state.markers.addLayer(L.marker([report.Latitude, report.Longitude])
        .bindPopup(popText, {maxHeight: 300}));

    countVisit(state, "yearCounts", report.Date.substring(0,4));
    countVisit(state, "seasonCounts", report.Season);
    countVisit(state, "countyCounts", report.County);
    state.totalSightings++;

    fieldList.forEach(field =>
        accumulateValue(state, field, Number(report[field])));

    if (state === stateData[defaultChoice])
        addMarker(report, stateData[report.State]); // Woo recursion!
}

function countVisit(state, field, subfield) {
    if (!state[field][subfield]) state[field][subfield] = 0;
    state[field][subfield]++;
}

function accumulateValue(state, field, addend) {
    state.fieldTotals[field] += addend;
    state.fieldCounts[field]++;
}

// Set up chart parameters, dropdown option, and metadata tidbits
function stateSetup(stateName, state) {
    state.bar[0].x = Object.keys(state.seasonCounts);
    state.bar[0].y = Object.values(state.seasonCounts);

    state.line[0].x = Object.keys(state.yearCounts).sort();
    state.line[0].y = state.line[0].x.map(index => state.yearCounts[index]);

    dropdown.append("option").attr("value", stateName).text(stateName);

    countyMax(state);
    fieldList.forEach(field => {
        calcAvgs(state, field);
        if (fieldUnits[field] === "%")
            state.fieldAvgs[field] = Math.round(state.fieldAvgs[field] * 100);
    });
}

function countyMax(state) {
    let counties = state.countyCounts;
    state.hotspots = Object.keys(counties).filter(county => {
        return counties[county] === Math.max(...Object.values(counties));
    });
};

function calcAvgs(state, field) {
    let rawAvg = state.fieldTotals[field] / state.fieldCounts[field];
    state.fieldAvgs[field] = Math.round(rawAvg * 100) / 100;
}

// Update page on dropdown selection
function optionChanged(stateName, state) {
    metaPanel.selectAll("div").remove();
    myMap.removeLayer(stateData[prevState].markers);
    prevState = stateName;

    //console.log(`${stateName}:`); // debug
    //console.log(state); // debug

    myMap.addLayer(state.markers);
    myMap.fitBounds(state.markers.getBounds());

    let barLayout = {
        title: {
            text: `Bigfoot Sightings Per<br>Season In ${stateName}`,
            font: {size: 20}
        },
        xaxis: {title: {text: "Season"}},
        yaxis: {title: {text: "Number of Sightings"}}
    }
    Plotly.newPlot("bar", state.bar, barLayout);

    let lineLayout = {
        title: {
            text: `Bigfoot Sightings Over<br>Time In ${stateName}`,
            font: {size: 20}
        },
        xaxis: {title: {text: "Year"}},
        yaxis: {title: {text: "Number of Sightings"}}
    }
    Plotly.newPlot("line", state.line, lineLayout);

    // Metadata
    let totalListing = metaPanel.append("div");
    totalListing.append("b").text("Total Sightings: ");
    totalListing.append().text(state.totalSightings);

    if (state.countyCounts[state.hotspots[0]] === 1)
        metaPanel.append("div").append("b")
            .text("No more than one visit per county");   
    else listHotspots(state);

    let avgDiv = metaPanel.append("div");
    avgDiv.append("b").text("Averages:");
    let avgList = avgDiv.append("ul")
    Object.entries(state.fieldAvgs).forEach(([key, value]) => {
        if (value) {
            let stat = avgList.append("li");
            stat.append("b").text(`${key}: `);
            stat.append().text(`${value}${fieldUnits[key]}`);
        }
    });
}

// Display all the counties with the most Bigfoot visits for a given state
function listHotspots(state) {
    let hotDiv = metaPanel.append("div");
    let plural = (state.hotspots.length > 1 ? 1 : 0);
    let maxVisits = state.countyCounts[state.hotspots[0]];
    hotDiv.append("b").text(`Most Visited Count${plural ? "ies" : "y"} `);
    hotDiv.append().text(`(${maxVisits} visits${plural ? " each" : ""})`);
    hotDiv.append("b").text(":");
    let hotspotList = hotDiv.append("ul");
    state.hotspots.forEach(county => hotspotList.append("li").text(county));
}