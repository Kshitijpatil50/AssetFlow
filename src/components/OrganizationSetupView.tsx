import React, { useState } from 'react';
import { 
  Building2, Tags, Users2, Plus, Edit2, ShieldCheck, CheckCircle, 
  XCircle, Trash2, ShieldAlert, UserCheck
} from 'lucide-react';
import { Department, AssetCategory, Employee, CustomFieldConfig, EmployeeRole } from '../types';

interface OrganizationSetupViewProps {
  currentUser: Employee;
  departments: Department[];
  categories: AssetCategory[];
  employees: Employee[];
  onAddDepartment: (name: string, code: string, headId: string | null, parentId: string | null) => void;
  onUpdateDepartment: (id: string, name: string, code: string, headId: string | null, parentId: string | null, status: 'Active' | 'Inactive') => void;
  onAddCategory: (name: string, fields: CustomFieldConfig[]) => void;
  onUpdateCategory: (id: string, name: string, fields: CustomFieldConfig[], status: 'Active' | 'Inactive') => void;
  onUpdateEmployee: (empId: string, role: EmployeeRole, deptId: string | null, status: 'Active' | 'Inactive') => void;
}

export default function OrganizationSetupView({
  currentUser,
  departments,
  categories,
  employees,
  onAddDepartment,
  onUpdateDepartment,
  onAddCategory,
  onUpdateCategory,
  onUpdateEmployee,
}: OrganizationSetupViewProps) {
  const [activeTab, setActiveTab] = useState<'departments' | 'categories' | 'employees'>('departments');

  // Modals / Form States
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', headEmployeeId: '', parentDepartmentId: '', status: 'Active' as const });

  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<AssetCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [customFields, setCustomFields] = useState<CustomFieldConfig[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date'>('text');
  const [newFieldReq, setNewFieldReq] = useState(false);

  const [showEmpModal, setShowEmpModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [empForm, setEmpForm] = useState({ role: 'Employee' as EmployeeRole, departmentId: '', status: 'Active' as 'Active' | 'Inactive' });

  // 1. Departments Handler
  const openDeptModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({
        name: dept.name,
        code: dept.code,
        headEmployeeId: dept.headEmployeeId || '',
        parentDepartmentId: dept.parentDepartmentId || '',
        status: dept.status
      });
    } else {
      setEditingDept(null);
      setDeptForm({ name: '', code: '', headEmployeeId: '', parentDepartmentId: '', status: 'Active' });
    }
    setShowDeptModal(true);
  };

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hId = deptForm.headEmployeeId || null;
    const pId = deptForm.parentDepartmentId || null;

    if (editingDept) {
      onUpdateDepartment(editingDept.id, deptForm.name, deptForm.code, hId, pId, deptForm.status);
    } else {
      onAddDepartment(deptForm.name, deptForm.code, hId, pId);
    }
    setShowDeptModal(false);
  };

  // 2. Categories Custom Fields Builder
  const addCustomFieldToDraft = () => {
    if (!newFieldName.trim()) return;
    setCustomFields([
      ...customFields,
      { name: newFieldName.trim(), type: newFieldType, required: newFieldReq }
    ]);
    setNewFieldName('');
    setNewFieldReq(false);
  };

  const removeCustomFieldFromDraft = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const openCatModal = (cat?: AssetCategory) => {
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name);
      setCustomFields(cat.customFields || []);
    } else {
      setEditingCat(null);
      setCatName('');
      setCustomFields([]);
    }
    setShowCatModal(true);
  };

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCat) {
      onUpdateCategory(editingCat.id, catName, customFields, editingCat.status);
    } else {
      onAddCategory(catName, customFields);
    }
    setShowCatModal(false);
  };

  // 3. Employee Directories Handler
  const openEmpModal = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpForm({
      role: emp.role,
      departmentId: emp.departmentId || '',
      status: emp.status
    });
    setShowEmpModal(true);
  };

  const handleEmpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    const dId = empForm.departmentId || null;
    onUpdateEmployee(editingEmp.id, empForm.role, dId, empForm.status);
    setShowEmpModal(false);
  };

  // Helper getters
  const getEmployeeName = (id: string | null) => {
    if (!id) return 'Unassigned';
    return employees.find(e => e.id === id)?.name || 'Unknown Employee';
  };

  const getDeptName = (id: string | null) => {
    if (!id) return 'None (Root)';
    return departments.find(d => d.id === id)?.name || 'Unknown Department';
  };

  return (
    <div className="space-y-6" id="org-setup-container">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-700 gap-1" id="org-setup-tabs">
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'departments' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-departments"
        >
          <Building2 className="w-4 h-4" />
          <span>Tab A — Departments</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'categories' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-categories"
        >
          <Tags className="w-4 h-4" />
          <span>Tab B — Asset Categories</span>
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'employees' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-employees"
        >
          <Users2 className="w-4 h-4" />
          <span>Tab C — Employee Directory</span>
        </button>
      </div>

      {/* TAB A: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="space-y-4" id="setup-departments-panel">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Department Setup</h2>
              <p className="text-xs text-slate-400">Create, configure, and assign leaders to organizational units.</p>
            </div>
            <button
              onClick={() => openDeptModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition cursor-pointer"
              id="add-dept-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Create Department</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm" id="departments-table">
              <thead className="bg-slate-800/60 text-slate-400 text-xs font-medium uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Code</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Department Head</th>
                  <th className="p-4">Parent Unit</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {departments.map(dept => (
                  <tr key={dept.id} className="hover:bg-slate-800/20">
                    <td className="p-4 font-mono font-bold text-indigo-400">{dept.code}</td>
                    <td className="p-4 font-semibold text-white">{dept.name}</td>
                    <td className="p-4">{getEmployeeName(dept.headEmployeeId)}</td>
                    <td className="p-4 text-slate-400">{getDeptName(dept.parentDepartmentId)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                        dept.status === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {dept.status === 'Active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {dept.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openDeptModal(dept)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB B: ASSET CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4" id="setup-categories-panel">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Asset Classification & Fields</h2>
              <p className="text-xs text-slate-400">Classify physical resources and configure specific schema requirements.</p>
            </div>
            <button
              onClick={() => openCatModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition cursor-pointer"
              id="add-cat-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Create Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-white text-md">{cat.name}</h3>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      cat.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {cat.status}
                    </span>
                  </div>
                  <button
                    onClick={() => openCatModal(cat)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custom Schema Fields</p>
                  {cat.customFields.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No specific custom fields assigned.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {cat.customFields.map((field, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg">
                          <span className="font-mono text-[10px] text-indigo-400">{field.type}</span>
                          <strong>{field.name}</strong>
                          {field.required && <span className="text-rose-500 text-[10px] font-bold">*</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB C: EMPLOYEE DIRECTORY & ROLE MANAGEMENT */}
      {activeTab === 'employees' && (
        <div className="space-y-4" id="setup-employees-panel">
          <div>
            <h2 className="text-lg font-semibold text-white">Employee Directory & Access Control</h2>
            <p className="text-xs text-slate-400">
              Review company workers. Promote employees to <strong className="text-slate-300">Asset Managers</strong> or <strong className="text-slate-300">Department Heads</strong>.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm" id="employees-table">
              <thead className="bg-slate-800/60 text-slate-400 text-xs font-medium uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Security Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-800/20">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                          {emp.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-white">{emp.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs">{emp.email}</td>
                    <td className="p-4 text-slate-300">{getDeptName(emp.departmentId)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                        emp.role === 'Admin' 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                          : emp.role === 'Asset Manager'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          : emp.role === 'Department Head'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-700/30 text-slate-300 border-slate-700/50'
                      }`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        emp.status === 'Active' ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Active' ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEmpModal(emp)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:border-indigo-500/60 bg-indigo-500/5 transition flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Authorize</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEPARTMENT CREATION/EDITION MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-md">
                {editingDept ? 'Modify Department' : 'Create Department'}
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            <form onSubmit={handleDeptSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Creative Marketing"
                  value={deptForm.name}
                  onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Code (Caps)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MKT"
                    value={deptForm.code}
                    onChange={e => setDeptForm({ ...deptForm, code: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Status</label>
                  <select
                    value={deptForm.status}
                    onChange={e => setDeptForm({ ...deptForm, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Department Head (Leader)</label>
                <select
                  value={deptForm.headEmployeeId}
                  onChange={e => setDeptForm({ ...deptForm, headEmployeeId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- No Leader Assigned --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Parent Unit (Optional Hierarchy)</label>
                <select
                  value={deptForm.parentDepartmentId}
                  onChange={e => setDeptForm({ ...deptForm, parentDepartmentId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">None (Top Level)</option>
                  {departments.filter(d => d.id !== editingDept?.id).map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
                >
                  {editingDept ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY CREATION/EDITION MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-md">
                {editingCat ? 'Modify Category' : 'Create Asset Category'}
              </h3>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            <form onSubmit={handleCatSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Category Classification Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laptops & Handhelds"
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Dynamic Draft Custom Field Section */}
              <div className="border border-slate-800/80 rounded-xl p-4 bg-slate-900/60 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Define Asset Specifications (Custom Schema)</p>
                
                {/* Custom Fields Draft List */}
                {customFields.length === 0 ? (
                  <p className="text-xs text-slate-500 italic pb-2">No spec fields declared yet. Create fields like "Warranty Period" or "Model Number" below.</p>
                ) : (
                  <div className="space-y-2 pb-2">
                    {customFields.map((field, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{field.type}</span>
                          <span className="font-semibold text-white">{field.name}</span>
                          {field.required && <span className="text-rose-500 font-bold">(Required)</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCustomFieldFromDraft(idx)}
                          className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Custom Field Sub-form */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-3 border-t border-slate-800/40">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Field Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Serial Model"
                      value={newFieldName}
                      onChange={e => setNewFieldName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Data Type</label>
                    <select
                      value={newFieldType}
                      onChange={e => setNewFieldType(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none"
                    >
                      <option value="text">text</option>
                      <option value="number">number</option>
                      <option value="date">date</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-2 h-9">
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFieldReq}
                        onChange={e => setNewFieldReq(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span>Required?</span>
                    </label>
                    <button
                      type="button"
                      onClick={addCustomFieldToDraft}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md cursor-pointer"
                    >
                      Add Spec
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
                >
                  {editingCat ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUTHORIZE EMPLOYEE RBAC ELEVATION MODAL */}
      {showEmpModal && editingEmp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-md flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Adjust Authorizations</span>
              </h3>
              <button onClick={() => setShowEmpModal(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            <form onSubmit={handleEmpSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                <p className="text-slate-400">Worker Profile: <strong className="text-white">{editingEmp.name}</strong></p>
                <p className="text-slate-400">Registered Email: <span className="font-mono text-indigo-400">{editingEmp.email}</span></p>
              </div>

              {/* RBAC Promotion Field */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Assign System Role</label>
                <select
                  value={empForm.role}
                  onChange={e => setEmpForm({ ...empForm, role: e.target.value as EmployeeRole })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Employee">Employee (Standard workspace access)</option>
                  <option value="Department Head">Department Head (Approve department transfers)</option>
                  <option value="Asset Manager">Asset Manager (Register and allocate all assets)</option>
                  <option value="Admin">Admin (Full administrative & setup permissions)</option>
                </select>
                <p className="text-[10px] text-slate-500 italic mt-1">
                  Only Administrators have authorization to promote roles. Workers cannot self-promote.
                </p>
              </div>

              {/* Department Assignment */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Assign Department</label>
                <select
                  value={empForm.departmentId}
                  onChange={e => setEmpForm({ ...empForm, departmentId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- No Department Assigned --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              {/* Status Assignment */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Account Status</label>
                <select
                  value={empForm.status}
                  onChange={e => setEmpForm({ ...empForm, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive (Blocks system logins)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEmpModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
                >
                  Save Authorizations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
