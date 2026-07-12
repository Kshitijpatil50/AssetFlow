import React, { useState } from 'react';
import { 
  ClipboardCheck, Plus, CheckCircle, AlertTriangle, ShieldCheck, 
  Search, Lock, Eye, CheckSquare, RefreshCw, EyeOff
} from 'lucide-react';
import { Asset, Employee, Department, AuditCycle, AuditItem } from '../types';

interface AuditViewProps {
  currentUser: Employee;
  assets: Asset[];
  departments: Department[];
  employees: Employee[];
  audits: AuditCycle[];
  auditItems: AuditItem[];
  onCreateAuditCycle: (
    scopeDeptId: string | null, scopeLocation: string | null, 
    start: string, end: string, auditors: string[]
  ) => void;
  onSaveAuditVerdict: (itemId: string, verdict: AuditItem['verdict'], notes: string) => void;
  onCloseAuditCycle: (cycleId: string) => { success: boolean; discrepancyCount: number };
}

export default function AuditView({
  currentUser,
  assets,
  departments,
  employees,
  audits,
  auditItems,
  onCreateAuditCycle,
  onSaveAuditVerdict,
  onCloseAuditCycle,
}: AuditViewProps) {
  const isManagerOrAdmin = currentUser.role === 'Asset Manager' || currentUser.role === 'Admin';
  const isAdmin = currentUser.role === 'Admin';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState(audits[0]?.id || '');

  // Cycle Creation Form State
  const [scopeDeptId, setScopeDeptId] = useState('');
  const [scopeLocation, setScopeLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [selectedAuditors, setSelectedAuditors] = useState<string[]>([]);

  // Selected audit cycle details
  const activeCycle = audits.find(c => c.id === selectedCycleId);
  const activeCycleItems = auditItems.filter(item => item.auditCycleId === selectedCycleId);
  
  // Scoped discrepancy report (computed dynamically before close)
  const discrepancyItems = activeCycleItems.filter(i => i.verdict === 'Missing' || i.verdict === 'Damaged');

  // Submit Audit Cycle Creation
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAuditors.length === 0) {
      alert('Please assign at least one auditor.');
      return;
    }
    onCreateAuditCycle(
      scopeDeptId || null,
      scopeLocation || null,
      startDate,
      endDate || startDate,
      selectedAuditors
    );
    setShowCreateModal(false);
  };

  // Close Cycle Handler
  const handleCloseCycle = () => {
    if (!activeCycle) return;
    const confirmClose = window.confirm(`Are you sure you want to CLOSE this audit cycle? This action is irreversible, will lock all verdicts, and update matching asset statuses (e.g., set Missing items to Lost).`);
    if (confirmClose) {
      const res = onCloseAuditCycle(activeCycle.id);
      if (res.success) {
        alert(`Audit Cycle closed successfully! Processed discrepancies: ${res.discrepancyCount}.`);
      }
    }
  };

  // Helpers
  const getAssetName = (id: string) => {
    const asset = assets.find(a => a.id === id);
    return asset ? `[${asset.assetTag}] ${asset.name}` : 'Unknown';
  };

  const getAssetLocation = (id: string) => assets.find(a => a.id === id)?.location || 'Unspecified';

  const getDeptName = (id: string | null) => {
    if (!id) return 'Company-wide';
    return departments.find(d => d.id === id)?.name || 'Unknown Department';
  };

  const getAuditorsNames = (ids: string[]) => {
    return ids.map(id => employees.find(e => e.id === id)?.name || id).join(', ');
  };

  const isAssignedAuditor = activeCycle?.auditorIds.includes(currentUser.id) || isManagerOrAdmin;

  return (
    <div className="space-y-6" id="audit-view-container">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="audit-header">
        <div>
          <h2 className="text-lg font-semibold text-white">Stocktaking & Asset Audits</h2>
          <p className="text-xs text-slate-400">Establish formal physical audit periods, audit scoped gear, and resolve discrepancy logs.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setScopeDeptId('');
              setScopeLocation('');
              setStartDate(new Date().toISOString().split('T')[0]);
              setEndDate('');
              setSelectedAuditors([currentUser.id]);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
            id="create-audit-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Audit Cycle</span>
          </button>
        )}
      </div>

      {/* Select active audit cycles */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl" id="select-cycle-panel">
        <label className="text-xs text-slate-400 font-bold uppercase shrink-0">Inspect Audit Cycle</label>
        <select
          value={selectedCycleId}
          onChange={e => setSelectedCycleId(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none flex-1 max-w-sm"
        >
          <option value="">-- Select Audit Cycle --</option>
          {audits.map(c => (
            <option key={c.id} value={c.id}>
              {getDeptName(c.scopeDepartmentId)} {c.scopeLocation ? `(${c.scopeLocation})` : ''} — {c.dateRangeStart} to {c.dateRangeEnd} [{c.status}]
            </option>
          ))}
        </select>
      </div>

      {activeCycle ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="active-audit-workspace">
          
          {/* LEFT: AUDIT CYCLE OVERVIEW & DISCREPANCY RECONCILIATION */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-semibold text-white text-md">Cycle Summary</h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  activeCycle.status === 'Open' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                }`}>
                  {activeCycle.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <p>Scope Department: <strong className="text-slate-300">{getDeptName(activeCycle.scopeDepartmentId)}</strong></p>
                {activeCycle.scopeLocation && <p>Scope Location: <strong className="text-slate-300">{activeCycle.scopeLocation}</strong></p>}
                <p>Date Window: <span className="font-mono text-slate-300">{activeCycle.dateRangeStart} to {activeCycle.dateRangeEnd}</span></p>
                <p>Authorized Auditors: <span className="text-slate-300">{getAuditorsNames(activeCycle.auditorIds)}</span></p>
              </div>

              {activeCycle.status === 'Open' && isAdmin && (
                <button
                  onClick={handleCloseCycle}
                  className="w-full text-center py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock & Close Audit Cycle</span>
                </button>
              )}
            </div>

            {/* LIVE DISCREPANCY REPORT */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-white text-sm">Discrepancy Report</h3>
              </div>

              {discrepancyItems.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">No missing or damaged stock flagged under this cycle.</p>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {discrepancyItems.map(item => (
                    <div key={item.id} className="p-3 bg-rose-500/5 rounded-lg border border-rose-500/10 text-[11px] space-y-1">
                      <p className="font-bold text-rose-300 truncate">{getAssetName(item.assetId)}</p>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Verdict:</span>
                        <span className="font-semibold text-rose-400 uppercase">{item.verdict}</span>
                      </div>
                      {item.notes && <p className="text-slate-400 italic">"{item.notes}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: SCRUTINY OF INDIVIDUAL ASSETS */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <ClipboardCheck className="w-4 h-4 text-indigo-400" />
              <span>Inspection Register ({activeCycleItems.length} Scoped Items)</span>
            </h3>

            {activeCycleItems.length === 0 ? (
              <p className="text-sm text-slate-500 py-12 text-center bg-slate-900 border border-slate-800 rounded-xl">No assets found in scope for this audit cycle.</p>
            ) : (
              <div className="space-y-3">
                {activeCycleItems.map(item => {
                  const isClosed = activeCycle.status === 'Closed';
                  const canEdit = isAssignedAuditor && !isClosed;

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <h4 className="font-semibold text-white text-sm">{getAssetName(item.assetId)}</h4>
                        <p className="text-xs text-slate-500">Storage Location: {getAssetLocation(item.assetId)}</p>
                        
                        {/* Notes input or display */}
                        {canEdit ? (
                          <input
                            type="text"
                            placeholder="Type auditor findings notes here..."
                            value={item.notes === 'Awaiting inspection.' ? '' : item.notes}
                            onChange={e => onSaveAuditVerdict(item.id, item.verdict, e.target.value)}
                            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-md p-2 text-xs text-slate-300 focus:outline-none"
                          />
                        ) : (
                          <p className="text-xs text-slate-400 italic">Notes: "{item.notes}"</p>
                        )}
                      </div>

                      <div className="flex flex-row sm:flex-col gap-2 shrink-0 items-end">
                        {canEdit ? (
                          <div className="flex gap-1.5">
                            {(['Verified', 'Missing', 'Damaged'] as const).map(verd => (
                              <button
                                key={verd}
                                type="button"
                                onClick={() => onSaveAuditVerdict(item.id, verd, item.notes)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition cursor-pointer ${
                                  item.verdict === verd
                                    ? verd === 'Verified' 
                                      ? 'bg-emerald-600 border-emerald-500 text-white' 
                                      : verd === 'Missing'
                                      ? 'bg-rose-600 border-rose-500 text-white'
                                      : 'bg-amber-600 border-amber-500 text-white'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                }`}
                              >
                                {verd}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            item.verdict === 'Verified' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : item.verdict === 'Missing'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {item.verdict}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500">
          No audit cycle selected or registered yet. Use the header button to spawn a stocktake cycle.
        </div>
      )}

      {/* CREATE AUDIT CYCLE MODAL (Admin Only) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-md">
                Launch Corporate Audit Cycle
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Department Scope</label>
                  <select
                    value={scopeDeptId}
                    onChange={e => setScopeDeptId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                  >
                    <option value="">Company-wide (All departments)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Location Scope (Keyword)</label>
                  <input
                    type="text"
                    placeholder="e.g. Basement Parking"
                    value={scopeLocation}
                    onChange={e => setScopeLocation(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Start Window</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Close Deadline</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Auditors checkboxes */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase">Assign Stocktaking Auditors</label>
                <div className="border border-slate-800 bg-slate-950 p-3 rounded-lg space-y-2 max-h-[140px] overflow-y-auto">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAuditors.includes(emp.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedAuditors([...selectedAuditors, emp.id]);
                          } else {
                            setSelectedAuditors(selectedAuditors.filter(id => id !== emp.id));
                          }
                        }}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>{emp.name} ({emp.role})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
                >
                  Confirm & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
