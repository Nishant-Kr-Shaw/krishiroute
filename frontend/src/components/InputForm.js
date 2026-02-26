import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LocationSearch from './LocationSearch';
import './InputForm.css';

const InputForm = ({ onSubmit, loading, initialIsRideShare = false }) => {
    const { t, i18n } = useTranslation();
    const [formData, setFormData] = useState({
        crop: 'onion',
        quantity: 20,
        unit: 'quintal',
        vehicleType: 'truck',
        isRideShare: initialIsRideShare,
        source: {
            lat: 22.5726,
            lng: 88.3639,
        },
    });

    // Sync isRideShare if changed externally
    React.useEffect(() => {
        setFormData(prev => ({ ...prev, isRideShare: initialIsRideShare }));
    }, [initialIsRideShare]);

    const [gettingLocation, setGettingLocation] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);
    const [selectedLocationName, setSelectedLocationName] = useState('');
    const [customCrop, setCustomCrop] = useState('');
    const [showCustomVehicle, setShowCustomVehicle] = useState(false);
    const [customVehicle, setCustomVehicle] = useState({
        name: '',
        ratePerKm: '',
    });

    const crops = [
        { value: 'onion', label: t('crops.onion') },
        { value: 'potato', label: t('crops.potato') },
        { value: 'tomato', label: t('crops.tomato') },
        { value: 'rice', label: t('crops.rice') },
        { value: 'wheat', label: t('crops.wheat') },
        { value: 'other', label: t('crops.other') },
    ];

    const quantityUnits = [
        { value: 'kg', label: t('units.kg') },
        { value: 'quintal', label: t('units.quintal') },
        { value: 'ton', label: t('units.ton') },
    ];

    const vehicles = [
        { value: 'tractor', label: `${t('vehicles.tractor')} (₹12/km)`, icon: '🚜' },
        { value: 'tata-ace', label: `${t('vehicles.tataAce')} (₹18/km)`, icon: '🚐' },
        { value: 'truck', label: `${t('vehicles.truck')} (₹25/km)`, icon: '🚛' },
        { value: 'mini-truck', label: `${t('vehicles.miniTruck')} (₹20/km)`, icon: '🚚' },
        { value: 'tempo', label: `${t('vehicles.tempo')} (₹15/km)`, icon: '🛻' },
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'lat' || name === 'lng') {
            setFormData({
                ...formData,
                source: {
                    ...formData.source,
                    [name]: parseFloat(value),
                },
            });
        } else if (name === 'quantity') {
            setFormData({
                ...formData,
                [name]: parseFloat(value),
            });
        } else if (type === 'checkbox') {
            setFormData({
                ...formData,
                [name]: checked,
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            return;
        }

        setGettingLocation(true);
        setLocationError('');
        console.log('📍 Requesting GPS location...');

        const options = {
            enableHighAccuracy: true,
            timeout: 15000, // Increased to 15s
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = parseFloat(position.coords.latitude.toFixed(4));
                const lng = parseFloat(position.coords.longitude.toFixed(4));

                console.log(`✅ GPS Location found: ${lat}, ${lng}`);

                // Use functional update to avoid stale closure issues
                setFormData(prev => ({
                    ...prev,
                    source: { lat, lng },
                }));

                setSelectedLocationName(`GPS: ${lat}, ${lng}`);
                setGettingLocation(false);
                setLocationError('');
            },
            (error) => {
                console.error('❌ Geolocation error:', error);
                setGettingLocation(false);

                let errorMessage = 'Unable to get your location. ';
                switch (error.code) {
                    case 1: // PERMISSION_DENIED
                        errorMessage += 'Permission denied. Please allow location access.';
                        break;
                    case 2: // POSITION_UNAVAILABLE
                        errorMessage += 'Position unavailable. Try checking your network.';
                        break;
                    case 3: // TIMEOUT
                        errorMessage += 'Request timed out (15s). Please try again.';
                        break;
                    default:
                        errorMessage += 'Please try search or manual input.';
                }
                setLocationError(errorMessage);
            },
            options
        );
    };

    const handleLocationSelect = (location) => {
        setFormData({
            ...formData,
            source: {
                lat: location.lat,
                lng: location.lng,
            },
        });
        setSelectedLocationName(location.name);
        setLocationError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Convert quantity to quintals for backend
        let quantityInQuintals = formData.quantity;
        if (formData.unit === 'kg') {
            quantityInQuintals = formData.quantity / 100;
        } else if (formData.unit === 'ton') {
            quantityInQuintals = formData.quantity * 10;
        }

        // Use custom crop name if "other" is selected
        const finalFormData = {
            ...formData,
            quantity: quantityInQuintals,
            crop: formData.crop === 'other' ? customCrop.toLowerCase().trim() : formData.crop,
        };

        // Add custom vehicle if enabled and valid
        if (showCustomVehicle && customVehicle.name && customVehicle.ratePerKm) {
            finalFormData.customVehicle = {
                name: customVehicle.name.trim(),
                ratePerKm: parseFloat(customVehicle.ratePerKm),
            };
        }

        onSubmit(finalFormData);
    };

    return (
        <div className="input-form-container">
            <div className="form-header">
                <h1 className="form-title">
                    {t('appTitle')}
                    <span className="title-icon">🌾</span>
                </h1>
                <p className="form-subtitle">{t('form.headerSubtitlePart1')} <span className="hero-highlight">{t('form.headerSubtitlePart2')}</span></p>
            </div>

            <form onSubmit={handleSubmit} className="optimization-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="crop">{t('form.cropType')}</label>
                        <select
                            id="crop"
                            name="crop"
                            value={formData.crop}
                            onChange={handleChange}
                            className="form-control"
                            required
                        >
                            {crops.map(crop => (
                                <option key={crop.value} value={crop.value}>
                                    {crop.label}
                                </option>
                            ))}
                        </select>

                        {formData.crop === 'other' && (
                            <input
                                type="text"
                                placeholder={t('form.enterCropName')}
                                value={customCrop}
                                onChange={(e) => setCustomCrop(e.target.value)}
                                className="form-control custom-crop-input"
                                required
                                minLength="2"
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="quantity">
                            {t('form.quantityQuintals')}
                        </label>
                        <div className="quantity-input-group">
                            <input
                                type="number"
                                id="quantity"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                className="form-control"
                                min="0.1"
                                max="10000"
                                step="0.1"
                                required
                            />
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="form-control unit-select"
                            >
                                {quantityUnits.map(unit => (
                                    <option key={unit.value} value={unit.value}>
                                        {unit.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label>{t('form.vehicleType')}</label>
                        <div className="vehicle-grid">
                            {vehicles.map(vehicle => (
                                <div
                                    key={vehicle.value}
                                    className={`vehicle-option ${formData.vehicleType === vehicle.value ? 'selected' : ''}`}
                                    onClick={() => setFormData({ ...formData, vehicleType: vehicle.value })}
                                >
                                    <span className="vehicle-icon">{vehicle.icon}</span>
                                    <span className="vehicle-label">{vehicle.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="ride-share-card">
                            <div className="ride-share-header">
                                <span className="ride-share-icon">👥</span>
                                <div className="ride-share-titles">
                                    <h4 className="ride-share-main-label">{t('rideShare.label')}</h4>
                                    <p className="ride-share-tagline">
                                        {t('rideShare.opportunitiesSubtitle')}
                                    </p>
                                </div>
                            </div>

                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    name="isRideShare"
                                    checked={formData.isRideShare}
                                    onChange={handleChange}
                                />
                                <span className="checkmark"></span>
                                <div className="ride-share-info">
                                    <span className="ride-share-desc">{t('rideShare.description')}</span>
                                </div>
                            </label>
                        </div>

                        <div className="custom-vehicle-toggle">
                            <button
                                type="button"
                                className="toggle-custom-vehicle-btn"
                                onClick={() => setShowCustomVehicle(!showCustomVehicle)}
                            >
                                {showCustomVehicle ? `❌ ${t('form.removeCustomVehicle')}` : `➕ ${t('form.addCustomVehicle')}`}
                            </button>
                        </div>

                        {showCustomVehicle && (
                            <div className="custom-vehicle-inputs">
                                <div className="custom-vehicle-header">
                                    <span className="custom-vehicle-icon">🚗</span>
                                    <span>{t('form.customVehicle')}</span>
                                </div>
                                <div className="vehicle-input-grid">
                                    <div className="vehicle-input-group">
                                        <label htmlFor="vehicleName">{t('form.vehicleName')}</label>
                                        <input
                                            type="text"
                                            id="vehicleName"
                                            placeholder={t('form.vehicleNamePlaceholder')}
                                            value={customVehicle.name}
                                            onChange={(e) => setCustomVehicle({ ...customVehicle, name: e.target.value })}
                                            className="form-control"
                                            required={showCustomVehicle}
                                        />
                                    </div>
                                    <div className="vehicle-input-group">
                                        <label htmlFor="vehicleRate">{t('form.mileageRate')}</label>
                                        <input
                                            type="number"
                                            id="vehicleRate"
                                            placeholder="e.g., 30"
                                            value={customVehicle.ratePerKm}
                                            onChange={(e) => setCustomVehicle({ ...customVehicle, ratePerKm: e.target.value })}
                                            className="form-control"
                                            min="1"
                                            max="200"
                                            step="0.5"
                                            required={showCustomVehicle}
                                        />
                                    </div>
                                </div>
                                {customVehicle.ratePerKm && (
                                    <div className="vehicle-cost-preview">
                                        <span className="preview-icon">💰</span>
                                        <span>{t('form.costPreview')}: ₹{(parseFloat(customVehicle.ratePerKm) * 100).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="form-group full-width location-section">
                        <div className="location-header">
                            <label>📍 {t('form.yourLocation')}</label>
                            <div className="location-actions">
                                <button
                                    type="button"
                                    className="location-button"
                                    onClick={handleGetLocation}
                                    disabled={gettingLocation}
                                >
                                    {gettingLocation ? (
                                        <>
                                            <span className="spinner-small"></span>
                                            {t('form.gettingLocation')}
                                        </>
                                    ) : (
                                        <>
                                            <span>🎯</span>
                                            {t('form.useGPS')}
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="toggle-manual-btn"
                                    onClick={() => setShowManualInput(!showManualInput)}
                                    title={showManualInput ? 'Switch to search' : 'Switch to manual coordinates'}
                                >
                                    {showManualInput ? `🔍 ${t('form.search')}` : `⚙️ ${t('form.manual')}`}
                                </button>
                            </div>
                        </div>

                        {locationError && (
                            <div className="location-error">
                                ⚠️ {locationError}
                            </div>
                        )}

                        {!showManualInput ? (
                            <>
                                <LocationSearch onLocationSelect={handleLocationSelect} />
                                {selectedLocationName && (
                                    <div className="selected-location">
                                        <span className="selected-icon">✓</span>
                                        <span className="selected-text">{selectedLocationName}</span>
                                        <span className="selected-coords">
                                            ({formData.source.lat.toFixed(4)}, {formData.source.lng.toFixed(4)})
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="location-inputs">
                                <div className="location-input-group">
                                    <label htmlFor="lat" className="small-label">{t('form.latitude')}</label>
                                    <input
                                        type="number"
                                        id="lat"
                                        name="lat"
                                        value={formData.source.lat}
                                        onChange={handleChange}
                                        className="form-control"
                                        step="0.0001"
                                        required
                                    />
                                </div>

                                <div className="location-input-group">
                                    <label htmlFor="lng" className="small-label">{t('form.longitude')}</label>
                                    <input
                                        type="number"
                                        id="lng"
                                        name="lng"
                                        value={formData.source.lng}
                                        onChange={handleChange}
                                        className="form-control"
                                        step="0.0001"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    className="submit-button"
                    disabled={loading || (formData.crop === 'other' && !customCrop.trim())}
                >
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            {t('form.optimizing')}
                        </>
                    ) : (
                        <>
                            <span className="button-icon">🎯</span>
                            {t('form.findBestMandi')}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default InputForm;
