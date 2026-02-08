import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import { Trash2, Loader2,Eye,EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import './Login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const [show,setShow]=useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // login now returns true/false, but we need the user object or role
            // Let's modify logic to rely on the updated user state or return value
            // Since login in AuthContext sets the user, we can await it.
            // However, state updates might not be immediate in the same render cycle.
            // Better to have login return the user object or role.

            // Checking AuthContext.jsx again, login returns true/false
            const success = await login(email, password);

            if (!success) {
                toast.error('Invalid email or password');
                setLoading(false);
                return;
            }

            toast.success('Login successful!');

            // We need to fetch the user again or modify login to return the user
            // accessing 'user' state here might be stale
            // For now, let's read from localStorage as a fallback or modify AuthContext
            const storedUser = JSON.parse(localStorage.getItem('smartbin_user'));

            if (storedUser?.role === 'admin') {
                navigate('/dashboard');
            } else if (storedUser?.role === 'worker') {
                navigate('/dashboardworker');
            } else {
                // Default fallback
                navigate('/dashboard');
            }

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };



    const handleRegisterClick = (e) => {
        const registerSection = document.getElementById('register');
        if (registerSection) {
            e.preventDefault();
            registerSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-icon-wrapper">
                        <div className="login-icon-box">
                            <Trash2 className="login-icon-trash" />
                        </div>
                    </div>
                    <h2 className="login-title">Smart Dustbin System</h2>
                    <p className="login-description">
                        Sign in to manage your IoT-enabled dustbin network
                    </p>
                </div>
                <div className="login-content">
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="login-input-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="admin@smartbin.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="login-input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type={show ? "text":"password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span className="bg" onClick={()=>{
                                setShow(!show)
                            }}>{show ?<Eye/>:<EyeOff/>}</span>
                            
                        </div>
                        <div className="login-forgot-password">
                            <Link
                                to="/forgot-password"
                                className="login-forgot-link"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <button type="submit" className="login-submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="login-spinner" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                    <div className="login-demo-info">
                        <span className="login-demo-label">Demo credentials:</span>
                        <div className="login-demo-credentials">
                            <div>Admin: admin@smartbin.com / admin123</div>
                            <div>Worker: worker@smartbin.com / worker123</div>
                        </div>
                    </div>
                    <div className="login-register-link-container">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="login-register-link"
                            onClick={handleRegisterClick}
                        >
                            Register here
                        </Link>
                    </div>
                </div>
            </div >
        </div >
    );
}
