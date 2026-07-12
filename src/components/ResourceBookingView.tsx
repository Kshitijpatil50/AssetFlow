import React, { useState } from 'react';
import { 
  Calendar, Clock, Plus, AlertTriangle, CheckCircle, XCircle, 
  ChevronRight, CalendarDays, Ban, User, Building
} from 'lucide-react';
import { Asset, Employee, Department, ResourceBooking } from '../types';

interface ResourceBookingViewProps {
  currentUser: Employee;
  assets: Asset[];
  departments: Department[];
  employees: Employee[];
  bookings: ResourceBooking[];
  onAddBooking: (
    resourceAssetId: string, bookedBy: string, departmentId: string | null, 
    startTime: string, endTime: string
  ) => { success: boolean; error?: string };
  onCancelBooking: (bookingId: string) => void;
}

export default function ResourceBookingView({
  currentUser,
  assets,
  departments,
  employees,
  bookings,
  onAddBooking,
  onCancelBooking,
}: ResourceBookingViewProps) {
  const isManagerOrAdmin = currentUser.role === 'Asset Manager' || currentUser.role === 'Admin';

  // Bookable Shared Assets
  const bookableAssets = assets.filter(a => a.isBookable && a.status !== 'Retired' && a.status !== 'Disposed');

  // Selection state
  const [selectedAssetId, setSelectedAssetId] = useState(bookableAssets[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Form State
  const [bookingForm, setBookingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startHour: '09:00',
    endHour: '10:00',
  });

  const selectedAsset = bookableAssets.find(a => a.id === selectedAssetId);

  // Active bookings for the selected asset
  const assetBookings = bookings.filter(
    b => b.resourceAssetId === selectedAssetId && b.status !== 'Cancelled'
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Submit Booking with precise overlap checking
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');

    if (!selectedAssetId) {
      setBookingError('No shared resource selected.');
      return;
    }

    // Parse start and end times in local/ISO format
    const startIso = `${bookingForm.date}T${bookingForm.startHour}:00`;
    const endIso = `${bookingForm.date}T${bookingForm.endHour}:00`;

    const res = onAddBooking(
      selectedAssetId,
      currentUser.id,
      currentUser.departmentId,
      startIso,
      endIso
    );

    if (res.success) {
      setShowAddModal(false);
    } else {
      setBookingError(res.error || 'Overlap error.');
    }
  };

  // Helper getters
  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown Employee';
  const getDeptName = (id: string | null) => {
    if (!id) return 'Personal Allocation';
    return departments.find(d => d.id === id)?.name || 'Unknown Department';
  };

  return (
    <div className="space-y-6" id="bookings-view-container">
      {/* Title */}
      <div>
        <h2 className="text-lg font-semibold text-white">Shared Resource Scheduler</h2>
        <p className="text-xs text-slate-400">Book boardrooms, development vehicles, AV hardware, and workspace rooms without conflict.</p>
      </div>

      {/* Main Grid: Resource Selector on Left, Timeline/Agenda on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RESOURCE SELECTOR */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <CalendarDays className="w-4 h-4 text-sky-400" />
            <span>Shared Resource Assets</span>
          </h3>

          <div className="space-y-2">
            {bookableAssets.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No bookable resources registered.</p>
            ) : (
              bookableAssets.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAssetId(a.id)}
                  className={`w-full text-left p-4 rounded-xl border transition flex flex-col gap-1.5 cursor-pointer ${
                    selectedAssetId === a.id 
                      ? 'bg-sky-500/10 border-sky-500/40 text-white' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">{a.assetTag}</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-400 font-medium capitalize">
                      {a.status}
                    </span>
                  </div>
                  <h4 className={`font-semibold text-sm ${selectedAssetId === a.id ? 'text-white' : 'text-slate-200'}`}>{a.name}</h4>
                  <p className="text-[11px] text-slate-500">{a.location}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* AGENDA & BOOKINGS LOG */}
        <div className="lg:col-span-8 space-y-4">
          {selectedAsset ? (
            <div className="space-y-4">
              
              {/* Selected Resource info header */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-sky-400">Selected Calendar</span>
                  <h3 className="text-lg font-bold text-white">{selectedAsset.name}</h3>
                  <p className="text-xs text-slate-400">Location: {selectedAsset.location} | S/N: {selectedAsset.serialNumber}</p>
                </div>

                <button
                  onClick={() => {
                    setBookingError('');
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition self-start sm:self-auto cursor-pointer"
                  id="book-slot-btn"
                >
                  <Plus className="w-4 h-4" />
                  <span>Reserve Slot</span>
                </button>
              </div>

              {/* Booking List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Reservations Schedule</h4>
                
                {assetBookings.length === 0 ? (
                  <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-sm">
                    No active reservations scheduled for this resource. Start by booking a slot!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {assetBookings.map(b => {
                      const startTime = new Date(b.startTime);
                      const endTime = new Date(b.endTime);
                      
                      const dayStr = startTime.toLocaleDateString([], {
                        weekday: 'short', month: 'short', day: 'numeric'
                      });
                      const startStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const endStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      const isMine = b.bookedBy === currentUser.id;

                      return (
                        <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex flex-col items-center justify-center font-bold text-sky-400">
                              <span className="text-[10px] uppercase font-bold">{startTime.toLocaleString([], { month: 'short' })}</span>
                              <span className="text-sm font-black -mt-1">{startTime.getDate()}</span>
                            </div>

                            <div className="space-y-0.5">
                              <p className="font-semibold text-white text-sm">
                                Reserved by: {getEmployeeName(b.bookedBy)}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 font-medium">
                                <p className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-500" /> <span>{startStr} – {endStr}</span></p>
                                <span>•</span>
                                <p className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-slate-500" /> <span>{getDeptName(b.departmentId)}</span></p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              b.status === 'Upcoming' 
                                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' 
                                : b.status === 'Ongoing'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {b.status}
                            </span>

                            {(isMine || isManagerOrAdmin) && b.status === 'Upcoming' && (
                              <button
                                onClick={() => onCancelBooking(b.id)}
                                className="text-slate-400 hover:text-rose-400 p-1 rounded-lg border border-slate-800 hover:border-rose-500/20 bg-slate-950/40 hover:bg-rose-500/5 transition cursor-pointer"
                                title="Cancel booking slot"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
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
              Please choose a shared asset from the left panel.
            </div>
          )}
        </div>
      </div>

      {/* BOOK SLOT MODAL */}
      {showAddModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-md flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>Reserve Shared Slot</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold">&times;</button>
            </div>
            <form onSubmit={handleBookingSubmit} className="p-5 space-y-4">
              
              {bookingError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1 text-slate-400">
                <p>Shared Asset: <strong className="text-white">{selectedAsset.name}</strong></p>
                <p>Booking Under: <strong className="text-white">{currentUser.name}</strong> ({getDeptName(currentUser.departmentId)})</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Date of Reservation</label>
                <input
                  type="date"
                  required
                  value={bookingForm.date}
                  onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Start Time</label>
                  <select
                    value={bookingForm.startHour}
                    onChange={e => setBookingForm({ ...bookingForm, startHour: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                  >
                    <option value="08:00">08:00 AM</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">End Time</label>
                  <select
                    value={bookingForm.endHour}
                    onChange={e => setBookingForm({ ...bookingForm, endHour: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none"
                  >
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                    <option value="19:00">07:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg cursor-pointer"
                >
                  Verify & Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
