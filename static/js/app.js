const metadataPanel = d3.select("#state-metadata");
const fieldUnits = {
    "Humidity": "humidity unit",
    "Pressure": "pressure unit",
    "Temperature": "°F",
    "Cloud_cover": "",
    "Precip_intensity": "inches per hour",
    "Visibility": "miles",
    "Wind_speed": "mph"};
const fieldList = Object.keys(fieldUnits);
const dropdown = d3.select("#selDataset");
const defaultChoice = "All States";
let prevState = defaultChoice;
let stateData = {};
let myMap = L.map("map");
  
// Adding the tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// query API, perform initial setup
fetch("/data").then((response) => response.json()).then(function(response) {
    newState(defaultChoice);

    console.log(response[0]); // debug
  
    // Loop through the data
    for (const report of response) {
        let state = report.State;
  
        // Only mark reports with useful info
        if (report.Latitude && report.Longitude && report.Observed) {
            if (!stateData[state]) newState(state);
            addMarker(report);
        }
    }

    // Alphabetize list, keeping the default at the top
    let stateList = Object.keys(stateData).sort();
    stateList.unshift(stateList.splice(stateList.indexOf(defaultChoice), 1)[0]);

    // Give each location chart data and dropdown entry, calculate averages
    for (const state of stateList) {
        stateData[state].bar[0].x = Object.keys(stateData[state].seasonCounts);
        stateData[state].bar[0].y = Object.values(stateData[state].seasonCounts);

        stateData[state].line[0].x = Object.keys(stateData[state].yearCounts).sort();
        stateData[state].line[0].y = stateData[state].line[0].x.map(index => stateData[state].yearCounts[index]);

        dropdown.append("option").attr("value", state).text(state);

        for (const field of fieldList) {
            metadataAverage(state, field);
        }
    }

    // Initialize graphics with first item in dropdown menu
    optionChanged(dropdown.select("option").attr("value"));
});

// Get average of recorded total
function metadataAverage(state, field) {
    let avgFieldName = "Avg " + field;
    stateData[state].metadata[avgFieldName] = Math.round(stateData[state].totals[field] / stateData[state].counts[field] * 100) / 100;
}

// Add given value to total for given field
function accumulateValue(state, field, addend) {
    stateData[state].totals[field] += addend;
    stateData[state].counts[field]++;
}

// Add new marker
function addMarker(report, state = defaultChoice) {
    let lat = report.Latitude;
    let long = report.Longitude;
    let desc = report.Observed;
    let num = report.Number;
    let date = report.Date;
    let year = date.substring(0,4);
    let season = report.Season;

    // Add marker to markerClusterGroup
    stateData[state].markers.addLayer(L.marker([lat, long])
        .bindPopup(`<b>Report #${num}:</b> ${desc} <b>--${date}</b>`, {maxHeight: 300}));

    // Count sighting in relevant fields
    countSighting(state, "yearCounts", year);
    countSighting(state, "seasonCounts", season);
    stateData[state].metadata["Total Sightings"]++;

    for (const field of fieldList) {
        accumulateValue(state, field, Number(report[field]));
    }

    if (state === defaultChoice) addMarker(report, report.State); // Woo recursion!
}

// Count sighting where appropriate
function countSighting(state, field, subfield) {
    if (!stateData[state][field][subfield]) stateData[state][field][subfield] = 0;
    stateData[state][field][subfield]++;
}

// Set up new state with markers, metadata, etc.
function newState(state) {
    stateData[state] = {
        markers: L.markerClusterGroup(),
        yearCounts: {},
        seasonCounts: {
            "Spring": 0,
            "Summer": 0,
            "Fall": 0,
            "Winter": 0
        },
        totals: {},
        counts: {},
        metadata: {
            ["Total Sightings"]: 0
        },
        bar: [{
            type: "bar",
            x: [],
            y: []
        }],
        line: [{
            x: [],
            y: []
        }]
    }

    for (const field of fieldList) {
        stateData[state].totals[field] = 0;
        stateData[state].counts[field] = 0;
    }
}

// Update page on dropdown selection
function optionChanged(state) {
    // Clear old stuff
    metadataPanel.selectAll("div").remove();
    myMap.removeLayer(stateData[prevState].markers);
    prevState = state;

    console.log(`${state}:`); // debug
    console.log(stateData[state]); // debug

    // Map stuff
    myMap.addLayer(stateData[state].markers);
    myMap.fitBounds(stateData[state].markers.getBounds());

    // Bar chart
    let barLayout = {
        title: {
            text: `Bigfoot Sightings Per<br>Season In ${state}`,
            font: {
                size: 20
            }
        },
        xaxis: {
            title: {
                text: "Season"
            }
        },
        yaxis: {
            title: {
                text: "Number of Sightings"
            }
        }
    }
    Plotly.newPlot("bar", stateData[state].bar, barLayout);

    // Line chart
    let lineLayout = {
        title: {
            text: `Bigfoot Sightings Over<br>Time In ${state}`,
            font: {
                size: 20
            }
        },
        xaxis: {
            title: {
                text: "Year"
            }
        },
        yaxis: {
            title: {
                text: "Number of Sightings"
            }
        }
    }
    Plotly.newPlot("line", stateData[state].line, lineLayout);

    // Metadata
    for (const [key, value] of Object.entries(stateData[state].metadata)) {
        let field = key.substring(4);
        let unit = "";
        if (fieldUnits[field]) unit = fieldUnits[field];
        if (value) {
            let stat = metadataPanel.append("div");
            stat.append("b").text(`${key}: `);
            stat.append().text(`${value} ${unit}`);
        }
    }
}