import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    getOrders, saveOrder, createInitialOrder, getEmployees, fetchPendingOrdersFromCloud, 
    confirmOrderSynced, getCurrentUser, deleteOrder, notifyFabrimueble 
} from '../services/storageService';
import { printOrder } from '../services/pdfService';
import { 
    ProductionOrder, OrderStatus, Employee, ProductionArticle, 
    EmployeeRole, ProcessStatus, ProcessType, PROCESS_FLOW_DEFAULT 
} from '../types';
import { 
    Plus, Search, RefreshCw, Image as ImageIcon, File as FileIcon, 
    Trash2, X, Printer, CheckSquare, LayoutGrid, List, Calendar, 
    User, Upload, Download, Wifi, Loader2, ClipboardCheck, AlertCircle, Send
} from 'lucide-react';

const ITEMS_PER_CHUNK = 20;

const ProductionOrders = () => {
    // --- State ---
    const [orders, setOrders] = useState<ProductionOrder[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [currentUser, setCurrentUser] = useState<Employee | null>(null);
    
    // View Mode
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    
    // Filters
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterManager, setFilterManager] = useState<string>('all');
    const [filterDateReceived, setFilterDateReceived] = useState('');
    const [filterDateDue, setFilterDateDue] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Infinite Scroll State
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_CHUNK);
    const [sortConfig, setSortConfig] = useState<{key: keyof ProductionOrder, direction: 'asc' | 'desc'} | null>(null);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

    // --- Review Modal State (For Approving/Rejecting) ---
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewOrder, setReviewOrder] = useState<ProductionOrder | null>(null);
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
    const [reviewDate, setReviewDate] = useState('');
    const [reviewReason, setReviewReason] = useState('');
    const [reviewProcesses, setReviewProcesses] = useState<ProcessType[]>(PROCESS_FLOW_DEFAULT);
    const [communicating, setCommunicating] = useState(false);

    // File Import
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New Order Form (Internal)
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
        setCurrentUser(getCurrentUser());
        setLoading(false);
    };

    // Permission Check
    const isSuperackito = currentUser?.employeeNumber === 'Superackito';

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
            // Priority sort: REVIEW_PENDING first, then by date
            result.sort((a, b) => {
                if (a.status === OrderStatus.REVIEW_PENDING && b.status !== OrderStatus.REVIEW_PENDING) return -1;
                if (b.status === OrderStatus.REVIEW_PENDING && a.status !== OrderStatus.REVIEW_PENDING) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
        }

        return result;
    }, [orders, filterStatus, filterManager, filterDateReceived, filterDateDue, searchTerm, sortConfig]);

    // Reset visible items when filters change
    useEffect(() => {
        setVisibleCount(ITEMS_PER_CHUNK);
    }, [filteredOrders.length, filterStatus, filterManager, searchTerm]);

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    // Small delay to show spinner and feel natural
                    setTimeout(() => {
                        setVisibleCount(prev => prev + ITEMS_PER_CHUNK);
                    }, 300);
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [observerTarget, visibleCount, filteredOrders.length]);

    // Infinite Scroll Slicing
    const currentData = filteredOrders.slice(0, visibleCount);

    // --- Handlers ---

    const handleSort = (key: keyof ProductionOrder) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
        const updatedOrders = orders.map(o => {
            if (o.id === orderId) {
                return { ...o, status: newStatus };
            }
            return o;
        });
        setOrders(updatedOrders);
        const orderToUpdate = updatedOrders.find(o => o.id === orderId);
        if (orderToUpdate) saveOrder(orderToUpdate);
        
        // Also update selectedOrder if it's the one being modified
        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
    };

    const handleDeleteOrder = (orderId: string, orderNumber: string) => {
        if (window.confirm(`⚠️ ADVERTENCIA: ¿Estás seguro de que deseas ELIMINAR permanentemente la orden ${orderNumber}? Esta acción no se puede deshacer.`)) {
            deleteOrder(orderId);
            loadData();
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(null);
            }
        }
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

    const toggleProcess = (type: ProcessType, isReview: boolean = false) => {
        const setFn = isReview ? setReviewProcesses : setSelectedProcesses;
        const currentList = isReview ? reviewProcesses : selectedProcesses;

        setFn(prev => {
            if (prev.includes(type)) {
                return prev.filter(p => p !== type);
            } else {
                const newSet = [...prev, type];
                const order = Object.values(ProcessType);
                return newSet.sort((a, b) => order.indexOf(a) - order.indexOf(b));
            }
        });
    };

    // --- Review Handlers (Approve/Reject) ---

    const openReviewModal = (order: ProductionOrder) => {
        setReviewOrder(order);
        setReviewDate(order.dueDate || new Date().toISOString().split('T')[0]); // Default to today if empty
        setReviewReason('');
        setReviewProcesses(PROCESS_FLOW_DEFAULT);
        setReviewAction(null);
        setIsReviewModalOpen(true);
    };

    const confirmReview = async () => {
        if (!reviewOrder || !reviewAction) return;
        setCommunicating(true);

        const updatedOrder = { ...reviewOrder };

        if (reviewAction === 'approve') {
            if (!reviewDate) {
                alert("Debe seleccionar una fecha de entrega tentativa.");
                setCommunicating(false);
                return;
            }
            if (reviewProcesses.length === 0) {
                 alert("Debe seleccionar al menos un área de producción.");
                 setCommunicating(false);
                 return;
            }
            
            // Generate processes
            updatedOrder.status = OrderStatus.PENDING; // Moves to normal flow
            updatedOrder.dueDate = reviewDate;
            updatedOrder.processes = reviewProcesses.map(type => ({
                id: crypto.randomUUID(),
                type: type,
                status: ProcessStatus.PENDING,
                pausedTimeTotal: 0,
                notes: ''
            }));
            
            // Notify external app
            const notified = await notifyFabrimueble(updatedOrder, 'APPROVED');
            if(!notified) alert("⚠️ La orden se aprobó localmente, pero falló la notificación a Fabrimueble.");

        } else if (reviewAction === 'reject') {
            if (!reviewReason) {
                alert("Debe ingresar un motivo de rechazo.");
                setCommunicating(false);
                return;
            }
            updatedOrder.status = OrderStatus.REJECTED;
            updatedOrder.rejectionReason = reviewReason;
            
            // Notify external app
            const notified = await notifyFabrimueble(updatedOrder, 'REJECTED');
            if(!notified) alert("⚠️ La orden se rechazó localmente, pero falló la notificación a Fabrimueble.");
        }

        saveOrder(updatedOrder);
        setCommunicating(false);
        setIsReviewModalOpen(false);
        loadData();
    };

    // --- Create Internal Order ---

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

    // --- JSON Import & Sync Logic ---
    const handleTestConnection = async () => { /* ... existing ... */ };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const order = mapJsonToOrder(json);
                if (order) {
                    saveOrder(order);
                    loadData();
                    alert(`Orden ${order.orderNumber} importada. Requiere revisión.`);
                }
            } catch (err) {
                console.error(err);
                alert('Error al procesar el archivo JSON. Formato inválido.');
            }
        };
        reader.readAsText(file);
    };

    const handleCloudSync = async () => {
        setSyncing(true);
        try {
            console.log("☁️ Iniciando descarga de órdenes desde Firebase...");
            const remoteOrders = await fetchPendingOrdersFromCloud();
            console.log(`☁️ Órdenes encontradas en la nube: ${remoteOrders.length}`, remoteOrders);
            
            let count = 0;
            for (const json of remoteOrders) {
                const exists = orders.some(o => o.orderNumber === json.external_id);
                if (!exists) {
                    const order = mapJsonToOrder(json);
                    if (order) {
                        saveOrder(order);
                        count++;
                        if (json._firestoreId) await confirmOrderSynced(json._firestoreId);
                    }
                } else {
                    if (json._firestoreId) await confirmOrderSynced(json._firestoreId);
                }
            }
            if (count > 0) {
                await loadData();
                alert(`✅ Éxito: Se descargaron ${count} nuevas solicitudes de orden.`);
            } else {
                alert('📭 No hay órdenes nuevas en la nube.');
            }
        } catch (error) {
            console.error("❌ Sync Error:", error);
            alert('Error al conectar con la nube.');
        } finally {
            setSyncing(false);
        }
    };

    const mapJsonToOrder = (data: any): ProductionOrder | null => {
        // ... (Logic moved to storageService, but duplicated here if needed for file import)
        // Using the one from storageService if importing that file, or keeping local here if not imported.
        // Assuming we kept logic in this file for simplicity of file-based import or we import it.
        // Let's implement local version for file upload safety.
        if (!data.external_id || !data.items) return null;
        
        return {
            id: crypto.randomUUID(),
            orderNumber: data.external_id,
            projectName: data.project_name || 'Proyecto Importado',
            client: data.client || 'Cliente Externo',
            receptionDate: data.export_date ? new Date(data.export_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            dueDate: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '', 
            managerId: '',
            status: OrderStatus.REVIEW_PENDING, // Always needs review
            priority: 'Medium',
            designId: 'EXT-IMPORT',
            designVersion: '1.0',
            createdAt: new Date().toISOString(),
            evidenceLogs: [],
            materials: [],
            processes: [], // Empty until approved
            articles: data.items.map((item: any) => ({
                id: crypto.randomUUID(),
                name: item.sku_name || 'Artículo',
                quantity: item.quantity || 1,
                description: item.category || '',
                photos: [],
                pdfs: [],
                syncedAttachment: item.attachment || undefined,
                attachmentType: item.attachment_type || undefined
            }))
        };
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

    const calculateProgress = (order: ProductionOrder) => {
        if (!order.processes || order.processes.length === 0) return 0;
        const completed = order.processes.filter(p => p.status === ProcessStatus.COMPLETED).length;
        return Math.round((completed / order.processes.length) * 100);
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.REVIEW_PENDING: return 'bg-purple-100 text-purple-700 border-purple-200 animate-pulse';
            case OrderStatus.COMPLETED: return 'bg-green-100 text-green-700 border-green-200';
            case OrderStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700 border-blue-200';
            case OrderStatus.PENDING: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case OrderStatus.PAUSED: return 'bg-orange-100 text-orange-700 border-orange-200';
            case OrderStatus.CANCELED: return 'bg-red-50 text-red-600 border-red-200';
            case OrderStatus.REJECTED: return 'bg-red-100 text-red-800 border-red-200 line-through';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    // --- Render ---

    return (
        <div className="p-4 md:p-6 h-full flex flex-col pb-24">
            {/* Hidden Input for Import */}
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".json" 
                onChange={handleFileChange} 
            />
            
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Panel de Producción</h2>
                    <p className="text-slate-500 text-sm">Gestión centralizada de órdenes</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                    {/* View Toggle */}
                    <div className="hidden md:flex bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`} title="Vista Tarjetas">
                            <LayoutGrid size={18} />
                        </button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`} title="Vista Lista">
                            <List size={18} />
                        </button>
                    </div>

                    <button 
                        onClick={handleCloudSync}
                        disabled={syncing}
                        className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100 bg-white shadow-sm transition-colors flex items-center gap-2"
                        title="Sincronizar desde Nube (API)"
                    >
                        <Download size={20} className={syncing ? 'animate-bounce' : ''} /> 
                        <span className="hidden lg:inline text-sm font-medium">Sincronizar Nube</span>
                    </button>

                    <button 
                        onClick={handleImportClick}
                        className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg border bg-white shadow-sm transition-colors flex items-center gap-2"
                        title="Importar JSON Local"
                    >
                        <Upload size={20} /> <span className="hidden lg:inline text-sm font-medium">Importar</span>
                    </button>

                    <button 
                        onClick={loadData} 
                        className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg border bg-white shadow-sm transition-colors"
                        title="Actualizar"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors flex-1 md:flex-none shadow-md font-medium"
                    >
                        <Plus size={18} /> <span className="hidden sm:inline">Crear Orden</span> <span className="sm:hidden">Crear</span>
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
                            placeholder="Buscar..." 
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
                        className="w-full p-2 border rounded-lg text-sm text-slate-600"
                        title="Fecha Recepción"
                        value={filterDateReceived}
                        onChange={e => setFilterDateReceived(e.target.value)}
                    />

                    <input 
                        type="date" 
                        className="w-full p-2 border rounded-lg text-sm text-slate-600"
                        title="Fecha Entrega"
                        value={filterDateDue}
                        onChange={e => setFilterDateDue(e.target.value)}
                    />
                </div>
            </div>

            {/* Orders Data Container */}
            <div className={`flex-1 flex flex-col ${viewMode === 'list' ? 'bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden' : ''}`}>
                
                {/* GRID VIEW */}
                {(viewMode === 'grid' || window.innerWidth < 768) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                        {currentData.map(order => {
                            const progress = calculateProgress(order);
                            const isReview = order.status === OrderStatus.REVIEW_PENDING;

                            return (
                                <div key={order.id} className={`bg-white rounded-xl shadow-sm border ${isReview ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-200'} hover:shadow-md transition-shadow flex flex-col overflow-hidden relative`}>
                                    {/* Card Header */}
                                    <div className={`p-4 border-b flex justify-between items-start ${isReview ? 'bg-purple-50' : 'bg-slate-50/50'}`}>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Folio</span>
                                            <p className="text-lg font-bold text-blue-600 leading-none mt-0.5">{order.orderNumber}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4 flex-1 flex flex-col gap-3">
                                        <div>
                                            <h3 className="font-bold text-slate-800 line-clamp-2" title={order.projectName}>{order.projectName}</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">{order.client}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                                            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <Calendar size={14} className="text-slate-400" />
                                                <div>
                                                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Entrega</span>
                                                    <span className="text-xs font-semibold">{order.dueDate || 'Pendiente'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <User size={14} className="text-slate-400" />
                                                <div className="overflow-hidden">
                                                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Encargado</span>
                                                    <span className="text-xs font-semibold truncate block">
                                                        {getManagerName(order.managerId).split(' ')[0]}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="px-4 pb-4">
                                        {isReview ? (
                                            <button 
                                                onClick={() => openReviewModal(order)}
                                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold transition-colors text-sm shadow-md shadow-purple-200 flex items-center justify-center gap-2 animate-pulse"
                                            >
                                                <ClipboardCheck size={16} /> Revisar Solicitud
                                            </button>
                                        ) : (
                                            <>
                                                <div className="mb-3">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Progreso</span>
                                                        <span className="text-[10px] font-bold text-slate-600">{progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                        <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="flex-1 bg-white text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm border border-blue-200 shadow-sm"
                                                    >
                                                        Ver Detalles
                                                    </button>
                                                    
                                                    {isSuperackito && (
                                                        <button 
                                                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                                                            className="bg-red-50 text-red-600 px-3 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* LIST VIEW */}
                <div className={`hidden md:block overflow-x-auto flex-1 ${viewMode !== 'list' ? 'hidden' : ''}`}>
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
                            {currentData.map(order => {
                                const isReview = order.status === OrderStatus.REVIEW_PENDING;
                                return (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-medium text-blue-600">{order.orderNumber}</td>
                                        <td className="p-4">
                                            <p className="font-medium text-slate-800 line-clamp-1">{order.projectName}</p>
                                            <p className="text-xs text-slate-500 hidden sm:block">{order.client}</p>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 hidden lg:table-cell">{getManagerName(order.managerId)}</td>
                                        <td className="p-4 text-sm text-slate-600 hidden xl:table-cell">{order.receptionDate || '-'}</td>
                                        <td className="p-4 text-sm text-slate-600 hidden md:table-cell">{order.dueDate || 'Pendiente'}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 items-center">
                                                {isReview ? (
                                                     <button 
                                                        onClick={() => openReviewModal(order)}
                                                        className="text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded shadow-sm flex items-center gap-1"
                                                    >
                                                        <ClipboardCheck size={14} /> Revisar
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
                                                        >
                                                            Ver Detalle
                                                        </button>
                                                        {isSuperackito && (
                                                            <button 
                                                                onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* --- INFINITE SCROLL INDICATORS --- */}
                {filteredOrders.length > visibleCount && (
                    <div ref={observerTarget} className="p-8 flex justify-center w-full bg-slate-50/50 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-blue-600">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="text-sm font-medium animate-pulse">Cargando más órdenes...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* --- REVIEW MODAL --- */}
            {isReviewModalOpen && reviewOrder && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 md:p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b bg-purple-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <ClipboardCheck className="text-purple-600" /> Revisión de Orden
                                </h3>
                                <p className="text-sm text-slate-600">Folio: {reviewOrder.orderNumber}</p>
                            </div>
                            <button onClick={() => setIsReviewModalOpen(false)}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Project Summary */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
                                <p><strong>Proyecto:</strong> {reviewOrder.projectName}</p>
                                <p><strong>Artículos:</strong> {reviewOrder.articles.length} items</p>
                                <p><strong>Recibido:</strong> {reviewOrder.receptionDate}</p>
                            </div>

                            {/* Decision Buttons */}
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setReviewAction('approve')}
                                    className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all ${reviewAction === 'approve' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 hover:border-green-300'}`}
                                >
                                    Aprobar Orden
                                </button>
                                <button 
                                    onClick={() => setReviewAction('reject')}
                                    className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all ${reviewAction === 'reject' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:border-red-300'}`}
                                >
                                    Rechazar Orden
                                </button>
                            </div>

                            {/* Approval Form */}
                            {reviewAction === 'approve' && (
                                <div className="space-y-4 animate-fade-in-down">
                                    <div className="p-4 border-l-4 border-green-500 bg-green-50/50 rounded-r-lg">
                                        <h4 className="font-bold text-green-800 mb-4">Configuración de Aprobación</h4>
                                        
                                        <div className="mb-4">
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Fecha de Entrega Comprometida</label>
                                            <input 
                                                type="date" 
                                                className="w-full border p-2 rounded bg-white"
                                                value={reviewDate}
                                                onChange={e => setReviewDate(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Áreas de Producción Requeridas</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {Object.values(ProcessType).map((pt) => {
                                                    const isSelected = reviewProcesses.includes(pt);
                                                    return (
                                                        <label key={pt} className={`flex items-center gap-2 p-2 rounded cursor-pointer border bg-white ${isSelected ? 'border-blue-400' : 'border-slate-200'}`}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isSelected}
                                                                onChange={() => toggleProcess(pt, true)}
                                                                className="accent-blue-600"
                                                            />
                                                            <span className="text-xs font-medium">{pt}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 italic">
                                        * Al aprobar, se notificará a Fabrimueble la fecha de entrega y el estado "En Proceso".
                                    </p>
                                </div>
                            )}

                            {/* Rejection Form */}
                            {reviewAction === 'reject' && (
                                <div className="space-y-4 animate-fade-in-down">
                                     <div className="p-4 border-l-4 border-red-500 bg-red-50/50 rounded-r-lg">
                                        <h4 className="font-bold text-red-800 mb-4">Motivo de Rechazo</h4>
                                        <textarea 
                                            className="w-full border p-3 rounded bg-white h-24 focus:ring-2 focus:ring-red-500 outline-none"
                                            placeholder="Describa por qué no se puede procesar esta orden (ej. Falta de material, capacidad excedida)..."
                                            value={reviewReason}
                                            onChange={e => setReviewReason(e.target.value)}
                                        ></textarea>
                                     </div>
                                     <p className="text-xs text-slate-500 italic">
                                        * Al rechazar, se notificará a Fabrimueble y la orden se marcará como Cancelada/Rechazada.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                             <button onClick={() => setIsReviewModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-lg">Cancelar</button>
                             {reviewAction && (
                                 <button 
                                    onClick={confirmReview}
                                    disabled={communicating}
                                    className={`px-6 py-2 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 ${
                                        reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    } ${communicating ? 'opacity-70 cursor-wait' : ''}`}
                                 >
                                     {communicating ? (
                                         <><Loader2 className="animate-spin" size={18} /> Procesando...</>
                                     ) : (
                                         <><Send size={18} /> Confirmar {reviewAction === 'approve' ? 'Aprobación' : 'Rechazo'}</>
                                     )}
                                 </button>
                             )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Order Modal (Existing) */}
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
                                                            <button type="button" className="text-xs flex items-center gap-1 text-slate-500 hover:text-blue-600 bg-slate-100 px-2 py-1 rounded border">
                                                                <ImageIcon size={12} /> {art.photos.length} Fotos
                                                            </button>
                                                            <button type="button" className="text-xs flex items-center gap-1 text-slate-500 hover:text-red-600 bg-slate-100 px-2 py-1 rounded border">
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

            {/* View Detail Modal (Existing) */}
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
                        {/* Detail Content... (Rest of existing modal content) */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Status & Key Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-slate-50 rounded border">
                                    <span className="text-xs text-slate-400 uppercase font-bold">Recepción</span>
                                    <p className="font-semibold">{selectedOrder.receptionDate || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border">
                                    <span className="text-xs text-slate-400 uppercase font-bold">Entrega</span>
                                    <p className="font-semibold text-blue-600">{selectedOrder.dueDate || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border">
                                    <span className="text-xs text-slate-400 uppercase font-bold">Encargado</span>
                                    <p className="font-semibold truncate">{getManagerName(selectedOrder.managerId)}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded border">
                                    <span className="text-xs text-slate-400 uppercase font-bold">Estado</span>
                                    <select 
                                        value={selectedOrder.status}
                                        onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                                        className="font-semibold bg-transparent outline-none cursor-pointer text-blue-700 w-full"
                                    >
                                        {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                             {/* Rejection Reason display if rejected */}
                             {selectedOrder.status === OrderStatus.REJECTED && selectedOrder.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-800 flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <div>
                                        <span className="font-bold block">Motivo de Rechazo:</span>
                                        {selectedOrder.rejectionReason}
                                    </div>
                                </div>
                            )}

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
                                                            {art.photos.length > 0 && <span className="bg-blue-100 text-blue-700 px-1.5 rounded">{art.photos.length} Fotos</span>}
                                                            {art.pdfs.length > 0 && <span className="bg-red-100 text-red-700 px-1.5 rounded">{art.pdfs.length} PDFs</span>}
                                                            {art.syncedAttachment && <span className="bg-purple-100 text-purple-700 px-1.5 rounded">Adjunto Nube</span>}
                                                            {art.photos.length === 0 && art.pdfs.length === 0 && !art.syncedAttachment && <span className="text-slate-400">-</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={3} className="p-4 text-center text-slate-400 italic">No hay artículos registrados.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                         <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                            {isSuperackito && (
                                <button 
                                    onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.orderNumber)}
                                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 mr-auto"
                                >
                                    <Trash2 size={18} /> Eliminar
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    if(selectedOrder) printOrder(selectedOrder, getManagerName(selectedOrder.managerId));
                                }}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center gap-2"
                            >
                                <Printer size={18} /> Imprimir
                            </button>
                            <button onClick={() => setSelectedOrder(null)} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductionOrders;