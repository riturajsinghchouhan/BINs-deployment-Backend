import { useState, useMemo } from 'react';
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
    ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import './AreaDetail.css';

export default function AreaDetail() {
    const { areaName } = useParams();
    const decodedAreaName = decodeURIComponent(areaName || '');
    const { user, logout } = useAuth();
    const { dustbins, claimBin, completeBin, refreshDustbins } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
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

        setShowAddDialog(false);
        setNewBin({
            binNumber: '',
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

    // ... (keep existing filter logic)

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
                                <div className="area-detail-form-group">
                                    <label className="area-detail-label">Location</label>
                                    <input
                                        value={decodedAreaName}
                                        disabled
                                        className="area-detail-input area-detail-input-disabled"
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
