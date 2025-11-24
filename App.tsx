import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProductionOrders from './pages/ProductionOrders';
import Personnel from './pages/Personnel';
import DailyLogPage from './pages/DailyLog';
import IncidentsPage from './pages/Incidents';
import Login from './pages/Login';
import { seedDatabase, getCurrentUser } from './services/storageService';
import { Menu, Factory } from 'lucide-react';

// Protected Route Guard
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
    const user = getCurrentUser();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

// Layout Component (Sidebar + Content)
const AppLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 w-full bg-slate-900 text-white z-40 h-16 flex items-center px-4 justify-between shadow-md">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <Factory size={20} className="text-white" />
                    </div>
                    <span className="font-bold text-lg">ProControl</span>
                </div>
                <button 
                    onClick={() => setSidebarOpen(true)} 
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden md:ml-64 pt-16 md:pt-0 transition-all duration-300">
                <div className="max-w-7xl mx-auto w-full">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/orders" element={<ProductionOrders />} />
                        <Route path="/incidents" element={<IncidentsPage />} />
                        <Route path="/personnel" element={<Personnel />} />
                        <Route path="/logs" element={<DailyLogPage />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

const App = () => {
    useEffect(() => {
        // Run seed on mount to ensure users exist
        seedDatabase();
    }, []);

    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route path="/*" element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                } />
            </Routes>
        </HashRouter>
    );
};

export default App;