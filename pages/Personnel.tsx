import React, { useState, useEffect } from 'react';
import { getEmployees, saveEmployee, deleteEmployee, getCurrentUser, updateUserPassword } from '../services/storageService';
import { Employee, EmployeeRole, SKILL_CATALOG, ILUOLevel, EmployeeSkill } from '../types';
import { UserPlus, Edit3, X, Save, Trash2, Shield, Key } from 'lucide-react';

const Personnel = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [currentUser, setCurrentUser] = useState<Employee | null>(null);
    const [tab, setTab] = useState<'list' | 'skills'>('list');
    
    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null); // For Skills
    const [passwordModalUser, setPasswordModalUser] = useState<Employee | null>(null); // For Password Change

    // Form States
    const [tempSkills, setTempSkills] = useState<EmployeeSkill[]>([]);
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState(EmployeeRole.PRODUCTION_MANAGER);
    const [newKey, setNewKey] = useState('');
    
    // Password Change State
    const [newPasswordInput, setNewPasswordInput] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setEmployees(getEmployees());
        setCurrentUser(getCurrentUser());
    };

    const isDeveloper = currentUser?.role === EmployeeRole.DEVELOPER;
    const canManageUsers = isDeveloper;

    const handleAddEmployee = (e: React.FormEvent) => {
        e.preventDefault();
        const newEmp: Employee = {
            id: crypto.randomUUID(),
            employeeNumber: `EMP-${Math.floor(Math.random() * 1000)}`,
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
        loadData();
        setShowAddModal(false);
        resetAddForm();
    };

    const resetAddForm = () => {
        setNewName('');
        setNewKey('');
    };

    const handleDeleteEmployee = (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este usuario?')) {
            deleteEmployee(id);
            loadData();
        }
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordModalUser && newPasswordInput) {
            updateUserPassword(passwordModalUser.id, newPasswordInput);
            alert(`Contraseña actualizada para ${passwordModalUser.fullName}`);
            setPasswordModalUser(null);
            setNewPasswordInput('');
            loadData();
        }
    };

    // Skill Matrix Logic
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
        <div className="p-4 md:p-8 pb-24">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Personal y Accesos</h2>
                    <p className="text-sm text-slate-500">Gestión de usuarios y matriz de habilidades</p>
                </div>
                
                <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                     <div className="bg-white border rounded-lg p-1 flex shadow-sm w-full sm:w-auto">
                        <button onClick={() => setTab('list')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-sm ${tab === 'list' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-500'}`}>Directorio</button>
                        <button onClick={() => setTab('skills')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-sm ${tab === 'skills' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-500'}`}>Matriz ILUO</button>
                     </div>
                     
                     {canManageUsers && (
                        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                            <UserPlus size={18} /> Alta Usuario
                        </button>
                     )}
                </div>
            </div>

            {tab === 'list' && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-4 font-medium text-slate-600 text-sm">Empleado</th>
                                    <th className="p-4 font-medium text-slate-600 text-sm hidden md:table-cell">Rol</th>
                                    <th className="p-4 font-medium text-slate-600 text-sm hidden lg:table-cell">Credencial</th>
                                    {canManageUsers && <th className="p-4 font-medium text-slate-600 text-sm text-right">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(emp => (
                                    <tr key={emp.id} className="border-b hover:bg-slate-50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                                                    emp.role === EmployeeRole.DEVELOPER ? 'bg-purple-600' :
                                                    emp.role === EmployeeRole.DIRECTOR ? 'bg-slate-800' : 'bg-blue-500'
                                                }`}>
                                                    {emp.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 text-sm">{emp.fullName}</p>
                                                    <p className="text-xs text-slate-500">{emp.employeeNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 hidden md:table-cell">
                                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">{emp.role}</span>
                                        </td>
                                        <td className="p-4 text-sm font-mono hidden lg:table-cell">
                                            {isDeveloper ? (
                                                <span className="text-slate-600 bg-slate-100 px-2 py-1 rounded">{emp.accessKey || '-'}</span>
                                            ) : (
                                                <span className="text-slate-400 flex items-center gap-1">
                                                    <Shield size={12} /> ************
                                                </span>
                                            )}
                                        </td>
                                        {canManageUsers && (
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => setPasswordModalUser(emp)}
                                                        className="text-amber-500 hover:bg-amber-50 p-1.5 rounded text-sm font-medium transition-colors"
                                                        title="Cambiar Contraseña"
                                                    >
                                                        <Key size={16} />
                                                    </button>
                                                    {emp.role !== EmployeeRole.DEVELOPER && (
                                                        <button 
                                                            onClick={() => handleDeleteEmployee(emp.id)}
                                                            className="text-red-500 hover:bg-red-50 p-1.5 rounded text-sm font-medium transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'skills' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {employees.map(emp => (
                         <div key={emp.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
                             <div className="flex items-center justify-between mb-4">
                                 <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                        {emp.fullName.charAt(0)}
                                     </div>
                                     <div>
                                         <h3 className="font-bold text-slate-800 text-sm leading-tight">{emp.fullName}</h3>
                                         <p className="text-[10px] text-slate-400">{emp.role}</p>
                                     </div>
                                 </div>
                                 {canManageUsers && (
                                     <button onClick={() => openSkillEditor(emp)} className="text-slate-400 hover:text-blue-600 p-1"><Edit3 size={18} /></button>
                                 )}
                             </div>
                             <div className="space-y-2 flex-1">
                                 {emp.skills.length > 0 ? emp.skills.map((skill, idx) => (
                                     <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded border border-slate-100">
                                         <span className="text-slate-700 text-xs font-medium">{skill.skillName}</span>
                                         <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getLevelColor(skill.level)}`}>{skill.level}</span>
                                     </div>
                                 )) : (
                                    <div className="text-center py-4 text-sm text-slate-400 bg-slate-50 rounded border border-dashed">Sin habilidades evaluadas.</div>
                                 )}
                             </div>
                         </div>
                     ))}
                 </div>
            )}

            {/* Add User Modal */}
            {showAddModal && canManageUsers && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Alta de Usuario</h3>
                        <form onSubmit={handleAddEmployee}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                                <input required className="w-full border p-2 rounded-lg" value={newName} onChange={e => setNewName(e.target.value)} />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Rol</label>
                                <select className="w-full border p-2 rounded-lg bg-white" value={newRole} onChange={e => setNewRole(e.target.value as EmployeeRole)}>
                                    <option value={EmployeeRole.PRODUCTION_MANAGER}>Jefe de Producción</option>
                                    <option value={EmployeeRole.QUALITY_MANAGER}>Calidad</option>
                                    <option value={EmployeeRole.ASSISTANT}>Asistente de Director</option>
                                    <option value={EmployeeRole.DIRECTOR}>Director General</option>
                                </select>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-1">Contraseña Inicial</label>
                                <input required className="w-full border p-2 rounded-lg" value={newKey} onChange={e => setNewKey(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {passwordModalUser && isDeveloper && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-1">Cambiar Contraseña</h3>
                        <p className="text-sm text-slate-500 mb-4">Usuario: {passwordModalUser.fullName}</p>
                        <form onSubmit={handlePasswordChange}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-1">Nueva Contraseña</label>
                                <input required className="w-full border p-2 rounded-lg" value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setPasswordModalUser(null)} className="px-4 py-2 text-slate-600 rounded-lg hover:bg-slate-100">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">Actualizar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Skill Matrix Editor Modal */}
            {editingEmployee && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <h3 className="text-lg font-bold text-slate-800">Editar Habilidades: {editingEmployee.fullName}</h3>
                            <button onClick={() => setEditingEmployee(null)}><X size={24} /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 space-y-3">
                            {tempSkills.map((skill) => (
                                <div key={skill.skillName} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border p-3 rounded-lg gap-3">
                                    <span className="font-medium text-slate-700 min-w-[150px]">{skill.skillName}</span>
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        {['-', 'I', 'L', 'U', 'O'].map((lvl) => (
                                            <button key={lvl} onClick={() => updateSkillLevel(skill.skillName, lvl as ILUOLevel)} disabled={!canManageUsers}
                                                className={`w-10 h-8 text-sm font-bold rounded transition-all ${skill.level === lvl ? 'bg-white shadow text-blue-600 border border-blue-100' : 'text-slate-400'}`}>
                                                {lvl === '-' ? '•' : lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-5 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
                            <button onClick={() => setEditingEmployee(null)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Cancelar</button>
                            {canManageUsers && <button onClick={saveSkills} className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"><Save size={18} /> Guardar</button>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Personnel;