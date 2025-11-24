import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/storageService';
import { Lock, User, Factory, ChevronRight } from 'lucide-react';

const Login = () => {
    const [empId, setEmpId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (loginUser(empId, password)) {
            navigate('/');
        } else {
            setError('Credenciales inválidas o usuario inactivo.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
            
            <div className="mb-8 text-center animate-fade-in-down">
                <div className="bg-blue-600 p-4 rounded-2xl inline-block mb-4 shadow-lg shadow-blue-500/20">
                    <Factory size={48} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">ProControl Industrial</h1>
                <p className="text-slate-400 mt-2">Sistema Integral de Gestión de Planta</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-8">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Lock size={20} className="text-blue-600" /> Iniciar Sesión
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <span className="font-bold">Error:</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-1">Número de Empleado</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej. DEV-ADMIN"
                                    value={empId}
                                    onChange={e => setEmpId(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-1">Contraseña / Llave de Acceso</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input 
                                    type="password" 
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            Ingresar al Sistema <ChevronRight size={18} />
                        </button>
                    </form>
                </div>
                
                <div className="bg-slate-50 p-6 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Credenciales Demo:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-white border rounded">
                            <span className="block font-bold text-slate-700">Desarrollador</span>
                            <span className="text-slate-500">User: DEV-ADMIN</span><br/>
                            <span className="text-slate-500">Pass: ROOT-SUDO</span>
                        </div>
                        <div className="p-2 bg-white border rounded">
                            <span className="block font-bold text-slate-700">Director</span>
                            <span className="text-slate-500">User: DIR-001</span><br/>
                            <span className="text-slate-500">Pass: DIR-777</span>
                        </div>
                        <div className="p-2 bg-white border rounded col-span-2">
                             <span className="block font-bold text-slate-700">Jefe Producción</span>
                            <span className="text-slate-500">User: PROD-001</span> | <span className="text-slate-500">Pass: PROD-123</span>
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-slate-500 text-xs text-center">
                © 2024 ProControl Industrial. Acceso restringido a personal autorizado.
            </p>
        </div>
    );
};

export default Login;