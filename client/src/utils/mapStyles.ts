export const greenMapStyle: google.maps.MapTypeStyle[] = [
  {
    elementType: "geometry",
    stylers: [{ color: "#d8edd8" }], // fundo verde claro
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a7c4e" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }], // estradas brancas
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e0e0e0" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#a8d5a2" }], // água verde
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#b2d9b2" }], // parques
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#e8f5e8" }],
  },
];
