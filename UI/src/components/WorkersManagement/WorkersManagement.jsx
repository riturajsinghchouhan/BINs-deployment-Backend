import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../app/context/DataContext';
import {
    ArrowLeft,
    Trash2,
    PlusCircle,
    Search,
    Edit,
    Mail,
    Phone,
    Award
} from 'lucide-react';
import { toast } from 'sonner';
import './WorkersManagement.css';

export default function WorkersManagement() {
    const { workers, addWorker, updateWorker, deleteWorker } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        profilePicture: ''
    });

    const filteredWorkers = workers.filter(worker =>
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddWorker = () => {
        if (!formData.name || !formData.email || !formData.phone) {
            toast.error('Please fill in all required fields');
            return;
        }

        addWorker({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: 'worker',
            profilePicture: formData.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.email}`,
            createdAt: new Date().toISOString(),
            assignedBins: [],
            completedTasks: 0
        });

        setShowAddDialog(false);
        setFormData({ name: '', email: '', phone: '', profilePicture: '' });
        toast.success('Worker added successfully');
    };

    const handleEditWorker = () => {
        if (!selectedWorker) return;

        updateWorker(selectedWorker._id, formData);
        setShowEditDialog(false);
        setSelectedWorker(null);
        setFormData({ name: '', email: '', phone: '', profilePicture: '' });
        toast.success('Worker updated successfully');
    };

    const handleDeleteWorker = (workerId, workerName) => {
        if (confirm(`Are you sure you want to delete ${workerName}?`)) {
            deleteWorker(workerId);
            toast.success('Worker deleted successfully');
        }
    };

    const openEditDialog = (worker) => {
        setSelectedWorker(worker);
        setFormData({
            name: worker.name,
            email: worker.email,
            phone: worker.phone,
            profilePicture: worker.profilePicture || ''
        });
        setShowEditDialog(true);
    };

    return (
        <div className="workers-management-container">
            {/* Header */}
            <header className="workers-header">
                <div className="workers-header-inner">
                    <div className="workers-header-content">
                        <div className="workers-header-left">
                            <button
                                className="workers-btn workers-btn-ghost"
                                onClick={() => navigate('/dashboard')}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div>
                                <h1 className="workers-header-title">Workers Management</h1>
                                <p className="workers-header-subtitle">Manage your workforce</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="workers-main">
                {/* Stats */}
                <div className="workers-stats-grid">
                    <div className="workers-stat-card">
                        <div className="workers-stat-content">
                            <div className="workers-stat-row">
                                <div>
                                    <p className="workers-stat-label">Total Workers</p>
                                    <p className="workers-stat-value">{workers.length}</p>
                                </div>
                                <div className="workers-stat-icon-wrapper bg-blue-100">
                                    <Award className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="workers-stat-card">
                        <div className="workers-stat-content pt-6">
                            <div className="workers-stat-row">
                                <div>
                                    <p className="workers-stat-label">Active Tasks</p>
                                    <p className="workers-stat-value">
                                        {workers.reduce((sum, w) => sum + w.assignedBins.length, 0)}
                                    </p>
                                </div>
                                <div className="workers-stat-icon-wrapper bg-green-100">
                                    <Trash2 className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="workers-stat-card">
                        <div className="workers-stat-content pt-6">
                            <div className="workers-stat-row">
                                <div>
                                    <p className="workers-stat-label">Total Completed</p>
                                    <p className="workers-stat-value">
                                        {workers.reduce((sum, w) => sum + w.completedTasks, 0)}
                                    </p>
                                </div>
                                <div className="workers-stat-icon-wrapper bg-purple-100">
                                    <Award className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="workers-actions-bar">
                    <div className="workers-search-wrapper">
                        <Search className="workers-search-icon" />
                        <input
                            type="text"
                            placeholder="Search workers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="workers-search-input"
                        />
                    </div>
                    <button
                        className="workers-btn workers-btn-primary"
                        onClick={() => setShowAddDialog(true)}
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Worker
                    </button>
                </div>

                {/* Workers Table */}
                <div className="workers-card">
                    <div className="workers-table-container">
                        <table className="workers-table">
                            <thead>
                                <tr>
                                    <th>Worker</th>
                                    <th>Contact</th>
                                    <th>Active Tasks</th>
                                    <th>Completed</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWorkers.map((worker) => (
                                    <tr key={worker._id}>
                                        <td>
                                            <div className="worker-info-cell">
                                                <div className="workers-avatar">
                                                    {worker.profilePicture ? (
                                                        <img src={worker.profilePicture} alt={worker.name} />
                                                    ) : (
                                                        <div className="workers-avatar-fallback">
                                                            {worker.name.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="workers-name">{worker.name}</p>
                                                    <p className="workers-email">{worker.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Phone className="w-4 h-4" />
                                                {worker.phone}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="workers-badge workers-badge-outline">
                                                {worker.assignedBins.length} tasks
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <Award className="w-4 h-4 text-green-600" />
                                                <span className="font-medium">{worker.completedTasks}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {worker.assignedBins.length > 0 ? (
                                                <span className="workers-badge workers-badge-blue">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="workers-badge workers-badge-green">
                                                    Available
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            <div className="workers-table-actions">
                                                <button
                                                    className="workers-btn workers-btn-outline workers-btn-sm"
                                                    onClick={() => openEditDialog(worker)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="workers-btn workers-btn-destructive workers-btn-sm"
                                                    onClick={() => handleDeleteWorker(worker._id, worker.name)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredWorkers.length === 0 && (
                            <div className="workers-empty-state">
                                <Award className="workers-empty-icon" />
                                <p className="text-gray-600">No workers found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Worker Modal */}
            {showAddDialog && (
                <div className="workers-modal-overlay">
                    <div className="workers-modal">
                        <div className="workers-modal-header">
                            <h2 className="workers-modal-title">Add New Worker</h2>
                            <p className="workers-modal-desc">
                                Enter the details of the new worker
                            </p>
                        </div>
                        <div className="workers-modal-content">
                            <div className="workers-form">
                                <div className="workers-form-group">
                                    <label className="workers-label" htmlFor="name">Full Name</label>
                                    <input
                                        id="name"
                                        placeholder="John Doe"
                                        className="workers-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="workers-form-group">
                                    <label className="workers-label" htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        className="workers-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="workers-form-group">
                                    <label className="workers-label" htmlFor="phone">Phone Number</label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        placeholder="+91-9876543210"
                                        className="workers-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="workers-form-group">
                                    <label className="workers-label" htmlFor="profilePicture">Profile Picture URL (Optional)</label>
                                    <input
                                        id="profilePicture"
                                        type="url"
                                        placeholder="https://example.com/photo.jpg"
                                        className="workers-input"
                                        value={formData.profilePicture}
                                        onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="workers-modal-footer">
                                <button
                                    className="workers-btn workers-btn-outline"
                                    onClick={() => setShowAddDialog(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="workers-btn workers-btn-primary"
                                    onClick={handleAddWorker}
                                >
                                    Add Worker
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Worker Modal */}
            {showEditDialog && (
                <div className="workers-modal-overlay">
                    <div className="workers-modal">
                        <div className="workers-modal-header">
                            <h2 className="workers-modal-title">Edit Worker</h2>
                            <p className="workers-modal-desc">
                                Update worker information
                            </p>
                        </div>
                        <div className="workers-modal-content">
                            <div className="workers-form">
                                <div className="workers-form-group">
                                    <label className="workers-label" htmlFor="edit-name">Full Name</label>
                                    <input
                                        id="edit-name"
                                        placeholder="John Doe"
                                        className="workers-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="workers-form-group">
                                    <label className="workers-label" htmlFor="edit-email">Email</label>
                                    <input
                                        id="edit-email"
                                        type="email"
                                        placeholder="john@example.com"
                                        className="workers-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="workers-form-group">
                                    <label className="workers-label" htmlFor="edit-phone">Phone Number</label>
                                    <input
                                        id="edit-phone"
                                        type="tel"
                                        placeholder="+91-9876543210"
                                        className="workers-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="workers-form-group">
                                    <label className="workers-label" htmlFor="edit-profilePicture">Profile Picture URL</label>
                                    <input
                                        id="edit-profilePicture"
                                        type="url"
                                        placeholder="https://example.com/photo.jpg"
                                        className="workers-input"
                                        value={formData.profilePicture}
                                        onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="workers-modal-footer">
                                <button
                                    className="workers-btn workers-btn-outline"
                                    onClick={() => setShowEditDialog(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="workers-btn workers-btn-primary"
                                    onClick={handleEditWorker}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
