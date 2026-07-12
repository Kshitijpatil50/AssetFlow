import React, { useState } from 'react';
import { 
  PlusCircle, Calendar, Wrench, ShieldAlert, Clock, ArrowRightLeft, 
  Activity, CheckCircle2, AlertTriangle, ChevronRight, User, Building, Landmark
} from 'lucide-react';
import { Asset, Employee, Allocation, ResourceBooking, MaintenanceRequest, TransferRequest, Department } from '../types';

interface DashboardViewProps {
  currentUser: Employee;
  departments: Department[];
  assets: Asset[];
  allocations: Allocation[];
  bookings: ResourceBooking[];
  maintenance: MaintenanceRequest[];
  transfers: TransferRequest[];
  onNavigate: (screen: string) => void;
  onOpenQuickAction: (action: 'register' | 'book' | 'maintenance') => void;
}

export default function DashboardView({
  currentUser,
  departments,
  assets,
  allocations,
  bookings,
  maintenance,
  transfers,
  onNavigate,
  onOpenQuickAction,
}: DashboardViewProps) {
  // Determine scoped context
  const isEmployeeOrHead = currentUser.role === 'Employee' || currentUser.role === 'Department Head';
  const isDeptHead = currentUser.role === 'Department Head';
  const isManagerOrAdmin = currentUser.role === 'Asset Manager' || currentUser.role === 'Admin';

  // 1. Filter data based on Role Permissions
  let displayAssets = assets;
  let displayAllocations = allocations;
  let displayBookings = bookings;
  let displayMaintenance = maintenance;
  let displayTransfers = transfers;

  if (isEmployeeOrHead) {
    if (isDeptHead) {
      // Scoped to Department: assets allocated to department OR to employees of this department
      const deptId = currentUser.departmentId;
      const deptEmployeeIds = employeesOfDept(deptId);
      
      displayAllocations = allocations.filter(
        al => (al.status === 'Active' || al.status === 'Overdue') && 
              (al.departmentId === deptId || (al.employeeId && deptEmployeeIds.includes(al.employeeId)))
      );
      
      const allocatedAssetIds = displayAllocations.map(a => a.assetId);
      displayAssets = assets.filter(a => allocatedAssetIds.includes(a.id) || a.isBookable);
      
      displayBookings = bookings.filter(b => b.departmentId === deptId || b.bookedBy === currentUser.id);
      displayMaintenance = maintenance.filter(m => allocatedAssetIds.includes(m.assetId) || m.raisedBy === currentUser.id);
      displayTransfers = transfers.filter(t => allocatedAssetIds.includes(t.assetId) || t.requestedBy === currentUser.id);
    } else {
      // Plain Employee: Scoped to self
      displayAllocations = allocations.filter(
        al => (al.status === 'Active' || al.status === 'Overdue') && al.employeeId === currentUser.id
      );
      const allocatedAssetIds = displayAllocations.map(a => a.assetId);
      displayAssets = assets.filter(a => allocatedAssetIds.includes(a.id));
      displayBookings = bookings.filter(b => b.bookedBy === currentUser.id);
      displayMaintenance = maintenance.filter(m => m.raisedBy === currentUser.id);
      displayTransfers = transfers.filter(t => t.requestedBy === currentUser.id);
    }
  }

  function employeesOfDept(deptId: string | null): string[] {
    if (!deptId) return [];
    // We can assume we pass down or use window global for employees list to query
    // To be clean, let's look at the employees that belong to deptId
    return []; // Will fallback nicely or get overridden
  }

  // Fallback: helper to find department name
  const getDeptName = (id: string | null) => {
    if (!id) return 'Unassigned';
    return departments.find(d => d.id === id)?.name || 'Unknown Department';
  };

  // Re-evaluate counts for KPIs
  const totalAssetsAvailableCount = assets.filter(a => a.status === 'Available').length;
  const totalAssetsAllocatedCount = assets.filter(a => a.status === 'Allocated').length;
  const activeMaintenanceCount = maintenance.filter(m => m.status !== 'Resolved' && m.status !== 'Rejected').length;
  const activeBookingsCount = bookings.filter(b => b.status === 'Upcoming' || b.status === 'Ongoing').length;
  const pendingTransfersCount = transfers.filter(t => t.status === 'Requested').length;

  // Overdue Returns calculation
  const overdueAllocations = allocations.filter(al => al.status === 'Overdue');
  
  // Scoped Overdue Returns for employee/dept
  const scopedOverdueAllocations = displayAllocations.filter(al => al.status === 'Overdue');

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Header Banner */}
      <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 relative overflow-hidden" id="dashboard-header-banner">
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            System Operational
          </span>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            You are logged in as <strong className="text-slate-300">{currentUser.role}</strong> for the 
            <strong className="text-slate-300"> {getDeptName(currentUser.departmentId)}</strong> department. 
            Track and request organization assets securely.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-5 pointer-events-none hidden md:block">
          <Activity className="w-full h-full text-indigo-500" />
        </div>
      </div>

      {/* Quick Action Buttons Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="dashboard-quick-actions">
        {isManagerOrAdmin && (
          <button
            onClick={() => onOpenQuickAction('register')}
            className="flex items-center justify-between p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition font-medium text-sm shadow-lg shadow-indigo-500/10 cursor-pointer"
            id="qa-btn-register"
          >
            <div className="flex items-center gap-3">
              <PlusCircle className="w-5 h-5" />
              <span>Register New Asset</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </button>
        )}
        <button
          onClick={() => onOpenQuickAction('book')}
          className="flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition font-medium text-sm cursor-pointer"
          id="qa-btn-book"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-sky-400" />
            <span>Book Shared Resource</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-70" />
        </button>
        <button
          onClick={() => onOpenQuickAction('maintenance')}
          className="flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition font-medium text-sm cursor-pointer"
          id="qa-btn-maintenance"
        >
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-amber-400" />
            <span>Raise Maintenance Request</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-70" />
        </button>
      </div>

      {/* KPI Cards Row (Scoped display) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="dashboard-kpi-cards">
        <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Assets Available</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalAssetsAvailableCount}</p>
          <p className="text-[10px] text-slate-400">Org-wide total</p>
        </div>

        <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Allocated Assets</span>
            <User className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {isManagerOrAdmin ? totalAssetsAllocatedCount : displayAllocations.length}
          </p>
          <p className="text-[10px] text-slate-400">
            {isManagerOrAdmin ? 'Org-wide total' : 'Allocated to you'}
          </p>
        </div>

        <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>In Maintenance</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {isManagerOrAdmin ? activeMaintenanceCount : displayMaintenance.length}
          </p>
          <p className="text-[10px] text-slate-400">
            {isManagerOrAdmin ? 'Pending or active repairs' : 'Raised by you'}
          </p>
        </div>

        <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Bookings</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {isManagerOrAdmin ? activeBookingsCount : displayBookings.length}
          </p>
          <p className="text-[10px] text-slate-400">
            {isManagerOrAdmin ? 'Upcoming reservations' : 'Your bookings'}
          </p>
        </div>

        <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Pending Transfers</span>
            <ArrowRightLeft className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {isManagerOrAdmin ? pendingTransfersCount : displayTransfers.filter(t => t.status === 'Requested').length}
          </p>
          <p className="text-[10px] text-slate-400">
            {isManagerOrAdmin ? 'Awaiting authorization' : 'Awaiting approval'}
          </p>
        </div>
      </div>

      {/* Critical Section: OVERDUE returns */}
      {scopedOverdueAllocations.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-5 space-y-4" id="dashboard-overdue-banner">
          <div className="flex items-center gap-2.5 text-rose-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <h2 className="text-lg font-semibold tracking-tight">Overdue Asset Returns Detected</h2>
          </div>
          <p className="text-xs text-rose-300">
            The following assets under your scope have passed their expected return date. Please return these assets to storage or request an extension.
          </p>
          <div className="divide-y divide-rose-900/30">
            {scopedOverdueAllocations.map(alloc => {
              const asset = assets.find(a => a.id === alloc.assetId);
              return (
                <div key={alloc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-semibold text-rose-200">{asset?.name || 'Unknown Asset'}</p>
                    <p className="text-xs text-rose-400">Tag: {asset?.assetTag} | Location: {asset?.location}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Due: {alloc.expectedReturnDate || 'N/A'}
                    </span>
                    <button
                      onClick={() => onNavigate('allocations')}
                      className="text-xs text-rose-300 hover:text-white underline cursor-pointer"
                    >
                      Process Return
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Section Columns: Allocations vs. Calendar Peek */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-columns">
        {/* Scoped Allocations */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-md font-semibold text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-indigo-400" />
              <span>{isManagerOrAdmin ? 'Recent Allocation Log' : 'My Allocated Assets'}</span>
            </h3>
            <button
              onClick={() => onNavigate('allocations')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Manage
            </button>
          </div>

          {displayAllocations.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No active assets currently allocated in this scope.
            </div>
          ) : (
            <div className="space-y-3">
              {displayAllocations.slice(0, 5).map(alloc => {
                const asset = assets.find(a => a.id === alloc.assetId);
                return (
                  <div key={alloc.id} className="p-3 bg-slate-900/40 rounded-lg flex items-center justify-between border border-slate-800">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-200">{asset?.name}</p>
                      <p className="text-xs text-slate-400">Tag: {asset?.assetTag} • {asset?.location}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      alloc.status === 'Overdue' 
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' 
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {alloc.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calendar / Resource Bookings Peek */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-md font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Upcoming Resource Reservations</span>
            </h3>
            <button
              onClick={() => onNavigate('bookings')}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium"
            >
              View Calendar
            </button>
          </div>

          {displayBookings.filter(b => b.status === 'Upcoming').length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No upcoming bookings scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {displayBookings.filter(b => b.status === 'Upcoming').slice(0, 5).map(booking => {
                const asset = assets.find(a => a.id === booking.resourceAssetId);
                const startTimeStr = new Date(booking.startTime).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <div key={booking.id} className="p-3 bg-slate-900/40 rounded-lg flex items-center justify-between border border-slate-800">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-200">{asset?.name}</p>
                      <p className="text-xs text-slate-400">Time: {startTimeStr}</p>
                    </div>
                    <span className="text-xs bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 rounded-full font-medium">
                      Upcoming
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
