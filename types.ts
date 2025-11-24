

// --- Enums ---
export enum ProcessType {
    CUTTING = 'Corte',
    BENDING = 'Doblado',
    WELDING = 'Soldadura',
    ASSEMBLY = 'Ensamble',
    PAINTING = 'Pintura',
    PACKING = 'Empaque'
}

export enum OrderStatus {
    PENDING = 'Pendiente',
    IN_PROGRESS = 'En Proceso',
    PAUSED = 'Pausada',
    COMPLETED = 'Completada',
    DELIVERED = 'Entregada',
    CANCELED = 'Cancelada'
}

export enum ProcessStatus {
    PENDING = 'Pendiente',
    ACTIVE = 'Activo',
    PAUSED = 'Pausado',
    COMPLETED = 'Completado'
}

export enum EmployeeRole {
    DEVELOPER = 'Desarrollador',
    DIRECTOR = 'Director General',
    PRODUCTION_MANAGER = 'Jefe de Producción',
    QUALITY_MANAGER = 'Calidad',
    ASSISTANT = 'Asistente de Director'
}

// --- Interfaces ---

export interface DesignData {
    id: string;
    version: string;
    lastUpdated: string;
    status: 'Approved' | 'Pending' | 'Revision';
    thumbnailUrl?: string;
}

export interface ProcessStep {
    id: string;
    type: ProcessType;
    status: ProcessStatus;
    startTime?: string;
    endTime?: string;
    pausedTimeTotal: number; // in minutes
    notes: string;
    assignedTo?: string; // Employee ID
}

export interface ProductionArticle {
    id: string;
    name: string;
    description: string;
    quantity: number;
    photos: string[]; // Simulated URLs or Base64
    pdfs: string[];   // Simulated URLs or Base64
}

export interface ProductionOrder {
    id: string;
    orderNumber: string;
    projectName: string; // Previously client, now project name
    client: string;      // Kept for backward compatibility
    
    // New Fields
    receptionDate: string;
    managerId: string;   // Employee ID
    articles: ProductionArticle[];
    
    designId: string;
    designVersion: string; 
    priority: 'High' | 'Medium' | 'Low';
    dueDate: string; // Estimated delivery date
    status: OrderStatus;
    
    processes: ProcessStep[];
    materials: MaterialItem[]; // Kept for MVP compatibility
    createdAt: string;
    evidenceLogs: EvidenceLog[];
}

export interface MaterialItem {
    id: string;
    name: string;
    description?: string; // Added to satisfy usage in some contexts
    requiredQty: number;
    inStock: boolean;
}

export interface EvidenceLog {
    id: string;
    timestamp: string;
    note: string;
    imageUrl?: string;
    user: string;
}

export type ILUOLevel = 'I' | 'L' | 'U' | 'O' | '-';

export interface Employee {
    id: string;
    employeeNumber: string;
    fullName: string;
    role: EmployeeRole;
    shift: 'Morning' | 'Afternoon' | 'Night';
    joinDate: string;
    photoUrl?: string;
    skills: EmployeeSkill[];
    certifications: Certification[];
    active: boolean;
    accessKey?: string; // Credential/Password
}

export interface EmployeeSkill {
    skillName: string;
    level: ILUOLevel; 
}

export interface Certification {
    name: string;
    issueDate: string;
    expiryDate: string;
}

export interface AttendanceRecord {
    id: string;
    employeeId: string;
    date: string;
    status: 'Present' | 'Late' | 'Absent' | 'Excused';
    checkInTime?: string;
    checkOutTime?: string;
}

export interface DailyLog {
    id: string;
    date: string;
    supervisor: string;
    shift: string;
    progressSummary: string;
    incidents: string;
    absenteeism: string[]; // List of names
    materialsMissing: string;
    productionCount: number;
    efficiency: number; // Percentage
}

// --- New Incident Module ---
export enum IncidentType {
    SAFETY = 'Seguridad',
    QUALITY = 'Calidad',
    MACHINERY = 'Maquinaria',
    MATERIAL = 'Material',
    DELAY = 'Retraso',
    OTHER = 'Otro'
}

export interface Incident {
    id: string;
    date: string;
    area: string;
    type: IncidentType;
    description: string;
    orderId?: string; // Associated Production Order ID (Optional)
    responsible: string;
    reportedBy?: string;
    status: 'Open' | 'Resolved';
}

// --- Mock Data Initializers ---
export const PROCESS_FLOW_DEFAULT = [
    ProcessType.CUTTING,
    ProcessType.BENDING,
    ProcessType.WELDING,
    ProcessType.PAINTING,
    ProcessType.ASSEMBLY,
    ProcessType.PACKING
];

export const SKILL_CATALOG = [
    'Corte',
    'Doblez Tipo 1',
    'Doblez Tipo 2',
    'Doblez Tipo 3',
    'Troquelado 1',
    'Troquelado 2',
    'Troquelado 3',
    'Pailería',
    'Corte Láser',
    'Pintura Electrostática'
];