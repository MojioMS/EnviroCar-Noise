/* Map functions */
var map;

function initMap() {
  // set up the map
  geocoder = new google.maps.Geocoder();
  var latlng = new google.maps.LatLng(51.963837, 7.616608);
  map = new google.maps.Map(document.getElementById('map-canvas'), {
    center: new google.maps.LatLng(51.963837, 7.616608),
    zoom: 2,
	minZoom: 4,
	maxZoom: 16,
	mapTypeControl: true,
	scaleControl: true,
	streetViewControl: false,
	overviewMapControl: true
  });
  var styles = [
  {
	featureType: "all",
    stylers: [
      { saturation: -80 }
    ]
  },{
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [
      { hue: "#00ffee" },
      { saturation: 50 }
    ]
  },{
    featureType: "poi.business",
    elementType: "labels",
    stylers: [
      { visibility: "off" }
    ]
  }];
  map.setOptions({styles: styles});
}


/**
* Loads a geoString and adds the measurements onto the map colored by noise level. 
* TODO: dB(A)- funktionen einfügen und Farben anpassen.
*/
function loadGeoJsonString(geoString) {
  var geojson = JSON.parse(geoString);
  
  map.data.addGeoJson(geojson);
  map.data.setStyle(function(feature) {
	try {
		var rpm = feature.getProperty("phenomenons").Rpm.value;
		var velocity = feature.getProperty("phenomenons").Speed.value;
		var dBAvalue = dBA(velocity, rpm);
	} catch(e) {
	}
	if (dBAvalue<55){
		return {icon:"images/green_dot.png"};}
	else if ((dBAvalue>=55) && (dBAvalue<65)) {
		return {icon:"images/green_yellow_dot.png"};}
	else if ((dBAvalue>=65) && (dBAvalue<70)) {
		return {icon:"images/yellow_dot.png"};}
	else if ((dBAvalue>=70) && (dBAvalue<75)) {
		return {icon:"images/orange_dot.png"};}
	else if ((dBAvalue>=75) && (dBAvalue<80)) {
		return {icon:"images/orange_red_dot.png"};}
	else if ((dBAvalue>=80) && (dBAvalue<85)) {
		return {icon:"images/red_dot.png"};}
	else if (dBAvalue>=85){
		return {icon:"images/red_dark_dot.png"};}
	else {
		return {icon:"images/no_dot.png"};}
	});
  zoom(map);
} 


// average (a+b)/2
function avg(a,b){
	return (a+b)/2;
}

/**
* Main function for dB(A)~ velocity & rounds per minute
*/
function dBA(v,rpm){
	var dbv = rollingNoise(v,rpm);
	var dbr = propulsionNoise(v,rpm);
	return avg(dbv,dbr);
}

//========== Functions for dB(A) ~ rounds per minute====

function dB_rpm_i1(rpm){
	return 0.0075*rpm+52.953;
}

function dB_rpm_i2(rpm,v){
	return (0.0075*rpm+52.953+(v/30)*((0.0075-0.0038)*rpm+(52.953-63.142)));
}

function dB_rpm_i3(rpm,v){
	return (0.0038*rpm+63.142+((v-30)/(50-30))*((0.0038-0.0023)*rpm+(63.142-69.13)));
}

function dB_rpm_i4(rpm,v){
	return (0.0023*rpm+69.13+((v-50)/(70-50))*((0.0023-0.0011)*rpm+(69.13-75.567)));
}

function dB_rpm_i5(rpm,v){
	return (0.0011*rpm+75.567+((v-70)/(100-70))*((0.0011-0.0005)*rpm+(75.567-79.62)));
}

function dB_rpm_i6(v){
	return 0.1739*v+63.941;
}

/**
* function for dB(A) ~ rounds per minute
*/
function propulsionNoise(v,rpm){
	if (v==0) {
		return dB_rpm_i1(rpm);
	} else if ((v>0) && (v<=30)){
		return dB_rpm_i2(rpm,v);
	} else if ((v>30) && (v<=50)){
		return dB_rpm_i3(rpm,v);
	} else if ((v>50) && (v<=70)){
		return dB_rpm_i4(rpm,v);
	} else if ((v>70) && (v<=100)){
		return dB_rpm_i5(rpm,v);
	}  else if (v>100){
		return dB_rpm_i6(v);
	}
}

//========== Functions for dB(A) ~ velocity=============

function dB_v_i1(v){
	return 0.2055*v+60.449;
}

function dB_v_i2(v,rpm){
	return (0.2055*v+60.449+((rpm-800)/(1500-800))*((0.2055-0.1739)*v+(60.449-63.941)));
}

function dB_v_i3(v,rpm){
	return (0.1739*v+63.941+((rpm-1500)/(2000-1500))*((0.1739-0.1494)*v+(63.941-66.557)));
}

function dB_v_i4(v,rpm){
	return (0.1494*v+66.557+((rpm-2000)/(3000-2000))*((0.1494-0.0528)*v+(66.557-73.725)));
}

function dB_v_i5(v,rpm){
	return (0.0528*v+73.725+((rpm-3000)/(3500-3000))*((0.0528-0.0283)*v+(73.725-77.999)));
}

function dB_v_i6(v){
	return 0.1739*v+63.941;
}

/**
* function for dB(A) ~ velocity 
*/
function rollingNoise(v,rpm){
	if (v<=100){
		if (rpm<=800) {
			return dB_v_i1(v);
		} else if ((rpm>800) && (rpm<=1500)){
			return dB_v_i2(v,rpm);
		} else if ((rpm>1500) && (rpm<=2000)){
			return dB_v_i3(v,rpm);
		} else if ((rpm>2000) && (rpm<=3000)){
			return dB_v_i4(v,rpm);
		} else if ((rpm>3000) && (rpm<=3500)){
			return dB_v_i5(v,rpm);
		} else if (rpm>3500){
			return dB_v_i6(v);
		}
	}
	else {
		return dB_v_i2(v,rpm);
	}
}

/**
 * Update a map's viewport to fit each geometry in a dataset
 * @param {google.maps.Map} map The map to adjust
 */
function zoom(map) {
  var bounds = new google.maps.LatLngBounds();
  map.data.forEach(function(feature) {
    processPoints(feature.getGeometry(), bounds.extend, bounds);
  });
  map.fitBounds(bounds);
}

/**
 * Process each point in a Geometry, regardless of how deep the points may lie.
 * @param {google.maps.Data.Geometry} geometry The structure to process
 * @param {function(google.maps.LatLng)} callback A function to call on each
 *     LatLng point encountered (e.g. Array.push)
 * @param {Object} thisArg The value of 'this' as provided to 'callback' (e.g.
 *     myArray)
 */
function processPoints(geometry, callback, thisArg) {
  if (geometry instanceof google.maps.LatLng) {
    callback.call(thisArg, geometry);
  } else if (geometry instanceof google.maps.Data.Point) {
    callback.call(thisArg, geometry.get());
  } else {
    geometry.getArray().forEach(function(g) {
      processPoints(g, callback, thisArg);
    });
  }
}


/* DOM (drag/drop) functions */

function initEvents() {
  // set up the drag & drop events
  var mapContainer = document.getElementById('map-canvas');
  var dropContainer = document.getElementById('drop-container');

  // first on common events
  [mapContainer, dropContainer].forEach(function(container) {
    container.addEventListener('drop', handleDrop, false);
    container.addEventListener('dragover', showPanel, false);
  });

  // then map-specific events
  mapContainer.addEventListener('dragstart', showPanel, false);
  mapContainer.addEventListener('dragenter', showPanel, false);

  // then the overlay specific events (since it only appears once drag starts)
  dropContainer.addEventListener('dragend', hidePanel, false);
  dropContainer.addEventListener('dragleave', hidePanel, false);
}

function showPanel(e) {
  e.stopPropagation();
  e.preventDefault();
  document.getElementById('drop-container').style.display = 'block';
  return false;
}

function hidePanel(e) {
  document.getElementById('drop-container').style.display = 'none';
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  hidePanel(e);

  var files = e.dataTransfer.files;
  if (files.length) {
    // process file(s) being dropped
    // grab the file data from each file
    for (var i = 0, file; file = files[i]; i++) {
      var reader = new FileReader();
      reader.onload = function(e) {
        loadGeoJsonString(e.target.result);
      };
      reader.onerror = function(e) {
        console.error('reading failed');
      };
      reader.readAsText(file);
    }
  } else {
    // process non-file (e.g. text or html) content being dropped
    // grab the plain text version of the data
    var plainText = e.dataTransfer.getData('text/plain');
    if (plainText) {
      loadGeoJsonString(plainText);
    }
  }

  // prevent drag event from bubbling further
  return false;
}


google.maps.event.addDomListener(window, 'load', function() {
  initMap();
  initEvents();
});