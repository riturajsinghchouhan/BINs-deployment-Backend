import { createContext, useContext, useState, useEffect } from 'react';
import api from '../../config/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('smartbin_user');
            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                    // Optional: Verify token with backend
                    // const { data } = await api.get('/auth/me');
                    // setUser({ ...data, token: userData.token }); 
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('smartbin_user');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setUser(data);
            localStorage.setItem('smartbin_user', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Login failed:', error.response?.data?.message || error.message);
            throw error; // Re-throw to handle in UI
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('smartbin_user');
    };

    const register = async (email, password, name, role, phone) => {
        try {
            const { data } = await api.post('/auth/register', {
                email,
                password,
                name,
                role,
                phone
            });
            setUser(data);
            localStorage.setItem('smartbin_user', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Registration failed:', error.response?.data?.message || error.message);
            throw error;
        }
    };

    const updateProfile = async (updates) => {
        try {
            const { data } = await api.put('/auth/profile', updates);
            setUser(data);
            localStorage.setItem('smartbin_user', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Profile update failed:', error.response?.data?.message || error.message);
            throw error;
        }
    };

    const resetPassword = async (email) => {
        // Implement if backend has this endpoint
        console.log('Reset password not implemented on backend yet');
        return true;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, updateProfile, resetPassword, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
