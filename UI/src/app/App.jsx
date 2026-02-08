import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Toaster } from '../components/common/Toaster';
import Login from '../components/Login/Login';
import Register from '../components/Register/Register';
import ForgotPassword from '../components/ForgotPassword/ForgotPassword';
import Dashboard from '../components/Dashboard/Dashboard';
import Profile from '../components/Profile/Profile';
import WorkersManagement from '../components/WorkersManagement/WorkersManagement';
import AreaOverview from '../components/AreaOverview/AreaOverview';
import AreaDetail from '../components/AreaDetail/AreaDetail';
import AreaOverview_worker from '../components/AreaOverview_worker/AreaOverview_worker';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AreaDetailworker from '../components/AreaDetail_worker/AreaDetail_worker';
import LandingPage from './components/LandingPage/LandingPage';

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <DataProvider>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        {/* <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            /> */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <AreaOverview />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/dashboardworker"
                            element={
                                <ProtectedRoute>
                                    <AreaOverview_worker />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/areaW/:areaName"
                            element={
                                <ProtectedRoute>
                                    <AreaDetailworker />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/area/:areaName"
                            element={
                                <ProtectedRoute>
                                    <AreaDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/workers"
                            element={
                                <ProtectedRoute adminOnly>
                                    <WorkersManagement />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                    <Toaster />
                </DataProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
