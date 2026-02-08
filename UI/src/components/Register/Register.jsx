import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import { Trash2, Loader2,Eye,EyeOff} from 'lucide-react';
import { toast } from 'sonner';
import './Register.css';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'worker'
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const [showpass,setShowpass]=useState(false)
    

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const success = await register(
                formData.email,
                formData.password,
                formData.name,
                formData.role,
                formData.phone
            );

            if (success) {
                toast.success('Registration successful!');
                if (formData.role === 'worker') {
                    navigate('/dashboardworker');
                } else {
                    navigate('/dashboard');
                }
            } else {
                toast.error('Email already exists');
            }
        } catch (error) {
            toast.error('An error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <div className="register-header">
                    <div className="register-icon-wrapper">
                        <div className="register-icon">
                            <Trash2 className="register-icon-trash" />
                        </div>
                    </div>
                    <h2 className="register-title">Create Account</h2>
                    <p className="register-description">
                        Join the Smart Dustbin Management System
                    </p>
                </div>
                <div className="register-content">
                    <form onSubmit={handleSubmit} className="register-form">
                        <div className="register-input-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                required
                            />
                        </div>
                        <div className="register-input-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                required
                            />
                        </div>
                        <div className="register-input-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                id="phone"
                                type="tel"
                                placeholder="+91-9876543210"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                required
                            />
                        </div>
                        <div className="register-input-group">
                            <label htmlFor="role">Role</label>
                            <select
                                id="role"
                                value={formData.role}
                                onChange={(e) => handleChange('role', e.target.value)}
                                className="register-select"
                            >
                                <option value="worker">Worker</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="register-input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type={showpass ? "text":"password"}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                required
                            />
                            <span className='bg' onClick={(e)=>{
                                setShowpass(!showpass)
                            }}>{showpass ? <Eye/>:<EyeOff/>}</span>
                        </div>
                        <div className="register-input-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type={showpass?"text":"password"}
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                required
                            />
                            <span className='bg' onClick={(e)=>{
                                setShowpass(!showpass)
                            }}>{showpass ? <Eye/>:<EyeOff/>}</span>
                        </div>
                        <button type="submit" className="register-submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="register-spinner" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>
                    <div className="register-footer">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="register-signin-link"
                            onClick={(e) => {
                                const loginSection = document.getElementById('login');
                                if (loginSection) {
                                    e.preventDefault();
                                    loginSection.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
