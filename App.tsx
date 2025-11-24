import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProductionOrders from './pages/ProductionOrders';
import Personnel from './pages/Personnel';
import DailyLogPage from './pages/DailyLog';
import IncidentsPage from './pages/Incidents';
import Login from './pages/Login';
import { seedDatabase, getCurrentUser } from './services/storageService';
import { Menu, Plus, ClipboardList, Users, FileText, Settings, X } from 'lucide-react';

// --- Components ---

// Config Page (Superackito Only)
const ConfigPage = () => {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Settings className="text-slate-600" /> Configuración Avanzada
            </h2>
            <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
                <p className="text-slate-600 mb-4">Panel exclusivo para Superackito. Opciones de sistema:</p>
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded border flex justify-between items-center">
                        <span>Modo de Depuración</span>
                        <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div></div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded border flex justify-between items-center">
                        <span>Forzar Sincronización</span>
                        <button className="text-xs bg-slate-200 px-3 py-1 rounded">Ejecutar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Protected Route Guard
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
    const user = getCurrentUser();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Protect Config route
    if (location.pathname === '/config' && user.employeeNumber !== 'Superackito') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

// Layout Component (Sidebar + Content + FAB)
const AppLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [fabOpen, setFabOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        setSidebarOpen(false);
        setFabOpen(false);
    }, [location]);

    const handleFabNav = (path: string) => {
        navigate(path);
        setFabOpen(false);
    };

    return (
        <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans">
            
            {/* Mobile Header (Hamburger) */}
            <div className="md:hidden fixed top-0 left-0 w-full bg-white text-slate-800 z-30 h-16 flex items-center px-4 justify-between shadow-sm border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setSidebarOpen(true)} 
                        className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg text-slate-800">Estaracks</span>
                </div>
            </div>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden md:ml-72 pt-16 md:pt-0 transition-all duration-300 scroll-smooth">
                <div className="max-w-6xl mx-auto w-full min-h-full">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/orders" element={<ProductionOrders />} />
                        <Route path="/reports" element={<DailyLogPage />} />
                        <Route path="/personnel" element={<Personnel />} />
                        <Route path="/incidents" element={<IncidentsPage />} />
                        <Route path="/config" element={<ConfigPage />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
            </main>

            {/* Floating Action Button (FAB) Menu */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                {fabOpen && (
                    <div className="flex flex-col items-end gap-3 animate-fade-in-up mb-2">
                        <button 
                            onClick={() => handleFabNav('/personnel')}
                            className="flex items-center gap-3 bg-white text-slate-700 px-4 py-2.5 rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-all"
                        >
                            <span className="text-sm font-bold">Personal</span>
                            <div className="bg-purple-100 p-2 rounded-full text-purple-600"><Users size={18} /></div>
                        </button>
                        <button 
                            onClick={() => handleFabNav('/reports')}
                            className="flex items-center gap-3 bg-white text-slate-700 px-4 py-2.5 rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-all"
                        >
                            <span className="text-sm font-bold">Reportes</span>
                            <div className="bg-green-100 p-2 rounded-full text-green-600"><FileText size={18} /></div>
                        </button>
                        <button 
                            onClick={() => handleFabNav('/orders')}
                            className="flex items-center gap-3 bg-white text-slate-700 px-4 py-2.5 rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-all"
                        >
                            <span className="text-sm font-bold">Órdenes</span>
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600"><ClipboardList size={18} /></div>
                        </button>
                    </div>
                )}
                
                <button 
                    onClick={() => setFabOpen(!fabOpen)}
                    className={`
                        w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300
                        ${fabOpen ? 'bg-slate-800 rotate-45' : 'bg-orange-500 hover:bg-orange-600'}
                    `}
                >
                    <Plus size={28} className="text-white" />
                </button>
            </div>

            {/* Overlay for FAB when open */}
            {fabOpen && (
                <div 
                    className="fixed inset-0 bg-white/60 z-40 backdrop-blur-[2px]"
                    onClick={() => setFabOpen(false)}
                />
            )}
        </div>
    );
};

const App = () => {
    useEffect(() => {
        // Run seed on mount
        seedDatabase();
    }, []);

    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
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