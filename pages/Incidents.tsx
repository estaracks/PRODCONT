

import React, { useState, useEffect } from 'react';
import { getIncidents, saveIncident, getOrders } from '../services/storageService';
import { Incident, IncidentType, ProductionOrder, ProcessType } from '../types';
import { AlertTriangle, List, Plus, CheckCircle } from 'lucide-react';

const IncidentsPage = () => {
    const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [orders, setOrders] = useState<ProductionOrder[]>([]);
    const [loading, setLoading] = useState(false);

    // Form States
    const currentDate = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(currentDate);
    const [area, setArea] = useState<string>('General');
    const [type, setType] = useState<IncidentType>(IncidentType.OTHER);
    const [description, setDescription] = useState('');
    const [orderId, setOrderId] = useState('');
    const [responsible, setResponsible] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setLoading(true);
        const data = getIncidents();
        const ords = getOrders();
        setIncidents(data);
        setOrders(ords);
        setLoading(false);
    };

    const getOrderName = (id?: string) => {
        if (!id) return 'General / Sin Orden';
        const order = orders.find(o => o.id === id);
        return order ? `${order.orderNumber} - ${order.projectName}` : 'N/A';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const newIncident: Incident = {
            id: crypto.randomUUID(),
            date: date,
            area,
            type,
            description,
            orderId: orderId || undefined,
            responsible,
            status: 'Open'
        };

        saveIncident(newIncident);
        setSuccessMsg('Incidencia registrada correctamente');
        
        // Reset form
        setDescription('');
        setOrderId('');
        setResponsible('');
        
        setTimeout(() => {
            setSuccessMsg('');
            setActiveTab('list');
            loadData();
        }, 1500);
    };

    const areas = [
        ...Object.values(ProcessType), 
        'General', 
        'Almacén', 
        'Mantenimiento'
    ];

    return (
        <div className="p-4 md:p-8 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Reporte de Incidencias</h2>
                    <p className="text-slate-500 text-sm">Gestión y seguimiento de anomalías en planta</p>
                </div>
                
                {/* Tabs Toggle */}
                <div className="bg-white p-1 rounded-lg border shadow-sm flex w-full md:w-auto">
                    <button 
                        onClick={() => setActiveTab('list')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                            activeTab === 'list' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <List size={16} /> Listado
                    </button>
                    <button 
                        onClick={() => setActiveTab('create')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                            activeTab === 'create' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <Plus size={16} /> Registrar / Crear
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'create' ? (
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b bg-slate-50 flex items-center gap-2">
                            <AlertTriangle className="text-orange-500" size={20} />
                            <h3 className="font-bold text-slate-800">Nueva Incidencia</h3>
                        </div>

                        {successMsg ? (
                            <div className="p-10 text-center flex flex-col items-center justify-center animate-fade-in">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="text-green-600" size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-slate-800 mb-2">¡Registrado!</h4>
                                <p className="text-slate-500">{successMsg}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Fecha */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Fecha del Incidente</label>
                                        <input 
                                            type="date" 
                                            required 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                        />
                                    </div>

                                    {/* Tipo */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Incidencia</label>
                                        <select 
                                            required
                                            className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                                            value={type}
                                            onChange={e => setType(e.target.value as IncidentType)}
                                        >
                                            {Object.values(IncidentType).map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Area */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Área Afectada</label>
                                        <select 
                                            required
                                            className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                                            value={area}
                                            onChange={e => setArea(e.target.value)}
                                        >
                                            {areas.map(a => (
                                                <option key={a} value={a}>{a}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Responsable */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Responsable</label>
                                        <input 
                                            required 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={responsible}
                                            onChange={e => setResponsible(e.target.value)}
                                            placeholder="Nombre del responsable"
                                        />
                                    </div>

                                    {/* Orden Asociada */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Orden Asociada (Opcional)</label>
                                        <select 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                                            value={orderId}
                                            onChange={e => setOrderId(e.target.value)}
                                        >
                                            <option value="">General / Ninguna</option>
                                            {orders.map(o => (
                                                <option key={o.id} value={o.id}>
                                                    {o.orderNumber} - {o.projectName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Descripcion */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Descripción Detallada</label>
                                    <textarea 
                                        required
                                        className="w-full border border-slate-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        placeholder="Describa qué sucedió, las causas aparentes y acciones inmediatas tomadas..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="pt-4 border-t flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveTab('list')}
                                        className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-lg flex items-center gap-2"
                                    >
                                        <AlertTriangle size={18} /> Registrar Incidencia
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 font-semibold text-slate-600 text-sm">Fecha</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm">Tipo</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm hidden md:table-cell">Área</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm">Responsable</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm hidden lg:table-cell">Orden</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm">Descripción</th>
                                    <th className="p-4 font-semibold text-slate-600 text-sm text-center hidden sm:table-cell">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {incidents.map(inc => (
                                    <tr key={inc.id} className="hover:bg-slate-50">
                                        <td className="p-4 text-sm font-medium text-slate-800">{inc.date}</td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                                                inc.type === IncidentType.SAFETY ? 'bg-red-100 text-red-700' :
                                                inc.type === IncidentType.QUALITY ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {inc.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 hidden md:table-cell">{inc.area}</td>
                                        <td className="p-4 text-sm text-slate-700 font-medium">{inc.responsible || '-'}</td>
                                        <td className="p-4 text-sm text-blue-600 font-medium hidden lg:table-cell">
                                            {inc.orderId ? getOrderName(inc.orderId) : <span className="text-slate-400">General</span>}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 max-w-xs truncate" title={inc.description}>
                                            {inc.description}
                                        </td>
                                        <td className="p-4 text-center hidden sm:table-cell">
                                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
                                                {inc.status === 'Open' ? 'Abierto' : 'Cerrado'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {incidents.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                                            No hay incidencias registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncidentsPage;