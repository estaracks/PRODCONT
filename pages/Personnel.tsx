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
        <div className="p-4 md:p-8 pb-32">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Personal</h2>
                    <p className="text-sm text-slate-500">Directorio y Matriz de Habilidades</p>
                </div>
                
                <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                     <div className="bg-white border rounded-lg p-1 flex shadow-sm w-full sm:w-auto">
                        <button onClick={() => setTab('list')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded text-sm transition-all ${tab === 'list' ? 'bg-blue-600 text-white font-bold shadow' : 'text-slate-500 hover:bg-slate-50'}`}>Lista</button>
                        <button onClick={() => setTab('skills')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded text-sm transition-all ${tab === 'skills' ? 'bg-blue-600 text-white font-bold shadow' : 'text-slate-500 hover:bg-slate-50'}`}>Habilidades</button>
                     </div>
                     
                     {canManageUsers && (
                        <button onClick={() => setShowAddModal(true)} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors shadow-sm">
                            <UserPlus size={16} />
                            <span className="text-sm font-bold">Nuevo</span>
                        </button>
                     )}
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
                                    <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Rol</th>
                                    <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Acceso</th>
                                    {canManageUsers && <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {employees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-slate-50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                                                    emp.role === EmployeeRole.DEVELOPER ? 'bg-purple-600' :
                                                    emp.role === EmployeeRole.DIRECTOR ? 'bg-slate-800' : 'bg-blue-500'
                                                }`}>
                                                    {emp.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{emp.fullName}</p>
                                                    <p className="text-[10px] text-slate-500">{emp.employeeNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs font-semibold text-slate-600">{emp.role}</span>
                                        </td>
                                        <td className="p-4 text-sm font-mono">
                                            {isDeveloper ? (
                                                <span className="text-slate-600 bg-slate-100 px-2 py-1 rounded">{emp.accessKey || '-'}</span>
                                            ) : (
                                                <span className="text-slate-300 flex items-center gap-1"><Shield size={12} /> ***</span>
                                            )}
                                        </td>
                                        {canManageUsers && (
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setPasswordModalUser(emp)} className="text-amber-500 hover:bg-amber-50 p-2 rounded-lg transition-colors" title="Cambiar Pass"><Key size={16} /></button>
                                                    {emp.role !== EmployeeRole.DEVELOPER && (
                                                        <button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {employees.map(emp => (
                            <div key={emp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm ${
                                        emp.role === EmployeeRole.DEVELOPER ? 'bg-purple-600' :
                                        emp.role === EmployeeRole.DIRECTOR ? 'bg-slate-800' : 'bg-blue-500'
                                    }`}>
                                        {emp.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{emp.fullName}</p>
                                        <p className="text-xs text-slate-500 font-medium mb-1">{emp.employeeNumber}</p>
                                        <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase">{emp.role}</span>
                                    </div>
                                </div>
                                
                                {canManageUsers && (
                                    <div className="flex flex-col gap-2">
                                         <button onClick={() => setPasswordModalUser(emp)} className="text-amber-500 bg-amber-50 p-2 rounded-lg" title="Cambiar Contraseña"><Key size={18} /></button>
                                         {emp.role !== EmployeeRole.DEVELOPER && (
                                             <button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-500 bg-red-50 p-2 rounded-lg" title="Eliminar"><Trash2 size={18} /></button>
                                         )}
                                    </div>
                                )}
                            </div>
                        ))}
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
                                     </div>
                                 </div>
                                 {canManageUsers && (
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

            {/* Add User Modal */}
            {showAddModal && canManageUsers && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                        <h3 className="text-lg font-bold mb-4 text-slate-800">Alta de Usuario</h3>
                        <form onSubmit={handleAddEmployee} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                                <input required className="w-full border-2 border-slate-100 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors" value={newName} onChange={e => setNewName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol</label>
                                <select className="w-full border-2 border-slate-100 rounded-lg p-2.5 bg-slate-50 focus:bg-white outline-none" value={newRole} onChange={e => setNewRole(e.target.value as EmployeeRole)}>
                                    <option value={EmployeeRole.PRODUCTION_MANAGER}>Jefe de Producción</option>
                                    <option value={EmployeeRole.QUALITY_MANAGER}>Calidad</option>
                                    <option value={EmployeeRole.ASSISTANT}>Asistente</option>
                                    <option value={EmployeeRole.DIRECTOR}>Director</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña</label>
                                <input required className="w-full border-2 border-slate-100 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" value={newKey} onChange={e => setNewKey(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">Guardar Usuario</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {passwordModalUser && isDeveloper && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-1">Cambiar Contraseña</h3>
                        <p className="text-xs text-slate-500 mb-4 uppercase font-bold tracking-wide">{passwordModalUser.fullName}</p>
                        <form onSubmit={handlePasswordChange}>
                            <div className="mb-6">
                                <input required placeholder="Nueva Contraseña" className="w-full border-2 border-slate-100 rounded-lg p-3 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none" value={newPasswordInput} onChange={e => setNewPasswordInput(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setPasswordModalUser(null)} className="px-4 py-2 text-slate-500 font-bold text-sm">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-amber-500 text-white font-bold text-sm rounded-lg hover:bg-amber-600 shadow-lg shadow-amber-500/30">Actualizar</button>
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
                            <h3 className="font-bold text-slate-800">Evaluación ILUO</h3>
                            <button onClick={() => setEditingEmployee(null)} className="bg-slate-200 p-1 rounded-full"><X size={18} /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4 space-y-3">
                            {tempSkills.map((skill) => (
                                <div key={skill.skillName} className="flex flex-col gap-2 bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                    <span className="font-bold text-slate-700 text-sm">{skill.skillName}</span>
                                    <div className="flex gap-1">
                                        {['-', 'I', 'L', 'U', 'O'].map((lvl) => (
                                            <button key={lvl} onClick={() => updateSkillLevel(skill.skillName, lvl as ILUOLevel)} disabled={!canManageUsers}
                                                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${skill.level === lvl ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                                                {lvl === '-' ? 'N/A' : lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
                            {canManageUsers && <button onClick={saveSkills} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"><Save size={18} /> Guardar Evaluación</button>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Personnel;