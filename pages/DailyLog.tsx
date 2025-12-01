import React, { useState, useEffect } from 'react';
import { saveDailyLog, getDailyLogs, getCurrentUser, deleteDailyLog } from '../services/storageService';
import { printDailyLog } from '../services/pdfService';
import { DailyLog, Employee } from '../types';
import { Save, Printer, FileText, Trash2 } from 'lucide-react';

const DailyLogPage = () => {
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [currentUser, setCurrentUser] = useState<Employee | null>(null);

    // Form
    const [supervisor, setSupervisor] = useState('');
    const [shift, setShift] = useState('Matutino');
    const [summary, setSummary] = useState('');
    const [incidents, setIncidents] = useState('');
    const [prodCount, setProdCount] = useState(0);
    const [efficiency, setEfficiency] = useState(90);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setLogs(getDailyLogs());
        setCurrentUser(getCurrentUser());
    };

    const isSuperackito = currentUser?.employeeNumber === 'Superackito';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newLog: DailyLog = {
            id: crypto.randomUUID(),
            date: new Date().toISOString().split('T')[0],
            supervisor,
            shift,
            progressSummary: summary,
            incidents,
            absenteeism: [], // Simplified for demo
            materialsMissing: '',
            productionCount: prodCount,
            efficiency
        };
        saveDailyLog(newLog);
        loadData();
        setIsCreating(false);
        resetForm();
    };

    const resetForm = () => {
        setSummary('');
        setIncidents('');
        setProdCount(0);
        setEfficiency(90);
    };

    const handleDeleteLog = (id: string, date: string) => {
        if(window.confirm(`¿Estás seguro de eliminar el reporte del día ${date}?`)) {
            deleteDailyLog(id);
            loadData();
        }
    }

    return (
        <div className="p-4 md:p-8 pb-24">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Bitácora Diaria</h2>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
                >
                    <FileText size={18} /> Nuevo Reporte
                </button>
            </div>

            {isCreating ? (
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border mb-8">
                    <h3 className="text-lg font-bold mb-4 text-blue-600 border-b pb-2">Registrar Reporte del Día</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">Supervisor</label>
                                <input required className="w-full border p-2 rounded-lg" value={supervisor} onChange={e => setSupervisor(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">Turno</label>
                                <select className="w-full border p-2 rounded-lg" value={shift} onChange={e => setShift(e.target.value)}>
                                    <option>Matutino</option>
                                    <option>Vespertino</option>
                                    <option>Nocturno</option>
                                </select>
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1 text-slate-700">Resumen de Avances</label>
                             <textarea required className="w-full border p-2 rounded-lg h-24" value={summary} onChange={e => setSummary(e.target.value)}></textarea>
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1 text-slate-700">Incidencias (Opcional)</label>
                             <textarea className="w-full border p-2 rounded-lg h-16" value={incidents} onChange={e => setIncidents(e.target.value)}></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">Piezas Producidas</label>
                                <input type="number" className="w-full border p-2 rounded-lg" value={prodCount} onChange={e => setProdCount(Number(e.target.value))} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">Eficiencia Calc. (%)</label>
                                <input type="number" className="w-full border p-2 rounded-lg" value={efficiency} onChange={e => setEfficiency(Number(e.target.value))} />
                            </div>
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100">Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 shadow">
                                <Save size={18} /> Guardar Reporte
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid gap-4">
                    {logs.map(log => (
                        <div key={log.id} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-lg text-slate-800">{log.date}</h4>
                                    <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">{log.shift}</span>
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Sup: {log.supervisor}</p>
                                <p className="text-sm mt-2 text-slate-700 line-clamp-2 md:w-3/4">{log.progressSummary}</p>
                            </div>
                            <div className="flex items-center justify-between md:flex-col md:items-end gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                                <div className="text-left md:text-right">
                                    <p className="text-2xl font-bold text-blue-600">{log.efficiency}%</p>
                                    <p className="text-xs text-slate-400">Eficiencia</p>
                                </div>
                                <div className="flex gap-2">
                                    {isSuperackito && (
                                        <button 
                                            onClick={() => handleDeleteLog(log.id, log.date)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                            title="Eliminar Reporte"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <button onClick={() => printDailyLog(log)} className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm border px-3 py-1.5 rounded-lg transition-colors">
                                        <Printer size={14} /> <span className="md:hidden lg:inline">PDF</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && <p className="text-center text-slate-400 py-10">No hay bitácoras registradas.</p>}
                </div>
            )}
        </div>
    );
};

export default DailyLogPage;