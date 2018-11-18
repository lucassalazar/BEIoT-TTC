let divs = document.getElementsByClassName('conteudo')
let cord = []
let geo = new mapfit.Geocoder("{MAPFIT_KEY}", "https://api.mapfit.com/v2");

Array.from(divs).forEach((elements, index) => {
  cord[index] = elements.getElementsByTagName('p').item(0).innerHTML

  cord[index] = cord[index].toString().replace(/\s/g, '').split(':')[1]

  geo.reverseGeocode(latlng=cord[index], building = true, radius = 75, limit = 1)
    .then(data => {
      var h4 = document.createElement('h4')
      var t = document.createTextNode("Endereço: "+data[0].street_address.toString())
      h4.appendChild(t)
      elements.prepend(h4)
    })
    .catch(error => {
      console.log(" error = ", error)
      setTimeout("location.reload(true);", 3000);
    })  
})
coord = []
