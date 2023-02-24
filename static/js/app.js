let myMap = L.map("map");
let stateData = {};
const defaultChoice = "ALL STATES"; // TODO: match caps
let prevState = defaultChoice;
const dropdown = d3.select("#selDataset");
const metadataPanel = d3.select("#sample-metadata");
const fieldsToAverage = ["Latitude", "Longitude"]; // TODO: match JSON
  
// Adding the tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);
  
// Store the API query variables
// For docs, refer to https://dev.socrata.com/docs/queries/where.html
// And, refer to https://dev.socrata.com/foundry/data.cityofnewyork.us/erm2-nwe9
const baseURL = "https://data.cityofnewyork.us/resource/fhrw-4uyv.json?";
const date = "$where=created_date between'2016-01-01T00:00:00' and '2017-01-01T00:00:00'";
const complaint = "&complaint_type=Rodent";
const limit = "&$limit=10000";
  
// Assemble the API query URL
const url = baseURL + date + complaint + limit;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// query API, perform initial setup
d3.json(url).then(function(response) { // TODO: change to fetch(url)
    newState(defaultChoice);

    console.log(response[0]); // debug
  
    // Loop through the data
    for (const report of response) {
        let state = report.borough; // TODO: match JSON
  
        // Only mark reports with useful info
        if (report.location && report.descriptor) { // TODO: match JSON
            if (!stateData[state]) newState(state);
            addMarker(report); // TODO: match JSON
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

        for (const field of fieldsToAverage) {
            metadataAverage(state, field);
        }
    }

    // Initialize graphics with first item in dropdown menu
    optionChanged(dropdown.select("option").attr("value"));
});

// Get average of recorded total
function metadataAverage(state, field) {
    let avgFieldName = "Average " + field;
    stateData[state].metadata[avgFieldName] = Math.round(stateData[state].totals[field] / stateData[state].counts[field] * 100) / 100;
}

// Add given value to total for given field
function accumulateValue(state, field, addend) {
    stateData[state].totals[field] += addend;
    stateData[state].counts[field]++;
}

// Add new marker
function addMarker(report, state = defaultChoice) {
    let location = report.location; // TODO: match JSON
    let desc = report.descriptor; // TODO: match JSON
    let year = report.created_date.substr(5,2); // TODO: match JSON
    let season = report.descriptor; // TODO: match JSON

    // Add marker to markerClusterGroup
    stateData[state].markers.addLayer(L.marker([location.coordinates[1], location.coordinates[0]]) // TODO: match JSON
        .bindPopup(desc));

    // Count sighting in relevant fields
    countSighting(state, "yearCounts", year);
    countSighting(state, "seasonCounts", season);
    stateData[state].metadata["Total Sightings"]++;

    for (const field of fieldsToAverage) {
        accumulateValue(state, field, Number(report[field.toLowerCase()])); // TODO: remove .toLowercase() if needed
    }

    if (state === defaultChoice) addMarker(report, report.borough); // Woo recursion! // TODO: match JSON
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
        seasonCounts: { // TODO: Change to actual seasons
            "Rat Sighting": 0,
            "Condition Attracting Rodents": 0,
            "Mouse Sighting": 0,
            "Signs of Rodents": 0
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

    for (const field of fieldsToAverage) {
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
        if (value) metadataPanel.append("div").text(`${key}: ${value}`);
    }
}