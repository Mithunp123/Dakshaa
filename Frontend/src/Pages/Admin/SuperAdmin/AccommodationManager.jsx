import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bed,
  Users,
  CheckCircle2,
  Clock,
  Search,
  UserCheck,
  DollarSign,
  Home,
  MapPin,
  Calendar,
  RefreshCw,
  Save,
  X
} from "lucide-react";
import { supabase } from "../../../supabase";

const AccommodationManager = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBeds: 500,
    occupied: 0,
    available: 0
  });
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomNumber, setRoomNumber] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh on visibility change and location change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Tab visible, refreshing accommodation data...');
        fetchData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

  useEffect(() => {
    filterBookings();
  }, [searchQuery, statusFilter, bookings]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all accommodation bookings from accommodation_requests table
      const { data, error } = await supabase
        .from("accommodation_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Aggregate bookings by user_id (since users can extend their booking)
      const userBookingsMap = {};
      
      data.forEach(booking => {
        const userId = booking.user_id;
        
        // Parse dates from special_requests
        let bookingDates = [];
        try {
          const specialData = JSON.parse(booking.special_requests || '{}');
          if (specialData.dates) bookingDates = specialData.dates;
        } catch (e) {}
        
        if (!userBookingsMap[userId]) {
          // First booking for this user
          userBookingsMap[userId] = {
            id: booking.id,
            ids: [booking.id], // Keep all booking IDs
            user_id: booking.user_id,
            full_name: booking.full_name,
            email: booking.email,
            college: booking.college_name,
            mobile: booking.phone,
            gender: booking.gender,
            payment_status: booking.payment_status,
            payment_amount: parseFloat(booking.total_price) || 0,
            check_in_status: booking.check_in_status,
            check_in_time: booking.check_in_time,
            room_no: booking.room_no,
            booked_dates: bookingDates,
            created_at: booking.created_at
          };
        } else {
          // Additional booking for same user - aggregate
          userBookingsMap[userId].ids.push(booking.id);
          userBookingsMap[userId].payment_amount += parseFloat(booking.total_price) || 0;
          userBookingsMap[userId].booked_dates = [...userBookingsMap[userId].booked_dates, ...bookingDates];
          
          // Update status to PAID if any booking is paid
          if (booking.payment_status === 'PAID') {
            userBookingsMap[userId].payment_status = 'PAID';
          }
          
          // Keep the room assignment if any booking has it
          if (booking.room_no && !userBookingsMap[userId].room_no) {
            userBookingsMap[userId].room_no = booking.room_no;
          }
          
          // Keep check-in status if any booking is checked in
          if (booking.check_in_status) {
            userBookingsMap[userId].check_in_status = true;
            userBookingsMap[userId].check_in_time = booking.check_in_time;
          }
        }
      });

      // Convert to array and calculate days_booked from unique dates
      const formattedBookings = Object.values(userBookingsMap).map(booking => ({
        ...booking,
        days_booked: booking.booked_dates.length || 1
      }));

      setBookings(formattedBookings);

      // Calculate stats
      const occupied = formattedBookings.filter(b => b.room_no).length;
      setStats({
        totalBeds: 500,
        occupied,
        available: 500 - occupied
      });
    } catch (error) {
      console.error("Error fetching accommodation data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (searchQuery) {
      filtered = filtered.filter(b =>
        b.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.college?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.mobile?.includes(searchQuery) ||
        b.room_no?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter === "paid_unassigned") {
      filtered = filtered.filter(b => b.payment_status === "PAID" && !b.room_no);
    } else if (statusFilter === "assigned") {
      filtered = filtered.filter(b => b.room_no);
    } else if (statusFilter === "checked_in") {
      filtered = filtered.filter(b => b.check_in_status);
    } else if (statusFilter === "pending_payment") {
      filtered = filtered.filter(b => b.payment_status === "PENDING");
    }

    setFilteredBookings(filtered);
  };

  const handleAssignRoom = async (booking, room) => {
    try {
      // Update all booking records for this user
      const bookingIds = booking.ids || [booking.id];
      
      const { error } = await supabase
        .from("accommodation_requests")
        .update({ room_no: room })
        .in("id", bookingIds);

      if (error) throw error;

      setEditingRoom(null);
      setRoomNumber("");
      await fetchData();
    } catch (error) {
      console.error("Error assigning room:", error);
      alert("Failed to assign room");
    }
  };

  const handleCheckIn = async (booking) => {
    try {
      // Update all booking records for this user
      const bookingIds = booking.ids || [booking.id];
      
      const { error } = await supabase
        .from("accommodation_requests")
        .update({
          check_in_status: true,
          check_in_time: new Date().toISOString()
        })
        .in("id", bookingIds);

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error("Error checking in:", error);
      alert("Failed to check in");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  const paidUnassigned = bookings.filter(b => b.payment_status === "PAID" && !b.room_no).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accommodation Management</h1>
          <p className="text-gray-400 text-sm mt-1">Manage hostel bookings and room allocations</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 rounded-xl transition-colors"
        >
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Home className="text-blue-500" size={24} />
            <span className="text-2xl font-bold">{stats.totalBeds}</span>
          </div>
          <p className="text-sm text-gray-400">Total Beds</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Bed className="text-green-500" size={24} />
            <span className="text-2xl font-bold">{stats.occupied}</span>
          </div>
          <p className="text-sm text-gray-400">Occupied</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="text-purple-500" size={24} />
            <span className="text-2xl font-bold">{stats.available}</span>
          </div>
          <p className="text-sm text-gray-400">Available</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Clock className="text-orange-500" size={24} />
            <span className="text-2xl font-bold">{paidUnassigned}</span>
          </div>
          <p className="text-sm text-gray-400">Awaiting Assignment</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, college, mobile, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary"
        >
          <option value="all">All Bookings</option>
          <option value="paid_unassigned">Paid but Unassigned</option>
          <option value="assigned">Room Assigned</option>
          <option value="checked_in">Checked In</option>
          <option value="pending_payment">Pending Payment</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left p-4 font-semibold">Student</th>
                <th className="text-left p-4 font-semibold">College</th>
                <th className="text-left p-4 font-semibold">Mobile</th>
                <th className="text-left p-4 font-semibold">Days</th>
                <th className="text-left p-4 font-semibold">Payment</th>
                <th className="text-left p-4 font-semibold">Room No</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{booking.full_name}</p>
                      <p className="text-xs text-gray-500">{booking.email}</p>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400">{booking.college}</td>
                  <td className="p-4 text-gray-400">{booking.mobile}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs">
                      {booking.days_booked} day{booking.days_booked > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="p-4">
                    {booking.payment_status === "PAID" ? (
                      <span className="flex items-center gap-2 text-green-500 text-sm">
                        <CheckCircle2 size={14} />
                        ₹{booking.payment_amount}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-orange-500 text-sm">
                        <Clock size={14} />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {editingRoom === booking.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                          placeholder="Block A - 101"
                          className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-secondary text-sm w-32"
                        />
                        <button
                          onClick={() => handleAssignRoom(booking, roomNumber)}
                          className="p-1 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded transition-colors"
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingRoom(null);
                            setRoomNumber("");
                          }}
                          className="p-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : booking.room_no ? (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-purple-500" />
                        <span className="text-purple-400 font-medium">{booking.room_no}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Not Assigned</span>
                    )}
                  </td>
                  <td className="p-4">
                    {booking.check_in_status ? (
                      <span className="flex items-center gap-2 text-green-500">
                        <CheckCircle2 size={16} />
                        Checked In
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-gray-500">
                        <Clock size={16} />
                        Awaiting
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {!booking.room_no && booking.payment_status === "PAID" && (
                        <button
                          onClick={() => {
                            setEditingRoom(booking.id);
                            setRoomNumber(booking.room_no || "");
                          }}
                          className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors text-sm"
                        >
                          Assign Room
                        </button>
                      )}
                      {booking.room_no && !booking.check_in_status && (
                        <button
                          onClick={() => handleCheckIn(booking)}
                          className="px-3 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors text-sm flex items-center gap-1"
                        >
                          <UserCheck size={14} />
                          Check In
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Bed size={48} className="mx-auto mb-4 opacity-50" />
            <p>No bookings found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccommodationManager;
