const metadataPanel = d3.select("#state-metadata");
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
        if (stateData[state].seasonCounts.Unknown) delete stateData[state].seasonCounts.Unknown; // TODO: remove if new JSON doesn't need this
        stateData[state].bar[0].x = Object.keys(stateData[state].seasonCounts);
        stateData[state].bar[0].y = Object.values(stateData[state].seasonCounts);

        stateData[state].line[0].x = Object.keys(stateData[state].yearCounts).sort();
        stateData[state].line[0].y = stateData[state].line[0].x.map(index => stateData[state].yearCounts[index]);

        dropdown.append("option").attr("value", state).text(state);

        for (const field of fieldList) calcAverages(state, field);
        stateData[state].fieldAverages.Cloud_cover = Math.round(stateData[state].fieldAverages.Cloud_cover * 100); // TODO: remove if new JSON doesn't need this
        stateData[state].fieldAverages.Humidity = Math.round(stateData[state].fieldAverages.Humidity * 100); // TODO: remove if new JSON doesn't need this

        countyMax(state);
    }

    // Initialize graphics with first item in dropdown menu
    optionChanged(dropdown.select("option").attr("value"));
});

// Get average of recorded total, to two decimal places
function calcAverages(state, field) {
    stateData[state].fieldAverages[field] = Math.round(stateData[state].fieldTotals[field] / stateData[state].fieldCounts[field] * 100) / 100;
}

// Add given value to total for given field
function accumulateValue(state, field, addend) {
    stateData[state].fieldTotals[field] += addend;
    stateData[state].fieldCounts[field]++;
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
    let county = report.County;

    // Add marker to markerClusterGroup
    stateData[state].markers.addLayer(L.marker([lat, long])
        .bindPopup(`<b>Report #${num}:</b> ${desc} <b>--${date}</b>`, {maxHeight: 300}));

    // Count sighting in relevant fields
    countSighting(state, "yearCounts", year);
    countSighting(state, "seasonCounts", season);
    countSighting(state, "countyCounts", county);
    stateData[state].totalSightings++;

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

// Get an array of counties with the highest number of Bigfoot sightings
// Source: https://stackoverflow.com/a/47934466/20258097
function countyMax(state) {
    let countyList = stateData[state].countyCounts;
    stateData[state].densestCounties = Object.keys(countyList).filter(x => {
         return countyList[x] == Math.max.apply(null, 
         Object.values(countyList));
   });
};

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
        countyCounts: {},
        fieldTotals: {},
        fieldCounts: {},
        totalSightings: 0,
        densestCounties: [],
        fieldAverages: {},
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
        stateData[state].fieldTotals[field] = 0;
        stateData[state].fieldCounts[field] = 0;
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
    let metaTotal = metadataPanel.append("div");
    metaTotal.append("b").text("Total Sightings: ");
    metaTotal.append().text(stateData[state].totalSightings);

    // Most visited county
    if (stateData[state].countyCounts[stateData[state].densestCounties[0]] === 1) {
        metadataPanel.append("div").append("b").text("No more than one visit per county");
    } else {
        let metaDense = metadataPanel.append("div");
        if (stateData[state].densestCounties.length === 1) {
            metaDense.append("b").text("Most Visited County ");
            metaDense.append().text(`(${stateData[state].countyCounts[stateData[state].densestCounties[0]]} visits)`);
        } else {
            metaDense.append("b").text("Most Visited Counties ");
            metaDense.append().text(`(${stateData[state].countyCounts[stateData[state].densestCounties[0]]} visits each)`);
        }
        metaDense.append("b").text(":");
        let countyEntries = metaDense.append("ul");
        for (const county of stateData[state].densestCounties) countyEntries.append("li").text(county);
    }

    // Averages
    let avgList = metadataPanel.append("div");
    avgList.append("b").text("Averages:");
    let avgEntries = avgList.append("ul")
    for (const [key, value] of Object.entries(stateData[state].fieldAverages)) {
        let unit = fieldUnits[key];
        if (value) {
            let stat = avgEntries.append("li");
            stat.append("b").text(`${key}: `);
            stat.append().text(`${value}${unit}`);
        }
    }
}