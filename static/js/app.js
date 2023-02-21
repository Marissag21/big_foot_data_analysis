var myMap = L.map("bubble");
var stateData = {};
var currentLocation = "ALL LOCATIONS";
var dropdown = d3.select("#selDataset");
  
// Adding the tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);
  
// Store the API query variables
// For docs, refer to https://dev.socrata.com/docs/queries/where.html
// And, refer to https://dev.socrata.com/foundry/data.cityofnewyork.us/erm2-nwe9
var baseURL = "https://data.cityofnewyork.us/resource/fhrw-4uyv.json?";
var date = "$where=created_date between'2016-01-01T00:00:00' and '2017-01-01T00:00:00'";
var complaint = "&complaint_type=Rodent";
var limit = "&$limit=10000";
  
// Assemble the API query URL
var url = baseURL + date + complaint + limit;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// query API, perform initial setup
d3.json(url).then(function(response) {
    newState("ALL LOCATIONS");

    console.log(response[0]); // debug
  
    // Loop through the data
    for (var i = 0; i < response.length; i++) {
        var state = response[i].borough; // TODO: match JSON
  
        // If a location is given for the report, put the report in the corresponding markerClusterGroup and bind a popup
        if (response[i].location && response[i].incident_zip) { // TODO: match JSON
            if (!stateData[state]) newState(state);

            addMarker(response[i]); // TODO: match JSON
        }
    }

    // Loop through locations to get chart data, average metadata, etc
    let locList = Object.keys(stateData);
    console.log(locList); // debug
    for (var i = 0; i < locList.length; i++) {
        stateData[locList[i]].bar[0].x = Object.keys(stateData[locList[i]].seasonCounts);
        stateData[locList[i]].bar[0].y = Object.values(stateData[locList[i]].seasonCounts);

        stateData[locList[i]].line[0].x = Object.keys(stateData[locList[i]].yearCounts).sort();
        stateData[locList[i]].line[0].y = stateData[locList[i]].line[0].x.map(index => stateData[locList[i]].yearCounts[index]);
    }

    // Initialize graphics with first item in dropdown menu
    optionChanged(dropdown.select("option").attr("value"));
});

// Add new marker
function addMarker(response, state = "ALL LOCATIONS") {
    let location = response.location; // TODO: match JSON
    let desc = response.descriptor; // TODO: match JSON

    let year = response.created_date.substr(5,2); // TODO: match JSON
    let season = response.incident_zip.substr(0,3); // TODO: match JSON

    // Add marker to markerClusterGroup
    stateData[state].markers.addLayer(L.marker([location.coordinates[1], location.coordinates[0]]) // TODO: match JSON
        .bindPopup(desc));

    // Count sighting in relevant fields
    countSighting(state, "yearCounts", year);
    countSighting(state, "seasonCounts", season);

    if (state === "ALL LOCATIONS") addMarker(response, response.borough); // Woo recursion! // TODO: match JSON
}

// Count sighting where appropriate
function countSighting(state, field, subfield) {
    if (!stateData[state][field][subfield]) stateData[state][field][subfield] = 0;
    stateData[state][field][subfield]++;
}

// Set up new state with dropdown choice, markers, metadata, etc.
function newState(state) {
    stateData[state] = {
        markers: L.markerClusterGroup(),
        yearCounts: {},
        seasonCounts: {},
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
    dropdown.append("option").attr("value", state).text(state);
}

// Update graphics on dropdown selection
function optionChanged(id) {
    myMap.removeLayer(stateData[currentLocation].markers);
    currentLocation = id;

    console.log(`${id}:`); // debug
    console.log(stateData[id]); // debug

    myMap.addLayer(stateData[id].markers);
    myMap.fitBounds(stateData[id].markers.getBounds());

    let barLayout = {
        title: {
            text: `Bigfoot Sightings Per Season<br>In ${id}`,
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

    let lineLayout = {
        title: {
            text: `Bigfoot Sightings Over Time<br>In ${id}`,
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

    Plotly.newPlot("bar", stateData[id].bar, barLayout);
    Plotly.newPlot("gauge", stateData[id].line, lineLayout);
}