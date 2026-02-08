import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import { Trash2, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import './ForgotPassword.css';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await resetPassword(email);
            if (result) {
                setSuccess(true);
                toast.success('Password reset instructions sent to your email');
            } else {
                toast.error('No account found with this email');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="forgot-password-container">
                <div className="forgot-password-card">
                    <div className="forgot-password-header">
                        <div className="forgot-password-icon-wrapper">
                            <div className="forgot-password-icon">
                                <CheckCircle className="forgot-password-icon-check" />
                            </div>
                        </div>
                        <h2 className="forgot-password-title">Check Your Email</h2>
                        <p className="forgot-password-description">
                            We've sent password reset instructions to {email}
                        </p>
                    </div>
                    <div className="forgot-password-content">
                        <Link to="/login">
                            <button className="forgot-password-back-btn">
                                <ArrowLeft className="forgot-password-icon-arrow" />
                                Back to Sign In
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <div className="forgot-password-header">
                    <div className="forgot-password-icon-wrapper">
                        <div className="forgot-password-icon">
                            <Trash2 className="forgot-password-icon-trash" />
                        </div>
                    </div>
                    <h2 className="forgot-password-title">Forgot Password?</h2>
                    <p className="forgot-password-description">
                        Enter your email and we'll send you instructions to reset your password
                    </p>
                </div>
                <div className="forgot-password-content">
                    <form onSubmit={handleSubmit} className="forgot-password-form">
                        <div className="forgot-password-input-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="forgot-password-submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="forgot-password-spinner" />
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Instructions'
                            )}
                        </button>
                    </form>
                    <div className="forgot-password-back-link">
                        <Link to="/login" className="forgot-password-link">
                            <ArrowLeft className="forgot-password-icon-arrow-sm" />
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
