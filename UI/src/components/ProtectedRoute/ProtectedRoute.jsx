import { Navigate } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import './ProtectedRoute.css';

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
