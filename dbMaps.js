const map = L.map('map').setView([-28.48, 24.67], 5);

var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
osm.addTo(map);

//Creating keys for fast data search
const provGiniData = {}
const muniGiniData = {}
const provMedInData = {}
const muniMedInData = {}
const muniWageData = {}

function processProvGiniCSV(dataArray) {
    dataArray.forEach(row => {
    const key = `${row.PROVINCE}|${row.TaxYear}`;
    provGiniData[key] = row;
  });
}
function processMuniGiniCSV(dataArray) {
    dataArray.forEach(row => {
    const key = `${row.CATB}|${row.TaxYear}`;
    muniGiniData[key] = row;
  });
}
function processProvMedInCSV(dataArray) {
    dataArray.forEach(row => {
        const key = `${row.PROVINCE}|${row.TaxYear}`;
        provMedInData[key] = row;
    });
}
function processMuniMedInCSV(dataArray) {
    dataArray.forEach(row => {
        const key = `${row.CATB}|${row.TaxYear}`;
        muniMedInData[key] = row;
    });
}
function processMuniWageCSV(dataArray) {
    dataArray.forEach(row => {
    const key = `${row.CATB}|${row.TaxYear}`;
    muniWageData[key] = row;
  });
}
//Loading csv file data
loadCSV("data/gini/Province_Gini.csv")
    .then(data => {
        console.log('Province_Gini.csv loaded');
        processProvGiniCSV(data);
    });
loadCSV("data/gini/Municipal_Gini.csv")
    .then(data => {console.log('Municipal_Gini.csv loaded');
        processMuniGiniCSV(data);
    });
loadCSV("data/median_income/Municipal_MedianIncome.csv")
    .then(data => {console.log('Municipal_MedianIncome.csv loaded');
        processMuniMedInCSV(data);
    });
loadCSV("data/median_income/Province_MedianIncome.csv")
    .then(data => {console.log('Province_MedianIncome.csv loaded');
        processProvMedInCSV(data);
    });
loadCSV("data/wage_band/Municipal_FTE_WageBand.csv")
    .then(data => {console.log('Municipal_FTE_WageBand.csv loaded');
        processMuniWageCSV(data);
    });

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

let nationalLayer, provincialLayer, municipalLayer;

// Load GeoJSON layers
async function loadGeoJSONLayer(filePath, styleOptions, onEachFeature) {
    const response = await fetch(filePath);
    const data = await response.json();
    return L.geoJSON(data, {style: styleOptions, onEachFeature});
}
// Adding interactive mouseover and popup for provinces & municipalities
const highlightStyle = {weight: 4, color: 'orange', fillOpacity: 0.3};
const defaultProvStyle = {color: 'blue', weight: 2, fillOpacity: 0.1};
const defaultMuniStyle = {color: 'darkblue', weight: 1, fillOpacity: 0.1};

function onEachFeatureProv(feature, layer) {
    layer.on({
        mouseover: () => layer.setStyle(highlightStyle),
        mouseout: () => layer.setStyle(defaultProvStyle),
        click: () => layer.openPopup()
    });
    layer.bindPopup(`<strong>Province:</strong> ${feature.properties.name || 'Unknown'}`);
}
function onEachFeatureMuni(feature, layer) {
    layer.on({
        mouseover: () => layer.setStyle(highlightStyle),
        mouseout: () => layer.setStyle(defaultMuniStyle),
        click: () => layer.openPopup()
    });
    layer.bindPopup(`<strong>Municipality:</strong> ${feature.properties.name || 'Unknown'}`);
}
// Load geoJSON layers and add National to map immediately
(async () => {
    nationalLayer = await loadGeoJSONLayer('data/boundaries/South_Africa_Boundary.geojson',
        {color: 'green', weight: 3, fillOpacity: 0.1});
        nationalLayer.addTo(map);
    provincialLayer = await loadGeoJSONLayer('data/boundaries/Provincial_Boundary.geojson',
        defaultProvStyle, onEachFeatureProv);
    municipalLayer = await loadGeoJSONLayer('data/boundaries/Local_Municipal_Boundaries.geojson',
        defaultMuniStyle, onEachFeatureMuni);
})();

// Handling filter changes to update map layers
function updateMapLayers() {
    const boundaryLevel = document.getElementById('boundary-level').value;
     // Show/hide layers based on boundary selection
    if (boundaryLevel === 'national') {
        if (!map.hasLayer(nationalLayer)) nationalLayer.addTo(map);
        if (map.hasLayer(provincialLayer)) map.removeLayer(provincialLayer);
        if (map.hasLayer(municipalLayer)) map.removeLayer(municipalLayer);
    }
    else if (boundaryLevel === 'provincial') {
       if (map.hasLayer(nationalLayer))  map.removeLayer(nationalLayer);
        if (!map.hasLayer(provincialLayer)) provincialLayer.addTo(map);
        if (map.hasLayer(municipalLayer)) map.removeLayer(municipalLayer);
    }
    else if (boundaryLevel === 'municipal') {
        if (map.hasLayer(nationalLayer))  map.removeLayer(nationalLayer);
        if (map.hasLayer(provincialLayer)) map.removeLayer(provincialLayer);
        if (!map.hasLayer(municipalLayer)) municipalLayer.addTo(map);
    }
}

function updateProvincialLayerStyles() {
    if (!provincialLayer) return;
    provincialLayer.eachLayer(layer => {
        const props = layer.feature.properties;
        const key = `${props.PROVINCE}|${selectedYear}`;
        const data = provGiniData[key];
        let fillColor = '#gray'; // default if no data
        let popupContent = `<strong>${props.name || props.PROVINCE_CODE}</strong><br>No data for ${selectedYear}`;
        
        if (data && data.gini != null) {
            fillColor = getColor(data.gini);
            popupContent = `<strong>${props.PROVINCE}</strong><br>
            Year: ${selectedYear}<br>
            Gini Coefficient: ${data.gini.toFixed(3)}<br>
            FTE: ${data.FTE.toLocaleString()}`;
        }
        layer.setStyle({
            fillColor: fillColor,
            fillOpacity: 0.7,
            color: 'black',
            weight: 1
        });
        layer.bindPopup(popupContent);
    });
}
function updateYearData() {
    const yearSelected = document.getElementById('year-select').value;


}

function updateMetricData() {

}


let selectedYear = 2014; // default, update this on year filter change
function getColor(giniValue) {
  // Color scale for Gini value (0 to 1)
  return giniValue > 0.6 ? 'rgb(128, 0, 38)' :
         giniValue > 0.55 ? 'rgb(189, 0, 38)' :
         giniValue > 0.5 ? 'rgb(227, 26, 28)' :
         giniValue > 0.45 ? 'hsl(10, 97%, 58%)' :
         giniValue > 0.4 ? 'rgb(253, 141, 60)' :
         giniValue > 0.35 ? 'rgb(254, 178, 76)' :
         giniValue > 0.3 ? 'rgb(254, 217, 118)' :
                           'rgb(195, 255, 160)';
}


// When year changes (e.g., from filter dropdown), update selectedYear and refresh styles
document.getElementById('year-select').addEventListener('change', e => {
    selectedYear = parseInt(e.target.value);
    updateProvincialLayerStyles();
});

// Attach event listeners to detect changes in selects
document.getElementById('boundary-level').addEventListener('change', updateMapLayers);
document.getElementById('year-select').addEventListener('change', updateYearData);
document.getElementById('metric-select').addEventListener('change', updateMetricData);
