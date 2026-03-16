import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import { useData } from '../../app/context/DataContext';
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
import './AreaDetail_worker.css';

// Fix default marker icon issue in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create color-coded marker icons
const createMarkerIcon = (color) => {
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

export default function AreaDetail_worker() {
    const { areaName } = useParams();
    const decodedAreaName = decodeURIComponent(areaName || '');
    const { user, logout } = useAuth();
    const { dustbins, claimBin, completeBin } = useData();
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
            polygon = polygon.map(p => {
                const dLat = (p[0] - avgLat) * 0.15;
                const dLng = (p[1] - avgLng) * 0.15;
                return [p[0] + dLat, p[1] + dLng];
            });
        } else if (coords.length === 2) {
            const pad = 0.002;
            polygon = [
                [coords[0][0] - pad, coords[0][1] - pad],
                [coords[0][0] - pad, coords[1][1] + pad],
                [coords[1][0] + pad, coords[1][1] + pad],
                [coords[1][0] + pad, coords[0][1] - pad],
            ];
        } else {
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
        <div className="area-detail-worker-container">
            {/* Header */}
            <header className="area-detail-worker-header">
                <div className="area-detail-worker-header-inner">
                    <div className="area-detail-worker-header-content">
                        <div className="area-detail-worker-header-left">
                            <button
                                className="area-detail-worker-btn area-detail-worker-btn-ghost"
                                onClick={() => navigate('/dashboardworker')}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="area-detail-worker-title-section">
                                <div className="area-detail-worker-icon-box">
                                    <MapPin className="area-detail-worker-icon-main" />
                                </div>
                                <div>
                                    <h1 className="area-detail-worker-title">{decodedAreaName}</h1>
                                    <p className="area-detail-worker-subtitle">Area Dashboard</p>
                                </div>
                            </div>
                        </div>
                        <div className="area-detail-worker-header-right">
                            <div className="area-detail-worker-user-info">
                                <p className="area-detail-worker-user-name">{user?.name}</p>
                                <p className="area-detail-worker-user-role">{user?.role}</p>
                            </div>
                            <button
                                className="area-detail-worker-btn area-detail-worker-btn-outline"
                                onClick={() => navigate('/profile')}
                            >
                                <User className="w-4 h-4 mr-2" />
                                Profile
                            </button>
                            <button
                                className="area-detail-worker-btn area-detail-worker-btn-outline"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="area-detail-worker-main">
                {/* Statistics Cards */}
                <div className="area-detail-worker-stats-grid">
                    <div className="area-detail-worker-stat-card">
                        <div className="area-detail-worker-stat-card-header">
                            <span className="area-detail-worker-stat-title">Total Bins</span>
                            <Activity className="area-detail-worker-stat-icon text-blue" />
                        </div>
                        <div className="area-detail-worker-stat-content">
                            <div className="area-detail-worker-stat-value">{totalBins}</div>
                        </div>
                    </div>

                    <div className="area-detail-worker-stat-card">
                        <div className="area-detail-worker-stat-card-header">
                            <span className="area-detail-worker-stat-title">Full Bins</span>
                            <AlertCircle className="area-detail-worker-stat-icon text-red" />
                        </div>
                        <div className="area-detail-worker-stat-content">
                            <div className="area-detail-worker-stat-value text-red">{fullBins}</div>
                        </div>
                    </div>

                    <div className="area-detail-worker-stat-card">
                        <div className="area-detail-worker-stat-card-header">
                            <span className="area-detail-worker-stat-title">
                                {user?.role === 'worker' ? 'My Tasks' : 'Being Emptied'}
                            </span>
                            <TrendingUp className="area-detail-worker-stat-icon text-blue" />
                        </div>
                        <div className="area-detail-worker-stat-content">
                            <div className="area-detail-worker-stat-value text-blue">
                                {user?.role === 'worker' ? myAssignedBins : beingEmptied}
                            </div>
                        </div>
                    </div>

                    <div className="area-detail-worker-stat-card">
                        <div className="area-detail-worker-stat-card-header">
                            <span className="area-detail-worker-stat-title">Empty Bins</span>
                            <CheckCircle className="area-detail-worker-stat-icon text-green" />
                        </div>
                        <div className="area-detail-worker-stat-content">
                            <div className="area-detail-worker-stat-value text-green">{emptyBins}</div>
                        </div>
                    </div>

                    <div className="area-detail-worker-stat-card">
                        <div className="area-detail-worker-stat-card-header">
                            <span className="area-detail-worker-stat-title">Avg Fill Level</span>
                            <TrendingUp className="area-detail-worker-stat-icon text-purple" />
                        </div>
                        <div className="area-detail-worker-stat-content">
                            <div className="area-detail-worker-stat-value">{averageFillLevel.toFixed(0)}%</div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════ SMART CITY MAP SECTION ═══════════════ */}
                {binCoords.length > 0 && (
                    <div className="area-detail-worker-map-section">
                        <div className="area-detail-worker-map-header">
                            <div className="area-detail-worker-map-header-left">
                                <div className="area-detail-worker-map-icon-wrapper">
                                    <MapIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="area-detail-worker-map-title">Zone Map — {decodedAreaName}</h2>
                                    <p className="area-detail-worker-map-subtitle">
                                        {showMarkers
                                            ? `Showing ${areaBins.filter(b => b.latitude && b.longitude).length} IoT dustbins`
                                            : 'Click the highlighted zone to reveal dustbin locations'}
                                    </p>
                                </div>
                            </div>
                            <div className="area-detail-worker-map-controls">
                                <button
                                    className="area-detail-worker-map-toggle-btn ao-theme-toggle"
                                    onClick={() => setMapTheme(mapTheme === 'light' ? 'dark' : 'light')}
                                    title={mapTheme === 'light' ? 'Switch to Dark Map' : 'Switch to Light Map'}
                                    style={{ width: '2rem', height: '2rem', padding: 0, justifyContent: 'center' }}
                                >
                                    {mapTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-warning" />}
                                </button>
                                {showMarkers && (
                                    <button
                                        className="area-detail-worker-map-toggle-btn"
                                        onClick={() => setShowMarkers(false)}
                                        title="Hide markers"
                                    >
                                        <EyeOff className="w-4 h-4" />
                                        <span>Hide Bins</span>
                                    </button>
                                )}
                                <button
                                    className="area-detail-worker-map-toggle-btn"
                                    onClick={() => setMapExpanded(!mapExpanded)}
                                >
                                    {mapExpanded ? 'Collapse' : 'Expand'}
                                </button>
                            </div>
                        </div>

                        {mapExpanded && (
                            <div className="area-detail-worker-map-wrapper">
                                {/* Map Legend */}
                                <div className="area-detail-worker-map-legend">
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
                                    className="area-detail-worker-leaflet-map"
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
                <div className="area-detail-worker-search-bar">
                    <div className="area-detail-worker-search-input-wrapper">
                        <Search className="area-detail-worker-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by bin number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="area-detail-worker-search-input"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="area-detail-worker-tabs">
                    <div className="area-detail-worker-tabs-list">
                        <button
                            className={`area-detail-worker-tab-trigger ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            All Bins ({visibleBins.length})
                        </button>
                        <button
                            className={`area-detail-worker-tab-trigger ${activeTab === 'full' ? 'active' : ''}`}
                            onClick={() => setActiveTab('full')}
                        >
                            Full ({visibleBins.filter(b => b.status === 'full').length})
                        </button>
                        <button
                            className={`area-detail-worker-tab-trigger ${activeTab === 'half-full' ? 'active' : ''}`}
                            onClick={() => setActiveTab('half-full')}
                        >
                            Half Full ({visibleBins.filter(b => b.status === 'half-full').length})
                        </button>
                        <button
                            className={`area-detail-worker-tab-trigger ${activeTab === 'empty' ? 'active' : ''}`}
                            onClick={() => setActiveTab('empty')}
                        >
                            Empty ({visibleBins.filter(b => b.status === 'empty').length})
                        </button>
                        {user?.role === 'worker' && (
                            <button
                                className={`area-detail-worker-tab-trigger ${activeTab === 'my-tasks' ? 'active' : ''}`}
                                onClick={() => setActiveTab('my-tasks')}
                            >
                                My Tasks ({myAssignedBins})
                            </button>
                        )}
                    </div>

                    <div className="area-detail-worker-tab-content">
                        {activeTab === 'all' && (
                            <div className="area-detail-worker-bins-grid">
                                {visibleBins.map(bin => (
                                    <DustbinCard
                                        key={bin._id}
                                        bin={bin}
                                        onClaim={handleClaimBin}
                                        onComplete={handleCompleteBin}
                                        onDelete={undefined}
                                        showActions={true}
                                        isWorker={user?.role === 'worker'}
                                        currentUserId={user?._id}
                                    />
                                ))}
                            </div>
                        )}

                        {activeTab === 'full' && (
                            <div className="area-detail-worker-bins-grid">
                                {visibleBins.filter(b => b.status === 'full').map(bin => (
                                    <DustbinCard
                                        key={bin._id}
                                        bin={bin}
                                        onClaim={handleClaimBin}
                                        onComplete={handleCompleteBin}
                                        onDelete={undefined}
                                        showActions={true}
                                        isWorker={user?.role === 'worker'}
                                        currentUserId={user?._id}
                                    />
                                ))}
                            </div>
                        )}

                        {activeTab === 'half-full' && (
                            <div className="area-detail-worker-bins-grid">
                                {visibleBins.filter(b => b.status === 'half-full').map(bin => (
                                    <DustbinCard
                                        key={bin._id}
                                        bin={bin}
                                        onClaim={handleClaimBin}
                                        onComplete={handleCompleteBin}
                                        onDelete={undefined}
                                        showActions={true}
                                        isWorker={user?.role === 'worker'}
                                        currentUserId={user?._id}
                                    />
                                ))}
                            </div>
                        )}

                        {activeTab === 'empty' && (
                            <div className="area-detail-worker-bins-grid">
                                {visibleBins.filter(b => b.status === 'empty').map(bin => (
                                    <DustbinCard
                                        key={bin._id}
                                        bin={bin}
                                        onClaim={handleClaimBin}
                                        onComplete={handleCompleteBin}
                                        onDelete={undefined}
                                        showActions={true}
                                        isWorker={user?.role === 'worker'}
                                        currentUserId={user?._id}
                                    />
                                ))}
                            </div>
                        )}

                        {user?.role === 'worker' && activeTab === 'my-tasks' && (
                            <div className="area-detail-worker-tab-pane">
                                <div className="area-detail-worker-bins-grid">
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
                                    <div className="area-detail-worker-empty-state">
                                        <Trash2 className="area-detail-worker-empty-icon" />
                                        <p className="text-gray-600">No tasks assigned in this area yet</p>
                                        <p className="text-sm text-gray-500 mt-2">Claim a bin to start working</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {visibleBins.length === 0 && activeTab !== 'my-tasks' && (
                            <div className="area-detail-worker-empty-state">
                                <Trash2 className="area-detail-worker-empty-icon" />
                                <p className="text-gray-600">No dustbins found in this area</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
