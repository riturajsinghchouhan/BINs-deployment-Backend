import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';
import './LocationSearch.css';

const LocationSearch = ({ onSelect, initialValue = '' }) => {
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const debounceTimer = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (searchText) => {
        if (!searchText || searchText.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=5&addressdetails=1`
            );
            const data = await response.json();
            setSuggestions(data);
            setShowDropdown(data.length > 0);
        } catch (error) {
            console.error('Error fetching locations:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(() => {
            fetchSuggestions(value);
        }, 500);
    };

    const handleSelect = (item) => {
        setQuery(item.display_name);
        setSuggestions([]);
        setShowDropdown(false);
        onSelect({
            address: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
        });
    };

    return (
        <div className="location-search-container" ref={dropdownRef}>
            <div className="location-search-input-wrapper">
                {loading ? (
                    <Loader2 className="location-search-icon animate-spin text-blue-500" />
                ) : (
                    <Search className="location-search-icon" />
                )}
                <input
                    type="text"
                    className="location-search-input"
                    placeholder="Search area (e.g. Rajwada, Indore)..."
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                />
            </div>

            {showDropdown && suggestions.length > 0 && (
                <ul className="location-suggestions-dropdown">
                    {suggestions.map((item, index) => (
                        <li
                            key={index}
                            className="location-suggestion-item"
                            onClick={() => handleSelect(item)}
                        >
                            <MapPin className="suggestion-icon" />
                            <div className="suggestion-text">
                                <span className="suggestion-name">{item.display_name.split(',')[0]}</span>
                                <span className="suggestion-address">{item.display_name}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LocationSearch;
