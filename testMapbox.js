async function testMapbox() {
  const fromLng = 72.8777;
  const fromLat = 19.0760;
  const toLng = 73.8567;
  const toLat = 18.5204;
  require('dotenv').config();
  const mapboxApiKey = process.env.MAPBOX_API_KEY;
  const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=polyline&access_token=${mapboxApiKey}`;
  
  console.log("Fetching: ", directionsUrl);
  try {
    const res = await fetch(directionsUrl);
    const data = await res.json();
    console.log("Mapbox Response:");
    console.log(data.code, data.message);
    if(data.routes && data.routes.length > 0) {
        console.log("Polyline length: ", data.routes[0].geometry.length);
    }
  } catch (e) {
    console.error(e);
  }
}

testMapbox();
