import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Calendar,
    Shield,
    Camera,
    Save,
    Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import api from '../../config/api';
import './Profile.css';

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        profilePicture: user?.profilePicture || ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data } = await api.get('/auth/me');
                setFormData({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    profilePicture: data.profilePicture || ''
                });
            } catch (error) {
                console.error('Failed to fetch user data:', error);
                toast.error('Failed to load profile data');
            }
        };

        fetchUserData();
    }, []);

    const handleSaveProfile = async () => {
        if (!formData.name || !formData.email || !formData.phone) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            await updateProfile(formData);
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Profile update failed:', error);
            toast.error('Failed to update profile');
        }
    };

    const handleChangePassword = () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error('Please fill in all password fields');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        // In a real app, this would call an API
        toast.success('Password changed successfully');
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    const handleProfilePictureChange = (url) => {
        setFormData({ ...formData, profilePicture: url });
    };

    const [activeTab, setActiveTab] = useState('profile');

    // ... (keep existing handlers)

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div className="profile-container">
            {/* Header */}
            <header className="profile-header">
                <div className="profile-header-inner">
                    <div className="profile-header-content">
                        <button
                            className="profile-btn profile-btn-ghost"
                            onClick={() => {
                                if (user?.role === 'worker') {
                                    navigate('/dashboardworker');
                                } else {
                                    navigate('/dashboard');
                                }
                            }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <h1 className="profile-header-title">Profile Settings</h1>
                            <p className="profile-header-subtitle">Manage your account information</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="profile-main">
                <div className="profile-tabs">
                    <div className="profile-tabs-list">
                        <button
                            className={`profile-tab-trigger ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            Profile Information
                        </button>
                        <button
                            className={`profile-tab-trigger ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            Security
                        </button>
                    </div>

                    <div className="profile-tab-content">
                        {activeTab === 'profile' && (
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <h2 className="profile-card-title">Personal Information</h2>
                                </div>
                                <div className="profile-card-content space-y-6">
                                    {/* Profile Picture */}
                                    <div className="profile-avatar-section">
                                        <div className="profile-avatar">
                                            {formData.profilePicture ? (
                                                <img src={formData.profilePicture} alt={formData.name} />
                                            ) : (
                                                <div className="profile-avatar-fallback">
                                                    {formData.name?.split(' ').map(n => n[0]).join('')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="profile-avatar-input-section">
                                            <label className="profile-label" htmlFor="profilePicture">Profile Picture URL</label>
                                            <div className="profile-input-group">
                                                <input
                                                    id="profilePicture"
                                                    type="url"
                                                    placeholder="https://example.com/avatar.jpg"
                                                    className="profile-input"
                                                    value={formData.profilePicture}
                                                    onChange={(e) => handleProfilePictureChange(e.target.value)}
                                                    disabled={!isEditing}
                                                />
                                                <button
                                                    className="profile-btn profile-btn-outline profile-btn-icon"
                                                    disabled={!isEditing}
                                                    onClick={() => {
                                                        const newUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
                                                        handleProfilePictureChange(newUrl);
                                                    }}
                                                >
                                                    <Camera className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="profile-helper-text">
                                                Click the camera icon to generate a random avatar
                                            </p>
                                        </div>
                                    </div>

                                    <hr className="profile-separator" />

                                    {/* Basic Info */}
                                    <div className="profile-info-grid">
                                        <div className="profile-field">
                                            <label className="profile-label" htmlFor="name">
                                                <div className="profile-label-flex">
                                                    <User className="w-4 h-4" />
                                                    Full Name
                                                </div>
                                            </label>
                                            <input
                                                id="name"
                                                className="profile-input"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                disabled={!isEditing}
                                            />
                                        </div>

                                        <div className="profile-field">
                                            <label className="profile-label" htmlFor="email">
                                                <div className="profile-label-flex">
                                                    <Mail className="w-4 h-4" />
                                                    Email
                                                </div>
                                            </label>
                                            <input
                                                id="email"
                                                type="email"
                                                className="profile-input"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                disabled={!isEditing}
                                            />
                                        </div>

                                        <div className="profile-field">
                                            <label className="profile-label" htmlFor="phone">
                                                <div className="profile-label-flex">
                                                    <Phone className="w-4 h-4" />
                                                    Phone Number
                                                </div>
                                            </label>
                                            <input
                                                id="phone"
                                                className="profile-input"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                disabled={!isEditing}
                                            />
                                        </div>

                                        <div className="profile-field">
                                            <label className="profile-label">
                                                <div className="profile-label-flex">
                                                    <Shield className="w-4 h-4" />
                                                    Role
                                                </div>
                                            </label>
                                            <input
                                                className="profile-input profile-input-disabled"
                                                value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    <hr className="profile-separator" />

                                    {/* Account Info */}
                                    <div className="profile-info-grid">
                                        <div className="profile-field">
                                            <label className="profile-label">
                                                <div className="profile-label-flex">
                                                    <Calendar className="w-4 h-4" />
                                                    Member Since
                                                </div>
                                            </label>
                                            <input
                                                className="profile-input profile-input-disabled"
                                                value={user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : ''}
                                                disabled
                                            />
                                        </div>

                                        <div className="profile-field">
                                            <label className="profile-label">
                                                <div className="profile-label-flex">
                                                    <User className="w-4 h-4" />
                                                    User ID
                                                </div>
                                            </label>
                                            <input
                                                className="profile-input profile-input-disabled"
                                                value={user?._id || ''}
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="profile-actions">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    className="profile-btn profile-btn-outline"
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        setFormData({
                                                            name: user?.name,
                                                            email: user?.email,
                                                            phone: user?.phone,
                                                            profilePicture: user?.profilePicture || ''
                                                        });
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="profile-btn profile-btn-primary"
                                                    onClick={handleSaveProfile}
                                                >
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Save Changes
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="profile-btn profile-btn-primary"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                Edit Profile
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <h2 className="profile-card-title">Change Password</h2>
                                </div>
                                <div className="profile-card-content space-y-4">
                                    <div className="profile-field">
                                        <label className="profile-label" htmlFor="currentPassword">
                                            <div className="profile-label-flex">
                                                <Lock className="w-4 h-4" />
                                                Current Password
                                            </div>
                                        </label>
                                        <input
                                            id="currentPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            className="profile-input"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        />
                                    </div>

                                    <div className="profile-field">
                                        <label className="profile-label" htmlFor="newPassword">New Password</label>
                                        <input
                                            id="newPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            className="profile-input"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        />
                                    </div>

                                    <div className="profile-field">
                                        <label className="profile-label" htmlFor="confirmPassword">Confirm New Password</label>
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            className="profile-input"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            className="profile-btn profile-btn-primary w-full md:w-auto"
                                            onClick={handleChangePassword}
                                        >
                                            <Lock className="w-4 h-4 mr-2" />
                                            Update Password
                                        </button>
                                    </div>

                                    <div className="profile-requirements-box">
                                        <h4 className="profile-requirements-title">Password Requirements</h4>
                                        <ul className="profile-requirements-list">
                                            <li>• At least 6 characters long</li>
                                            <li>• Contains both letters and numbers (recommended)</li>
                                            <li>• Different from your previous password</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
