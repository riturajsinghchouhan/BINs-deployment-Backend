import { useMemo } from 'react';
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
    ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import './AreaOverview_worker.css';

export default function AreaOverview_worker() {
    const { user, logout } = useAuth();
    const { dustbins } = useData();
    const navigate = useNavigate();

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

            return {
                area,
                totalBins,
                fullBins,
                halfFullBins,
                emptyBins,
                beingEmptied,
                averageFillLevel,
                urgentBins
            };
        });

        // Sort by urgentBins descending, then by averageFillLevel descending
        return stats.sort((a, b) => {
            if (b.urgentBins !== a.urgentBins) {
                return b.urgentBins - a.urgentBins;
            }
            return b.averageFillLevel - a.averageFillLevel;
        });
    }, [dustbins]);

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
                                {/* Total Bins */}
                                <div className="area-worker-card-row">
                                    <span className="text-sm text-gray-600">Total Bins</span>
                                    <span className="text-lg font-semibold">{area.totalBins}</span>
                                </div>

                                {/* Average Fill Level */}
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

                                {/* Status Distribution */}
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

                                {/* View Details Button */}
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
