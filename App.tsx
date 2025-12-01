import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProductionOrders from './pages/ProductionOrders';
import Personnel from './pages/Personnel';
import DailyLogPage from './pages/DailyLog';
import IncidentsPage from './pages/Incidents';
import Login from './pages/Login';
import { seedDatabase, getCurrentUser, getEmployees, saveEmployee, deleteEmployee, updateUserPassword } from './services/storageService';
import { Menu, Plus, ClipboardList, Users, FileText, Settings, X, Bell, UserPlus, Key, Trash2, CheckCircle, Shield } from 'lucide-react';
import { db } from './services/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { Employee, EmployeeRole } from './types';

// --- Components ---

// Config Page (Superackito Only - Now with User Management)
const ConfigPage = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'system'>('users');
    
    // User Management States
    const [showAddModal, setShowAddModal] = useState(false);
    const [passwordModalUser, setPasswordModalUser] = useState<Employee | null>(null);
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState(EmployeeRole.PRODUCTION_MANAGER);
    const [newKey, setNewKey] = useState('');
    const [newPasswordInput, setNewPasswordInput] = useState('');

    useEffect(() => {
        loadSystemUsers();
    }, []);

    const loadSystemUsers = () => {
        const all = getEmployees();
        // FILTER: Only show System Users (Admins, Managers, Devs) - those with Login Roles
        // We exclude generic operational staff like Welders/Painters from this "System Users" view
        const systemRoles = [
            EmployeeRole.DEVELOPER, 
            EmployeeRole.DIRECTOR, 
            EmployeeRole.PRODUCTION_MANAGER, 
            EmployeeRole.QUALITY_MANAGER, 
            EmployeeRole.ASSISTANT
        ];
        // Alternatively, filter by presence of accessKey or ID pattern
        setEmployees(all.filter(e => systemRoles.includes(e.role) || e.accessKey));
    };

    const handleAddEmployee = (e: React.FormEvent) => {
        e.preventDefault();
        const newEmp: Employee = {
            id: crypto.randomUUID(),
            employeeNumber: `SYS-${Math.floor(Math.random() * 1000)}`,
            fullName: newName,
            role: newRole,
            shift: 'Morning',
            joinDate: new Date().toISOString().split('T')[0],
            active: true,
            skills: [],
            certifications: [],
            accessKey: newKey || undefined
        };
        saveEmployee(newEmp);
        loadSystemUsers();
        setShowAddModal(false);
        setNewName('');
        setNewKey('');
    };

    const handleDeleteEmployee = (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este usuario del sistema? Se perderá su historial de acceso.')) {
            deleteEmployee(id);
            loadSystemUsers();
        }
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordModalUser && newPasswordInput) {
            updateUserPassword(passwordModalUser.id, newPasswordInput);
            alert(`Contraseña actualizada para ${passwordModalUser.fullName}`);
            setPasswordModalUser(null);
            setNewPasswordInput('');
            loadSystemUsers();
        }
    };

    return (
        <div className="p-4 md:p-6 pb-24">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Settings className="text-slate-600" /> Configuración y Usuarios
            </h2>

            <div className="flex gap-4 border-b border-slate-200 mb-6">
                <button onClick={() => setActiveTab('users')} className={`pb-3 px-2 font-bold text-sm ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>
                    Usuarios del Sistema
                </button>
                <button onClick={() => setActiveTab('system')} className={`pb-3 px-2 font-bold text-sm ${activeTab === 'system' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>
                    Sistema
                </button>
            </div>

            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <p className="text-slate-500 text-sm">Control de cuentas de acceso para administrativos y gerencia.</p>
                        <button onClick={() => setShowAddModal(true)} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-slate-700">
                            <UserPlus size={16} /> Agregar Admin
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-4 font-bold text-slate-600 text-xs uppercase">Usuario</th>
                                    <th className="p-4 font-bold text-slate-600 text-xs uppercase">Rol</th>
                                    <th className="p-4 font-bold text-slate-600 text-xs uppercase">Password</th>
                                    <th className="p-4 font-bold text-slate-600 text-xs uppercase text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {employees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-slate-50">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 text-sm">{emp.fullName}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">{emp.employeeNumber}</div>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs font-semibold text-slate-600">{emp.role}</span>
                                        </td>
                                        <td className="p-4 text-sm font-mono text-slate-600">
                                            {emp.accessKey}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setPasswordModalUser(emp)} className="text-amber-500 hover:bg-amber-50 p-2 rounded-lg" title="Cambiar Contraseña"><Key size={16} /></button>
                                                {emp.role !== EmployeeRole.DEVELOPER && (
                                                    <button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="Eliminar"><Trash2 size={16} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
                    <p className="text-slate-600 mb-4">Opciones avanzadas del sistema:</p>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded border flex justify-between items-center">
                            <span>Modo de Depuración</span>
                            <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div></div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded border flex justify-between items-center">
                            <span>Forzar Sincronización Nube</span>
                            <button className="text-xs bg-slate-200 px-3 py-1 rounded hover:bg-slate-300 transition-colors">Ejecutar</button>
                        </div>
                    </div>
                </div>
            )}

             {/* Add User Modal */}
             {showAddModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                        <h3 className="text-lg font-bold mb-4 text-slate-800">Alta de Usuario (Acceso Sistema)</h3>
                        <form onSubmit={handleAddEmployee} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                                <input required className="w-full border-2 border-slate-100 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors" value={newName} onChange={e => setNewName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol de Sistema</label>
                                <select className="w-full border-2 border-slate-100 rounded-lg p-2.5 bg-slate-50 focus:bg-white outline-none" value={newRole} onChange={e => setNewRole(e.target.value as EmployeeRole)}>
                                    <option value={EmployeeRole.PRODUCTION_MANAGER}>Jefe de Producción</option>
                                    <option value={EmployeeRole.QUALITY_MANAGER}>Calidad</option>
                                    <option value={EmployeeRole.ASSISTANT}>Asistente</option>
                                    <option value={EmployeeRole.DIRECTOR}>Director</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña de Acceso</label>
                                <input required className="w-full border-2 border-slate-100 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" value={newKey} onChange={e => setNewKey(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">Guardar Usuario</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {passwordModalUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-1">Cambiar Contraseña</h3>
                        <p className="text-xs text-slate-500 mb-4 uppercase font-bold tracking-wide">{passwordModalUser.fullName}</p>
                        <form onSubmit={handlePasswordChange}>
                            <div className="mb-6">
                                <input required placeholder="Nueva Contraseña" className="w-full border-2 border-slate-100 rounded-lg p-3 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none" value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setPasswordModalUser(null)} className="px-4 py-2 text-slate-500 font-bold text-sm">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-amber-500 text-white font-bold text-sm rounded-lg hover:bg-amber-600 shadow-lg shadow-amber-500/30">Actualizar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
    const [notification, setNotification] = useState<{show: boolean, orderId?: string}>({show: false});
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        setSidebarOpen(false);
        setFabOpen(false);
    }, [location]);

    // Firestore Listener for New Orders
    useEffect(() => {
        const q = query(collection(db, "pending_orders"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                // Only alert on NEW additions (added), not initial load or modifications if possible
                // Note: onSnapshot fires 'added' for all docs on initial load. 
                // To prevent spam on refresh, we could check timestamps, but for MVP:
                // We rely on the fact that this runs on client mount.
                // A better approach is to check if data is 'fresh'. 
                // For this demo, we'll assume any 'added' event after a small delay is a new order.
                if (change.type === "added") {
                    // Simple debounce check or timestamp check could go here
                    const data = change.doc.data();
                    const now = new Date();
                    const receivedTime = new Date(data.receivedAt);
                    
                    // Only show alert if received within the last minute (to avoid alerting old pending orders on refresh)
                    const diffSeconds = (now.getTime() - receivedTime.getTime()) / 1000;
                    
                    if (diffSeconds < 60) {
                        setNotification({ show: true, orderId: data.external_id });
                        // Auto hide after 5 seconds
                        setTimeout(() => setNotification({ show: false }), 8000);
                    }
                }
            });
        });

        return () => unsubscribe();
    }, []);

    const handleFabNav = (path: string) => {
        navigate(path);
        setFabOpen(false);
    };

    return (
        <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans relative">
            
            {/* New Order Notification Toast */}
            {notification.show && (
                <div className="fixed bottom-24 right-6 z-[60] animate-fade-in-up bg-slate-800 text-white p-4 rounded-xl shadow-2xl border-l-4 border-green-500 flex items-center gap-4 max-w-sm">
                    <div className="bg-green-500/20 p-2 rounded-full">
                        <Bell className="text-green-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-sm">¡Nueva Orden Recibida!</h4>
                        <p className="text-xs text-slate-300">Folio: {notification.orderId}</p>
                    </div>
                    <button 
                        onClick={() => {
                            setNotification({show: false});
                            navigate('/orders');
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Ver
                    </button>
                    <button onClick={() => setNotification({show: false})} className="text-slate-400 hover:text-white"><X size={16} /></button>
                </div>
            )}

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