require("dotenv").config();
const turf = require("@turf/turf");
const fetch = require("cross-fetch");
const { response } = require("express");

const ORS_KEY = process.env.ORS_KEY;
const OTM_KEY = process.env.OTM_KEY;

// private function to get itinerary waypoints
const getWaypoints = (route) => {
  // Create an array of cumulative times in n hours intervals
  const totalTime = route.features[0].properties.summary.duration;
  let timePoints = [];
  // This will have to change depending on user input
  const timeInterval = 21600;
  let timeCounter = timeInterval;
  while (timeCounter < totalTime) {
    timePoints.push(timeCounter);
    timeCounter += timeInterval;
  }
  if (timePoints.length === 0) {
    timePoints = [totalTime / 2];
  }
  // Get coordinates of waypoints closest to each of the time points
  let cumTime = 0;
  let timeIndex = 0;
  let coordinateArray = [];
  const steps = route.features[0].properties.segments[0].steps;
  for (let i = 0; i < steps.length; i++) {
    if (cumTime < timePoints[timeIndex]) {
      cumTime += steps[i].duration;
    } else {
      coordinateArray.push(
        route.features[0].geometry.coordinates[steps[i].way_points[1]]
      );
      if (timeIndex < timePoints.length - 1) {
        timeIndex++;
      } else {
        break;
      }
    }
  }
  return coordinateArray;
};

const calculateRoute = async (routeData) => {
  const route = await fetch(
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: ORS_KEY,
      },
      body: JSON.stringify(routeData),
    }
  )
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((err) => {
      console.log("An error occurred: " + err);
    });
  return route;
};

const calculateBuffer = (route, radius) => {
  const turfRoute = turf.lineString(
    route.features[0].geometry.coordinates.map((el) => [el[1], el[0]]),
    { name: "buffer" }
  );
  const buffered = turf.buffer(turfRoute, radius, { units: "kilometers" });
  return buffered;
};

const fetchPois = async (bbox, cats, buffered) => {
  const pois = await fetch(
    `https://api.opentripmap.com/0.1/en/places/bbox?lon_min=${bbox[1]}&lat_min=${bbox[0]}&lon_max=${bbox[3]}&lat_max=${bbox[2]}&kinds=${cats}&format=geojson&apikey=${OTM_KEY}`
  )
    .then((response) => response.json())
    .then((data) => {
      // Select points in buffer area and with high popularity score
      if (data.features) {
        const points = data.features.filter(
          (el) =>
            turf.booleanPointInPolygon(
              turf.point([
                el.geometry.coordinates[1],
                el.geometry.coordinates[0],
              ]),
              buffered
            ) && el.properties.rate === 7
        );
        return points;
      } else {
        return { error: "no POIs found" };
      }
    });
  return pois;
};

const geocode = async (query) => {
  const queryData = await fetch(
    `https://api.openrouteservice.org/geocode/search?api_key=${ORS_KEY}&text=${query.replace(
      / /g,
      "-"
    )}`
  )
    .then((response) => response.json())
    .catch((err) => {
      console.log("An error occurred: " + err);
    });
  return { queryData: queryData };
};

const getRoute = async (coordinates, radius, categories) => {
  // Get initial route from start and end coordinates
  const routeData = {
    coordinates: coordinates,
  };

  const initialRoute = await calculateRoute(routeData);
  if (!initialRoute.features) {
    return {
      status: 500,
      body: { error: "Initial route could not be calculated" },
    };
  }

  // Calculate buffer
  const buffered = calculateBuffer(initialRoute, radius);
  const bbox = turf.bbox(buffered);

  // Get pois
  const cats = categories.join("%2C");
  const pois = await fetchPois(bbox, cats, buffered);
  if (pois.error) {
    return { status: 500, body: { error: pois.error } };
  }

  // Get array of suggested pois, remove duplicates
  const coordinateArray = getWaypoints(initialRoute);
  const turfPois = turf.featureCollection(pois);
  let selectedPoisArray = [];
  for (let point of coordinateArray) {
    const selectedPoint = turf.point(point);
    const nearest = turf.nearestPoint(selectedPoint, turfPois);
    selectedPoisArray.push(nearest);
  }
  selectedPoisArray = selectedPoisArray.filter(
    (el, index, arr) =>
      arr.indexOf(arr.find((subel) => subel.id === el.id)) === index
  );

  // update route to visit all suggested pois
  const poiCoordinates = selectedPoisArray.map((el) => el.geometry.coordinates);
  const newCoordinates = [coordinates[0], ...poiCoordinates, coordinates[1]];
  const radiusArray = new Array(newCoordinates.length).fill(-1);

  const updatedRouteData = {
    coordinates: newCoordinates,
    extra_info: ["waytype", "steepness"],
    radiuses: radiusArray,
  };

  const updatedRoute = await calculateRoute(updatedRouteData);
  if (!updatedRoute.features) {
    return {
      status: 500,
      body: { error: "Final route could not be calculated" },
    };
  }

  return {
    buffered: buffered,
    updatedRoute: updatedRoute,
    pois: pois,
    selectedPoisArray: selectedPoisArray,
  };
};

const getPoiInfo = async (poiId) => {
  let isError = false;
  let errorMessage = "";

  const poiInfo = await fetch(
    `​https://api.opentripmap.com/0.1/en​/places​/xid​/${poiId}?apikey=${OTM_KEY}`.replace(
      /\u200B/g,
      ""
    )
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.xid) {
        return data;
      } else {
        return {
          status: 500,
          body: { error: "Final route could not be calculated" },
        };
      }
    })
    .catch((err) => {
      console.log("An error occurred: " + err);
    });

  return { poiInfo: poiInfo };
};

module.exports = { geocode, getRoute, getPoiInfo };
