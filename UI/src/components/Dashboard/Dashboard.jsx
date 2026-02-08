import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import './Dashboard.css';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { dustbins, addDustbin, deleteDustbin, claimBin, completeBin } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newBin, setNewBin] = useState({
        binNumber: '',
        location: '',
        latitude: 0,
        longitude: 0,
        fillLevel: 0
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
        toast.success('Logged out successfully');
    };

    const handleAddBin = () => {
        if (!newBin.binNumber || !newBin.location) {
            toast.error('Please fill in all required fields');
            return;
        }

        const status =
            newBin.fillLevel >= 80 ? 'full' :
                newBin.fillLevel >= 50 ? 'half-full' : 'empty';

        addDustbin({
            binNumber: newBin.binNumber,
            location: newBin.location,
            latitude: newBin.latitude,
            longitude: newBin.longitude,
            fillLevel: newBin.fillLevel,
            status: status,
            lastEmptied: new Date().toISOString()
        });

        setShowAddDialog(false);
        setNewBin({
            binNumber: '',
            location: '',
            latitude: 0,
            longitude: 0,
            fillLevel: 0
        });
        toast.success('Dustbin added successfully');
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

    const handleDeleteBin = (binId) => {
        deleteDustbin(binId);
        toast.success('Dustbin deleted successfully');
    };

    // Filter bins based on search
    const filteredBins = dustbins.filter(bin =>
        bin.binNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bin.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter bins for workers (hide being-emptied bins assigned to others)
    const visibleBins = user?.role === 'worker'
        ? filteredBins.filter(bin =>
            bin.status !== 'being-emptied' || bin.assignedWorkerId === user._id
        )
        : filteredBins;

    // Statistics
    const totalBins = dustbins.length;
    const fullBins = dustbins.filter(b => b.status === 'full').length;
    const emptyBins = dustbins.filter(b => b.status === 'empty').length;
    const beingEmptied = dustbins.filter(b => b.status === 'being-emptied').length;
    const myAssignedBins = user?.role === 'worker'
        ? dustbins.filter(b => b.assignedWorkerId === user._id).length
        : 0;

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="dashboard-header-inner">
                    <div className="dashboard-header-content">
                        <div className="dashboard-title-section">
                            <div className="dashboard-icon-box">
                                <Trash2 className="dashboard-icon-main" />
                            </div>
                            <div>
                                <h1 className="dashboard-title">Smart Dustbin Monitor</h1>
                                <p className="dashboard-subtitle">Real-time waste management system</p>
                            </div>
                        </div>
                        <div className="dashboard-header-right">
                            <div className="dashboard-user-info">
                                <p className="dashboard-user-name">{user?.name}</p>
                                <p className="dashboard-user-role">{user?.role}</p>
                            </div>
                            {user?.role === 'admin' && (
                                <button className="dashboard-btn dashboard-btn-outline" onClick={() => navigate('/workers')}>
                                    <User className="w-4 h-4 mr-2" />
                                    Manage Workers
                                </button>
                            )}
                            <button
                                className="dashboard-btn dashboard-btn-outline"
                                onClick={() => navigate('/profile')}
                            >
                                <User className="w-4 h-4 mr-2" />
                                Profile
                            </button>
                            <button
                                className="dashboard-btn dashboard-btn-outline"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="dashboard-main">
                {/* Stats Grid */}
                <div className="dashboard-stats-grid">
                    <div className="dashboard-stat-card">
                        <div className="dashboard-stat-card-header">
                            <span className="dashboard-stat-title">Total Bins</span>
                            <Trash2 className="dashboard-stat-icon text-blue" />
                        </div>
                        <div className="dashboard-stat-content">
                            <div className="dashboard-stat-value">{stats.total}</div>
                            <p className="dashboard-stat-desc">Active dustbins</p>
                        </div>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="dashboard-stat-card-header">
                            <span className="dashboard-stat-title">Critical Level</span>
                            <AlertCircle className="dashboard-stat-icon text-red" />
                        </div>
                        <div className="dashboard-stat-content">
                            <div className="dashboard-stat-value">{stats.critical}</div>
                            <p className="dashboard-stat-desc">Bins &gt; 80% full</p>
                        </div>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="dashboard-stat-card-header">
                            <span className="dashboard-stat-title">Direct Collection</span>
                            <CheckCircle className="dashboard-stat-icon text-green" />
                        </div>
                        <div className="dashboard-stat-content">
                            <div className="dashboard-stat-value">{stats.collected}</div>
                            <p className="dashboard-stat-desc">Ready for pickup</p>
                        </div>
                    </div>

                    <div className="dashboard-stat-card">
                        <div className="dashboard-stat-card-header">
                            <span className="dashboard-stat-title">System Status</span>
                            <Activity className="dashboard-stat-icon text-purple" />
                        </div>
                        <div className="dashboard-stat-content">
                            <div className="dashboard-stat-value">Active</div>
                            <p className="dashboard-stat-desc">All systems normal</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="dashboard-content-tabs">
                    <div className="dashboard-tabs-list">
                        <button
                            className={`dashboard-tab-trigger ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Overview
                        </button>
                        <button
                            className={`dashboard-tab-trigger ${activeTab === 'list' ? 'active' : ''}`}
                            onClick={() => setActiveTab('list')}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Bin List
                        </button>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="dashboard-tab-content">
                            <div className="dashboard-overview-grid">
                                <div
                                    className="dashboard-overview-card dashboard-card-interactive"
                                    onClick={() => navigate('/areas')}
                                >
                                    <div className="dashboard-card-header">
                                        <h3 className="dashboard-card-title">
                                            <MapPin className="w-5 h-5" />
                                            Area-wise Overview
                                        </h3>
                                        <p className="dashboard-card-desc">
                                            View dustbin status grouped by areas
                                        </p>
                                    </div>
                                    <div className="dashboard-card-content">
                                        <div className="dashboard-area-stats">
                                            <div className="dashboard-area-stat-item">
                                                <span className="text-2xl font-bold">{areas.length}</span>
                                                <span className="text-sm text-gray-500">Areas</span>
                                            </div>
                                            <div className="dashboard-area-stat-item">
                                                <span className="text-2xl font-bold text-red-500">
                                                    {areas.filter(a =>
                                                        dustbins.some(b => b.location.includes(a) && b.fillLevel >= 80)
                                                    ).length}
                                                </span>
                                                <span className="text-sm text-gray-500">Critical Areas</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'list' && (
                        <div className="dashboard-tab-content">
                            <div className="dashboard-toolbar">
                                <div className="dashboard-search-wrapper">
                                    <Search className="dashboard-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search by location or Bin ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="dashboard-search-input"
                                    />
                                </div>
                                <div className="dashboard-filters">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="dashboard-filter-select"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="empty">Empty</option>
                                        <option value="half-full">Half Full</option>
                                        <option value="full">Full</option>
                                    </select>
                                    {user?.role === 'admin' && (
                                        <button
                                            className="dashboard-btn dashboard-btn-primary"
                                            onClick={() => setIsAddBinOpen(true)}
                                        >
                                            <PlusCircle className="w-4 h-4 mr-2" />
                                            Add New Bin
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="dashboard-bins-grid">
                                {filteredBins.map((bin) => (
                                    <DustbinCard
                                        key={bin._id}
                                        bin={bin}
                                        onDelete={user?.role === 'admin' ? handleDeleteBin : undefined}
                                        showActions={true}
                                        isWorker={false}
                                    />
                                ))}
                            </div>

                            {filteredBins.length === 0 && (
                                <div className="dashboard-empty-state">
                                    <Trash2 className="dashboard-empty-icon" />
                                    <p className="text-gray-500 text-lg">No dustbins found</p>
                                    <p className="text-gray-400">Try adjusting your search or filters</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>


        </div >
    );
}
