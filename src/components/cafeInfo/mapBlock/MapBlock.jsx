import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapBlock = ({ onPositionChange }) => {
  const [data, setData] = useState(null);
  const [markerPosition, setMarkerPosition] = useState([null]); 

  useEffect(() => {
    
    const selectedCafe = JSON.parse(localStorage.getItem('selectedCafe'));
    if (selectedCafe) {
      setData(selectedCafe);
  
      const { lat, lng } = selectedCafe.adminData?.address || selectedCafe.geometry.location;
      const newPosition = formatCoordinates([lat, lng]);
  
      setMarkerPosition(newPosition);
      onPositionChange(newPosition);
    }
  }, []);
  
  const formatCoordinates = ([lat, lng]) => [
    parseFloat(lat.toFixed(7)),
    parseFloat(lng.toFixed(7)),
  ];
  
  const MapClickHandler = () => {
    useMapEvents({
      click(event) {
        const { lat, lng } = event.latlng;
        const newPosition = formatCoordinates([lat, lng]);
        console.log(`Натиснуто на карті: ${newPosition[0]}, ${newPosition[1]}`);
        setMarkerPosition(newPosition);
        onPositionChange(newPosition);
      },
    });
    return null;
  };
  return (
    <div style={{ width: '100%', height: '500px' }}>
      {data && data.geometry && data.geometry.location ? (
        <MapContainer
          center={[markerPosition[0], markerPosition[1]]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker
            position={markerPosition} 
            icon={new L.Icon({
              iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })}
          >
            <Popup>
              This is the selected cafe!
            </Popup>
          </Marker>
          <MapClickHandler />
        </MapContainer>
      ) : (
        <p>Loading map...</p>
      )}
    </div>
  );
};

export default MapBlock;






