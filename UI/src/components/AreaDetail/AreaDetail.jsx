import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';

import { useData } from '../../app/context/DataContext';
import api from '../../config/api';
import DustbinCard from '../DustbinCard/DustbinCard';
import {
    Trash2,
    LogOut,
    User,
    PlusCircle,
    Search,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Activity,
    MapPin,
    ArrowLeft,
    Map as MapIcon,
    Eye,
    EyeOff,
    Sun,
    Moon
} from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AreaDetail.css';
import LocationSearch from '../LocationSearch/LocationSearch';

// Fix default marker icon issue in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create color-coded marker icons
const createMarkerIcon = (color, pulseColor) => {
    return L.divIcon({
        className: 'custom-marker-icon',
        html: `
            <div class="marker-pin marker-${color}">
                <div class="marker-pulse marker-pulse-${color}"></div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            </div>
        `,
        iconSize: [36, 46],
        iconAnchor: [18, 46],
        popupAnchor: [0, -40],
    });
};

const greenIcon = createMarkerIcon('green');
const yellowIcon = createMarkerIcon('yellow');
const redIcon = createMarkerIcon('red');
const blueIcon = createMarkerIcon('blue');

const getMarkerIcon = (bin) => {
    if (bin.status === 'being-emptied') return blueIcon;
    if (bin.fillLevel >= 80) return redIcon;
    if (bin.fillLevel >= 50) return yellowIcon;
    return greenIcon;
};

// Compute convex hull for zone polygon
function computeConvexHull(points) {
    if (points.length < 3) return points;

    const cross = (O, A, B) =>
        (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);

    const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const lower = [];
    for (const p of sorted) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
            lower.pop();
        lower.push(p);
    }
    const upper = [];
    for (const p of sorted.reverse()) {
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
            upper.pop();
        upper.push(p);
    }
    upper.pop();
    lower.pop();
    return lower.concat(upper);
}

// Component to fit map bounds
function FitBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            const leafletBounds = L.latLngBounds(bounds.map(b => [b[0], b[1]]));
            map.fitBounds(leafletBounds, { padding: [40, 40], maxZoom: 16 });
        }
    }, [bounds, map]);
    return null;
}

export default function AreaDetail() {
    const { areaName } = useParams();
    const decodedAreaName = decodeURIComponent(areaName || '');
    const { user, logout } = useAuth();
    const { dustbins, claimBin, completeBin, refreshDustbins } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showMarkers, setShowMarkers] = useState(false);
    const [mapExpanded, setMapExpanded] = useState(true);
    const [mapTheme, setMapTheme] = useState('dark');
    const [newBin, setNewBin] = useState({
        binNumber: '',
        latitude: 0,
        longitude: 0,
        fillLevel: 0
    });

    // Filter bins for this area
    const areaBins = useMemo(() => {
        return dustbins.filter(bin => bin.location === decodedAreaName);
    }, [dustbins, decodedAreaName]);

    // Compute zone polygon and map center
    const { zonePolygon, mapCenter, binCoords } = useMemo(() => {
        const coords = areaBins
            .filter(b => b.latitude && b.longitude)
            .map(b => [b.latitude, b.longitude]);

        if (coords.length === 0) {
            return { zonePolygon: [], mapCenter: [22.7196, 75.8577], binCoords: [] };
        }

        const avgLat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
        const avgLng = coords.reduce((s, c) => s + c[1], 0) / coords.length;

        let polygon = [];
        if (coords.length >= 3) {
            polygon = computeConvexHull(coords);
            // Expand polygon slightly for visual padding
            polygon = polygon.map(p => {
                const dLat = (p[0] - avgLat) * 0.15;
                const dLng = (p[1] - avgLng) * 0.15;
                return [p[0] + dLat, p[1] + dLng];
            });
        } else if (coords.length === 2) {
            // Create a rectangle around 2 points
            const pad = 0.002;
            polygon = [
                [coords[0][0] - pad, coords[0][1] - pad],
                [coords[0][0] - pad, coords[1][1] + pad],
                [coords[1][0] + pad, coords[1][1] + pad],
                [coords[1][0] + pad, coords[0][1] - pad],
            ];
        } else {
            // Single point - create a small square
            const pad = 0.003;
            polygon = [
                [coords[0][0] - pad, coords[0][1] - pad],
                [coords[0][0] - pad, coords[0][1] + pad],
                [coords[0][0] + pad, coords[0][1] + pad],
                [coords[0][0] + pad, coords[0][1] - pad],
            ];
        }

        return { zonePolygon: polygon, mapCenter: [avgLat, avgLng], binCoords: coords };
    }, [areaBins]);

    const handleLogout = () => {
        logout();
        navigate('/login');
        toast.success('Logged out successfully');
    };

    const handleAddBin = async () => {
        if (!newBin.binNumber) {
            toast.error('Please fill in all required fields');
            return;
        }

        const status =
            newBin.fillLevel >= 80 ? 'full' :
                newBin.fillLevel >= 50 ? 'half-full' : 'empty';

        try {
            await api.post('/dustbins', {
                binNumber: newBin.binNumber,
                location: decodedAreaName,
                latitude: newBin.latitude,
                longitude: newBin.longitude,
                fillLevel: newBin.fillLevel,
                status: status,
                lastEmptied: new Date().toISOString()
            });
            await refreshDustbins();
            setShowAddDialog(false);
            setNewBin({
                binNumber: '',
                latitude: 0,
                longitude: 0,
                fillLevel: 0
            });
            toast.success('Dustbin added successfully');
        } catch (error) {
            console.error('Failed to add bin:', error);
            toast.error('Failed to add dustbin');
        }
    };

    const handleClaimBin = (binId) => {
        if (user) {
            claimBin(binId, user._id);
            toast.success('Bin claimed! You can now empty it.');
        }
    };

    const handleCompleteBin = (binId) => {
        completeBin(binId);
        toast.success('Great work! Bin marked as emptied.');
    };

    const handleDeleteBin = async (binId) => {
        if (window.confirm('Are you sure you want to delete this dustbin?')) {
            try {
                await api.delete(`/dustbins/${binId}`);
                await refreshDustbins();
                toast.success('Dustbin deleted successfully');
            } catch (error) {
                console.error('Failed to delete bin:', error);
                toast.error('Failed to delete dustbin');
            }
        }
    };

    const handleZoneClick = () => {
        setShowMarkers(true);
    };

    // Filter bins based on search
    const filteredBins = areaBins.filter(bin =>
        bin.binNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter bins for workers (hide being-emptied bins assigned to others)
    const visibleBins = user?.role === 'worker'
        ? filteredBins.filter(bin =>
            bin.status !== 'being-emptied' || bin.assignedWorkerId === user._id
        )
        : filteredBins;

    // Statistics for this area
    const totalBins = areaBins.length;
    const fullBins = areaBins.filter(b => b.status === 'full').length;
    const emptyBins = areaBins.filter(b => b.status === 'empty').length;
    const beingEmptied = areaBins.filter(b => b.status === 'being-emptied').length;
    const myAssignedBins = user?.role === 'worker'
        ? areaBins.filter(b => b.assignedWorkerId === user._id).length
        : 0;
    const averageFillLevel = totalBins > 0
        ? areaBins.reduce((sum, b) => sum + b.fillLevel, 0) / totalBins
        : 0;

    if (!decodedAreaName) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-600">Invalid area</p>
            </div>
        );
    }

    const [activeTab, setActiveTab] = useState('all');

    // Get fill level color for popup
    const getFillColor = (level) => {
        if (level >= 80) return '#ef4444';
        if (level >= 50) return '#f59e0b';
        return '#22c55e';
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'empty': return 'Empty';
            case 'half-full': return 'Half Full';
            case 'full': return 'Full';
            case 'being-emptied': return 'Being Emptied';
            default: return status;
        }
    };

    return (
        <div className="area-detail-container">
            {/* Header */}
            <header className="area-detail-header">
                <div className="area-detail-header-inner">
                    <div className="area-detail-header-content">
                        <div className="area-detail-header-left">
                            <button
                                className="area-detail-btn area-detail-btn-ghost"
                                onClick={() => navigate('/dashboard')}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="area-detail-title-section">
                                <div className="area-detail-icon-box">
                                    <MapPin className="area-detail-icon-main" />
                                </div>
                                <div>
                                    <h1 className="area-detail-title">{decodedAreaName}</h1>
                                    <p className="area-detail-subtitle">Area Dashboard</p>
                                </div>
                            </div>
                        </div>
                        <div className="area-detail-header-right">
                            <div className="area-detail-user-info">
                                <p className="area-detail-user-name">{user?.name}</p>
                                <p className="area-detail-user-role">{user?.role}</p>
                            </div>
                            <button
                                className="area-detail-btn area-detail-btn-outline"
                                onClick={() => navigate('/profile')}
                            >
                                <User className="w-4 h-4 mr-2" />
                                Profile
                            </button>
                            <button
                                className="area-detail-btn area-detail-btn-outline"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="area-detail-main">
                {/* Statistics Cards */}
                <div className="area-detail-stats-grid">
                    <div className="area-detail-stat-card">
                        <div className="area-detail-stat-card-header">
                            <span className="area-detail-stat-title">Total Bins</span>
                            <Activity className="area-detail-stat-icon text-blue" />
                        </div>
                        <div className="area-detail-stat-content">
                            <div className="area-detail-stat-value">{totalBins}</div>
                        </div>
                    </div>

                    <div className="area-detail-stat-card">
                        <div className="area-detail-stat-card-header">
                            <span className="area-detail-stat-title">Full Bins</span>
                            <AlertCircle className="area-detail-stat-icon text-red" />
                        </div>
                        <div className="area-detail-stat-content">
                            <div className="area-detail-stat-value text-red">{fullBins}</div>
                        </div>
                    </div>

                    <div className="area-detail-stat-card">
                        <div className="area-detail-stat-card-header">
                            <span className="area-detail-stat-title">
                                {user?.role === 'worker' ? 'My Tasks' : 'Being Emptied'}
                            </span>
                            <TrendingUp className="area-detail-stat-icon text-blue" />
                        </div>
                        <div className="area-detail-stat-content">
                            <div className="area-detail-stat-value text-blue">
                                {user?.role === 'worker' ? myAssignedBins : beingEmptied}
                            </div>
                        </div>
                    </div>

                    <div className="area-detail-stat-card">
                        <div className="area-detail-stat-card-header">
                            <span className="area-detail-stat-title">Empty Bins</span>
                            <CheckCircle className="area-detail-stat-icon text-green" />
                        </div>
                        <div className="area-detail-stat-content">
                            <div className="area-detail-stat-value text-green">{emptyBins}</div>
                        </div>
                    </div>

                    <div className="area-detail-stat-card">
                        <div className="area-detail-stat-card-header">
                            <span className="area-detail-stat-title">Avg Fill Level</span>
                            <TrendingUp className="area-detail-stat-icon text-purple" />
                        </div>
                        <div className="area-detail-stat-content">
                            <div className="area-detail-stat-value">{averageFillLevel.toFixed(0)}%</div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════ SMART CITY MAP SECTION ═══════════════ */}
                {binCoords.length > 0 && (
                    <div className="area-detail-map-section">
                        <div className="area-detail-map-header">
                            <div className="area-detail-map-header-left">
                                <div className="area-detail-map-icon-wrapper">
                                    <MapIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="area-detail-map-title">Zone Map — {decodedAreaName}</h2>
                                    <p className="area-detail-map-subtitle">
                                        {showMarkers
                                            ? `Showing ${areaBins.filter(b => b.latitude && b.longitude).length} IoT dustbins`
                                            : 'Click the highlighted zone to reveal dustbin locations'}
                                    </p>
                                </div>
                            </div>
                            <div className="area-detail-map-controls">
                                <button
                                    className="area-detail-map-toggle-btn ao-theme-toggle"
                                    onClick={() => setMapTheme(mapTheme === 'light' ? 'dark' : 'light')}
                                    title={mapTheme === 'light' ? 'Switch to Dark Map' : 'Switch to Light Map'}
                                    style={{ width: '2rem', height: '2rem', padding: 0, justifyContent: 'center' }}
                                >
                                    {mapTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-warning" />}
                                </button>
                                {showMarkers && (
                                    <button
                                        className="area-detail-map-toggle-btn"
                                        onClick={() => setShowMarkers(false)}
                                        title="Hide markers"
                                    >
                                        <EyeOff className="w-4 h-4" />
                                        <span>Hide Bins</span>
                                    </button>
                                )}
                                <button
                                    className="area-detail-map-toggle-btn"
                                    onClick={() => setMapExpanded(!mapExpanded)}
                                >
                                    {mapExpanded ? 'Collapse' : 'Expand'}
                                </button>
                            </div>
                        </div>

                        {mapExpanded && (
                            <div className="area-detail-map-wrapper">
                                {/* Map Legend */}
                                <div className="area-detail-map-legend">
                                    <div className="map-legend-item">
                                        <span className="map-legend-dot map-legend-green"></span>
                                        <span>Empty</span>
                                    </div>
                                    <div className="map-legend-item">
                                        <span className="map-legend-dot map-legend-yellow"></span>
                                        <span>Half Full</span>
                                    </div>
                                    <div className="map-legend-item">
                                        <span className="map-legend-dot map-legend-red"></span>
                                        <span>Full</span>
                                    </div>
                                    <div className="map-legend-item">
                                        <span className="map-legend-dot map-legend-blue"></span>
                                        <span>Being Emptied</span>
                                    </div>
                                </div>

                                <MapContainer
                                    center={mapCenter}
                                    zoom={15}
                                    className="area-detail-leaflet-map"
                                    scrollWheelZoom={true}
                                    zoomControl={true}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                                        url={mapTheme === 'light'
                                            ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                            : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                        }
                                    />
                                    <FitBounds bounds={binCoords} />

                                    {/* Zone Polygon */}
                                    {zonePolygon.length >= 3 && (
                                        <Polygon
                                            positions={zonePolygon}
                                            pathOptions={{
                                                color: showMarkers ? '#14b8a6' : '#06b6d4',
                                                fillColor: showMarkers ? '#0d9488' : '#0891b2',
                                                fillOpacity: showMarkers ? 0.08 : 0.2,
                                                weight: showMarkers ? 1.5 : 2.5,
                                                dashArray: showMarkers ? '4 6' : null,
                                            }}
                                            eventHandlers={{
                                                click: handleZoneClick,
                                            }}
                                        >
                                            {!showMarkers && (
                                                <Popup>
                                                    <div className="zone-popup">
                                                        <h3 className="zone-popup-title">{decodedAreaName}</h3>
                                                        <p className="zone-popup-info">{totalBins} dustbins in this zone</p>
                                                        <p className="zone-popup-hint">Click zone to show dustbin markers</p>
                                                    </div>
                                                </Popup>
                                            )}
                                        </Polygon>
                                    )}

                                    {/* Dustbin Markers (shown after clicking zone) */}
                                    {showMarkers && areaBins
                                        .filter(b => b.latitude && b.longitude)
                                        .map(bin => (
                                            <Marker
                                                key={bin._id}
                                                position={[bin.latitude, bin.longitude]}
                                                icon={getMarkerIcon(bin)}
                                            >
                                                <Popup>
                                                    <div className="bin-popup">
                                                        <div className="bin-popup-header">
                                                            <span className="bin-popup-id">{bin.binNumber}</span>
                                                            <span
                                                                className="bin-popup-status"
                                                                style={{ backgroundColor: getFillColor(bin.fillLevel) + '22', color: getFillColor(bin.fillLevel), border: `1px solid ${getFillColor(bin.fillLevel)}44` }}
                                                            >
                                                                {getStatusLabel(bin.status)}
                                                            </span>
                                                        </div>
                                                        <div className="bin-popup-fill-section">
                                                            <div className="bin-popup-fill-row">
                                                                <span>Fill Level</span>
                                                                <span style={{ color: getFillColor(bin.fillLevel), fontWeight: 700 }}>{bin.fillLevel}%</span>
                                                            </div>
                                                            <div className="bin-popup-fill-track">
                                                                <div
                                                                    className="bin-popup-fill-bar"
                                                                    style={{
                                                                        width: `${bin.fillLevel}%`,
                                                                        backgroundColor: getFillColor(bin.fillLevel),
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="bin-popup-coords">
                                                            <MapPin className="w-3 h-3" />
                                                            <span>{bin.latitude.toFixed(4)}, {bin.longitude.toFixed(4)}</span>
                                                        </div>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ))}
                                </MapContainer>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions Bar */}
                <div className="area-detail-search-bar">
                    <div className="area-detail-search-input-wrapper">
                        <Search className="area-detail-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by bin number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="area-detail-search-input"
                        />
                    </div>
                    {user?.role === 'admin' && (
                        <button
                            className="area-detail-btn area-detail-btn-primary"
                            onClick={() => setShowAddDialog(true)}
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Add Dustbin
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="area-detail-tabs">
                    <div className="area-detail-tabs-list">
                        <button
                            className={`area-detail-tab-trigger ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            All Bins ({visibleBins.length})
                        </button>
                        <button
                            className={`area-detail-tab-trigger ${activeTab === 'full' ? 'active' : ''}`}
                            onClick={() => setActiveTab('full')}
                        >
                            Full ({visibleBins.filter(b => b.status === 'full').length})
                        </button>
                        <button
                            className={`area-detail-tab-trigger ${activeTab === 'half-full' ? 'active' : ''}`}
                            onClick={() => setActiveTab('half-full')}
                        >
                            Half Full ({visibleBins.filter(b => b.status === 'half-full').length})
                        </button>
                        <button
                            className={`area-detail-tab-trigger ${activeTab === 'empty' ? 'active' : ''}`}
                            onClick={() => setActiveTab('empty')}
                        >
                            Empty ({visibleBins.filter(b => b.status === 'empty').length})
                        </button>
                        {user?.role === 'worker' && (
                            <button
                                className={`area-detail-tab-trigger ${activeTab === 'my-tasks' ? 'active' : ''}`}
                                onClick={() => setActiveTab('my-tasks')}
                            >
                                My Tasks ({myAssignedBins})
                            </button>
                        )}
                    </div>

                    <div className="area-detail-tab-content">
                        {activeTab === 'all' && (
                            <div className="area-detail-bins-grid">
                                {visibleBins.map(bin => (
                                    <DustbinCard
                                        key={bin._id}
                                        bin={bin}
                                        onClaim={handleClaimBin}
                                        onComplete={handleCompleteBin}
                                        onDelete={user?.role === 'admin' ? handleDeleteBin : undefined}
                                        showActions={true}
                                        isWorker={user?.role === 'worker'}
                                        currentUserId={user?._id}
                                    />
                                ))}
                            </div>
                        )}

                        {activeTab === 'full' && (
                            <div className="area-detail-bins-grid">
                                {visibleBins.filter(b => b.status === 'full').map(bin => (
                                    <DustbinCard
                                        key={bin._id}
                                        bin={bin}
                                        onClaim={handleClaimBin}
                                        onComplete={handleCompleteBin}
                                        onDelete={user?.role === 'admin' ? handleDeleteBin : undefined}
                                        showActions={true}
                                        isWorker={user?.role === 'worker'}
                                        currentUserId={user?._id}
                                    />
                                ))}
                            </div>
                        )}

                        {activeTab === 'half-full' && (
                            <div className="area-detail-bins-grid">
                                {visibleBins.filter(b => b.status === 'half-full').map(bin => (
                                    <DustbinCard
                                        key={bin._id}
                                        bin={bin}
                                        onClaim={handleClaimBin}
                                        onComplete={handleCompleteBin}
                                        onDelete={user?.role === 'admin' ? handleDeleteBin : undefined}
                                        showActions={true}
                                        isWorker={user?.role === 'worker'}
                                        currentUserId={user?._id}
                                    />
                                ))}
                            </div>
                        )}

                        {activeTab === 'empty' && (
                            <div className="area-detail-bins-grid">
                                {visibleBins.filter(b => b.status === 'empty').map(bin => (
                                    <DustbinCard
                                        key={bin._id}
                                        bin={bin}
                                        onClaim={handleClaimBin}
                                        onComplete={handleCompleteBin}
                                        onDelete={user?.role === 'admin' ? handleDeleteBin : undefined}
                                        showActions={true}
                                        isWorker={user?.role === 'worker'}
                                        currentUserId={user?._id}
                                    />
                                ))}
                            </div>
                        )}

                        {user?.role === 'worker' && activeTab === 'my-tasks' && (
                            <div className="area-detail-tab-pane">
                                <div className="area-detail-bins-grid">
                                    {visibleBins.filter(b => b.assignedWorkerId === user._id).map(bin => (
                                        <DustbinCard
                                            key={bin._id}
                                            bin={bin}
                                            onClaim={handleClaimBin}
                                            onComplete={handleCompleteBin}
                                            onDelete={undefined}
                                            showActions={true}
                                            isWorker={true}
                                            currentUserId={user._id}
                                        />
                                    ))}
                                </div>
                                {areaBins.filter(b => b.assignedWorkerId === user._id).length === 0 && (
                                    <div className="area-detail-empty-state">
                                        <Trash2 className="area-detail-empty-icon" />
                                        <p className="text-gray-600">No tasks assigned in this area yet</p>
                                        <p className="text-sm text-gray-500 mt-2">Claim a bin to start working</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {visibleBins.length === 0 && activeTab !== 'my-tasks' && (
                            <div className="area-detail-empty-state">
                                <Trash2 className="area-detail-empty-icon" />
                                <p className="text-gray-600">No dustbins found in this area</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Modal for Add Bin */}
            {showAddDialog && (
                <div className="area-detail-modal-overlay">
                    <div className="area-detail-modal">
                        <div className="area-detail-modal-header">
                            <h2 className="area-detail-modal-title">Add New Dustbin to {decodedAreaName}</h2>
                            <p className="area-detail-modal-desc">
                                Enter the details of the new IoT-enabled dustbin
                            </p>
                        </div>
                        <div className="area-detail-modal-content">
                            <div className="area-detail-form">
                                <div className="area-detail-form-group">
                                    <label className="area-detail-label" htmlFor="binNumber">Bin Number</label>
                                    <input
                                        id="binNumber"
                                        placeholder="BIN-009"
                                        value={newBin.binNumber}
                                        onChange={(e) => setNewBin({ ...newBin, binNumber: e.target.value })}
                                        className="area-detail-input"
                                    />
                                </div>
                                <div className="area-detail-form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="area-detail-label">Search Location & Coordinates</label>
                                    <LocationSearch
                                        initialValue={decodedAreaName}
                                        onSelect={(data) => {
                                            setNewBin({
                                                ...newBin,
                                                latitude: data.lat,
                                                longitude: data.lon
                                            });
                                            toast.success(`Coordinates found: ${data.lat}, ${data.lon}`);
                                        }}
                                    />
                                </div>
                                <div className="area-detail-grid-2">
                                    <div className="area-detail-form-group">
                                        <label className="area-detail-label" htmlFor="latitude">Latitude</label>
                                        <input
                                            id="latitude"
                                            type="number"
                                            step="0.0001"
                                            placeholder="28.5449"
                                            value={newBin.latitude || ''}
                                            onChange={(e) => setNewBin({ ...newBin, latitude: parseFloat(e.target.value) || 0 })}
                                            className="area-detail-input"
                                        />
                                    </div>
                                    <div className="area-detail-form-group">
                                        <label className="area-detail-label" htmlFor="longitude">Longitude</label>
                                        <input
                                            id="longitude"
                                            type="number"
                                            step="0.0001"
                                            placeholder="77.1926"
                                            value={newBin.longitude || ''}
                                            onChange={(e) => setNewBin({ ...newBin, longitude: parseFloat(e.target.value) || 0 })}
                                            className="area-detail-input"
                                        />
                                    </div>
                                </div>
                                <div className="area-detail-form-group">
                                    <label className="area-detail-label" htmlFor="fillLevel">Initial Fill Level (%)</label>
                                    <input
                                        id="fillLevel"
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="0"
                                        value={newBin.fillLevel || ''}
                                        onChange={(e) => setNewBin({ ...newBin, fillLevel: parseInt(e.target.value) || 0 })}
                                        className="area-detail-input"
                                    />
                                </div>
                            </div>
                            <div className="area-detail-modal-footer">
                                <button
                                    className="area-detail-btn area-detail-btn-outline"
                                    onClick={() => setShowAddDialog(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="area-detail-btn area-detail-btn-primary"
                                    onClick={handleAddBin}
                                >
                                    Add Dustbin
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
