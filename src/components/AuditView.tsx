import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Plus, CheckCircle, AlertTriangle, ShieldCheck, 
  Search, Lock, Eye, CheckSquare, RefreshCw, EyeOff, Download,
  Mail, FileText, DollarSign, Check, Wrench, MapPin, User,
  Calendar, ArrowUpDown, Copy, ExternalLink, AlertCircle, Filter
} from 'lucide-react';
import { Asset, Employee, Department, AuditCycle, AuditItem, AssetCategory, Allocation } from '../types';

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
  categories?: AssetCategory[];
  allocations?: Allocation[];
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
  categories = [],
  allocations = [],
}: AuditViewProps) {
  const isManagerOrAdmin = currentUser.role === 'Asset Manager' || currentUser.role === 'Admin';
  const isAdmin = currentUser.role === 'Admin';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState(audits[0]?.id || '');
  const [auditSubTab, setAuditSubTab] = useState<'inspect' | 'discrepancy'>('inspect');

  // Cycle Creation Form State
  const [scopeDeptId, setScopeDeptId] = useState('');
  const [scopeLocation, setScopeLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [selectedAuditors, setSelectedAuditors] = useState<string[]>([]);

  // Advanced Discrepancy Filter State
  const [discSearch, setDiscSearch] = useState('');
  const [discVerdictFilter, setDiscVerdictFilter] = useState<'All' | 'Missing' | 'Damaged'>('All');
  const [discSortBy, setDiscSortBy] = useState<'cost-desc' | 'cost-asc' | 'tag' | 'verdict'>('cost-desc');
  const [selectedDiscId, setSelectedDiscId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Selected audit cycle details
  const activeCycle = audits.find(c => c.id === selectedCycleId);
  const activeCycleItems = auditItems.filter(item => item.auditCycleId === selectedCycleId);
  
  // Dynamic compilation of discrepancies (Missing or Damaged)
  const discrepancyItems = activeCycleItems.filter(i => i.verdict === 'Missing' || i.verdict === 'Damaged');

  // Set default selected discrepancy when activeCycle or discrepancyItems change
  useEffect(() => {
    if (discrepancyItems.length > 0) {
      setSelectedDiscId(discrepancyItems[0].id);
    } else {
      setSelectedDiscId(null);
    }
  }, [selectedCycleId, discrepancyItems.length]);

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

  // Statistics Computations
  const totalScopedItems = activeCycleItems.length;
  const missingCount = discrepancyItems.filter(i => i.verdict === 'Missing').length;
  const damagedCount = discrepancyItems.filter(i => i.verdict === 'Damaged').length;
  const verifiedCount = activeCycleItems.filter(i => i.verdict === 'Verified').length;
  const uninspectedCount = totalScopedItems - discrepancyItems.length - verifiedCount;

  const totalValueAtRisk = discrepancyItems.reduce((sum, item) => {
    const asset = assets.find(a => a.id === item.assetId);
    return sum + (asset?.acquisitionCost || 0);
  }, 0);

  const missingValue = discrepancyItems
    .filter(i => i.verdict === 'Missing')
    .reduce((sum, item) => {
      const asset = assets.find(a => a.id === item.assetId);
      return sum + (asset?.acquisitionCost || 0);
    }, 0);

  const damagedValue = discrepancyItems
    .filter(i => i.verdict === 'Damaged')
    .reduce((sum, item) => {
      const asset = assets.find(a => a.id === item.assetId);
      return sum + (asset?.acquisitionCost || 0);
    }, 0);

  const discrepancyRate = totalScopedItems > 0 
    ? ((discrepancyItems.length / totalScopedItems) * 100).toFixed(1) 
    : '0';

  // Selected discrepancy for detailed audit inspect card
  const selectedItem = auditItems.find(i => i.id === selectedDiscId);
  const selectedAsset = selectedItem ? assets.find(a => a.id === selectedItem.assetId) : null;
  const selectedCategory = selectedAsset ? categories.find(c => c.id === selectedAsset.categoryId) : null;

  // Retrieve Custodian Info for selected item
  let activeCustodianEmp: Employee | null = null;
  let activeCustodianDept: Department | null = null;
  if (selectedAsset) {
    const activeAlloc = allocations.find(
      al => al.assetId === selectedAsset.id && (al.status === 'Active' || al.status === 'Overdue')
    );
    if (activeAlloc) {
      if (activeAlloc.employeeId) {
        activeCustodianEmp = employees.find(e => e.id === activeAlloc.employeeId) || null;
      } else if (activeAlloc.departmentId) {
        activeCustodianDept = departments.find(d => d.id === activeAlloc.departmentId) || null;
      }
    }
  }

  // Filtered and Sorted Discrepancy List
  const filteredDiscrepancies = discrepancyItems
    .filter(item => {
      const asset = assets.find(a => a.id === item.assetId);
      if (!asset) return false;

      // Filter by type
      if (discVerdictFilter !== 'All' && item.verdict !== discVerdictFilter) return false;

      // Filter by search query
      const matchSearch = 
        asset.name.toLowerCase().includes(discSearch.toLowerCase()) ||
        asset.assetTag.toLowerCase().includes(discSearch.toLowerCase()) ||
        asset.location.toLowerCase().includes(discSearch.toLowerCase()) ||
        item.notes.toLowerCase().includes(discSearch.toLowerCase());

      return matchSearch;
    })
    .sort((a, b) => {
      const assetA = assets.find(ast => ast.id === a.assetId);
      const assetB = assets.find(ast => ast.id === b.assetId);
      if (!assetA || !assetB) return 0;

      if (discSortBy === 'cost-desc') {
        return (assetB.acquisitionCost || 0) - (assetA.acquisitionCost || 0);
      }
      if (discSortBy === 'cost-asc') {
        return (assetA.acquisitionCost || 0) - (assetB.acquisitionCost || 0);
      }
      if (discSortBy === 'tag') {
        return assetA.assetTag.localeCompare(assetB.assetTag);
      }
      if (discSortBy === 'verdict') {
        return a.verdict.localeCompare(b.verdict);
      }
      return 0;
    });

  // Export CSV Report
  const handleExportCSV = () => {
    if (discrepancyItems.length === 0) {
      alert("No discrepancies found in this cycle to export.");
      return;
    }
    
    let csvContent = "Asset Tag,Asset Name,Category,Location,Verdict,Acquisition Cost,Custodian Name,Custodian Email,Auditor Notes\n";
    
    discrepancyItems.forEach(item => {
      const asset = assets.find(a => a.id === item.assetId);
      const category = categories.find(c => c.id === asset?.categoryId)?.name || 'Unspecified';
      const cost = asset?.acquisitionCost || 0;
      
      let custodianName = 'N/A';
      let custodianEmail = 'N/A';
      if (asset) {
        const activeAlloc = allocations.find(
          al => al.assetId === asset.id && (al.status === 'Active' || al.status === 'Overdue')
        );
        if (activeAlloc) {
          if (activeAlloc.employeeId) {
            const emp = employees.find(e => e.id === activeAlloc.employeeId);
            if (emp) {
              custodianName = emp.name;
              custodianEmail = emp.email;
            }
          } else if (activeAlloc.departmentId) {
            const dept = departments.find(d => d.id === activeAlloc.departmentId);
            if (dept) {
              custodianName = `Dept: ${dept.name}`;
            }
          }
        }
      }
      
      const tag = asset?.assetTag || 'N/A';
      const name = asset?.name.replace(/"/g, '""') || 'N/A';
      const loc = asset?.location.replace(/"/g, '""') || 'N/A';
      const notes = item.notes.replace(/"/g, '""') || '';
      
      csvContent += `"${tag}","${name}","${category}","${loc}","${item.verdict}",${cost},"${custodianName}","${custodianEmail}","${notes}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = `corporate_asset_discrepancy_report_${activeCycle ? activeCycle.id : 'export'}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pre-formatted Outreach Email draft
  const getEscalationEmailSubject = () => {
    if (!selectedAsset) return '';
    return `URGENT: Physical Verification Required for Custody Asset [${selectedAsset.assetTag}]`;
  };

  const getEscalationEmailBody = () => {
    if (!selectedAsset) return '';
    const custodianName = activeCustodianEmp?.name || activeCustodianDept?.name || 'Asset Custodian';
    const notesStr = selectedItem?.notes ? `\nAuditor Note: "${selectedItem.notes}"` : '';
    
    return `Dear ${custodianName},

During our ongoing Physical Assets Stocktaking & Compliance Audit, an item registered under your custody could not be verified at its assigned location:

Asset Details:
----------------------------------------
• Asset Tag: ${selectedAsset.assetTag}
• Name: ${selectedAsset.name}
• Category: ${selectedCategory?.name || 'Equipment'}
• Serial Number: ${selectedAsset.serialNumber || 'N/A'}
• Original Location: ${selectedAsset.location}
• Current Record Verdict: MISSING STOCK${notesStr}

Action Required:
Please inspect your workspace, office, or home environment immediately. 
If the asset is in your possession, reply to this email with its current physical location and a brief photo confirmation. 

If the asset cannot be located, has been transferred, or was damaged, please contact the IT & Operations Asset Management department immediately.

Thank you for your active cooperation in upholding corporate compliance.

Best regards,
Asset Audit Compliance Desk
System Automated Dispatch`;
  };

  const handleCopyEmail = () => {
    const text = `Subject: ${getEscalationEmailSubject()}\n\n${getEscalationEmailBody()}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="space-y-6" id="audit-view-container">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="audit-header">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-400" />
            <span>Stocktaking & Asset Audits</span>
          </h2>
          <p className="text-xs text-slate-400">Establish formal physical audit periods, audit scoped gear, and generate rich discrepancy logs.</p>
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
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer shadow-md shadow-indigo-600/10"
            id="create-audit-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Audit Cycle</span>
          </button>
        )}
      </div>

      {/* Select active audit cycles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl" id="select-cycle-panel">
        <div className="flex items-center gap-3 flex-1">
          <label className="text-xs text-slate-400 font-bold uppercase shrink-0">Inspect Audit Cycle</label>
          <select
            value={selectedCycleId}
            onChange={e => setSelectedCycleId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none flex-1 max-w-md"
          >
            <option value="">-- Select Audit Cycle --</option>
            {audits.map(c => (
              <option key={c.id} value={c.id}>
                {getDeptName(c.scopeDepartmentId)} {c.scopeLocation ? `(${c.scopeLocation})` : ''} — {c.dateRangeStart} to {c.dateRangeEnd} [{c.status}]
              </option>
            ))}
          </select>
        </div>

        {activeCycle && (
          <div className="flex gap-2">
            <button
              onClick={() => setAuditSubTab('inspect')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                auditSubTab === 'inspect'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-transparent border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Inspection Checklist ({activeCycleItems.length})
            </button>
            <button
              onClick={() => setAuditSubTab('discrepancy')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition flex items-center gap-2 ${
                auditSubTab === 'discrepancy'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-transparent border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Discrepancy & Escalation Hub ({discrepancyItems.length})</span>
            </button>
          </div>
        )}
      </div>

      {activeCycle ? (
        <div className="space-y-6">
          {/* Sub Tab: PHYSICAL INSPECTION CHECKLIST */}
          {auditSubTab === 'inspect' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="active-audit-workspace">
              {/* LEFT: AUDIT CYCLE OVERVIEW */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Cycle Summary</span>
                    </h3>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      activeCycle.status === 'Open' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {activeCycle.status}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-400">
                    <div className="flex justify-between border-b border-slate-800/40 pb-2">
                      <span>Scope Department:</span>
                      <strong className="text-slate-200">{getDeptName(activeCycle.scopeDepartmentId)}</strong>
                    </div>
                    {activeCycle.scopeLocation && (
                      <div className="flex justify-between border-b border-slate-800/40 pb-2">
                        <span>Scope Location:</span>
                        <strong className="text-slate-200">{activeCycle.scopeLocation}</strong>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-slate-800/40 pb-2">
                      <span>Date Window:</span>
                      <span className="font-mono text-slate-200">{activeCycle.dateRangeStart} to {activeCycle.dateRangeEnd}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span>Authorized Auditors:</span>
                      <span className="text-slate-200 font-medium bg-slate-800/40 p-2 rounded border border-slate-800/80 mt-1">{getAuditorsNames(activeCycle.auditorIds)}</span>
                    </div>
                  </div>

                  {activeCycle.status === 'Open' && isAdmin && (
                    <button
                      onClick={handleCloseCycle}
                      className="w-full text-center py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/15"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock & Close Audit Cycle</span>
                    </button>
                  )}
                </div>

                {/* Micro Discrepancy Preview */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <h4 className="font-semibold text-white text-xs">Live Discrepancies</h4>
                    </div>
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-bold">
                      {discrepancyItems.length}
                    </span>
                  </div>

                  {discrepancyItems.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2 text-center">No stock discrepancies logged yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {discrepancyItems.slice(0, 3).map(item => (
                        <div key={item.id} className="p-2.5 bg-rose-500/5 rounded-lg border border-rose-500/10 text-[10px] flex justify-between items-center">
                          <span className="font-medium text-slate-300 truncate max-w-[70%]">{getAssetName(item.assetId)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            item.verdict === 'Missing' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                          }`}>{item.verdict}</span>
                        </div>
                      ))}
                      {discrepancyItems.length > 3 && (
                        <button
                          onClick={() => setAuditSubTab('discrepancy')}
                          className="w-full text-center py-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition font-medium"
                        >
                          View all {discrepancyItems.length} in detail &rarr;
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: SCRUTINY OF INDIVIDUAL ASSETS */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardCheck className="w-4 h-4 text-indigo-400" />
                    <span>Inspection Register ({activeCycleItems.length} Scoped Items)</span>
                  </h3>
                  <div className="flex gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Verified: {verifiedCount}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Missing: {missingCount}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Damaged: {damagedCount}</span>
                  </div>
                </div>

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
          )}

          {/* Sub Tab: DYNAMIC DISCREPANCY & ESCALATION HUB */}
          {auditSubTab === 'discrepancy' && (
            <div className="space-y-6" id="discrepancy-elaborated-hub">
              {/* SECTION 1: FINANCIAL EXPOSURE & KPI BENTO GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Financial Risk Exposure</span>
                    <h4 className="text-xl font-bold text-rose-400 mt-1">${totalValueAtRisk.toLocaleString()}</h4>
                    <span className="text-[10px] text-slate-500">Acquisition cost of discrepancies</span>
                  </div>
                  <div className="bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                    <DollarSign className="w-5 h-5 text-rose-400" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discrepancy Rate</span>
                    <h4 className="text-xl font-bold text-amber-400 mt-1">{discrepancyRate}%</h4>
                    <span className="text-[10px] text-slate-500">{discrepancyItems.length} of {totalScopedItems} scoped items</span>
                  </div>
                  <div className="bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Missing Stock Exposure</span>
                    <h4 className="text-xl font-bold text-white mt-1">${missingValue.toLocaleString()}</h4>
                    <span className="text-[10px] text-rose-400 font-medium">{missingCount} item(s) unverified</span>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                    <FileText className="w-5 h-5 text-slate-300" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Damaged Gear Valuation</span>
                    <h4 className="text-xl font-bold text-white mt-1">${damagedValue.toLocaleString()}</h4>
                    <span className="text-[10px] text-amber-400 font-medium">{damagedCount} item(s) require service</span>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                    <Wrench className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
              </div>

              {/* SECTION 2: INTERACTIVE CONTROLS & DUAL-PANEL SPLIT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* DUAL-PANEL LEFT: SEARCHABLE DISCREPANCY REGISTER (col-span-5) */}
                <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <h3 className="font-semibold text-white text-sm">Discrepancy Ledger</h3>
                    </div>
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 px-2 py-1 rounded font-semibold transition cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export CSV Report</span>
                    </button>
                  </div>

                  {/* Filter / Search Bar */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search by tag, name, or location..."
                        value={discSearch}
                        onChange={e => setDiscSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <select
                          value={discVerdictFilter}
                          onChange={e => setDiscVerdictFilter(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 focus:outline-none"
                        >
                          <option value="All">All Verdicts</option>
                          <option value="Missing">Missing Only</option>
                          <option value="Damaged">Damaged Only</option>
                        </select>
                      </div>

                      <div className="flex-1">
                        <select
                          value={discSortBy}
                          onChange={e => setDiscSortBy(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 focus:outline-none"
                        >
                          <option value="cost-desc">Cost: High to Low</option>
                          <option value="cost-asc">Cost: Low to High</option>
                          <option value="tag">Asset Tag</option>
                          <option value="verdict">By Verdict</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Discrepancies List */}
                  {filteredDiscrepancies.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/40 border border-slate-800/60 rounded-lg text-slate-500 text-xs italic">
                      No matching discrepancies detected.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                      {filteredDiscrepancies.map(item => {
                        const asset = assets.find(a => a.id === item.assetId);
                        if (!asset) return null;
                        const isSelected = selectedDiscId === item.id;

                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedDiscId(item.id)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                              isSelected 
                                ? 'bg-indigo-600/10 border-indigo-500' 
                                : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700/80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <span className="font-mono text-[9px] text-slate-500 block">{asset.assetTag}</span>
                                <h4 className="font-semibold text-white text-xs truncate max-w-[180px]">{asset.name}</h4>
                              </div>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                item.verdict === 'Missing' 
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {item.verdict}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 border-t border-slate-800/40 pt-1.5">
                              <span className="flex items-center gap-1 text-slate-500">
                                <MapPin className="w-3 h-3 text-slate-600" />
                                <span className="truncate max-w-[110px]">{asset.location}</span>
                              </span>
                              <strong className="text-slate-300">${asset.acquisitionCost?.toLocaleString()}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* DUAL-PANEL RIGHT: ESCALATION ASSISTANT & RESOLUTION CENTER (col-span-7) */}
                <div className="lg:col-span-7 space-y-4">
                  {selectedAsset && selectedItem ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-lg">
                      
                      {/* Sub-Header: Focused Asset */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                              {selectedAsset.assetTag}
                            </span>
                            <span className="text-xs text-slate-400">{selectedCategory?.name || 'Equipment'}</span>
                          </div>
                          <h3 className="font-semibold text-white text-md mt-1">{selectedAsset.name}</h3>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border flex items-center gap-1 ${
                          selectedItem.verdict === 'Missing' 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          <AlertTriangle className="w-3 h-3" />
                          <span>{selectedItem.verdict} RECORD</span>
                        </span>
                      </div>

                      {/* Info Metadata */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/40 p-4 rounded-lg border border-slate-850">
                        <div className="text-xs space-y-1 text-slate-400">
                          <p>Original Location: <strong className="text-slate-200">{selectedAsset.location}</strong></p>
                          <p>Serial Number: <span className="font-mono text-slate-200">{selectedAsset.serialNumber || 'N/A'}</span></p>
                          <p>Acquisition Value: <strong className="text-slate-200">${selectedAsset.acquisitionCost?.toLocaleString()}</strong></p>
                        </div>
                        <div className="text-xs space-y-1 text-slate-400">
                          <p>Audited Verdict: <strong className="text-slate-200 uppercase">{selectedItem.verdict}</strong></p>
                          <p>Initial Condition: <strong className="text-slate-200">{selectedAsset.condition}</strong></p>
                          <p>Auditor Findings Notes: <span className="text-slate-300 italic">"{selectedItem.notes || 'No findings notes logged.'}"</span></p>
                        </div>
                      </div>

                      {/* Active Custodian Details */}
                      <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-800 space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Active Custody / Allocation</span>
                        </h4>

                        {activeCustodianEmp ? (
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <p className="font-semibold text-white">{activeCustodianEmp.name}</p>
                              <p className="text-slate-400 text-[11px]">{activeCustodianEmp.email}</p>
                            </div>
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-medium">
                              Individual Custody
                            </span>
                          </div>
                        ) : activeCustodianDept ? (
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <p className="font-semibold text-white">Department Custody</p>
                              <p className="text-slate-400 text-[11px]">Dept Head ID: {activeCustodianDept.headEmployeeId || 'Unassigned'}</p>
                            </div>
                            <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-medium">
                              Dept: {activeCustodianDept.name}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">This asset has no recorded custodian or active allocation. (Company Pool item)</p>
                        )}
                      </div>

                      {/* ACTION PROTOCOLS BASED ON VERDICT */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-800 pb-2">
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                          <span>Official Mitigation SOP & Resolution</span>
                        </h4>

                        {selectedItem.verdict === 'Missing' ? (
                          <div className="space-y-4">
                            <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg text-xs space-y-2">
                              <p className="font-semibold text-rose-300 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Action Protocol: Missing Asset Custody Outreach</span>
                              </p>
                              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                                <li>Send the structured verification dispatch to the registered custodian.</li>
                                <li>Review local security logs and transit cards.</li>
                                <li>If unrecovered by the audit deadline, close the cycle to convert status to <strong className="text-slate-200">Lost</strong>.</li>
                              </ol>
                            </div>

                            {/* Email Template Panel */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-300">Generated Email Dispatch Draft</span>
                                <button
                                  onClick={handleCopyEmail}
                                  className="flex items-center gap-1 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-2.5 py-1.5 rounded transition cursor-pointer"
                                >
                                  {copySuccess ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Copied to Clipboard!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy Email Dispatch</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-400 max-h-[160px] overflow-y-auto whitespace-pre-wrap select-text">
                                <strong className="text-indigo-400 block pb-1">Subject: {getEscalationEmailSubject()}</strong>
                                {getEscalationEmailBody()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs space-y-2">
                              <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                                <span>Action Protocol: Damaged Asset Isolation</span>
                              </p>
                              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                                <li>Quarantine the gear physically to protect personnel from safety hazards.</li>
                                <li>Create a high-priority repair request in the Maintenance section.</li>
                                <li>Update condition index to <strong className="text-slate-200">Poor</strong> or <strong className="text-slate-200">Broken</strong>.</li>
                              </ol>
                            </div>

                            <div className="flex flex-col gap-2 bg-slate-950/40 border border-slate-800 p-3.5 rounded-lg">
                              <h5 className="text-xs font-semibold text-white">Suggested Maintenance Ticket Parameters:</h5>
                              <div className="text-[11px] text-slate-400 space-y-1.5">
                                <p>• <strong className="text-slate-300">Target Asset:</strong> {selectedAsset.name} ({selectedAsset.assetTag})</p>
                                <p>• <strong className="text-slate-300">Priority Level:</strong> {selectedAsset.condition === 'Broken' ? 'Critical' : 'High'}</p>
                                <p>• <strong className="text-slate-300">Issue Description:</strong> "Flagged in stocktaking cycle on {new Date().toLocaleDateString()}. Notes: {selectedItem.notes}"</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs italic">
                      Select a discrepancy from the left panel to inspect custody allocations, copy outreach templates, and review official mitigation SOPs.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm">
          No audit cycle selected or registered yet. Use the "Launch Audit Cycle" button in the upper right to spawn a stocktake cycle.
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
