import React, { useState } from 'react';
import { 
  Search, SlidersHorizontal, Plus, Info, Edit, Trash2, Calendar, 
  MapPin, CheckCircle, ShieldAlert, History, HelpCircle, FileText, Wrench
} from 'lucide-react';
import { Asset, AssetCategory, Employee, Department, Allocation, MaintenanceRequest } from '../types';

interface AssetDirectoryViewProps {
  currentUser: Employee;
  assets: Asset[];
  categories: AssetCategory[];
  departments: Department[];
  allocations: Allocation[];
  maintenance: MaintenanceRequest[];
  employees: Employee[];
  onRegisterAsset: (
    name: string, categoryId: string, serialNumber: string, acquisitionDate: string,
    acquisitionCost: number, condition: Asset['condition'], location: string,
    isBookable: boolean, customFieldValues: Record<string, string | number>
  ) => void;
  onUpdateAsset: (
    id: string, name: string, categoryId: string, serialNumber: string, acquisitionDate: string,
    acquisitionCost: number, condition: Asset['condition'], location: string,
    isBookable: boolean, status: Asset['status'], customFieldValues: Record<string, string | number>
  ) => void;
}

export default function AssetDirectoryView({
  currentUser,
  assets,
  categories,
  departments,
  allocations,
  maintenance,
  employees,
  onRegisterAsset,
  onUpdateAsset,
}: AssetDirectoryViewProps) {
  const isManagerOrAdmin = currentUser.role === 'Asset Manager' || currentUser.role === 'Admin';

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [isBookableOnly, setIsBookableOnly] = useState(false);

  // Modal / Detail drawer
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Asset Form States
  const [assetForm, setAssetForm] = useState({
    name: '',
    categoryId: '',
    serialNumber: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    acquisitionCost: 0,
    condition: 'Good' as Asset['condition'],
    location: '',
    isBookable: false,
    status: 'Available' as Asset['status'],
    customFields: {} as Record<string, string | number>
  });

  // Filter lists
  const locations = Array.from(new Set(assets.map(a => a.location))).filter(Boolean);

  // Filter asset data
  const filteredAssets = assets.filter(a => {
    const term = search.toLowerCase();
    const matchesSearch = 
      a.name.toLowerCase().includes(term) ||
      a.assetTag.toLowerCase().includes(term) ||
      a.serialNumber.toLowerCase().includes(term) ||
      a.location.toLowerCase().includes(term);

    const matchesCategory = selectedCategory ? a.categoryId === selectedCategory : true;
    const matchesStatus = selectedStatus ? a.status === selectedStatus : true;
    const matchesLocation = selectedLocation ? a.location === selectedLocation : true;
    const matchesCondition = selectedCondition ? a.condition === selectedCondition : true;
    const matchesBookable = isBookableOnly ? a.isBookable : true;

    return matchesSearch && matchesCategory && matchesStatus && matchesLocation && matchesCondition && matchesBookable;
  });

  // Open register/edit modal
  const openRegisterModal = (asset?: Asset) => {
    if (asset) {
      setEditingAsset(asset);
      setAssetForm({
        name: asset.name,
        categoryId: asset.categoryId,
        serialNumber: asset.serialNumber,
        acquisitionDate: asset.acquisitionDate,
        acquisitionCost: asset.acquisitionCost,
        condition: asset.condition,
        location: asset.location,
        isBookable: asset.isBookable,
        status: asset.status,
        customFields: asset.customFieldValues || {}
      });
    } else {
      setEditingAsset(null);
      const defaultCat = categories[0]?.id || '';
      setAssetForm({
        name: '',
        categoryId: defaultCat,
        serialNumber: '',
        acquisitionDate: new Date().toISOString().split('T')[0],
        acquisitionCost: 0,
        condition: 'Good',
        location: '',
        isBookable: false,
        status: 'Available',
        customFields: {}
      });
    }
    setShowRegisterModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAsset) {
      onUpdateAsset(
        editingAsset.id,
        assetForm.name,
        assetForm.categoryId,
        assetForm.serialNumber,
        assetForm.acquisitionDate,
        Number(assetForm.acquisitionCost),
        assetForm.condition,
        assetForm.location,
        assetForm.isBookable,
        assetForm.status,
        assetForm.customFields
      );
    } else {
      onRegisterAsset(
        assetForm.name,
        assetForm.categoryId,
        assetForm.serialNumber,
        assetForm.acquisitionDate,
        Number(assetForm.acquisitionCost),
        assetForm.condition,
        assetForm.location,
        assetForm.isBookable,
        assetForm.customFields
      );
    }
    setShowRegisterModal(false);
  };

  const activeCategoryConfig = categories.find(c => c.id === assetForm.categoryId);

  // Helper getters for Details View
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown';
  
  const getAssetAllocations = (assetId: string) => {
    return allocations.filter(al => al.assetId === assetId);
  };

  const getAssetMaintenance = (assetId: string) => {
    return maintenance.filter(m => m.assetId === assetId);
  };

  const getHolderName = (alloc: Allocation) => {
    if (alloc.employeeId) {
      return employees.find(e => e.id === alloc.employeeId)?.name || 'Unknown Employee';
    }
    if (alloc.departmentId) {
      return departments.find(d => d.id === alloc.departmentId)?.name || 'Unknown Department';
    }
    return 'None';
  };

  // Helper to color status badges
  const getStatusStyle = (status: Asset['status']) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Allocated':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Reserved':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Under Maintenance':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Lost':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Retired':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-6" id="asset-directory-container">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="asset-directory-bar">
        <div>
          <h2 className="text-lg font-semibold text-white">Asset Catalog & Inventory</h2>
          <p className="text-xs text-slate-400">Search, filter, and review physical assets and bookable spaces.</p>
        </div>
        {isManagerOrAdmin && (
          <button
            onClick={() => openRegisterModal()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition self-start sm:self-auto cursor-pointer"
            id="register-asset-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Register Asset</span>
          </button>
        )}
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4" id="filters-panel">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search assets by name, tag (AF-XXXX), serial, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:w-3/5">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700/80 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700/80 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Allocated">Allocated</option>
              <option value="Reserved">Reserved</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Lost">Lost</option>
              <option value="Retired">Retired</option>
              <option value="Disposed">Disposed</option>
            </select>

            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="bg-slate-800 border border-slate-700/80 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Locations</option>
              {locations.map((loc, idx) => (
                <option key={idx} value={loc}>{loc}</option>
              ))}
            </select>

            <select
              value={selectedCondition}
              onChange={e => setSelectedCondition(e.target.value)}
              className="bg-slate-800 border border-slate-700/80 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="">All Conditions</option>
              <option value="New">New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Broken">Broken</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-slate-800/60">
          <label className="flex items-center gap-2 text-xs text-slate-400 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={isBookableOnly}
              onChange={e => setIsBookableOnly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span>Show Bookable Shared Resources Only</span>
          </label>
        </div>
      </div>

      {/* Assets Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="assets-grid-list">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-500">
            No physical assets matched your active filters. Try refining your search.
          </div>
        ) : (
          filteredAssets.map(asset => (
            <div
              key={asset.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between space-y-4 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs text-indigo-400 font-bold tracking-wider">{asset.assetTag}</span>
                    <h3 className="font-semibold text-white text-md line-clamp-1">{asset.name}</h3>
                    <p className="text-xs text-slate-400">{getCategoryName(asset.categoryId)}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getStatusStyle(asset.status)}`}>
                    {asset.status}
                  </span>
                </div>

                {/* Characteristics List */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs border-t border-b border-slate-800/60 py-2.5 text-slate-400">
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> <span className="truncate">{asset.location}</span></p>
                  <p className="flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5 text-slate-500" /> <span>Cond: {asset.condition}</span></p>
                  {asset.serialNumber && (
                    <p className="col-span-2 font-mono text-[10px] text-slate-500 truncate mt-1">S/N: {asset.serialNumber}</p>
                  )}
                </div>

                {/* Custom Fields Mini Listing */}
                {asset.customFieldValues && Object.keys(asset.customFieldValues).length > 0 && (
                  <div className="space-y-1 text-[11px]">
                    {Object.entries(asset.customFieldValues).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-slate-500 font-mono">
                        <span>{key}:</span>
                        <span className="text-slate-300 font-medium truncate max-w-[150px]">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Rows */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/30">
                <button
                  onClick={() => setSelectedAsset(asset)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <Info className="w-4 h-4" />
                  <span>Inspect Timeline</span>
                </button>

                {isManagerOrAdmin && (
                  <button
                    onClick={() => openRegisterModal(asset)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ASSET REGISTER/EDIT MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-md">
                {editingAsset ? `Edit Asset Tag: ${editingAsset.assetTag}` : 'Register Physical Asset'}
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dell Latitude 5440"
                  value={assetForm.name}
                  onChange={e => setAssetForm({ ...assetForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Category</label>
                  <select
                    value={assetForm.categoryId}
                    onChange={e => setAssetForm({ ...assetForm, categoryId: e.target.value, customFields: {} })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Serial Number (S/N)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SN-88A-901"
                    value={assetForm.serialNumber}
                    onChange={e => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Acquisition Date</label>
                  <input
                    type="date"
                    required
                    value={assetForm.acquisitionDate}
                    onChange={e => setAssetForm({ ...assetForm, acquisitionDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Acquisition Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={assetForm.acquisitionCost}
                    onChange={e => setAssetForm({ ...assetForm, acquisitionCost: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Condition</label>
                  <select
                    value={assetForm.condition}
                    onChange={e => setAssetForm({ ...assetForm, condition: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Broken">Broken</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Storage Location / Lab</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IT Equipment Locker C"
                    value={assetForm.location}
                    onChange={e => setAssetForm({ ...assetForm, location: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {editingAsset && (
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold uppercase">Lifecycle Status</label>
                    <select
                      value={assetForm.status}
                      onChange={e => setAssetForm({ ...assetForm, status: e.target.value as any })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                    >
                      <option value="Available">Available</option>
                      <option value="Allocated">Allocated</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Lost">Lost</option>
                      <option value="Retired">Retired</option>
                      <option value="Disposed">Disposed</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center h-16 pt-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assetForm.isBookable}
                      onChange={e => setAssetForm({ ...assetForm, isBookable: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Shared/Bookable Resource?</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Category Specific Custom Fields */}
              {activeCategoryConfig && activeCategoryConfig.customFields.length > 0 && (
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Specifications for {activeCategoryConfig.name}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeCategoryConfig.customFields.map((field, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-bold uppercase">
                          {field.name} {field.required && <span className="text-rose-500 font-bold">*</span>}
                        </label>
                        <input
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          required={field.required}
                          placeholder={`Enter ${field.name}`}
                          value={assetForm.customFields[field.name] || ''}
                          onChange={e => setAssetForm({
                            ...assetForm,
                            customFields: {
                              ...assetForm.customFields,
                              [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value
                            }
                          })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
                >
                  {editingAsset ? 'Save Changes' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED INSPECTION DRAWER / DIALOG */}
      {selectedAsset && (
        <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-slate-900 border-l border-slate-800 z-50 flex flex-col justify-between shadow-2xl p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="font-mono text-xs text-indigo-400 font-bold tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{selectedAsset.assetTag}</span>
                <h3 className="font-semibold text-white text-lg mt-1">{selectedAsset.name}</h3>
                <p className="text-xs text-slate-400">{getCategoryName(selectedAsset.categoryId)}</p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* General Specs */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <p className="text-slate-500 uppercase tracking-wider font-bold">Serial Number (S/N)</p>
                <p className="font-mono text-slate-300 font-semibold truncate">{selectedAsset.serialNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase tracking-wider font-bold">Acquisition Cost</p>
                <p className="font-semibold text-slate-300">${selectedAsset.acquisitionCost.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase tracking-wider font-bold">Location</p>
                <p className="font-semibold text-slate-300">{selectedAsset.location}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase tracking-wider font-bold">Acquired On</p>
                <p className="font-semibold text-slate-300">{selectedAsset.acquisitionDate}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase tracking-wider font-bold">Current State</p>
                <p className="font-semibold text-slate-300">{selectedAsset.status}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase tracking-wider font-bold">Condition Rating</p>
                <p className="font-semibold text-slate-300">{selectedAsset.condition}</p>
              </div>
            </div>

            {/* TAB-STYLE ALLOCATIONS vs MAINTENANCE TIMELINE */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-sm flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Historical Life Cycle Logs</span>
              </h4>

              {/* Allocations History */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Allocation History</span>
                </p>
                {getAssetAllocations(selectedAsset.id).length === 0 ? (
                  <p className="text-xs text-slate-500 italic pl-3">This asset has never been allocated to any holder.</p>
                ) : (
                  <div className="relative pl-4 border-l border-slate-800 space-y-4 text-xs ml-2">
                    {getAssetAllocations(selectedAsset.id).map((alloc, i) => (
                      <div key={alloc.id} className="relative">
                        {/* Dot */}
                        <span className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-slate-950"></span>
                        <div className="space-y-1">
                          <p className="font-semibold text-white">Assigned to: {getHolderName(alloc)}</p>
                          <p className="text-slate-400">Allocated Date: {alloc.allocatedDate} {alloc.expectedReturnDate && `• Due: ${alloc.expectedReturnDate}`}</p>
                          {alloc.actualReturnDate ? (
                            <p className="text-emerald-400">Returned On: {alloc.actualReturnDate} {alloc.conditionCheckInNotes && `(${alloc.conditionCheckInNotes})`}</p>
                          ) : (
                            <p className="text-amber-400 font-medium">Currently active ({alloc.status})</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Maintenance History */}
              <div className="space-y-3 pt-3">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Maintenance History</span>
                </p>
                {getAssetMaintenance(selectedAsset.id).length === 0 ? (
                  <p className="text-xs text-slate-500 italic pl-3">This asset has no repair logs on record.</p>
                ) : (
                  <div className="relative pl-4 border-l border-slate-800 space-y-4 text-xs ml-2">
                    {getAssetMaintenance(selectedAsset.id).map((maint, i) => (
                      <div key={maint.id} className="relative">
                        {/* Dot */}
                        <span className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-slate-950"></span>
                        <div className="space-y-1">
                          <p className="font-semibold text-white">Issue: {maint.issueDescription}</p>
                          <p className="text-slate-400">Raised By: {employees.find(e => e.id === maint.raisedBy)?.name || 'Employee'} • Priority: {maint.priority}</p>
                          <p className={`font-semibold ${maint.status === 'Resolved' ? 'text-emerald-400' : 'text-amber-400'}`}>Status: {maint.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => setSelectedAsset(null)}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
