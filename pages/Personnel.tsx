import React, { useState, useEffect } from 'react';
import { getEmployees, saveEmployee, getCurrentUser, deleteEmployee } from '../services/storageService';
import { Employee, EmployeeRole, SKILL_CATALOG, ILUOLevel, EmployeeSkill } from '../types';
import { Edit3, X, Save, Shield, UserPlus, Trash2 } from 'lucide-react';

const Personnel = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [currentUser, setCurrentUser] = useState<Employee | null>(null);
    const [tab, setTab] = useState<'list' | 'skills'>('list');
    
    // Modals
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null); // For Skills
    const [showAddModal, setShowAddModal] = useState(false); // For adding new floor staff

    // Add Staff Form
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState<EmployeeRole>(EmployeeRole.OPERATOR);
    const [newShift, setNewShift] = useState<'Morning'|'Afternoon'|'Night'>('Morning');
    const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);

    // Skill Form
    const [tempSkills, setTempSkills] = useState<EmployeeSkill[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const allEmployees = getEmployees();
        const user = getCurrentUser();
        
        // FILTER: Only show Operational/Floor staff. 
        // Exclude System Admins (Dev, Director, Managers who have login access).
        // Logic: If the role is strictly operational.
        const operationalRoles = [
            EmployeeRole.WELDER, 
            EmployeeRole.PAINTER, 
            EmployeeRole.OPERATOR, 
            EmployeeRole.ASSEMBLER, 
            EmployeeRole.WAREHOUSE
        ];
        
        // Show only operational roles OR anyone without an access key (legacy data)
        const floorStaff = allEmployees.filter(e => 
            operationalRoles.includes(e.role) || 
            (!e.accessKey && e.role !== EmployeeRole.DEVELOPER)
        );

        setEmployees(floorStaff);
        setCurrentUser(user);
    };

    const isDeveloper = currentUser?.role === EmployeeRole.DEVELOPER;
    const isProdManager = currentUser?.role === EmployeeRole.PRODUCTION_MANAGER;
    const canManageStaff = isDeveloper || isProdManager;

    // --- Actions ---

    const handleAddStaff = (e: React.FormEvent) => {
        e.preventDefault();
        const newEmp: Employee = {
            id: crypto.randomUUID(),
            employeeNumber: `OP-${Math.floor(Math.random() * 10000)}`,
            fullName: newName,
            role: newRole,
            shift: newShift,
            joinDate: newJoinDate,
            active: true,
            skills: [],
            certifications: [],
            // No access key for floor staff
        };
        saveEmployee(newEmp);
        loadData();
        setShowAddModal(false);
        resetForm();
    };

    const resetForm = () => {
        setNewName('');
        setNewRole(EmployeeRole.OPERATOR);
    };

    const handleDeleteStaff = (id: string, name: string) => {
        if(window.confirm(`¿Confirmas eliminar al empleado operativo: ${name}?`)) {
            deleteEmployee(id);
            loadData();
        }
    };

    // --- Skill Matrix Logic ---
    const openSkillEditor = (emp: Employee) => {
        const initializedSkills: EmployeeSkill[] = SKILL_CATALOG.map(cat => {
            const existing = emp.skills.find(s => s.skillName === cat);
            return existing ? { ...existing } : { skillName: cat, level: '-' };
        });
        setTempSkills(initializedSkills);
        setEditingEmployee(emp);
    };

    const updateSkillLevel = (skillName: string, level: ILUOLevel) => {
        setTempSkills(prev => prev.map(s => s.skillName === skillName ? { ...s, level } : s));
    };

    const saveSkills = () => {
        if (!editingEmployee) return;
        const validSkills = tempSkills.filter(s => s.level !== '-');
        const updatedEmp = { ...editingEmployee, skills: validSkills };
        saveEmployee(updatedEmp);
        loadData();
        setEditingEmployee(null);
    };

    const getLevelColor = (level: ILUOLevel) => {
        switch(level) {
            case 'I': return 'bg-red-100 text-red-800 border-red-200';
            case 'L': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'U': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'O': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-slate-50 text-slate-400 border-slate-200';
        }
    };

    return (
        <div className="p-4 md:p-8 pb-32">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Personal Operativo</h2>
                    <p className="text-sm text-slate-500">Gestión de operarios de planta y habilidades</p>
                </div>
                
                <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                     {canManageStaff && (
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-blue-700 w-full sm:w-auto"
                        >
                            <UserPlus size={16} /> Alta Personal
                        </button>
                     )}
                     <div className="bg-white border rounded-lg p-1 flex shadow-sm w-full sm:w-auto">
                        <button onClick={() => setTab('list')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded text-sm transition-all ${tab === 'list' ? 'bg-slate-800 text-white font-bold shadow' : 'text-slate-500 hover:bg-slate-50'}`}>Lista</button>
                        <button onClick={() => setTab('skills')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded text-sm transition-all ${tab === 'skills' ? 'bg-slate-800 text-white font-bold shadow' : 'text-slate-500 hover:bg-slate-50'}`}>Matriz ILUO</button>
                     </div>
                </div>
            </div>

            {tab === 'list' && (
                <>
                    {/* Desktop View */}
                    <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Empleado</th>
                                    <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Puesto / Rol</th>
                                    <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Turno</th>
                                    <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Ingreso</th>
                                    {canManageStaff && <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {employees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-slate-50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                                    {emp.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{emp.fullName}</p>
                                                    <p className="text-[10px] text-slate-500">{emp.employeeNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className="bg-blue-50 border border-blue-100 px-2 py-1 rounded text-xs font-semibold text-blue-700">{emp.role}</span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {emp.shift === 'Morning' ? 'Matutino' : emp.shift === 'Afternoon' ? 'Vespertino' : 'Nocturno'}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            {emp.joinDate}
                                        </td>
                                        {canManageStaff && (
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteStaff(emp.id, emp.fullName)}
                                                    className="text-slate-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {employees.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                            No hay personal operativo registrado. Usa "Alta Personal" para agregar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {employees.map(emp => (
                            <div key={emp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                                        {emp.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{emp.fullName}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-blue-50 text-blue-700 px-1.5 rounded text-[10px] font-bold uppercase">{emp.role}</span>
                                            <span className="text-xs text-slate-400">| {emp.shift}</span>
                                        </div>
                                    </div>
                                </div>
                                {canManageStaff && (
                                    <button 
                                        onClick={() => handleDeleteStaff(emp.id, emp.fullName)}
                                        className="text-slate-300 hover:text-red-500 p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                         {employees.length === 0 && (
                            <p className="text-center text-slate-400 py-6">No hay personal registrado.</p>
                        )}
                    </div>
                </>
            )}

            {tab === 'skills' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {employees.map(emp => (
                         <div key={emp.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
                             <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                                 <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                                        {emp.fullName.charAt(0)}
                                     </div>
                                     <div>
                                         <h3 className="font-bold text-slate-800 text-sm leading-tight">{emp.fullName}</h3>
                                         <p className="text-[10px] text-slate-500">{emp.role}</p>
                                     </div>
                                 </div>
                                 {canManageStaff && (
                                     <button onClick={() => openSkillEditor(emp)} className="text-blue-600 bg-blue-50 p-2 rounded-lg"><Edit3 size={16} /></button>
                                 )}
                             </div>
                             <div className="space-y-2 flex-1">
                                 {emp.skills.length > 0 ? emp.skills.map((skill, idx) => (
                                     <div key={idx} className="flex items-center justify-between text-sm">
                                         <span className="text-slate-600 text-xs font-medium">{skill.skillName}</span>
                                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getLevelColor(skill.level)}`}>{skill.level}</span>
                                     </div>
                                 )) : (
                                    <div className="text-center py-8 text-xs text-slate-400 italic">Sin evaluación ILUO.</div>
                                 )}
                             </div>
                         </div>
                     ))}
                 </div>
            )}

            {/* Add Staff Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Alta de Personal Operativo</h3>
                            <button onClick={() => setShowAddModal(false)}><X size={20} className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleAddStaff} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                                <input required className="w-full border-2 border-slate-100 rounded-lg p-2.5 bg-slate-50 focus:bg-white outline-none" 
                                    value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Juan Pérez" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Puesto / Rol</label>
                                <select className="w-full border-2 border-slate-100 rounded-lg p-2.5 bg-slate-50 focus:bg-white outline-none" 
                                    value={newRole} onChange={e => setNewRole(e.target.value as EmployeeRole)}>
                                    <option value={EmployeeRole.WELDER}>Soldador</option>
                                    <option value={EmployeeRole.PAINTER}>Pintor</option>
                                    <option value={EmployeeRole.ASSEMBLER}>Ensamblador</option>
                                    <option value={EmployeeRole.OPERATOR}>Operador General</option>
                                    <option value={EmployeeRole.WAREHOUSE}>Almacenista</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Turno</label>
                                    <select className="w-full border-2 border-slate-100 rounded-lg p-2.5 bg-slate-50 focus:bg-white outline-none"
                                        value={newShift} onChange={e => setNewShift(e.target.value as any)}>
                                        <option value="Morning">Matutino</option>
                                        <option value="Afternoon">Vespertino</option>
                                        <option value="Night">Nocturno</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Ingreso</label>
                                    <input type="date" required className="w-full border-2 border-slate-100 rounded-lg p-2.5 bg-slate-50 focus:bg-white outline-none"
                                        value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg text-sm">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow text-sm">Guardar Empleado</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Skill Matrix Editor Modal */}
            {editingEmployee && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-2 md:p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Evaluación ILUO: {editingEmployee.fullName}</h3>
                            <button onClick={() => setEditingEmployee(null)} className="bg-slate-200 p-1 rounded-full"><X size={18} /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4 space-y-3">
                            {tempSkills.map((skill) => (
                                <div key={skill.skillName} className="flex flex-col gap-2 bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                    <span className="font-bold text-slate-700 text-sm">{skill.skillName}</span>
                                    <div className="flex gap-1">
                                        {['-', 'I', 'L', 'U', 'O'].map((lvl) => (
                                            <button key={lvl} onClick={() => updateSkillLevel(skill.skillName, lvl as ILUOLevel)} disabled={!canManageStaff}
                                                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${skill.level === lvl ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                                                {lvl === '-' ? 'N/A' : lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
                            {canManageStaff && <button onClick={saveSkills} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"><Save size={18} /> Guardar Evaluación</button>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Personnel;