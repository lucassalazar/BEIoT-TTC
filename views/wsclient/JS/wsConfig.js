var host = 'wss://{DNS}:8083'

var clientId = document.getElementsByTagName('p').item(1).innerHTML

var bengalaId = document.getElementsByTagName('p').item(2).innerHTML

bengalaId = bengalaId.split('/')[3]

clientId = 'mqttjs_' + clientId.replace(/\s/g, '').split(':')[1] + Math.random().toString(16).substr(2, 8)

var options = {
  keepalive: 10,
  clientId: clientId,
  protocolId: 'MQTT',
  protocolVersion: 4,
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
  username: '{USERNAME}',
  password: '{PASSWORD}',
  rejectUnauthorized: true
}

var client = mqtt.connect(host, options);

var map = ''

document.getElementById('signal').onclick = function(){sendSignal()}

function sendSignal() {
  client.publish(`/bengala/set/${bengalaId}`, 'hellobengala')
  document.getElementById("signal").src = "/img/signal1.png"
  document.getElementById("signalSent").style.display = "inline"
  setTimeout(function() {
    document.getElementById("signal").src = "/img/signal.png"
    document.getElementById("signalSent").style.display = "none"
  }, 1000)
}

client.on('error', function (err) {
  console.log(err)
  client.end()
})

client.on('connect', () => {

  client.subscribe(`/bengala/location/${bengalaId}`);
  console.log('Connected to MQTT Broker.');
  console.log('client connected:' + clientId)
  // draw map
  mapfit.apikey = "{MAPFIT_KEY}";
  map = mapfit.MapView('mapfit', { theme: 'day' });
});

// Message recieved
client.on('message', (topic, message, packet) => {
  try {
    console.log('Payload: ' + message.toString() + '\nTopic: ' + topic)

    // create marker
    let mensagens = message.toString().replace(/\s/g, '').split(',')
    let lat = parseFloat(mensagens[0], 10)
    let lng = parseFloat(mensagens[1], 10)


    let position = mapfit.LatLng([lat, lng]);
    let myMarker = mapfit.Marker(position);
    let placeInfo = mapfit.PlaceInfo();

    let timenow = new Date
    
    // Reverse Geocoding
    let geo = new mapfit.Geocoder("{MAPFIT_KEY}", "https://api.mapfit.com/v2");
    geo.reverseGeocode(latlng = { lat, lng }, building = true, radius = 75, limit = 1)
      .then(data => {
        placeInfo.setTitle(data[0].street_address);
        placeInfo.setDescription(`[${lat}, ${lng}]\n${timenow}`);
      })
      .catch(error => {
        console.log("Local não encontrado... \nErro: ", error)
        placeInfo.setTitle('Local desconhecido');
        placeInfo.setDescription(lat + ', ' + lng+'\n'+timenow);
      })

    //set marker description
    myMarker.setPlaceInfo(placeInfo);
    
    //add marker to map
    let markerIcon = mapfit.Icon()
    markerIcon.setIconUrl('https://png.icons8.com/dusk/60/ffffff/user-location.png')
    myMarker.setIcon(markerIcon)
    map.addMarker(myMarker);

    //set the map center on marker position
    map.setCenter(position);
  } catch (e) {
    console.log('Menssagem inválida! Erro: '+e)
  }
});

client.on('close', () => {
  console.log('Disconnected from MQTT Broker.');
  client.end();
});
