import React, { useState } from 'react';
import { 
  PlusCircle, ArrowRightLeft, CheckCircle, HelpCircle, User, 
  Building, Calendar, AlertTriangle, FileText, CheckCircle2, XCircle
} from 'lucide-react';
import { Asset, Employee, Department, Allocation, TransferRequest } from '../types';

interface AllocationsViewProps {
  currentUser: Employee;
  assets: Asset[];
  departments: Department[];
  employees: Employee[];
  allocations: Allocation[];
  transfers: TransferRequest[];
  onAllocateAsset: (
    assetId: string, holderId: string, holderType: 'Employee' | 'Department', 
    expectedReturnDate: string | null
  ) => { success: boolean; error?: string };
  onReturnAsset: (allocationId: string, checkInNotes: string, condition: Asset['condition']) => void;
  onInitiateTransfer: (assetId: string, toHolderId: string) => { success: boolean; error?: string };
  onApproveTransfer: (transferId: string, approve: boolean) => { success: boolean; error?: string };
}

export default function AllocationsView({
  currentUser,
  assets,
  departments,
  employees,
  allocations,
  transfers,
  onAllocateAsset,
  onReturnAsset,
  onInitiateTransfer,
  onApproveTransfer,
}: AllocationsViewProps) {
  const isManagerOrAdmin = currentUser.role === 'Asset Manager' || currentUser.role === 'Admin';
  const isDeptHead = currentUser.role === 'Department Head';

  // State
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedAlloc, setSelectedAlloc] = useState<Allocation | null>(null);

  // Return Form State
  const [returnNotes, setReturnNotes] = useState('');
  const [returnCondition, setReturnCondition] = useState<Asset['condition']>('Good');

  // Allocate Form State
  const [allocForm, setAllocForm] = useState({
    assetId: '',
    holderType: 'Employee' as 'Employee' | 'Department',
    holderId: '',
    expectedReturnDate: '',
  });

  const [allocError, setAllocError] = useState('');
  const [allocConflictHolder, setAllocConflictHolder] = useState<string | null>(null);
  const [allocConflictAssetId, setAllocConflictAssetId] = useState<string | null>(null);

  // Transfer request selection (for initiation on conflict)
  const [showTransferProposal, setShowTransferProposal] = useState(false);
  const [transferTargetHolder, setTransferTargetHolder] = useState('');

  // 1. Process Return
  const openReturnModal = (alloc: Allocation) => {
    setSelectedAlloc(alloc);
    setReturnNotes('');
    const asset = assets.find(a => a.id === alloc.assetId);
    setReturnCondition(asset ? asset.condition : 'Good');
    setShowReturnModal(true);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlloc) return;
    onReturnAsset(selectedAlloc.id, returnNotes, returnCondition);
    setShowReturnModal(false);
  };

  // 2. Process Allocation Submit with Conflict Checking
  const handleAllocateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAllocError('');
    setAllocConflictHolder(null);
    setAllocConflictAssetId(null);
    setShowTransferProposal(false);

    const asset = assets.find(a => a.id === allocForm.assetId);
    if (!asset) {
      setAllocError('Please select a valid asset.');
      return;
    }

    // Check if asset is already allocated (Strict Business Rule 2)
    if (asset.status !== 'Available' && asset.status !== 'Reserved') {
      const activeAlloc = allocations.find(al => al.assetId === asset.id && al.status === 'Active');
      let holderName = 'another entity';
      if (activeAlloc) {
        if (activeAlloc.employeeId) {
          holderName = employees.find(emp => emp.id === activeAlloc.employeeId)?.name || 'an employee';
        } else if (activeAlloc.departmentId) {
          holderName = departments.find(d => d.id === activeAlloc.departmentId)?.name || 'a department';
        }
      }
      setAllocError(`Conflict: "${asset.name}" is already allocated.`);
      setAllocConflictHolder(holderName);
      setAllocConflictAssetId(asset.id);
      setTransferTargetHolder(allocForm.holderId); // preload transfer receiver
      setShowTransferProposal(true);
      return;
    }

    if (!allocForm.holderId) {
      setAllocError('Please choose a valid recipient.');
      return;
    }

    const res = onAllocateAsset(
      allocForm.assetId,
      allocForm.holderId,
      allocForm.holderType,
      allocForm.expectedReturnDate || null
    );

    if (res.success) {
      setShowAllocateModal(false);
    } else {
      setAllocError(res.error || 'Allocation error.');
    }
  };

  // 3. Initiate Transfer Proposal directly from conflict
  const handleTransferInitiation = () => {
    if (!allocConflictAssetId || !transferTargetHolder) return;
    const res = onInitiateTransfer(allocConflictAssetId, transferTargetHolder);
    if (res.success) {
      setShowAllocateModal(false);
      setShowTransferProposal(false);
      alert('Transfer Request registered! Assets Manager or Department Head has been notified to authorize.');
    } else {
      setAllocError(res.error || 'Transfer request failure.');
    }
  };

  // Helper getters
  const getAssetName = (id: string) => assets.find(a => a.id === id)?.name || 'Unknown Asset';
  const getAssetTag = (id: string) => assets.find(a => a.id === id)?.assetTag || 'AF-XXXX';
  const getEmployeeName = (id: string | null) => {
    if (!id) return 'None';
    return employees.find(e => e.id === id)?.name || 'Unknown Employee';
  };
  const getDeptName = (id: string | null) => {
    if (!id) return 'None';
    return departments.find(d => d.id === id)?.name || 'Unknown Department';
  };

  const getHolderName = (alloc: Allocation) => {
    if (alloc.employeeId) {
      return `Employee: ${getEmployeeName(alloc.employeeId)}`;
    }
    if (alloc.departmentId) {
      return `Department: ${getDeptName(alloc.departmentId)}`;
    }
    return 'None';
  };

  // Scoped lists
  let displayAllocations = allocations.filter(a => a.status === 'Active' || a.status === 'Overdue');
  let displayTransfers = transfers;

  if (!isManagerOrAdmin) {
    if (isDeptHead) {
      const deptId = currentUser.departmentId;
      const deptEmployeeIds = employees.filter(e => e.departmentId === deptId).map(e => e.id);
      displayAllocations = allocations.filter(
        a => (a.status === 'Active' || a.status === 'Overdue') &&
             (a.departmentId === deptId || (a.employeeId && deptEmployeeIds.includes(a.employeeId)))
      );
      displayTransfers = transfers.filter(
        t => {
          const activeAlloc = allocations.find(al => al.assetId === t.assetId && al.status === 'Active');
          return activeAlloc?.departmentId === deptId || t.requestedBy === currentUser.id;
        }
      );
    } else {
      displayAllocations = allocations.filter(
        a => (a.status === 'Active' || a.status === 'Overdue') && a.employeeId === currentUser.id
      );
      displayTransfers = transfers.filter(t => t.requestedBy === currentUser.id);
    }
  }

  return (
    <div className="space-y-6" id="allocations-view-container">
      {/* Header and Allocation Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="allocations-header">
        <div>
          <h2 className="text-lg font-semibold text-white">Asset Allocations & Transfers</h2>
          <p className="text-xs text-slate-400">Track current asset custody, process returns, and authorize transfer requests.</p>
        </div>

        {isManagerOrAdmin && (
          <button
            onClick={() => {
              setAllocForm({
                assetId: assets.find(a => a.status === 'Available')?.id || '',
                holderType: 'Employee',
                holderId: employees[0]?.id || '',
                expectedReturnDate: '',
              });
              setAllocError('');
              setAllocConflictHolder(null);
              setShowTransferProposal(false);
              setShowAllocateModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
            id="allocate-asset-btn"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Allocate Asset</span>
          </button>
        )}
      </div>

      {/* Main Grid: Active Allocations on Left, Transfers on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ACTIVE ALLOCATIONS */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-md font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>Active Asset Custodies</span>
          </h3>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {displayAllocations.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No active custody records under your current clearance level.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {displayAllocations.map(alloc => {
                  const asset = assets.find(a => a.id === alloc.assetId);
                  return (
                    <div key={alloc.id} className="p-4 flex items-start justify-between hover:bg-slate-800/10 transition gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-indigo-400 font-bold tracking-wider">{asset?.assetTag}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                            alloc.status === 'Overdue' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {alloc.status}
                          </span>
                        </div>
                        <h4 className="font-semibold text-white text-sm">{asset?.name}</h4>
                        
                        {/* Holder Details */}
                        <div className="flex flex-col gap-0.5 text-xs text-slate-400">
                          <p className="flex items-center gap-1.5 font-medium text-slate-300">
                            {alloc.employeeId ? <User className="w-3.5 h-3.5 text-slate-500" /> : <Building className="w-3.5 h-3.5 text-slate-500" />}
                            <span>{getHolderName(alloc)}</span>
                          </p>
                          <p className="flex items-center gap-1.5 mt-0.5 text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Assigned: {alloc.allocatedDate} {alloc.expectedReturnDate && `• Due: ${alloc.expectedReturnDate}`}</span>
                          </p>
                        </div>
                      </div>

                      {/* Return Trigger */}
                      {isManagerOrAdmin && (
                        <button
                          onClick={() => openReturnModal(alloc)}
                          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-500/5 transition cursor-pointer"
                        >
                          Check-In Return
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* TRANSFER REQUESTS */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-md font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <ArrowRightLeft className="w-4 h-4 text-pink-400" />
            <span>Custodian Transfer Pipelines</span>
          </h3>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {displayTransfers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No asset transfer authorization requests filed.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 text-xs">
                {displayTransfers.map(trans => {
                  const asset = assets.find(a => a.id === trans.assetId);
                  const requester = employees.find(e => e.id === trans.requestedBy);
                  
                  // Receiver info
                  const receiverEmp = employees.find(e => e.id === trans.toHolderId);
                  const receiverDept = departments.find(d => d.id === trans.toHolderId);
                  const receiverName = receiverEmp ? receiverEmp.name : receiverDept ? `Dept: ${receiverDept.name}` : trans.toHolderId;

                  // Current holder
                  const activeAlloc = allocations.find(al => al.assetId === trans.assetId && al.status === 'Active');
                  const currentHolderName = activeAlloc ? getHolderName(activeAlloc) : 'Unknown';

                  const canAuthorize = isManagerOrAdmin || (isDeptHead && activeAlloc?.departmentId === currentUser.departmentId);

                  return (
                    <div key={trans.id} className="p-4 space-y-3 hover:bg-slate-800/10 transition">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-[10px] text-pink-400 font-bold bg-pink-500/10 px-1.5 py-0.2 rounded border border-pink-500/20">
                            {getAssetTag(trans.assetId)}
                          </span>
                          <h4 className="font-semibold text-white text-sm mt-1">{getAssetName(trans.assetId)}</h4>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          trans.status === 'Requested' 
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                            : trans.status === 'Re-allocated'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                        }`}>
                          {trans.status}
                        </span>
                      </div>

                      <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-slate-400 text-[11px]">
                        <p>Current Custody: <strong className="text-slate-300">{currentHolderName}</strong></p>
                        <p className="text-pink-400">Proposed Target: <strong>{receiverName}</strong></p>
                        <p>Requested By: <span className="text-slate-300">{requester?.name}</span> ({new Date(trans.timestamp).toLocaleDateString()})</p>
                      </div>

                      {trans.status === 'Requested' && (
                        <div className="flex items-center gap-2 pt-1">
                          {canAuthorize ? (
                            <>
                              <button
                                onClick={() => onApproveTransfer(trans.id, true)}
                                className="flex-1 text-center py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition cursor-pointer"
                              >
                                Approve & Reallocate
                              </button>
                              <button
                                onClick={() => onApproveTransfer(trans.id, false)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <p className="text-[10px] text-slate-500 italic flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-slate-600" />
                              <span>Awaiting Asset Manager or Department Head authorization.</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NEW ALLOCATION & TRANSFER PROPOSAL MODAL */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-md">
                Allocate System Asset
              </h3>
              <button onClick={() => setShowAllocateModal(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            <form onSubmit={handleAllocateSubmit} className="p-5 space-y-4">
              
              {allocError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <div>
                    <p>{allocError}</p>
                    {allocConflictHolder && (
                      <p className="text-[11px] font-medium text-rose-300 mt-1">Currently held by: {allocConflictHolder}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Asset Selection */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Choose Asset</label>
                <select
                  required
                  value={allocForm.assetId}
                  onChange={e => setAllocForm({ ...allocForm, assetId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                >
                  <option value="">-- Choose Asset to Allocate --</option>
                  {/* List ALL assets, showing status */}
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      [{a.assetTag}] {a.name} ({a.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Holder Type selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Custody Target</label>
                  <select
                    value={allocForm.holderType}
                    onChange={e => setAllocForm({ ...allocForm, holderType: e.target.value as any, holderId: '' })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                  >
                    <option value="Employee">Single Employee</option>
                    <option value="Department">Full Department</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Expected Return Date</label>
                  <input
                    type="date"
                    value={allocForm.expectedReturnDate}
                    onChange={e => setAllocForm({ ...allocForm, expectedReturnDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Recipient Holder Selection */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Recipient Holder Entity</label>
                <select
                  required
                  value={allocForm.holderId}
                  onChange={e => setAllocForm({ ...allocForm, holderId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                >
                  <option value="">-- Choose Recipient Entity --</option>
                  {allocForm.holderType === 'Employee' ? (
                    employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                    ))
                  ) : (
                    departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))
                  )}
                </select>
              </div>

              {/* PROPOSED DIRECT TRANSFER SUB-FLOW */}
              {showTransferProposal && (
                <div className="border border-pink-500/30 bg-pink-500/5 rounded-xl p-4 space-y-2.5">
                  <h4 className="text-pink-400 text-xs font-bold uppercase flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Initiate Inter-Departmental Transfer?</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Instead of duplicate allocation, file a formal <strong>Custodian Transfer request</strong> to reroute custody from <span className="text-slate-300">{allocConflictHolder}</span> directly to your selected recipient.
                  </p>
                  <button
                    type="button"
                    onClick={handleTransferInitiation}
                    className="w-full text-center py-2 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Send Transfer Request
                  </button>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                {!showTransferProposal && (
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
                  >
                    Confirm Allocation
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECK-IN RETURN / VERIFICATION MODAL */}
      {showReturnModal && selectedAlloc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-md">
                Verify Return & Check-In
              </h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            <form onSubmit={handleReturnSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
                <p>Asset: <strong className="text-white">{getAssetName(selectedAlloc.assetId)}</strong> ({getAssetTag(selectedAlloc.assetId)})</p>
                <p>Current Custody holder: <span className="text-slate-300">{getHolderName(selectedAlloc)}</span></p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Inspect Condition Status</label>
                <select
                  value={returnCondition}
                  onChange={e => setReturnCondition(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                >
                  <option value="New">New (Flawless condition)</option>
                  <option value="Good">Good (Working, minimal wear)</option>
                  <option value="Fair">Fair (Minor cosmetic issues)</option>
                  <option value="Poor">Poor (Major defects, needs review)</option>
                  <option value="Broken">Broken (Unusable, needs repair)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Condition Check-In Notes</label>
                <textarea
                  required
                  placeholder="Describe inspection status. e.g., minor scratches on laptop lid, otherwise perfect."
                  rows={3}
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                >
                  Complete Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
