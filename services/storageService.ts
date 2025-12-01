import { 
    ProductionOrder, Employee, DailyLog, Incident, 
    PROCESS_FLOW_DEFAULT, OrderStatus, ProcessStatus, DesignData, ProductionArticle, EmployeeRole, ProcessType 
} from '../types';
import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

const KEYS = {
    ORDERS: 'procontrol_orders',
    EMPLOYEES: 'procontrol_employees',
    LOGS: 'procontrol_logs',
    INCIDENTS: 'procontrol_incidents',
    CURRENT_USER_ID: 'procontrol_current_user_id'
};

// --- Helpers ---
const getData = <T>(key: string): T[] => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

const setData = <T>(key: string, data: T[]) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// --- Orders ---
export const getOrders = (): ProductionOrder[] => getData<ProductionOrder>(KEYS.ORDERS);

export const saveOrder = (order: ProductionOrder) => {
    const orders = getOrders();
    const existingIndex = orders.findIndex(o => o.id === order.id);
    if (existingIndex >= 0) {
        orders[existingIndex] = order;
    } else {
        orders.push(order);
    }
    setData(KEYS.ORDERS, orders);
};

export const deleteOrder = (id: string) => {
    const orders = getOrders();
    const filtered = orders.filter(o => o.id !== id);
    setData(KEYS.ORDERS, filtered);
};

export const createInitialOrder = (
    projectName: string,
    client: string, 
    receptionDate: string,
    dueDate: string, 
    managerId: string,
    articles: ProductionArticle[],
    customProcesses: ProcessType[] = PROCESS_FLOW_DEFAULT,
    designId: string = 'N/A',
    designVersion: string = '1.0'
): ProductionOrder => {
    const processesToUse = customProcesses.length > 0 ? customProcesses : PROCESS_FLOW_DEFAULT;

    const newOrder: ProductionOrder = {
        id: crypto.randomUUID(),
        orderNumber: `OP-${Math.floor(Math.random() * 100000)}`,
        projectName,
        client,
        receptionDate,
        dueDate,
        managerId,
        articles,
        
        priority: 'Medium',
        status: OrderStatus.PENDING,
        designId,
        designVersion,
        createdAt: new Date().toISOString(),
        evidenceLogs: [],
        materials: [],
        processes: processesToUse.map((type) => ({
            id: crypto.randomUUID(),
            type: type,
            status: ProcessStatus.PENDING,
            pausedTimeTotal: 0,
            notes: ''
        }))
    };
    saveOrder(newOrder);
    return newOrder;
};

// --- Cloud Sync (SAFE PROTOCOL) ---

// Step 1: Just fetch, DO NOT DELETE yet
export const fetchPendingOrdersFromCloud = async () => {
    try {
        const pendingRef = collection(db, "pending_orders");
        const q = query(pendingRef); 
        const querySnapshot = await getDocs(q);
        
        const retrievedOrders: any[] = [];

        querySnapshot.forEach((doc) => {
            // Attach the Firestore ID so we can delete it specifically later
            retrievedOrders.push({
                ...doc.data(),
                _firestoreId: doc.id 
            });
        });

        return retrievedOrders;
    } catch (error) {
        console.error("Error fetching from cloud:", error);
        throw error;
    }
};

// Step 2: Confirmation delete (Only call this after successful local save)
export const confirmOrderSynced = async (firestoreId: string) => {
    if (!firestoreId) return;
    try {
        await deleteDoc(doc(db, "pending_orders", firestoreId));
        console.log(`Synced and cleaned up: ${firestoreId}`);
    } catch (error) {
        console.error(`Failed to cleanup order ${firestoreId}`, error);
        // We do not throw here to avoid crashing the UI loop, just log it.
    }
};

// --- Employees ---
export const getEmployees = (): Employee[] => getData<Employee>(KEYS.EMPLOYEES);

export const saveEmployee = (emp: Employee) => {
    const list = getEmployees();
    const idx = list.findIndex(e => e.id === emp.id);
    if (idx >= 0) list[idx] = emp;
    else list.push(emp);
    setData(KEYS.EMPLOYEES, list);
};

export const deleteEmployee = (id: string) => {
    const list = getEmployees();
    const filtered = list.filter(e => e.id !== id);
    setData(KEYS.EMPLOYEES, filtered);
};

// --- Logs ---
export const getDailyLogs = (): DailyLog[] => getData<DailyLog>(KEYS.LOGS);

export const saveDailyLog = (log: DailyLog) => {
    const logs = getDailyLogs();
    logs.push(log);
    setData(KEYS.LOGS, logs);
};

export const deleteDailyLog = (id: string) => {
    const logs = getDailyLogs();
    const filtered = logs.filter(l => l.id !== id);
    setData(KEYS.LOGS, filtered);
};

// --- Incidents ---
export const getIncidents = (): Incident[] => getData<Incident>(KEYS.INCIDENTS);

export const saveIncident = (incident: Incident) => {
    const list = getIncidents();
    list.unshift(incident);
    setData(KEYS.INCIDENTS, list);
};

// --- Auth & Session ---
export const getCurrentUser = (): Employee | null => {
    const id = localStorage.getItem(KEYS.CURRENT_USER_ID);
    if (!id) return null;
    const employees = getEmployees();
    return employees.find(e => e.id === id) || null;
};

export const loginUser = (employeeNumber: string, accessKey: string): boolean => {
    const employees = getEmployees();
    // Case insensitive check for username
    const user = employees.find(e => e.employeeNumber.toUpperCase() === employeeNumber.toUpperCase());
    
    // Strict password check
    if (user && user.accessKey === accessKey && user.active) {
        localStorage.setItem(KEYS.CURRENT_USER_ID, user.id);
        return true;
    }
    return false;
};

export const logoutUser = () => {
    localStorage.removeItem(KEYS.CURRENT_USER_ID);
};

export const updateUserPassword = (employeeId: string, newKey: string) => {
    const employees = getEmployees();
    const index = employees.findIndex(e => e.id === employeeId);
    if (index !== -1) {
        employees[index].accessKey = newKey;
        setData(KEYS.EMPLOYEES, employees);
        return true;
    }
    return false;
};

// --- External API Simulation ---
export const fetchDesignData = async (designId: string): Promise<DesignData> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
        id: designId,
        version: `v1.0`,
        lastUpdated: new Date().toISOString(),
        status: 'Approved',
        thumbnailUrl: `https://picsum.photos/200/200`
    };
};

// --- Initial Seed ---
export const seedDatabase = () => {
    const employees = getEmployees();
    
    // Check if Superackito exists
    const superExists = employees.find(e => e.employeeNumber === 'Superackito');
    
    if (!superExists || employees.length === 0) {
        console.log("Reinicializando base de datos de usuarios...");
        
        const initialUsers: Employee[] = [
            {
                id: 'super-dev-001',
                employeeNumber: 'Superackito',
                fullName: 'Superackito Dev',
                role: EmployeeRole.DEVELOPER,
                shift: 'Morning',
                joinDate: '2023-01-01',
                active: true,
                skills: [],
                certifications: [],
                accessKey: 'Rackito100'
            },
            {
                id: 'prod-main-01',
                employeeNumber: 'PROD-001',
                fullName: 'Jefe de Producción',
                role: EmployeeRole.PRODUCTION_MANAGER,
                shift: 'Morning',
                joinDate: '2023-02-01',
                active: true,
                skills: [],
                certifications: [],
                accessKey: 'PROD-123'
            },
            {
                id: 'qa-main-01',
                employeeNumber: 'QA-001',
                fullName: 'Encargado de Calidad',
                role: EmployeeRole.QUALITY_MANAGER,
                shift: 'Morning',
                joinDate: '2023-03-01',
                active: true,
                skills: [],
                certifications: [],
                accessKey: 'CAL-456'
            },
            {
                id: 'dir-main-01',
                employeeNumber: 'DIR-001',
                fullName: 'Director General',
                role: EmployeeRole.DIRECTOR,
                shift: 'Morning',
                joinDate: '2023-01-01',
                active: true,
                skills: [],
                certifications: [],
                accessKey: 'DIR-777'
            }
        ];
        setData(KEYS.EMPLOYEES, initialUsers);
    }
};