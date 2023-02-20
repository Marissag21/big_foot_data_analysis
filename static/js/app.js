// Creating empty variables to be assigned dynamically later
var myMap = L.map("bubble");
var markerObject = {};
var currentLocation = "";
  
// Adding the tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(myMap);
  
// Store the API query variables.
// For docs, refer to https://dev.socrata.com/docs/queries/where.html.
// And, refer to https://dev.socrata.com/foundry/data.cityofnewyork.us/erm2-nwe9.
var baseURL = "https://data.cityofnewyork.us/resource/fhrw-4uyv.json?";
var date = "$where=created_date between'2016-01-01T00:00:00' and '2017-01-01T00:00:00'";
var complaint = "&complaint_type=Rodent";
var limit = "&$limit=10000";
  
// Assemble the API query URL.
var url = baseURL + date + complaint + limit;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// build map layers and dropdown menu from API query
d3.json(url).then(function(response) {
    let dropdown = d3.select("#selDataset");
  
    // Loop through the data.
    for (var i = 0; i < response.length; i++) {
        var location = response[i].location; // TODO: match JSON
        var state = response[i].borough; // TODO: match JSON
  
        // If a location is given for the report, put the report in the corresponding markerClusterGroup and bind a popup
        if (location) {

            // Make only one markerClusterGroup and dropdown option per location
            if (!markerObject[state]) {
                markerObject[state] = L.markerClusterGroup();
                dropdown.append("option").attr("value", state).text(state);
            }

            markerObject[state].addLayer(L.marker([location.coordinates[1], location.coordinates[0]]) // TODO: match JSON
                .bindPopup(response[i].descriptor)); // TODO: match JSON
        }
    }

    // Initialize graphics with first item in dropdown menu
    optionChanged(dropdown.select("option").attr("value"));
});

// Update graphics on dropdown selection
function optionChanged(id) {
    if (markerObject[currentLocation]) myMap.removeLayer(markerObject[currentLocation]);
    currentLocation = id;
    myMap.addLayer(markerObject[id]);
    myMap.fitBounds(markerObject[id].getBounds());
}