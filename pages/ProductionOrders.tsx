import React, { useState, useEffect, useMemo } from 'react';
import { 
    getOrders, saveOrder, createInitialOrder, getEmployees
} from '../services/storageService';
import { printOrder } from '../services/pdfService';
import { 
    ProductionOrder, OrderStatus, Employee, ProductionArticle, 
    EmployeeRole, ProcessStatus, ProcessType, PROCESS_FLOW_DEFAULT 
} from '../types';
import { 
    Plus, Search, RefreshCw, ChevronLeft, 
    ChevronRight, Image as ImageIcon, File as FileIcon, Trash2, X, Printer, CheckSquare
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const ProductionOrders = () => {
    // --- State ---
    const [orders, setOrders] = useState<ProductionOrder[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterManager, setFilterManager] = useState<string>('all');
    const [filterDateReceived, setFilterDateReceived] = useState('');
    const [filterDateDue, setFilterDateDue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{key: keyof ProductionOrder, direction: 'asc' | 'desc'} | null>(null);

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

    // New Order Form
    const [newProjectName, setNewProjectName] = useState('');
    const [newReceptionDate, setNewReceptionDate] = useState('');
    const [newDueDate, setNewDueDate] = useState('');
    const [newManagerId, setNewManagerId] = useState('');
    const [newArticles, setNewArticles] = useState<ProductionArticle[]>([]);
    const [selectedProcesses, setSelectedProcesses] = useState<ProcessType[]>(PROCESS_FLOW_DEFAULT);
    
    // Article Form (Current Item being added)
    const [artName, setArtName] = useState('');
    const [artDesc, setArtDesc] = useState('');
    const [artQty, setArtQty] = useState(1);

    // --- Effects ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        // Simulate network request
        await new Promise(r => setTimeout(r, 500));
        setOrders(getOrders());
        setEmployees(getEmployees());
        setLoading(false);
    };

    // --- Filtering & Sorting Logic ---
    const filteredOrders = useMemo(() => {
        let result = [...orders];

        if (filterStatus !== 'all') {
            result = result.filter(o => o.status === filterStatus);
        }
        if (filterManager !== 'all') {
            result = result.filter(o => o.managerId === filterManager);
        }
        if (filterDateReceived) {
            result = result.filter(o => o.receptionDate === filterDateReceived);
        }
        if (filterDateDue) {
            result = result.filter(o => o.dueDate === filterDateDue);
        }
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(o => 
                o.orderNumber.toLowerCase().includes(lower) || 
                o.projectName.toLowerCase().includes(lower) ||
                o.client.toLowerCase().includes(lower)
            );
        }

        if (sortConfig) {
            result.sort((a, b) => {
                // @ts-ignore - dynamic sort key
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                // @ts-ignore
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            // Default sort by created recent
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return result;
    }, [orders, filterStatus, filterManager, filterDateReceived, filterDateDue, searchTerm, sortConfig]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const currentData = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE, 
        currentPage * ITEMS_PER_PAGE
    );

    // --- Handlers ---

    const handleSort = (key: keyof ProductionOrder) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleAddArticle = () => {
        if (!artName || artQty <= 0) return;
        const newArt: ProductionArticle = {
            id: crypto.randomUUID(),
            name: artName,
            description: artDesc,
            quantity: artQty,
            photos: [], // Simulating empty upload for now
            pdfs: []
        };
        setNewArticles([...newArticles, newArt]);
        setArtName('');
        setArtDesc('');
        setArtQty(1);
    };

    const removeArticle = (id: string) => {
        setNewArticles(newArticles.filter(a => a.id !== id));
    };

    const toggleProcess = (type: ProcessType) => {
        setSelectedProcesses(prev => {
            if (prev.includes(type)) {
                return prev.filter(p => p !== type);
            } else {
                const newSet = [...prev, type];
                const order = Object.values(ProcessType);
                return newSet.sort((a, b) => order.indexOf(a) - order.indexOf(b));
            }
        });
    };

    // Mock file "upload"
    const simulateFileUpload = (articleId: string, type: 'photo' | 'pdf') => {
        const updated = newArticles.map(a => {
            if (a.id === articleId) {
                if (type === 'photo') return { ...a, photos: [...a.photos, 'mock_url.jpg'] };
                if (type === 'pdf') return { ...a, pdfs: [...a.pdfs, 'mock_doc.pdf'] };
            }
            return a;
        });
        setNewArticles(updated);
    };

    const handleCreateOrder = (e: React.FormEvent) => {
        e.preventDefault();
        if (newArticles.length === 0) {
            alert("Debe agregar al menos un artículo");
            return;
        }
        
        if (selectedProcesses.length === 0) {
            alert("Debe seleccionar al menos un proceso de producción.");
            return;
        }

        createInitialOrder(
            newProjectName,
            "Cliente Genérico", // Can be added to form if needed
            newReceptionDate,
            newDueDate,
            newManagerId,
            newArticles,
            selectedProcesses
        );
        
        loadData();
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setNewProjectName('');
        setNewReceptionDate('');
        setNewDueDate('');
        setNewManagerId('');
        setNewArticles([]);
        setArtName('');
        setSelectedProcesses(PROCESS_FLOW_DEFAULT);
    };

    const getManagerName = (id: string) => {
        const emp = employees.find(e => e.id === id);
        return emp ? emp.fullName : 'No Asignado';
    };

    const handleProcessUpdate = (orderId: string, processId: string, newStatus: ProcessStatus) => {
        const updatedOrders = orders.map(o => {
            if (o.id === orderId) {
                const updatedProcesses = o.processes.map(p => 
                    p.id === processId ? { ...p, status: newStatus } : p
                );
                const allDone = updatedProcesses.every(p => p.status === ProcessStatus.COMPLETED);
                return { 
                    ...o, 
                    processes: updatedProcesses, 
                    status: allDone ? OrderStatus.COMPLETED : OrderStatus.IN_PROGRESS 
                };
            }
            return o;
        });
        setOrders(updatedOrders);
        updatedOrders.forEach(o => saveOrder(o));
        // Update selected order if open
        if(selectedOrder) {
             const fresh = updatedOrders.find(o => o.id === selectedOrder.id);
             if(fresh) setSelectedOrder(fresh);
        }
    };

    // --- Render ---

    return (
        <div className="p-4 md:p-6 h-full flex flex-col pb-24">
            
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Panel de Producción</h2>
                    <p className="text-slate-500 text-sm">Gestión centralizada de órdenes</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button 
                        onClick={loadData} 
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border bg-white shadow-sm transition-colors"
                        title="Actualizar"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors flex-1 md:flex-none shadow-md font-medium"
                    >
                        <Plus size={18} /> Crear Orden
                    </button>
                </div>
            </div>

            {/* Filters Container */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar proyecto..." 
                            className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <select 
                        className="w-full p-2 border rounded-lg text-sm bg-white"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Todos los Estados</option>
                        {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select 
                        className="w-full p-2 border rounded-lg text-sm bg-white"
                        value={filterManager}
                        onChange={e => setFilterManager(e.target.value)}
                    >
                        <option value="all">Todos los Encargados</option>
                        {employees.filter(e => e.role === EmployeeRole.PRODUCTION_MANAGER).map(e => (
                            <option key={e.id} value={e.id}>{e.fullName}</option>
                        ))}
                    </select>

                    <input 
                        type="date" 
                        className="w-full p-2 border rounded-lg text-sm"
                        title="Fecha Recepción"
                        value={filterDateReceived}
                        onChange={e => setFilterDateReceived(e.target.value)}
                    />

                    <input 
                        type="date" 
                        className="w-full p-2 border rounded-lg text-sm"
                        title="Fecha Entrega"
                        value={filterDateDue}
                        onChange={e => setFilterDateDue(e.target.value)}
                    />
                </div>
            </div>

            {/* Orders Data Container */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
                
                {/* 1. Mobile/Tablet Card View (md:hidden) */}
                <div className="md:hidden p-4 space-y-4 overflow-y-auto flex-1">
                    {currentData.map(order => (
                        <div key={order.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Folio</span>
                                    <p className="text-lg font-bold text-blue-600 leading-tight">{order.orderNumber}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                                    order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700 border-green-200' :
                                    order.status === OrderStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                    order.status === OrderStatus.PENDING ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                    {order.status}
                                </span>
                            </div>
                            
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Proyecto</span>
                                <p className="font-medium text-slate-800 line-clamp-2">{order.projectName}</p>
                                <p className="text-xs text-slate-500 mt-1">{order.client}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                    <span className="block text-xs text-slate-400">Entrega</span>
                                    <span className="font-semibold text-slate-700">{order.dueDate}</span>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                    <span className="block text-xs text-slate-400">Encargado</span>
                                    <span className="font-semibold text-slate-700 truncate">{getManagerName(order.managerId).split(' ')[0]}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedOrder(order)}
                                className="w-full mt-2 bg-blue-50 text-blue-600 py-2.5 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm border border-blue-100"
                            >
                                Ver Detalle Completo
                            </button>
                        </div>
                    ))}
                    {currentData.length === 0 && (
                        <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed text-slate-400">
                            No se encontraron órdenes con los filtros actuales.
                        </div>
                    )}
                </div>

                {/* 2. Desktop Table View (hidden md:block) */}
                <div className="hidden md:block overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th onClick={() => handleSort('orderNumber')} className="p-4 font-semibold text-slate-600 text-sm cursor-pointer hover:bg-slate-100">Folio</th>
                                <th onClick={() => handleSort('projectName')} className="p-4 font-semibold text-slate-600 text-sm cursor-pointer hover:bg-slate-100">Proyecto</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm hidden lg:table-cell">Encargado</th>
                                <th onClick={() => handleSort('receptionDate')} className="p-4 font-semibold text-slate-600 text-sm cursor-pointer hover:bg-slate-100 hidden xl:table-cell">Recepción</th>
                                <th onClick={() => handleSort('dueDate')} className="p-4 font-semibold text-slate-600 text-sm cursor-pointer hover:bg-slate-100 hidden md:table-cell">Entrega</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm text-center">Estado</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentData.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-medium text-blue-600">{order.orderNumber}</td>
                                    <td className="p-4">
                                        <p className="font-medium text-slate-800 line-clamp-1">{order.projectName}</p>
                                        <p className="text-xs text-slate-500 hidden sm:block">{order.client}</p>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 hidden lg:table-cell">{getManagerName(order.managerId)}</td>
                                    <td className="p-4 text-sm text-slate-600 hidden xl:table-cell">{order.receptionDate || '-'}</td>
                                    <td className="p-4 text-sm text-slate-600 hidden md:table-cell">{order.dueDate}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
                                            order.status === OrderStatus.COMPLETED ? 'bg-green-100 text-green-700 border-green-200' :
                                            order.status === OrderStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                            order.status === OrderStatus.PENDING ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => setSelectedOrder(order)}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
                                        >
                                            Ver Detalle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {currentData.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                                        No se encontraron órdenes con los filtros actuales.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Shared) */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                    <span className="text-sm text-slate-500 hidden sm:inline">
                        Mostrando {currentData.length} de {filteredOrders.length}
                    </span>
                    <div className="flex gap-2 w-full sm:w-auto justify-center">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border rounded hover:bg-white disabled:opacity-50"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-3 py-2 text-sm font-medium text-slate-700">Página {currentPage}</span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 border rounded hover:bg-white disabled:opacity-50"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Order Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
                        <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800">Nueva Orden de Producción</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 md:p-8">
                            <form id="createOrderForm" onSubmit={handleCreateOrder} className="space-y-8">
                                {/* General Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Proyecto</label>
                                        <input 
                                            required 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                                            placeholder="Ej. Estructura Metálica Lote 40"
                                            value={newProjectName} 
                                            onChange={e => setNewProjectName(e.target.value)} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Fecha Recepción</label>
                                        <input 
                                            type="date" required 
                                            className="w-full border border-slate-300 rounded-lg p-2.5" 
                                            value={newReceptionDate} 
                                            onChange={e => setNewReceptionDate(e.target.value)} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Fecha Estimada Entrega</label>
                                        <input 
                                            type="date" required 
                                            className="w-full border border-slate-300 rounded-lg p-2.5" 
                                            value={newDueDate} 
                                            onChange={e => setNewDueDate(e.target.value)} 
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Encargado de Producción</label>
                                        <select 
                                            required 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                                            value={newManagerId}
                                            onChange={e => setNewManagerId(e.target.value)}
                                        >
                                            <option value="">Seleccionar Encargado...</option>
                                            {employees.filter(e => e.role === EmployeeRole.PRODUCTION_MANAGER).map(e => (
                                                <option key={e.id} value={e.id}>{e.fullName} - {e.employeeNumber}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <hr className="border-slate-200" />
                                
                                {/* Processes Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Procesos Requeridos para la Orden</label>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {Object.values(ProcessType).map((pt) => {
                                                const isSelected = selectedProcesses.includes(pt);
                                                return (
                                                    <label key={pt} className={`flex items-center gap-3 p-3 rounded cursor-pointer border transition-all ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200 hover:bg-slate-100'}`}>
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-400'}`}>
                                                             {isSelected && <CheckSquare size={14} className="text-white" />}
                                                             {!isSelected && <input type="checkbox" className="hidden" />}
                                                        </div>
                                                        <input 
                                                            type="checkbox" 
                                                            className="hidden"
                                                            checked={isSelected}
                                                            onChange={() => toggleProcess(pt)}
                                                        />
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{pt}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-3">
                                            * Seleccione los procesos por los que pasará este artículo o lote de producción.
                                        </p>
                                    </div>
                                </div>

                                <hr className="border-slate-200" />

                                {/* Articles Section */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-lg font-bold text-slate-800">Artículos a Producir</h4>
                                    </div>
                                    
                                    {/* Add Article Inline Form */}
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                        <div className="md:col-span-4">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Artículo</label>
                                            <input 
                                                className="w-full border p-2 rounded text-sm" 
                                                placeholder="Nombre" 
                                                value={artName}
                                                onChange={e => setArtName(e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-5">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Descripción</label>
                                            <input 
                                                className="w-full border p-2 rounded text-sm" 
                                                placeholder="Detalles técnicos..." 
                                                value={artDesc}
                                                onChange={e => setArtDesc(e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Cant.</label>
                                            <input 
                                                type="number" min="1" 
                                                className="w-full border p-2 rounded text-sm" 
                                                value={artQty}
                                                onChange={e => setArtQty(Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <button 
                                                type="button" 
                                                onClick={handleAddArticle}
                                                className="w-full bg-slate-800 text-white p-2 rounded hover:bg-slate-700 flex justify-center"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Articles List */}
                                    <div className="space-y-3">
                                        {newArticles.map((art, idx) => (
                                            <div key={art.id} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white border p-3 rounded-lg shadow-sm gap-3">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className="bg-blue-50 text-blue-600 w-8 h-8 flex items-center justify-center rounded font-bold text-sm">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{art.name}</p>
                                                        <p className="text-xs text-slate-500">{art.description}</p>
                                                        <div className="flex gap-2 mt-2">
                                                            <button type="button" onClick={() => simulateFileUpload(art.id, 'photo')} className="text-xs flex items-center gap-1 text-slate-500 hover:text-blue-600 bg-slate-100 px-2 py-1 rounded border">
                                                                <ImageIcon size={12} /> {art.photos.length} Fotos
                                                            </button>
                                                            <button type="button" onClick={() => simulateFileUpload(art.id, 'pdf')} className="text-xs flex items-center gap-1 text-slate-500 hover:text-red-600 bg-slate-100 px-2 py-1 rounded border">
                                                                <FileIcon size={12} /> {art.pdfs.length} PDFs
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                    <span className="font-bold text-slate-700 text-lg">x{art.quantity}</span>
                                                    <button type="button" onClick={() => removeArticle(art.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {newArticles.length === 0 && (
                                            <p className="text-center text-slate-400 py-4 border-2 border-dashed rounded-lg bg-slate-50">
                                                Agrega artículos a la lista arriba.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                            <button 
                                form="createOrderForm" 
                                type="submit" 
                                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} /> Guardar Orden
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
                        <div className="p-5 border-b flex justify-between items-start bg-slate-50">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">{selectedOrder.orderNumber}</h3>
                                <p className="text-slate-500 font-medium">{selectedOrder.projectName}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-200 rounded-full"><X size={24} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Status & Key Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-slate-50 rounded border">
                                    <span className="text-xs text-slate-400 uppercase font-bold">Recepción</span>
                                    <p className="font-semibold">{selectedOrder.receptionDate || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border">
                                    <span className="text-xs text-slate-400 uppercase font-bold">Entrega</span>
                                    <p className="font-semibold text-blue-600">{selectedOrder.dueDate}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border">
                                    <span className="text-xs text-slate-400 uppercase font-bold">Encargado</span>
                                    <p className="font-semibold truncate">{getManagerName(selectedOrder.managerId)}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border">
                                    <span className="text-xs text-slate-400 uppercase font-bold">Estado</span>
                                    <p className="font-semibold">{selectedOrder.status}</p>
                                </div>
                            </div>

                            {/* Articles Table */}
                            <div>
                                <h4 className="text-lg font-bold mb-3 border-b pb-2">Artículos</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="p-2">Concepto</th>
                                                <th className="p-2 text-center">Cant.</th>
                                                <th className="p-2">Archivos</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {selectedOrder.articles && selectedOrder.articles.length > 0 ? selectedOrder.articles.map(art => (
                                                <tr key={art.id}>
                                                    <td className="p-2">
                                                        <p className="font-bold">{art.name}</p>
                                                        <p className="text-xs text-slate-500">{art.description}</p>
                                                    </td>
                                                    <td className="p-2 text-center font-bold">{art.quantity}</td>
                                                    <td className="p-2">
                                                        <div className="flex gap-2 text-xs">
                                                            {art.photos.length > 0 && <span className="bg-blue-100 text-blue-700 px-1.5 rounded">{art.photos.length} Img</span>}
                                                            {art.pdfs.length > 0 && <span className="bg-red-100 text-red-700 px-1.5 rounded">{art.pdfs.length} Doc</span>}
                                                            {art.photos.length === 0 && art.pdfs.length === 0 && <span className="text-slate-400">-</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={3} className="p-4 text-center text-slate-400">Orden creada con sistema anterior (Sin artículos detallados)</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Production Progress */}
                            <div>
                                <h4 className="text-lg font-bold mb-3 border-b pb-2">Seguimiento de Procesos</h4>
                                <div className="space-y-2">
                                    {selectedOrder.processes.map(proc => (
                                        <div key={proc.id} className="flex items-center justify-between bg-slate-50 p-3 rounded border">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${
                                                    proc.status === ProcessStatus.COMPLETED ? 'bg-green-500' : 
                                                    proc.status === ProcessStatus.ACTIVE ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'
                                                }`} />
                                                <span className="font-medium">{proc.type}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                 {proc.status !== ProcessStatus.COMPLETED && (
                                                    <button 
                                                        onClick={() => handleProcessUpdate(selectedOrder.id, proc.id, ProcessStatus.COMPLETED)}
                                                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-medium"
                                                    >
                                                        Marcar Listo
                                                    </button>
                                                 )}
                                                 {proc.status === ProcessStatus.COMPLETED && <span className="text-xs text-green-600 font-bold">Completado</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {selectedOrder.processes.length === 0 && (
                                        <div className="text-slate-400 italic text-sm">Sin procesos definidos.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                            <button 
                                onClick={() => printOrder(selectedOrder, getManagerName(selectedOrder.managerId))} 
                                className="px-5 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 flex items-center gap-2 shadow-sm"
                            >
                                <Printer size={18} /> Imprimir Orden PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductionOrders;