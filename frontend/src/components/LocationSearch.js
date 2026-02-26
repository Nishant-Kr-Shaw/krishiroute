import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './LocationSearch.css';

const LocationSearch = ({ onLocationSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const dropdownRef = useRef(null);

    // Load search history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('locationSearchHistory');
        if (savedHistory) {
            setSearchHistory(JSON.parse(savedHistory));
        }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search for locations using Nominatim API (free geocoding)
    const searchLocations = async (query) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: query,
                    format: 'json',
                    addressdetails: 1,
                    limit: 5,
                    countrycodes: 'in', // Limit to India
                },
            });

            const locations = response.data.map(item => ({
                name: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                type: item.type,
            }));

            setSuggestions(locations);
            setShowDropdown(true);
        } catch (error) {
            console.error('Location search error:', error);
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounce search to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                searchLocations(searchQuery);
            } else {
                setSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle location selection
    const handleSelectLocation = (location) => {
        // Add to history
        const newHistory = [
            location,
            ...searchHistory.filter(h => h.name !== location.name)
        ].slice(0, 10); // Keep only last 10 searches

        setSearchHistory(newHistory);
        localStorage.setItem('locationSearchHistory', JSON.stringify(newHistory));

        // Update parent component
        onLocationSelect({
            lat: location.lat,
            lng: location.lng,
            name: location.name,
        });

        // Update UI
        setSearchQuery(location.name);
        setShowDropdown(false);
        setSuggestions([]);
    };

    // Clear search
    const handleClear = () => {
        setSearchQuery('');
        setSuggestions([]);
        setShowDropdown(false);
    };

    // Clear history
    const handleClearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('locationSearchHistory');
    };

    // Show history when focusing on empty input
    const handleFocus = () => {
        if (!searchQuery && searchHistory.length > 0) {
            setShowDropdown(true);
        }
    };

    return (
        <div className="location-search" ref={dropdownRef}>
            <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search for city, village, or landmark..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleFocus}
                />
                {searchQuery && (
                    <button
                        type="button"
                        className="clear-button"
                        onClick={handleClear}
                    >
                        ✕
                    </button>
                )}
                {isSearching && <span className="search-spinner">⟳</span>}
            </div>

            {showDropdown && (
                <div className="search-dropdown">
                    {/* Show search history when no query */}
                    {!searchQuery && searchHistory.length > 0 && (
                        <>
                            <div className="dropdown-header">
                                <span className="dropdown-title">🕐 Recent Searches</span>
                                <button
                                    type="button"
                                    className="clear-history-btn"
                                    onClick={handleClearHistory}
                                >
                                    Clear All
                                </button>
                            </div>
                            {searchHistory.map((location, index) => (
                                <div
                                    key={index}
                                    className="dropdown-item history-item"
                                    onClick={() => handleSelectLocation(location)}
                                >
                                    <span className="item-icon">📍</span>
                                    <div className="item-content">
                                        <div className="item-name">{location.name}</div>
                                        <div className="item-coords">
                                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Show search suggestions */}
                    {searchQuery && suggestions.length > 0 && (
                        <>
                            <div className="dropdown-header">
                                <span className="dropdown-title">📍 Suggestions</span>
                            </div>
                            {suggestions.map((location, index) => (
                                <div
                                    key={index}
                                    className="dropdown-item"
                                    onClick={() => handleSelectLocation(location)}
                                >
                                    <span className="item-icon">📍</span>
                                    <div className="item-content">
                                        <div className="item-name">{location.name}</div>
                                        <div className="item-coords">
                                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* No results */}
                    {searchQuery && !isSearching && suggestions.length === 0 && (
                        <div className="dropdown-empty">
                            <span>😕</span>
                            <p>No locations found</p>
                            <small>Try searching for a city or landmark</small>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationSearch;
