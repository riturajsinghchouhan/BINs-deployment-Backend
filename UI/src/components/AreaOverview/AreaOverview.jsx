import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import { useData } from '../../app/context/DataContext';
import api from '../../config/api';
import {
    ArrowLeft,
    MapPin,
    Trash2,
    TrendingUp,
    AlertCircle,
    LogOut,
    User,
    ChevronRight,
    PlusCircle,
    Map as MapIcon,
    Moon,
    Sun,
    Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Polygon, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AreaOverview.css';
import LocationSearch from '../LocationSearch/LocationSearch';

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

// Zone color palette — distinct colors for each area
const ZONE_COLORS = [
    { stroke: '#0d9488', fill: '#14b8a6' }, // teal
    { stroke: '#2563eb', fill: '#3b82f6' }, // blue
    { stroke: '#7c3aed', fill: '#8b5cf6' }, // violet
    { stroke: '#db2777', fill: '#ec4899' }, // pink
    { stroke: '#ea580c', fill: '#f97316' }, // orange
    { stroke: '#059669', fill: '#10b981' }, // emerald
    { stroke: '#4f46e5', fill: '#6366f1' }, // indigo
    { stroke: '#b91c1c', fill: '#ef4444' }, // red
];

function getZoneColor(urgentBins, avgFill) {
    if (urgentBins > 0 || avgFill >= 70) return { stroke: '#dc2626', fill: '#ef4444' };
    if (avgFill >= 40) return { stroke: '#d97706', fill: '#f59e0b' };
    return { stroke: '#16a34a', fill: '#22c55e' };
}

// Build polygon from area bins
function buildAreaPolygon(bins) {
    const coords = bins
        .filter(b => b.latitude && b.longitude)
        .map(b => [b.latitude, b.longitude]);

    if (coords.length === 0) return null;

    const avgLat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const avgLng = coords.reduce((s, c) => s + c[1], 0) / coords.length;

    let polygon;
    if (coords.length >= 3) {
        polygon = computeConvexHull(coords);
        polygon = polygon.map(p => {
            const dLat = (p[0] - avgLat) * 0.2;
            const dLng = (p[1] - avgLng) * 0.2;
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

    return { polygon, center: [avgLat, avgLng], binCount: coords.length };
}

// Fit map to all zone bounds
function FitAllBounds({ allCoords }) {
    const map = useMap();
    useEffect(() => {
        if (allCoords && allCoords.length > 0) {
            const bounds = L.latLngBounds(allCoords.map(c => [c[0], c[1]]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }, [allCoords, map]);
    return null;
}

export default function AreaOverview() {
    const { user, logout } = useAuth();
    const { dustbins, refreshDustbins } = useData();
    const navigate = useNavigate();
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [mapExpanded, setMapExpanded] = useState(true);
    const [mapTheme, setMapTheme] = useState('light');
    const [formData, setFormData] = useState({
        binNumber: '',
        location: '',
        latitude: '',
        longitude: ''
    });

    const handleAddDustbin = async () => {
        if (!formData.binNumber || !formData.location || !formData.latitude || !formData.longitude) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await api.post('/dustbins', {
                binNumber: formData.binNumber,
                location: formData.location,
                latitude: Number(formData.latitude),
                longitude: Number(formData.longitude)
            });
            await refreshDustbins();
            setShowAddDialog(false);
            setFormData({ binNumber: '', location: '', latitude: '', longitude: '' });
            toast.success('Dustbin added successfully');
        } catch (error) {
            console.error('Failed to add dustbin:', error);
            toast.error('Failed to add dustbin');
        }
    };



    // Group bins by area and calculate statistics
    const areaStats = useMemo(() => {
        const groupedByArea = dustbins.reduce((acc, bin) => {
            const area = bin.location;
            if (!acc[area]) {
                acc[area] = [];
            }
            acc[area].push(bin);
            return acc;
        }, {});

        const stats = Object.entries(groupedByArea).map(([area, bins]) => {
            const totalBins = bins.length;
            const fullBins = bins.filter(b => b.status === 'full').length;
            const halfFullBins = bins.filter(b => b.status === 'half-full').length;
            const emptyBins = bins.filter(b => b.status === 'empty').length;
            const beingEmptied = bins.filter(b => b.status === 'being-emptied').length;
            const averageFillLevel = bins.reduce((sum, b) => sum + b.fillLevel, 0) / totalBins;
            const urgentBins = bins.filter(b => b.fillLevel >= 80).length;
            const polygonData = buildAreaPolygon(bins);

            return {
                area,
                totalBins,
                fullBins,
                halfFullBins,
                emptyBins,
                beingEmptied,
                averageFillLevel,
                urgentBins,
                bins,
                polygonData
            };
        });

        return stats.sort((a, b) => {
            if (b.urgentBins !== a.urgentBins) {
                return b.urgentBins - a.urgentBins;
            }
            return b.averageFillLevel - a.averageFillLevel;
        });
    }, [dustbins]);

    // Collect all bin coordinates for map bounds
    const allBinCoords = useMemo(() => {
        return dustbins
            .filter(b => b.latitude && b.longitude)
            .map(b => [b.latitude, b.longitude]);
    }, [dustbins]);

    const mapCenter = useMemo(() => {
        if (allBinCoords.length === 0) return [22.7196, 75.8577];
        const avgLat = allBinCoords.reduce((s, c) => s + c[0], 0) / allBinCoords.length;
        const avgLng = allBinCoords.reduce((s, c) => s + c[1], 0) / allBinCoords.length;
        return [avgLat, avgLng];
    }, [allBinCoords]);

    const handleLogout = () => {
        logout();
        navigate('/');
        toast.success('Logged out successfully');
    };

    const handleAreaClick = (area) => {
        navigate(`/area/${encodeURIComponent(area)}`);
    };

    // Overall statistics
    const totalAreas = areaStats.length;
    const totalBins = dustbins.length;
    const areasWithUrgentBins = areaStats.filter(a => a.urgentBins > 0).length;
    const overallAverageFill = areaStats.reduce((sum, a) => sum + a.averageFillLevel, 0) / (totalAreas || 1);

    const getStatusColor = (urgentCount, avgFill) => {
        if (urgentCount > 0 || avgFill >= 70) {
            return 'border-red-300 bg-red-50';
        }
        if (avgFill >= 40) {
            return 'border-yellow-300 bg-yellow-50';
        }
        return 'border-green-300 bg-green-50';
    };

    return (
        <div className="area-overview-container">
            {/* Header */}
            <header className="area-overview-header">
                <div className="area-overview-header-inner">
                    <div className="area-overview-header-content">
                        <div className="area-overview-header-left">
                            <button
                                className="area-overview-back-btn"
                                onClick={() => navigate('/dashboard')}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="area-overview-title-section">
                                <div className="area-overview-icon-box">
                                    <MapPin className="area-overview-icon-pin" />
                                </div>
                                <div>
                                    <h1 className="area-overview-title">Area-wise Overview</h1>
                                    <p className="area-overview-subtitle">Dustbin distribution across locations</p>
                                </div>
                            </div>
                        </div>
                        <div className="area-overview-header-right">
                            <div className="area-overview-user-info">
                                <p className="area-overview-user-name">{user?.name}</p>
                                <p className="area-overview-user-role">{user?.role}</p>
                            </div>
                            <button className="area-overview-btn-outline" onClick={() => navigate('/workers')}>
                                <User className="w-4 h-4 mr-2" />
                                Manage Workers
                            </button>
                            {user?.role === 'admin' && (
                                <button
                                    className="area-overview-btn-outline"
                                    onClick={() => setShowAddDialog(true)}
                                >
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Add Bin
                                </button>
                            )}
                            <button
                                className="area-overview-btn-outline"
                                onClick={() => navigate('/profile')}
                            >
                                <User className="w-4 h-4 mr-2" />
                                Profile
                            </button>
                            <button
                                className="area-overview-btn-outline"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="area-overview-main">
                {/* Overall Statistics */}
                <div className="area-overview-stats-grid">
                    <div className="area-overview-stat-card">
                        <div className="area-overview-card-header">
                            <span className="area-overview-card-title">Total Areas</span>
                        </div>
                        <div className="area-overview-card-content">
                            <div className="area-overview-stat-value-wrapper">
                                <div className="area-overview-stat-value">{totalAreas}</div>
                                <MapPin className="area-overview-stat-icon text-blue" />
                            </div>
                        </div>
                    </div>

                    <div className="area-overview-stat-card">
                        <div className="area-overview-card-header">
                            <span className="area-overview-card-title">Total Bins</span>
                        </div>
                        <div className="area-overview-card-content">
                            <div className="area-overview-stat-value-wrapper">
                                <div className="area-overview-stat-value">{totalBins}</div>
                                <Trash2 className="area-overview-stat-icon text-green" />
                            </div>
                        </div>
                    </div>

                    <div className="area-overview-stat-card">
                        <div className="area-overview-card-header">
                            <span className="area-overview-card-title">Areas Need Attention</span>
                        </div>
                        <div className="area-overview-card-content">
                            <div className="area-overview-stat-value-wrapper">
                                <div className="area-overview-stat-value text-red">{areasWithUrgentBins}</div>
                                <AlertCircle className="area-overview-stat-icon text-red" />
                            </div>
                        </div>
                    </div>

                    <div className="area-overview-stat-card">
                        <div className="area-overview-card-header">
                            <span className="area-overview-card-title">Avg Fill Level</span>
                        </div>
                        <div className="area-overview-card-content">
                            <div className="area-overview-stat-value-wrapper">
                                <div className="area-overview-stat-value">{overallAverageFill.toFixed(0)}%</div>
                                <TrendingUp className="area-overview-stat-icon text-purple" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════ ALL-AREAS MAP SECTION ═══════════════ */}
                {allBinCoords.length > 0 && (
                    <div className="ao-map-section">
                        <div className="ao-map-header">
                            <div className="ao-map-header-left">
                                <div className="ao-map-icon-wrapper">
                                    <MapIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="ao-map-title">Smart City Zone Map</h2>
                                    <p className="ao-map-subtitle">
                                        {areaStats.length} zones · {totalBins} IoT dustbins · Click a zone to view details
                                    </p>
                                </div>
                            </div>
                            <div className="ao-map-controls">
                                <div className="ao-map-legend-inline">
                                    <span className="ao-legend-chip ao-legend-green">Healthy</span>
                                    <span className="ao-legend-chip ao-legend-yellow">Warning</span>
                                    <span className="ao-legend-chip ao-legend-red">Critical</span>
                                </div>
                                <button
                                    className="ao-map-toggle-btn ao-theme-toggle"
                                    onClick={() => setMapTheme(mapTheme === 'light' ? 'dark' : 'light')}
                                    title={mapTheme === 'light' ? 'Switch to Dark Map' : 'Switch to Light Map'}
                                >
                                    {mapTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-yellow-500" />}
                                </button>
                                <button
                                    className="ao-map-toggle-btn"
                                    onClick={() => setMapExpanded(!mapExpanded)}
                                >
                                    {mapExpanded ? 'Collapse' : 'Expand'}
                                </button>
                            </div>
                        </div>

                        {mapExpanded && (
                            <div className="ao-map-wrapper">
                                <MapContainer
                                    center={mapCenter}
                                    zoom={13}
                                    className="ao-leaflet-map"
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
                                    <FitAllBounds allCoords={allBinCoords} />

                                    {areaStats.map((area, index) => {
                                        if (!area.polygonData) return null;
                                        const zoneColor = getZoneColor(area.urgentBins, area.averageFillLevel);

                                        return (
                                            <Polygon
                                                key={area.area}
                                                positions={area.polygonData.polygon}
                                                pathOptions={{
                                                    color: zoneColor.stroke,
                                                    fillColor: zoneColor.fill,
                                                    fillOpacity: 0.25,
                                                    weight: 2.5,
                                                }}
                                                eventHandlers={{
                                                    click: () => handleAreaClick(area.area),
                                                    mouseover: (e) => {
                                                        e.target.setStyle({ fillOpacity: 0.4, weight: 3 });
                                                    },
                                                    mouseout: (e) => {
                                                        e.target.setStyle({ fillOpacity: 0.25, weight: 2.5 });
                                                    },
                                                }}
                                            >
                                                <Tooltip
                                                    direction="center"
                                                    permanent
                                                    className="ao-zone-label"
                                                >
                                                    <span className="ao-zone-label-text">{area.area}</span>
                                                </Tooltip>
                                                <Popup>
                                                    <div className="ao-zone-popup">
                                                        <h3 className="ao-zone-popup-title">{area.area}</h3>
                                                        <div className="ao-zone-popup-stats">
                                                            <div className="ao-zone-popup-stat">
                                                                <span className="ao-zone-popup-label">Total Bins</span>
                                                                <span className="ao-zone-popup-value">{area.totalBins}</span>
                                                            </div>
                                                            <div className="ao-zone-popup-stat">
                                                                <span className="ao-zone-popup-label">Avg Fill</span>
                                                                <span className="ao-zone-popup-value" style={{ color: zoneColor.stroke }}>{area.averageFillLevel.toFixed(0)}%</span>
                                                            </div>
                                                            <div className="ao-zone-popup-stat">
                                                                <span className="ao-zone-popup-label">Urgent</span>
                                                                <span className="ao-zone-popup-value" style={{ color: area.urgentBins > 0 ? '#dc2626' : '#16a34a' }}>{area.urgentBins}</span>
                                                            </div>
                                                        </div>
                                                        <div className="ao-zone-popup-bar-row">
                                                            <div className="ao-zone-popup-bar-track">
                                                                <div className="ao-zone-popup-bar-fill" style={{ width: `${area.averageFillLevel}%`, backgroundColor: zoneColor.stroke }} />
                                                            </div>
                                                        </div>
                                                        <p className="ao-zone-popup-hint">Click to view zone details →</p>
                                                    </div>
                                                </Popup>
                                            </Polygon>
                                        );
                                    })}
                                </MapContainer>
                            </div>
                        )}
                    </div>
                )}

                {/* Area Cards */}
                <div className="area-overview-area-header">
                    <h2 className="area-overview-section-title">Areas ({areaStats.length})</h2>
                    <p className="area-overview-section-subtitle">
                        Click on any area to view detailed bin information
                    </p>
                </div>

                <div className="area-overview-area-grid">
                    {areaStats.map((area) => (
                        <div
                            key={area.area}
                            className={`area-overview-card area-card-interactive ${getStatusColor(area.urgentBins, area.averageFillLevel)}`}
                            onClick={() => handleAreaClick(area.area)}
                        >
                            <div className="area-overview-card-header">
                                <div className="area-card-header-flex">
                                    <div className="area-card-title-wrapper">
                                        <h3 className="area-card-title">
                                            <MapPin className="w-5 h-5 text-gray-600" />
                                            {area.area}
                                        </h3>
                                        {area.urgentBins > 0 && (
                                            <span className="area-badge badge-urgent">
                                                {area.urgentBins} Urgent
                                            </span>
                                        )}
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                            <div className="area-overview-card-content space-y-4">
                                {/* Total Bins */}
                                <div className="area-card-row">
                                    <span className="text-sm text-gray-600">Total Bins</span>
                                    <span className="text-lg font-semibold">{area.totalBins}</span>
                                </div>

                                {/* Average Fill Level */}
                                <div className="area-card-progress-section">
                                    <div className="area-card-row text-sm">
                                        <span className="text-gray-600">Avg Fill Level</span>
                                        <span className="font-medium">{area.averageFillLevel.toFixed(0)}%</span>
                                    </div>
                                    <div className="area-progress-track">
                                        <div
                                            className="area-progress-fill"
                                            style={{ width: `${area.averageFillLevel}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Status Distribution */}
                                <div className="area-card-stats-grid">
                                    <div className="area-mini-stat">
                                        <div className="area-mini-stat-header">
                                            <div className="status-dot dot-red"></div>
                                            <span className="text-xs text-gray-600">Full</span>
                                        </div>
                                        <p className="text-lg font-semibold">{area.fullBins}</p>
                                    </div>

                                    <div className="area-mini-stat">
                                        <div className="area-mini-stat-header">
                                            <div className="status-dot dot-yellow"></div>
                                            <span className="text-xs text-gray-600">Half Full</span>
                                        </div>
                                        <p className="text-lg font-semibold">{area.halfFullBins}</p>
                                    </div>

                                    <div className="area-mini-stat">
                                        <div className="area-mini-stat-header">
                                            <div className="status-dot dot-green"></div>
                                            <span className="text-xs text-gray-600">Empty</span>
                                        </div>
                                        <p className="text-lg font-semibold">{area.emptyBins}</p>
                                    </div>

                                    <div className="area-mini-stat">
                                        <div className="area-mini-stat-header">
                                            <div className="status-dot dot-blue"></div>
                                            <span className="text-xs text-gray-600">In Progress</span>
                                        </div>
                                        <p className="text-lg font-semibold">{area.beingEmptied}</p>
                                    </div>
                                </div>

                                {/* View Details Button */}
                                <button
                                    className="area-overview-btn-outline w-full mt-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAreaClick(area.area);
                                    }}
                                >
                                    View Details
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {areaStats.length === 0 && (
                    <div className="area-overview-empty-state">
                        <MapPin className="area-empty-icon" />
                        <p className="text-gray-600">No areas found</p>
                    </div>
                )}
            </div>
            {/* Add Bin Modal */}
            {
                showAddDialog && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 50,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '1rem',
                            padding: '1.5rem',
                            width: '100%',
                            maxWidth: '28rem',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Add New Dustbin</h2>
                                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Enter the details of the new dustbin</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', textTransform: 'uppercase', color: '#6b7280', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                        Bin Number
                                    </label>
                                    <input
                                        placeholder="BIN-001"
                                        value={formData.binNumber}
                                        onChange={(e) => setFormData({ ...formData, binNumber: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid #e5e7eb',
                                            fontSize: '0.875rem'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', textTransform: 'uppercase', color: '#6b7280', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                        Location Search & Area
                                    </label>
                                    <LocationSearch
                                        initialValue={formData.location}
                                        onSelect={(data) => {
                                            setFormData({
                                                ...formData,
                                                location: data.address,
                                                latitude: data.lat,
                                                longitude: data.lon
                                            });
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                                    <div>
                                        <label style={{ display: 'block', textTransform: 'uppercase', color: '#6b7280', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                            Latitude
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="28.5449"
                                            value={formData.latitude}
                                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #e5e7eb',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', textTransform: 'uppercase', color: '#6b7280', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                            Longitude
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="77.1926"
                                            value={formData.longitude}
                                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #e5e7eb',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button
                                    onClick={() => setShowAddDialog(false)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e5e7eb',
                                        backgroundColor: 'white',
                                        color: '#374151',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddDustbin}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        border: 'none',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Add Dustbin
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
