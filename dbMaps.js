const map = L.map('map').setView([-28.48, 24.67], 5);

var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
osm.addTo(map);
/*
//Boundary data
fetch("data/boundaries/South_Africa_Boundary.geojson") 
.then( function (respons){
    return respons.json();
})
.then (function (data){
    var SA_bound = L.geoJSON(data);
    SA_bound.addTo(map);
});

fetch("data/boundaries/Provincial_Boundary.geojson") 
.then( function (respons){
    return respons.json();
})
.then (function (data){
    var prov_bound = L.geoJSON(data);
    return prov_bound;
});
//prov_bound.addTo(map);

fetch("data/boundaries/Local_Municipal_Boundaries.geojson") 
.then( function (respons){
    return respons.json();
})
.then (function (data){
    var muni_bound = L.geoJSON(data);
    return muni_bound;
});
//muni_bound.addTo(map);
*/


//Loading geoJSON file data 
loadGeoJSON('data/boundaries/South_Africa_Boundary.geojson')
  .then(layer => { console.log('National boundary loaded', layer);
});
loadGeoJSON('data/boundaries/Provincial_Boundary.geojson')
  .then(layer => { console.log('Provincial boundary loaded', layer);
});
loadGeoJSON('data/boundaries/Local_Municipal_Boundaries.geojson')
  .then(layer => { console.log('Municipal boundary loaded', layer);
});

//Loading csv file data
loadCSV("data/gini/Province_Gini.csv")
    .then(data => {console.log('Province_Gini.csv loaded', data)});
loadCSV("data/gini/Municipal_Gini.csv")
    .then(data => {console.log('Municipal_Gini.csv loaded', data)});
loadCSV("data/median_income/Municipal_MedianIncome.csv")
    .then(data => {console.log('Municipal_MedianIncome.csv loaded', data)});
loadCSV("data/median_income/Province_MedianIncome.csv")
    .then(data => {console.log('Province_MedianIncome.csv loaded', data)});
loadCSV("data/wage_band/Municipal_FTE_WageBand.csv")
    .then(data => {console.log('Municipal_FTE_WageBand.csv loaded', data)});

// Function for adding csv data
function loadCSV(filePath) {
    return fetch(filePath)
        .then(respons => {
            return respons.text();
        })
        .then(csvText => {
            const parsedCSVData = Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            });
            return parsedCSVData.data
        })
        .catch(error => {console.error("Error while loading csv data:", error);
            return [];
        });
}

// Function for adding geoJSON data and adding the layer to the map
async function loadGeoJSON (filePath){
    const respons = await fetch(filePath);
    const geoJSONdata = await respons.json();
    const geojsonLayer = L.geoJSON(geoJSONdata, {
        style: function (feature) {
            return {
                color: 'blue',
                weight: 2,
                fillOpacity: 0.1
            };
        }
    });

    geojsonLayer.addTo(map);
    return geojsonLayer;
}