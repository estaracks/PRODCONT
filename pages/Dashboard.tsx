import React, { useEffect, useState } from 'react';
import { getOrders, getDailyLogs, getEmployees } from '../services/storageService';
import { ProductionOrder, DailyLog, OrderStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        activeOrders: 0,
        delayedOrders: 0,
        efficiency: 0,
        presentPersonnel: 0
    });
    const [processData, setProcessData] = useState<any[]>([]);

    useEffect(() => {
        const orders = getOrders();
        const logs = getDailyLogs();
        const employees = getEmployees();

        // Calculate KPIs
        const active = orders.filter(o => o.status === OrderStatus.IN_PROGRESS || o.status === OrderStatus.PENDING).length;
        
        // Mock process distribution for chart
        const pData = [
            { name: 'Corte', orders: Math.floor(Math.random() * 5) + 1 },
            { name: 'Soldadura', orders: Math.floor(Math.random() * 5) + 1 },
            { name: 'Ensamble', orders: Math.floor(Math.random() * 5) + 1 },
            { name: 'Pintura', orders: Math.floor(Math.random() * 5) + 1 },
        ];

        setStats({
            activeOrders: active,
            delayedOrders: orders.filter(o => new Date(o.dueDate) < new Date() && o.status !== OrderStatus.COMPLETED).length,
            efficiency: logs.length > 0 ? logs[logs.length - 1].efficiency : 85, // Default mock or last log
            presentPersonnel: employees.filter(e => e.active).length // Simplified presence
        });

        setProcessData(pData);
    }, []);

    return (
        <div className="p-4 md:p-8 pb-24">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">Tablero de Control</h2>

            {/* KPI Cards - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600 shrink-0">
                        <Clock size={24} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm text-slate-500 font-medium truncate">Órdenes Activas</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.activeOrders}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-full text-red-600 shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm text-slate-500 font-medium truncate">Retrasadas</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.delayedOrders}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-full text-green-600 shrink-0">
                        <CheckCircle size={24} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm text-slate-500 font-medium truncate">Eficiencia General</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.efficiency}%</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-full text-purple-600 shrink-0">
                        <Users size={24} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm text-slate-500 font-medium truncate">Personal Activo</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.presentPersonnel}</p>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 h-80">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Carga por Estación</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={processData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{fontSize: 12}} />
                            <YAxis width={30} />
                            <Tooltip />
                            <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 h-80">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Distribución de Estado</h3>
                    <div className="h-full flex items-center justify-center pb-8">
                         <p className="text-slate-400 text-center text-sm px-4">Datos insuficientes para gráfica circular detallada en demo.</p>
                    </div>
                </div>
            </div>

            {/* Recent Alerts */}
            <div className="mt-8 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Alertas del Sistema</h3>
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-yellow-800">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={18} className="shrink-0" />
                            <span className="font-bold sm:hidden">Alerta:</span>
                        </div>
                        <span className="text-sm md:text-base">Stock bajo: Lámina Calibre 14 (Orden OP-4821)</span>
                    </div>
                     <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-red-50 border border-red-100 rounded-lg text-red-800">
                        <div className="flex items-center gap-2">
                            <Users size={18} className="shrink-0" />
                            <span className="font-bold sm:hidden">Critico:</span>
                        </div>
                        <span className="text-sm md:text-base">Certificación por vencer: Soldadura MIG - Carlos Ruiz</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;