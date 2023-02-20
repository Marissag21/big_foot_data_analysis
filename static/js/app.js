// Setup


// Initialize


// Populate dropdown


// Get data for selected state


// Update visualizations






// Creating the map object
  var myMap = L.map("bubble", {
    center: [40.7, -73.95],
    zoom: 11
  });
  
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
  
  // Get the data with d3.
  d3.json(url).then(function(response) {

    console.log(response);

    // Create a new marker cluster group.
    var markers = L.markerClusterGroup();

    var borough = L.markerClusterGroup();

    var boroughChoice = "STATEN ISLAND";

    var boroughLat = [];
    var boroughLng = [];

    var locations = [];
  
    // Loop through the data.
    for (var i = 0; i < response.length; i++) {
  
      // Set the data location property to a variable.
      var location = response[i].location;
  
      // Check for the location property.
      if (location) {
  
        // Add a new marker to the cluster group, and bind a popup.
        markers.addLayer(L.marker([location.coordinates[1], location.coordinates[0]])
          .bindPopup(response[i].descriptor));

        if(response[i].borough === boroughChoice) {
            borough.addLayer(L.marker([location.coordinates[1], location.coordinates[0]])
            .bindPopup(response[i].descriptor));
            boroughLat.push(location.coordinates[1]);
            boroughLng.push(location.coordinates[0]);
        }
      }

      if (!locations.includes(response[i].borough)) {
        locations.push(response[i].borough);
      }
  
    }

    console.log(locations);

    // Populate dropdown menu
    let dropdown = d3.select("#selDataset");
    for (i=0; i<locations.length; i++) {
        dropdown.append("option").attr("value", i).text(locations[i]);
    }
  
    // Add our marker cluster layer to the map.
    const average = array => array.reduce((a, b) => a + b) / array.length;

    myMap.addLayer(borough);
    let latlng = [average(boroughLat), average(boroughLng)];
    myMap.setView(latlng, myMap.getZoom(), { animation: true });
  
  });