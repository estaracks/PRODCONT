import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, X, Factory, Shield, ClipboardList, Users, AlertTriangle } from 'lucide-react';
import { getCurrentUser, logoutUser } from '../services/storageService';
import { Employee } from '../types';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<Employee | null>(null);

    useEffect(() => {
        setCurrentUser(getCurrentUser());
    }, []);

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    // Sidebar navigation items
    const navItems = [
        { path: '/', label: 'Panel Principal', icon: LayoutDashboard },
        { path: '/orders', label: 'Órdenes', icon: ClipboardList },
        { path: '/personnel', label: 'Personal', icon: Users },
        { path: '/incidents', label: 'Incidencias', icon: AlertTriangle },
    ];

    if (currentUser?.employeeNumber === 'Superackito') {
        navItems.push({ path: '/config', label: 'Configuración', icon: Settings });
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed top-0 left-0 h-full w-72 bg-slate-900 text-white z-50 flex flex-col shadow-2xl 
                transition-transform duration-300 ease-in-out font-sans
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0
            `}>
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                             <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain opacity-90" onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                                 e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-factory text-white"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>';
                             }} />
                         </div>
                        <div>
                            <h1 className="text-lg font-bold leading-none tracking-tight">Estaracks</h1>
                            <p className="text-[10px] text-slate-400 font-medium tracking-widest mt-1">PRODUCCIÓN</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                {/* User Profile Summary */}
                <div className="px-6 py-8 bg-slate-900">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-lg font-bold border-2 border-slate-800 shadow-lg">
                            {currentUser ? currentUser.fullName.charAt(0) : '?'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate text-white">{currentUser ? currentUser.fullName : 'Usuario'}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <Shield size={10} className="text-orange-500" />
                                <p className="text-[10px] text-slate-400 truncate uppercase font-semibold tracking-wider">{currentUser ? currentUser.role : 'Invitado'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-4 px-4 space-y-2 overflow-y-auto">
                    <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Menu Principal</p>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                                    isActive 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-medium' 
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} />
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-950 border-t border-slate-800">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full transition-all rounded-xl text-sm font-medium border border-transparent hover:border-red-500/20"
                    >
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                    <p className="text-center text-[10px] text-slate-700 mt-4">v2.0.2 &copy; Estaracks</p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;