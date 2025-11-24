import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, BookOpen, Factory, X, AlertTriangle, LogOut } from 'lucide-react';
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

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/orders', label: 'Órdenes', icon: ClipboardList },
        { path: '/incidents', label: 'Incidencias', icon: AlertTriangle },
        { path: '/personnel', label: 'Personal', icon: Users },
        { path: '/logs', label: 'Bitácora', icon: BookOpen },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-50 flex flex-col shadow-xl 
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0
            `}>
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Factory size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight">ProControl</h1>
                            <p className="text-xs text-slate-400">Industrial Sys v1.2</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                
                {/* User Info */}
                <div className="px-6 py-6 bg-slate-800/30 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold border-2 border-slate-500">
                            {currentUser ? currentUser.fullName.charAt(0) : '?'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{currentUser ? currentUser.fullName : 'Usuario'}</p>
                            <p className="text-xs text-slate-400 truncate uppercase tracking-wider">{currentUser ? currentUser.role : ''}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                                    isActive 
                                        ? 'bg-blue-600 text-white shadow-lg' 
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                <item.icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700 bg-slate-900">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 w-full transition-colors rounded-lg"
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;