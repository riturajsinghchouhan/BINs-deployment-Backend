import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import { useData } from '../../app/context/DataContext';
import {
    ArrowLeft,
    MapPin,
    Trash2,
    TrendingUp,
    AlertCircle,
    LogOut,
    User,
    ChevronRight,
    Map as MapIcon,
    Moon,
    Sun
} from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Polygon, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AreaOverview_worker.css';

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

function getZoneColor(urgentBins, avgFill) {
    if (urgentBins > 0 || avgFill >= 70) return { stroke: '#dc2626', fill: '#ef4444' };
    if (avgFill >= 40) return { stroke: '#d97706', fill: '#f59e0b' };
    return { stroke: '#16a34a', fill: '#22c55e' };
}

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

export default function AreaOverview_worker() {
    const { user, logout } = useAuth();
    const { dustbins } = useData();
    const navigate = useNavigate();
    const [mapExpanded, setMapExpanded] = useState(true);
    const [mapTheme, setMapTheme] = useState('light');

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
        navigate(`/areaW/${encodeURIComponent(area)}`);
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
        <div className="area-overview-worker-container">
            {/* Header */}
            <header className="area-overview-worker-header">
                <div className="area-overview-worker-header-inner">
                    <div className="area-overview-worker-header-content">
                        <div className="area-overview-worker-header-left">
                            <button
                                className="area-overview-worker-back-btn"
                                onClick={() => navigate('/dashboardworker')}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="area-overview-worker-title-section">
                                <div className="area-overview-worker-icon-box">
                                    <MapPin className="area-overview-worker-icon-pin" />
                                </div>
                                <div>
                                    <h1 className="area-overview-worker-title">Area-wise Overview</h1>
                                    <p className="area-overview-worker-subtitle">Dustbin distribution across locations</p>
                                </div>
                            </div>
                        </div>
                        <div className="area-overview-worker-header-right">
                            <div className="area-overview-worker-user-info">
                                <p className="area-overview-worker-user-name">{user?.name}</p>
                                <p className="area-overview-worker-user-role">{user?.role}</p>
                            </div>

                            <button
                                className="area-overview-worker-btn-outline"
                                onClick={() => navigate('/profile')}
                            >
                                <User className="w-4 h-4 mr-2" />
                                Profile
                            </button>
                            <button
                                className="area-overview-worker-btn-outline"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="area-overview-worker-main">
                {/* Overall Statistics */}
                <div className="area-overview-worker-stats-grid">
                    <div className="area-overview-worker-stat-card">
                        <div className="area-overview-worker-card-header">
                            <span className="area-overview-worker-card-title">Total Areas</span>
                        </div>
                        <div className="area-overview-worker-card-content">
                            <div className="area-overview-worker-stat-value-wrapper">
                                <div className="area-overview-worker-stat-value">{totalAreas}</div>
                                <MapPin className="area-overview-worker-stat-icon text-blue" />
                            </div>
                        </div>
                    </div>

                    <div className="area-overview-worker-stat-card">
                        <div className="area-overview-worker-card-header">
                            <span className="area-overview-worker-card-title">Total Bins</span>
                        </div>
                        <div className="area-overview-worker-card-content">
                            <div className="area-overview-worker-stat-value-wrapper">
                                <div className="area-overview-worker-stat-value">{totalBins}</div>
                                <Trash2 className="area-overview-worker-stat-icon text-green" />
                            </div>
                        </div>
                    </div>

                    <div className="area-overview-worker-stat-card">
                        <div className="area-overview-worker-card-header">
                            <span className="area-overview-worker-card-title">Areas Need Attention</span>
                        </div>
                        <div className="area-overview-worker-card-content">
                            <div className="area-overview-worker-stat-value-wrapper">
                                <div className="area-overview-worker-stat-value text-red">{areasWithUrgentBins}</div>
                                <AlertCircle className="area-overview-worker-stat-icon text-red" />
                            </div>
                        </div>
                    </div>

                    <div className="area-overview-worker-stat-card">
                        <div className="area-overview-worker-card-header">
                            <span className="area-overview-worker-card-title">Avg Fill Level</span>
                        </div>
                        <div className="area-overview-worker-card-content">
                            <div className="area-overview-worker-stat-value-wrapper">
                                <div className="area-overview-worker-stat-value">{overallAverageFill.toFixed(0)}%</div>
                                <TrendingUp className="area-overview-worker-stat-icon text-purple" />
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

                                    {areaStats.map((area) => {
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
                <div className="area-overview-worker-area-header">
                    <h2 className="area-overview-worker-section-title">Areas ({areaStats.length})</h2>
                    <p className="area-overview-worker-section-subtitle">
                        Click on any area to view detailed bin information
                    </p>
                </div>

                <div className="area-overview-worker-area-grid">
                    {areaStats.map((area) => (
                        <div
                            key={area.area}
                            className={`area-overview-worker-card area-worker-card-interactive ${getStatusColor(area.urgentBins, area.averageFillLevel)}`}
                            onClick={() => handleAreaClick(area.area)}
                        >
                            <div className="area-overview-worker-card-header">
                                <div className="area-worker-card-header-flex">
                                    <div className="area-worker-card-title-wrapper">
                                        <h3 className="area-worker-card-title">
                                            <MapPin className="w-5 h-5 text-gray-600" />
                                            {area.area}
                                        </h3>
                                        {area.urgentBins > 0 && (
                                            <span className="area-worker-badge badge-urgent">
                                                {area.urgentBins} Urgent
                                            </span>
                                        )}
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                            <div className="area-overview-worker-card-content space-y-4">
                                <div className="area-worker-card-row">
                                    <span className="text-sm text-gray-600">Total Bins</span>
                                    <span className="text-lg font-semibold">{area.totalBins}</span>
                                </div>

                                <div className="area-worker-card-progress-section">
                                    <div className="area-worker-card-row text-sm">
                                        <span className="text-gray-600">Avg Fill Level</span>
                                        <span className="font-medium">{area.averageFillLevel.toFixed(0)}%</span>
                                    </div>
                                    <div className="area-worker-progress-track">
                                        <div
                                            className="area-worker-progress-fill"
                                            style={{ width: `${area.averageFillLevel}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="area-worker-card-stats-grid">
                                    <div className="area-worker-mini-stat">
                                        <div className="area-worker-mini-stat-header">
                                            <div className="status-dot dot-red"></div>
                                            <span className="text-xs text-gray-600">Full</span>
                                        </div>
                                        <p className="text-lg font-semibold">{area.fullBins}</p>
                                    </div>

                                    <div className="area-worker-mini-stat">
                                        <div className="area-worker-mini-stat-header">
                                            <div className="status-dot dot-yellow"></div>
                                            <span className="text-xs text-gray-600">Half Full</span>
                                        </div>
                                        <p className="text-lg font-semibold">{area.halfFullBins}</p>
                                    </div>

                                    <div className="area-worker-mini-stat">
                                        <div className="area-worker-mini-stat-header">
                                            <div className="status-dot dot-green"></div>
                                            <span className="text-xs text-gray-600">Empty</span>
                                        </div>
                                        <p className="text-lg font-semibold">{area.emptyBins}</p>
                                    </div>

                                    <div className="area-worker-mini-stat">
                                        <div className="area-worker-mini-stat-header">
                                            <div className="status-dot dot-blue"></div>
                                            <span className="text-xs text-gray-600">In Progress</span>
                                        </div>
                                        <p className="text-lg font-semibold">{area.beingEmptied}</p>
                                    </div>
                                </div>

                                <button
                                    className="area-overview-worker-btn-outline w-full mt-2"
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
                    <div className="area-overview-worker-empty-state">
                        <MapPin className="area-worker-empty-icon" />
                        <p className="text-gray-600">No areas found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
