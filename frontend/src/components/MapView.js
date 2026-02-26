import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapView = ({ sourceLocation, results, bestMandiName, poolOpportunities = [] }) => {
    const { t, i18n } = useTranslation();

    // Determine Map Tile URL based on language
    // English: OpenStreetMap (standard) often shows local scripts (Bengali in WB). 
    // Google Maps also shows local scripts sometimes.
    // Solution: Use CartoDB Voyager for English (enforces English labels).
    // Hindi: Use Google Maps with hl=hi (best for Hindi).
    const getTileUrl = () => {
        const lang = i18n.language || 'en';
        // Google Maps tiles support localization via the 'hl' parameter
        // This is excellent for Indian regional languages
        const supportedLangs = ['en', 'hi', 'mr', 'pa', 'te', 'ta', 'kn', 'gu'];
        const mapLang = supportedLangs.includes(lang) ? lang : 'en';

        return {
            url: `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=${mapLang}`,
            attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>'
        };
    };

    const tileInfo = getTileUrl();

    if (!results || results.length === 0) return null;

    // Create highly distinct custom icons using divIcon
    // User location - Large RED home/house marker
    const sourceIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
      background-color: #e74c3c;
      width: 40px;
      height: 40px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 4px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="transform: rotate(45deg); font-size: 24px;">🏠</span>
    </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
    });

    // Best mandi - GOLD star marker
    const bestMandiIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(255,215,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="transform: rotate(45deg); font-size: 20px;">⭐</span>
    </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
    });

    // Other mandis - BLUE market/shop marker
    // Pool partners - GREEN group/sharing marker
    const poolPartnerIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
      background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 3px 8px rgba(46, 204, 113, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="transform: rotate(45deg); font-size: 16px;">👥</span>
    </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });

    const mandiIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 3px 8px rgba(102,126,234,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="transform: rotate(45deg); font-size: 16px;">🏪</span>
    </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });

    const center = [sourceLocation.lat, sourceLocation.lng];

    // Function to get mandi location (approximate based on distance)
    const getMandiLocation = (result, index) => {
        const angle = (index / results.length) * 2 * Math.PI;
        const distance = result.distance / 111; // Rough km to degrees conversion
        return {
            lat: sourceLocation.lat + distance * Math.cos(angle),
            lng: sourceLocation.lng + distance * Math.sin(angle),
        };
    };

    return (
        <div className="map-container">
            <h3 className="map-title">🗺️ {t('map.title')}</h3>
            <div className="map-wrapper">
                <MapContainer
                    center={center}
                    zoom={9}
                    style={{ height: '500px', width: '100%', borderRadius: '16px' }}
                >
                    <TileLayer
                        key={i18n.language}
                        attribution={tileInfo.attribution}
                        url={tileInfo.url}
                    />

                    {/* Source location marker */}
                    <Marker position={[sourceLocation.lat, sourceLocation.lng]} icon={sourceIcon}>
                        <Popup>
                            <strong>🏠 {t('map.yourLocation')}</strong>
                            <br />
                            Lat: {sourceLocation.lat.toFixed(4)}
                            <br />
                            Lng: {sourceLocation.lng.toFixed(4)}
                        </Popup>
                    </Marker>

                    {/* Pool Partner Markers */}
                    {poolOpportunities.map((partner) => (
                        <Marker
                            key={partner.id}
                            position={[partner.location.lat, partner.location.lng]}
                            icon={poolPartnerIcon}
                        >
                            <Popup>
                                <div className="popup-content">
                                    <strong>🤝 {partner.farmerName}</strong>
                                    <br />
                                    <span className="popup-label">{partner.crop}:</span> {partner.quantity} Q
                                    <br />
                                    <span className="popup-label">{t('results.winner.distance')}:</span> {partner.distanceFromUser} km
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Mandi markers and routes */}
                    {results.map((result, index) => {
                        const mandiLoc = getMandiLocation(result, index);
                        const isBest = result.mandi === bestMandiName;
                        const routeColor = isBest ? '#ffd700' : '#667eea';

                        return (
                            <React.Fragment key={index}>
                                {/* Route line */}
                                <Polyline
                                    positions={[
                                        [sourceLocation.lat, sourceLocation.lng],
                                        [mandiLoc.lat, mandiLoc.lng],
                                    ]}
                                    color={routeColor}
                                    weight={isBest ? 4 : 2}
                                    opacity={isBest ? 0.8 : 0.5}
                                    dashArray={isBest ? null : '10, 10'}
                                />

                                {/* Mandi marker */}
                                <Marker
                                    position={[mandiLoc.lat, mandiLoc.lng]}
                                    icon={isBest ? bestMandiIcon : mandiIcon}
                                >
                                    <Popup>
                                        <div className="popup-content">
                                            <strong>{isBest ? '🏆 ' : ''}{t('mandis.' + result.mandi, result.mandi)}</strong>
                                            <br />
                                            <span className="popup-label">{t('map.distance')}:</span> {result.distance} km
                                            <br />
                                            <span className="popup-label">{t('map.netProfit')}:</span> <span className="profit-value">₹{result.netProfit.toLocaleString()}</span>
                                            <br />
                                            <span className="popup-label">{t('map.price')}:</span> ₹{result.price}/Q
                                        </div>
                                    </Popup>
                                </Marker>
                            </React.Fragment>
                        );
                    })}
                </MapContainer>

                {/* Legend with visual marker examples */}
                <div className="map-legend">
                    <div className="legend-item">
                        <div className="legend-marker green"></div>
                        <span>🏠 {t('map.legend.yourLocation')}</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-marker pool-green" style={{ background: '#2ecc71' }}></div>
                        <span>👥 {t('map.legend.poolPartners')}</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-marker gold"></div>
                        <span>⭐ {t('map.legend.bestMandi')}</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-marker blue"></div>
                        <span>🏪 {t('map.legend.otherMandis')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapView;
