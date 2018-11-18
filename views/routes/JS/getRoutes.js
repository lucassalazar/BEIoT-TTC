try{
  mapfit.apikey = "{MAPFIT_KEY}"
  let key = '{MAPFIT_KEY}'
  // draw map
  let map = mapfit.MapView('mapfit', { theme: 'day' })

  let cord2 = []

  let divs = document.getElementsByClassName('coordinates')

  let divArray = []

  for(let i=0; i < divs.length; i++) {
    divArray[i] = divs[i]
  }

  for(let i=0; i < divArray.length; i++) {
    cord2[i] = divArray[i].getElementsByTagName('p').item(0).innerHTML
  }

  async function getAddress(cord2){
    let geo = new mapfit.Geocoder("{MAPFIT_KEY}", "https://api.mapfit.com/v2")
    let data = await geo.reverseGeocode(latlng = cord2, building = true, radius = 75, limit = 1)
    let resultado = data[0].street_address
    //console.log(resultado)
    return resultado
  }

  let latlgnStart = cord2[1].toString().replace(/\s/g, '').split(',')
  let latlgnEnd = cord2[0].toString().replace(/\s/g, '').split(',')

  let latStart = parseFloat(latlgnStart[0], 10)
  let longStart = parseFloat(latlgnStart[1], 10)

  let latEnd = parseFloat(latlgnEnd[0], 10)
  let longEnd = parseFloat(latlgnEnd[1], 10)

  let directionsReq = new mapfit.Directions(key, "https://api.mapfit.com/v2")

  let encodedRoute

  let pointsArray

  // start marker
  let startMarkerIcon = mapfit.Icon()
  startMarkerIcon.setIconUrl('https://png.icons8.com/dusk/60/ffffff/place-marker.png')
  let position1 = mapfit.LatLng([latStart, longStart])
  let startMarker = mapfit.Marker(position1)
  startMarker.setIcon(startMarkerIcon)
  let placeInfo1 = mapfit.PlaceInfo()
  getAddress(cord2[1]).then(value => {
    placeInfo1.setTitle(value)
    placeInfo1.setDescription(`[${cord2[1]}]`)
  })
  
  startMarker.setPlaceInfo(placeInfo1)
  map.addMarker(startMarker)


  // end marker
  let endMarkerIcon = mapfit.Icon()
  endMarkerIcon.setIconUrl('https://png.icons8.com/dusk/60/ffffff/user-location.png')
  let position2 = mapfit.LatLng([latEnd, longEnd])
  let endMarker = mapfit.Marker(position2)
  endMarker.setIcon(endMarkerIcon)
  let placeInfo2 = mapfit.PlaceInfo()

  getAddress(cord2[0]).then(value => {
    placeInfo2.setTitle(value)
    placeInfo2.setDescription(`[${cord2[0]}]`)
  })
  endMarker.setPlaceInfo(placeInfo2)
  map.addMarker(endMarker)

  directionsReq.route(position1, position2, 'walking')
    .then(function (data) {
      encodedRoute = data.trip.legs[0].shape;
      pointsArray = decodePolyline(encodedRoute)
      let directionPolyline = mapfit.Polyline(pointsArray)
      map.addPolyline(directionPolyline)
      map.setCenterWithLayer(directionPolyline, 10, 40);
    })
  }catch(error){
    console.log('There is no registered locations. Erro: '+error)
  }

function decodePolyline(encoded) {
  let polyLineArrayCompiled = [];
  var index = 0,
    len = encoded.length;
  var lat = 0,
    lng = 0;
  while (index < len) {
    var b, shift = 0,
      result = 0;
    do {
      b = encoded.charAt(index++).charCodeAt(0) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    var dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;

    do {
      b = encoded.charAt(index++).charCodeAt(0) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    var dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    polyLineArrayCompiled.push([(lat / 1E6), (lng / 1E6)])
  }
  return polyLineArrayCompiled
}
