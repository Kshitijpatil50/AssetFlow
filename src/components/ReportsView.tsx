import React from 'react';
import { 
  BarChart, PieChart, Download, AlertTriangle, TrendingUp, 
  Wrench, ShieldAlert, CheckCircle, FileSpreadsheet, Building2
} from 'lucide-react';
import { Asset, AssetCategory, Department, Allocation, ResourceBooking, MaintenanceRequest } from '../types';

interface ReportsViewProps {
  assets: Asset[];
  categories: AssetCategory[];
  departments: Department[];
  allocations: Allocation[];
  bookings: ResourceBooking[];
  maintenance: MaintenanceRequest[];
}

export default function ReportsView({
  assets,
  categories,
  departments,
  allocations,
  bookings,
  maintenance,
}: ReportsViewProps) {

  // 1. Data Aggregation for Reports
  
  // Category distribution
  const categoryCounts = categories.map(cat => {
    const count = assets.filter(a => a.categoryId === cat.id).length;
    const totalValue = assets.filter(a => a.categoryId === cat.id)
                             .reduce((acc, curr) => acc + (curr.acquisitionCost || 0), 0);
    return { name: cat.name, count, totalValue };
  });

  // Department distribution
  const departmentAllocations = departments.map(dept => {
    // Find allocations directly to department or employees belonging to that department
    const allocCount = allocations.filter(
      al => (al.status === 'Active' || al.status === 'Overdue') && al.departmentId === dept.id
    ).length;
    return { name: dept.name, code: dept.code, count: allocCount };
  });

  // Assets due for maintenance or nearing retirement
  const criticalConditionAssets = assets.filter(a => a.condition === 'Poor' || a.condition === 'Broken' || a.status === 'Under Maintenance');
  
  // Maintenance frequency
  const maintenanceCountByAsset = assets.map(asset => {
    const mCount = maintenance.filter(m => m.assetId === asset.id).length;
    return { name: asset.name, tag: asset.assetTag, count: mCount };
  }).filter(item => item.count > 0).sort((a, b) => b.count - a.count);

  // Resource usage counts (Bookings)
  const bookableUsage = assets.filter(a => a.isBookable).map(asset => {
    const bookCount = bookings.filter(b => b.resourceAssetId === asset.id).length;
    return { name: asset.name, tag: asset.assetTag, count: bookCount };
  }).sort((a, b) => b.count - a.count);

  // CSV Export trigger (Client side helper)
  const downloadCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Asset Tag,Asset Name,Category,SerialNumber,Acquisition Date,Acquisition Cost,Condition,Location,Status,Bookable?\n';

    assets.forEach(a => {
      const catName = categories.find(c => c.id === a.categoryId)?.name || 'Unknown';
      const row = [
        a.assetTag,
        `"${a.name.replace(/"/g, '""')}"`,
        `"${catName}"`,
        a.serialNumber || 'N/A',
        a.acquisitionDate,
        a.acquisitionCost,
        a.condition,
        `"${a.location}"`,
        a.status,
        a.isBookable ? 'Yes' : 'No'
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AssetFlow_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Peak usage slots helper (Heatmap visualization)
  const hourSlots = [
    { label: '08:00 - 10:00', count: bookings.filter(b => b.startTime.includes('08:00') || b.startTime.includes('09:00')).length },
    { label: '10:00 - 12:00', count: bookings.filter(b => b.startTime.includes('10:00') || b.startTime.includes('11:00')).length },
    { label: '12:00 - 14:00', count: bookings.filter(b => b.startTime.includes('12:00') || b.startTime.includes('13:00')).length },
    { label: '14:00 - 16:00', count: bookings.filter(b => b.startTime.includes('14:00') || b.startTime.includes('15:00')).length },
    { label: '16:00 - 18:00', count: bookings.filter(b => b.startTime.includes('16:00') || b.startTime.includes('17:00')).length },
  ];

  return (
    <div className="space-y-6" id="reports-view-container">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="reports-header">
        <div>
          <h2 className="text-lg font-semibold text-white">Reports & Real-Time Analytics</h2>
          <p className="text-xs text-slate-400">View asset valuations, service diagnostics, and export audit sheets in CSV.</p>
        </div>

        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
          id="export-csv-btn"
        >
          <Download className="w-4 h-4" />
          <span>Export Inventory CSV</span>
        </button>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CATEGORY VALUE DISTRIBUTION (Beautiful visual inline bar charts) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-white text-sm">Asset Valuation & Distribution</h3>
          </div>

          <div className="space-y-4">
            {categoryCounts.map((cat, idx) => {
              const maxVal = Math.max(...categoryCounts.map(c => c.totalValue)) || 1;
              const percentVal = (cat.totalValue / maxVal) * 100;

              return (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-300">{cat.name} ({cat.count} items)</span>
                    <span className="font-semibold text-slate-200">${cat.totalValue.toLocaleString()}</span>
                  </div>
                  {/* Custom progress bar */}
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all" 
                      style={{ width: `${percentVal}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RESOURCE USAGE FREQUENCY & HEATMAP */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <BarChart className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-white text-sm">Peak Resource Booking Heatmap</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 text-center text-[10px] text-slate-500 font-bold">
              {hourSlots.map((slot, idx) => {
                const maxCount = Math.max(...hourSlots.map(s => s.count)) || 1;
                const heatOpacity = (slot.count / maxCount);
                // Heat scale color background
                const heatBg = slot.count > 0 ? `rgba(56, 189, 248, ${Math.max(0.15, heatOpacity)})` : 'rgba(30, 41, 59, 0.4)';
                const heatBorder = slot.count > 0 ? `rgba(56, 189, 248, ${Math.max(0.3, heatOpacity)})` : 'rgba(51, 65, 85, 0.2)';

                return (
                  <div 
                    key={idx} 
                    className="p-3 rounded-lg border flex flex-col justify-between items-center h-24 transition"
                    style={{ backgroundColor: heatBg, borderColor: heatBorder }}
                  >
                    <span className="text-slate-300 font-mono text-[9px] leading-tight">{slot.label}</span>
                    <span className="text-lg font-black text-white mt-2">{slot.count}</span>
                    <span className="text-[8px] text-slate-400 mt-1">Bookings</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 italic text-center">Color intensity illustrates high-frequency reservation slots.</p>
          </div>
        </div>

        {/* DEPARTMENT-WISE ALLOCATION METRIC */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-white text-sm">Department Allocations</h3>
          </div>

          <div className="space-y-3.5">
            {departmentAllocations.map((dept, idx) => {
              const maxAlloc = Math.max(...departmentAllocations.map(d => d.count)) || 1;
              const percentVal = (dept.count / maxAlloc) * 100;

              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-300 font-semibold">{dept.name} ({dept.code})</span>
                    <span className="text-slate-200 font-mono">{dept.count} active</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${percentVal}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DECREPIT/DAMAGED RISK WATCHLIST */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <h3 className="font-semibold text-white text-sm">Asset Condition Watchlist</h3>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
            {criticalConditionAssets.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No assets flagged in damaged or repair status.</p>
            ) : (
              criticalConditionAssets.map((asset, idx) => (
                <div key={idx} className="p-3 bg-rose-500/5 rounded-lg border border-rose-500/10 flex items-center justify-between text-xs gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="font-bold text-rose-300 truncate">{asset.name}</h4>
                    <p className="text-[10px] text-slate-500">Location: {asset.location} | Tag: {asset.assetTag}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 shrink-0">
                    {asset.condition}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* HIGHEST MAINTENANCE FREQUENCY HARDWARE */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Wrench className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-white text-sm">Repetitive Repair Incidents</h3>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
            {maintenanceCountByAsset.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No hardware units recorded any repair tickets.</p>
            ) : (
              maintenanceCountByAsset.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="font-bold text-slate-200 truncate">{item.name}</h4>
                    <p className="text-[10px] text-slate-500">Tag: {item.tag}</p>
                  </div>
                  <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                    {item.count} Tickets
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
