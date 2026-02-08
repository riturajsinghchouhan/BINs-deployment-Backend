import { createContext, useContext, useState, useEffect } from 'react';
import api from '../../config/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(undefined);

export function DataProvider({ children }) {
    const [dustbins, setDustbins] = useState([]);
    const [workers, setWorkers] = useState([]);
    const { user } = useAuth();

    // Fetch data when user is authenticated
    useEffect(() => {
        if (user) {
            fetchDustbins();
            if (user.role === 'admin') {
                fetchWorkers();
            }
        } else {
            setDustbins([]);
            setWorkers([]);
        }
    }, [user]);

    const fetchDustbins = async () => {
        try {
            const { data } = await api.get('/dustbins');
            setDustbins(data);
        } catch (error) {
            console.error('Failed to fetch dustbins:', error);
        }
    };

    const fetchWorkers = async () => {
        try {
            const { data } = await api.get('/auth/workers');
            setWorkers(data);
        } catch (error) {
            console.error('Failed to fetch workers:', error);
        }
    };

    const addDustbin = async (bin) => {
        try {
            const { data } = await api.post('/dustbins', bin);
            setDustbins((prev) => [...prev, data]);
        } catch (error) {
            console.error('Failed to add dustbin:', error);
            throw error;
        }
    };

    const updateDustbin = async (id, updates) => {
        try {
            const { data } = await api.put(`/dustbins/${id}`, updates);
            setDustbins((prev) => prev.map(bin => bin._id === id ? data : bin));
        } catch (error) {
            console.error('Failed to update dustbin:', error);
            throw error;
        }
    };

    const deleteDustbin = async (id) => {
        try {
            await api.delete(`/dustbins/${id}`);
            setDustbins((prev) => prev.filter(bin => bin._id !== id));
        } catch (error) {
            console.error('Failed to delete dustbin:', error);
            throw error;
        }
    };

    // Worker management (Admin only)
    const addWorker = async (worker) => {
        try {
            // Note: usually workers are added via registration
            await api.post('/auth/register', { ...worker, role: 'worker', password: 'worker123' });
            fetchWorkers();
        } catch (error) {
            console.error('Failed to add worker:', error);
            throw error;
        }
    };

    const updateWorker = async (id, updates) => {
        try {
            const { data } = await api.put(`/auth/workers/${id}`, updates);
            setWorkers((prev) => prev.map(w => w._id === id ? data : w));
        } catch (error) {
            console.error('Failed to update worker:', error);
            throw error;
        }
    };

    const deleteWorker = async (id) => {
        try {
            await api.delete(`/auth/workers/${id}`);
            setWorkers((prev) => prev.filter(w => w._id !== id));
        } catch (error) {
            console.error('Failed to delete worker:', error);
            throw error;
        }
    };

    const claimBin = async (binId, workerId) => {
        try {
            const updates = { status: 'being-emptied', assignedWorkerId: workerId };
            const { data } = await api.put(`/dustbins/${binId}`, updates);

            setDustbins((prev) => prev.map(bin => bin._id === binId ? data : bin));

            // Update local worker state if needed (optional, as backend handles source of truth)
            // Ideally we should re-fetch workers to get updated 'assignedBins' if backend returns it
            fetchWorkers();
        } catch (error) {
            console.error('Failed to claim bin:', error);
            throw error;
        }
    };

    const completeBin = async (binId) => {
        try {
            const bin = dustbins.find(b => b._id === binId);
            if (!bin) return;

            const updates = {
                status: 'empty',
                fillLevel: 0,
                lastEmptied: new Date().toISOString(),
                assignedWorkerId: null
            };

            const { data } = await api.put(`/dustbins/${binId}`, updates);
            setDustbins((prev) => prev.map(b => b._id === binId ? data : b));

            // Update worker stats
            if (bin.assignedWorkerId) {
                fetchWorkers();
            }

        } catch (error) {
            console.error('Failed to complete bin:', error);
            throw error;
        }
    };

    return (
        <DataContext.Provider value={{
            dustbins,
            workers,
            addDustbin,
            updateDustbin,
            deleteDustbin,
            addWorker,
            updateWorker,
            deleteWorker,
            claimBin,
            completeBin,
            refreshDustbins: fetchDustbins
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
