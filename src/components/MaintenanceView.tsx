import React, { useState } from 'react';
import { 
  Wrench, Plus, CheckCircle, Clock, ShieldAlert, AlertTriangle, 
  HelpCircle, User, HardHat, FileText, CheckCircle2, ClipboardList,
  Loader2
} from 'lucide-react';
import ImageDropzone from './ImageDropzone';
import { Asset, Employee, MaintenanceRequest } from '../types';

interface MaintenanceViewProps {
  currentUser: Employee;
  assets: Asset[];
  employees: Employee[];
  maintenance: MaintenanceRequest[];
  onRaiseRequest: (assetId: string, description: string, priority: MaintenanceRequest['priority'], photoUrl: string | null, id?: string) => void;
  onUpdateStatus: (requestId: string, status: MaintenanceRequest['status'], technicianName?: string) => void;
}

export default function MaintenanceView({
  currentUser,
  assets,
  employees,
  maintenance,
  onRaiseRequest,
  onUpdateStatus,
}: MaintenanceViewProps) {
  const isManagerOrAdmin = currentUser.role === 'Asset Manager' || currentUser.role === 'Admin';

  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [ticketPhotoUrl, setTicketPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenanceRequest['priority']>('Medium');

  // Form state for updating technician assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [techName, setTechName] = useState('');

  // Raise Submit
  const handleRaiseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !description.trim() || isUploadingPhoto) return;
    onRaiseRequest(selectedAssetId, description.trim(), priority, ticketPhotoUrl, ticketId);
    setShowRaiseModal(false);
    setSelectedAssetId('');
    setDescription('');
    setTicketPhotoUrl(null);
  };

  // Assign Submit
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !techName.trim()) return;
    onUpdateStatus(selectedRequest.id, 'Technician Assigned', techName.trim());
    setShowAssignModal(false);
    setTechName('');
  };

  // Scoped lists
  let displayRequests = maintenance;
  if (!isManagerOrAdmin) {
    displayRequests = maintenance.filter(m => m.raisedBy === currentUser.id);
  }

  // Helpers
  const getAssetName = (id: string) => {
    const asset = assets.find(a => a.id === id);
    return asset ? `[${asset.assetTag}] ${asset.name}` : 'Unknown Asset';
  };

  const getReporterName = (id: string) => employees.find(e => e.id === id)?.name || 'Employee';

  // State badge style
  const getStatusBadgeStyle = (status: MaintenanceRequest['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'Approved':
      case 'Technician Assigned':
        return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30';
      case 'In Progress':
        return 'bg-sky-500/15 text-sky-400 border border-sky-500/30';
      case 'Resolved':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      default:
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
    }
  };

  // Priority color
  const getPriorityStyle = (prio: MaintenanceRequest['priority']) => {
    switch (prio) {
      case 'Critical':
        return 'text-rose-400 font-black animate-pulse';
      case 'High':
        return 'text-orange-400 font-bold';
      case 'Medium':
        return 'text-amber-400 font-medium';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6" id="maintenance-view-container">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="maintenance-header">
        <div>
          <h2 className="text-lg font-semibold text-white">Maintenance & Repair Hub</h2>
          <p className="text-xs text-slate-400">File malfunction reports, authorize repair work, and oversee hardware technician assignments.</p>
        </div>

        <button
          onClick={() => {
            setSelectedAssetId(assets[0]?.id || '');
            setDescription('');
            setPriority('Medium');
            setTicketId(`maint-${Date.now()}`);
            setTicketPhotoUrl(null);
            setShowRaiseModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
          id="raise-ticket-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Ticket</span>
        </button>
      </div>

      {/* Main List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden" id="maintenance-panel">
        <div className="p-4 border-b border-slate-800 bg-slate-800/20 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-white text-sm">Active Repair Tickets</h3>
        </div>

        {displayRequests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No active maintenance requests raised under this scope.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 text-xs">
            {displayRequests.map(req => (
              <div key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/10 transition">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-semibold text-slate-200 text-sm">{getAssetName(req.assetId)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeStyle(req.status)}`}>
                      {req.status}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 font-bold border border-slate-700 rounded-md`}>
                      Priority: <span className={getPriorityStyle(req.priority)}>{req.priority}</span>
                    </span>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed">{req.issueDescription}</p>

                  {req.photoUrl && (
                    <div className="pt-2" id={`maint-photo-${req.id}`}>
                      <a 
                        href={req.photoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-block relative rounded-lg border border-slate-800 overflow-hidden bg-slate-950/40 w-32 aspect-video group shadow-inner"
                        title="View photo evidence"
                      >
                        <img 
                          src={req.photoUrl} 
                          alt="Issue evidence" 
                          referrerPolicy="no-referrer" 
                          className="w-full h-full object-cover hover:scale-105 transition duration-300" 
                        />
                      </a>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium">
                    <p className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-600" /> <span>Reported By: {getReporterName(req.raisedBy)}</span></p>
                    {req.technicianName && (
                      <p className="flex items-center gap-1"><HardHat className="w-3.5 h-3.5 text-slate-600" /> <span>Technician: <strong className="text-indigo-400">{req.technicianName}</strong></span></p>
                    )}
                  </div>
                </div>

                {/* Manager Actions */}
                {isManagerOrAdmin && req.status !== 'Resolved' && req.status !== 'Rejected' && (
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {req.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => onUpdateStatus(req.id, 'Approved')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition cursor-pointer"
                        >
                          Approve Repair
                        </button>
                        <button
                          onClick={() => onUpdateStatus(req.id, 'Rejected')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {(req.status === 'Approved' || req.status === 'Pending') && (
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setTechName(req.technicianName || '');
                          setShowAssignModal(true);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                      >
                        <HardHat className="w-3.5 h-3.5" />
                        <span>Assign Tech</span>
                      </button>
                    )}

                    {(req.status === 'Technician Assigned' || req.status === 'Approved') && (
                      <button
                        onClick={() => onUpdateStatus(req.id, 'In Progress')}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition cursor-pointer"
                      >
                        Start Repair work
                      </button>
                    )}

                    {req.status === 'In Progress' && (
                      <button
                        onClick={() => onUpdateStatus(req.id, 'Resolved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RAISE MAINTENANCE MODAL */}
      {showRaiseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-md flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-indigo-400" />
                <span>Report Broken/Damaged Hardware</span>
              </h3>
              <button onClick={() => setShowRaiseModal(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            <form onSubmit={handleRaiseSubmit} className="p-5 space-y-4">
              
              {/* Asset Selection */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Select Asset</label>
                <select
                  required
                  value={selectedAssetId}
                  onChange={e => setSelectedAssetId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                >
                  <option value="">-- Choose Asset with Defect --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      [{a.assetTag}] {a.name} ({a.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Urgency Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                >
                  <option value="Low">Low (Minor cosmetic issue)</option>
                  <option value="Medium">Medium (Malfunction, workaround exists)</option>
                  <option value="High">High (Core issue, blocks some work)</option>
                  <option value="Critical">Critical (Van crashed, workspace flooded, total failure)</option>
                </select>
              </div>

              {/* Issue Description */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Issue Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail the issue. E.g., The battery drains in 30 minutes, and the fan is making a screeching noise."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Evidence Photo Drag & Drop Upload */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Defect Photo Evidence</label>
                <ImageDropzone
                  storagePath={`maintenance/${ticketId}/photos`}
                  onUploadComplete={(urls) => setTicketPhotoUrl(urls[0] || null)}
                  onUploadingStateChange={(isUploading) => setIsUploadingPhoto(isUploading)}
                  initialUrls={ticketPhotoUrl ? [ticketPhotoUrl] : []}
                  multiple={false}
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRaiseModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingPhoto}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition ${
                    isUploadingPhoto
                      ? 'bg-indigo-700/60 text-indigo-300 cursor-not-allowed opacity-75'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {isUploadingPhoto && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isUploadingPhoto ? 'Uploading...' : 'File Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN TECHNICIAN MODAL */}
      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-md">
                Assign Repair Technician
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
                <p>Asset: <strong className="text-white">{getAssetName(selectedRequest.assetId)}</strong></p>
                <p>Defect: <span className="italic">"{selectedRequest.issueDescription}"</span></p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Technician or Service Provider Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Tech Support Services"
                  value={techName}
                  onChange={e => setTechName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
