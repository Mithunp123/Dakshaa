import React, { useState, useEffect } from "react";
import { Users, Eye, MoreVertical, Printer, Loader2 } from "lucide-react";
import TeamDetailsView from "../TeamManagement/TeamDetailsView";
import { motion, AnimatePresence } from "framer-motion";

const EventDetailsWithTeams = ({ event, registrations, showTeamDetails = true, hideActions = false, paymentFilter = 'all', onRefresh, onPrintQR, onPrintTeamQR, printingQR = false, isCoordinator = false }) => {
  const [isTeamEvent, setIsTeamEvent] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // Filter registrations based on payment status
  const filteredRegistrations = registrations?.filter(reg => {
    if (paymentFilter === 'all') return true;
    return reg.payment_status === paymentFilter;
  }) || [];

  // Action handler
  const handleViewDetails = (participant) => {
    setSelectedParticipant(participant);
    setShowDetailsModal(true);
    setActiveActionMenu(null);
  };

  useEffect(() => {
    // First check the database is_team_event field
    if (event?.is_team_event !== undefined) {
      console.log(`🎯 Event "${event.name}" - Database is_team_event:`, event.is_team_event);
      setIsTeamEvent(event.is_team_event);
    } else {
      // Fallback: Check if this is a team event based on event name/category for backward compatibility
      // Enhanced list of keywords for better detection
      const teamEventKeywords = [
        'paper presentation', 'team', 'group', 'mct', 'hackathon', 'conference',
        'project', 'coding', 'development', 'innovation', 'collaboration',
        'presentation', 'demo', 'showcase', 'competition', 'contest',
        'workshop', 'seminar', 'symposium', 'debate', 'discussion'
      ];
      const eventName = event?.name?.toLowerCase() || '';
      const eventCategory = event?.category?.toLowerCase() || '';
      const eventTitle = event?.title?.toLowerCase() || '';
      const eventDescription = event?.description?.toLowerCase() || '';
      
      const isTeamBased = teamEventKeywords.some(keyword => 
        eventName.includes(keyword) || 
        eventCategory.includes(keyword) ||
        eventTitle.includes(keyword) ||
        eventDescription.includes(keyword)
      );
      
      console.log(`🎯 Event "${event.name}" - Keyword detection result:`, isTeamBased);
      console.log(`🔍 Checked: name="${eventName}", category="${eventCategory}", title="${eventTitle}"`);
      setIsTeamEvent(isTeamBased);
    }
  }, [event]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeActionMenu && !e.target.closest('.action-menu-container')) {
        setActiveActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeActionMenu]);

  // For team events, show TeamDetailsView only
  // For individual events, show individual registrations table
  if (isTeamEvent && showTeamDetails) {
    return (
      <div>
        {/* Team Event Header */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-400" />
            <div>
              <p className="text-orange-400 font-medium">Team Event</p>
              <p className="text-gray-400 text-sm">Showing team registrations with all team members</p>
            </div>
          </div>
        </div>
        
        <TeamDetailsView
          eventId={event?.id}
          eventName={event?.name}
          showHeader={true}
          paymentFilter={paymentFilter}
          onPrintTeamQR={onPrintTeamQR}
          printingQR={printingQR}
          isCoordinator={isCoordinator}
        />
      </div>
    );
  }

  // Individual event registrations table
  console.log(`👤 Individual Event "${event?.name}" - Registrations count:`, filteredRegistrations?.length);
  console.log(`👤 Individual Event registrations:`, filteredRegistrations);
  
  // Participant Details Modal
  const ParticipantDetailsModal = () => {
    if (!showDetailsModal || !selectedParticipant) return null;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Participant Details</h2>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Full Name</p>
                  <p className="text-white font-medium">
                    {selectedParticipant.profiles?.full_name || selectedParticipant.user_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white font-medium">
                    {selectedParticipant.profiles?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Mobile Number</p>
                  <p className="text-white font-medium">
                    {selectedParticipant.profiles?.mobile_number || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">College/Institution</p>
                  <p className="text-white font-medium">
                    {selectedParticipant.profiles?.college_name || selectedParticipant.college || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Department</p>
                  <p className="text-white font-medium">
                    {selectedParticipant.profiles?.department || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Roll Number</p>
                  <p className="text-white font-medium">
                    {selectedParticipant.profiles?.roll_no || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Information */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">Registration Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Registration ID</p>
                  <p className="text-white font-medium font-mono">
                    {selectedParticipant.id || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Registered On</p>
                  <p className="text-white font-medium">
                    {new Date(selectedParticipant.registered_at || selectedParticipant.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Payment Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                    selectedParticipant.payment_status === 'PAID' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {selectedParticipant.payment_status || 'PENDING'}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Attendance</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                    selectedParticipant.attended 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedParticipant.attended ? 'Present' : 'Not Marked'}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Information */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">Event Information</h3>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-white font-semibold text-lg">{event?.name}</p>
                <p className="text-gray-400 text-sm mt-1">{event?.category}</p>
                {event?.price && (
                  <p className="text-cyan-400 mt-2">₹{event.price}</p>
                )}
              </div>
            </div>


          </div>
        </motion.div>
      </div>
    );
  };
  
  return (
    <div>
      {/* Participant Details Modal */}
      <AnimatePresence>
        {showDetailsModal && <ParticipantDetailsModal />}
      </AnimatePresence>
      {/* Individual Event Header */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-green-400 font-medium">Individual Event</p>
            <p className="text-gray-400 text-sm">
              Showing {filteredRegistrations?.length || 0} {paymentFilter !== 'all' ? paymentFilter.toLowerCase() : ''} participant registrations
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Individual Registrations</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  S.NO
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Participant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Payment Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Registered
                </th>
                {!hideActions && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Actions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                      Print QR
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredRegistrations && filteredRegistrations.length > 0 ? (
                filteredRegistrations.map((registration, index) => (
                  <tr key={registration.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-white">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-white font-medium">
                          {registration.profiles?.full_name || registration.user_name || 'Unknown User'}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {registration.profiles?.college_name || registration.college || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        registration.payment_status === 'PAID' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {registration.payment_status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {new Date(registration.registered_at || registration.created_at).toLocaleDateString()}
                    </td>
                    {!hideActions && (
                      <>
                        <td className="px-4 py-3">
                          <div className="relative action-menu-container">
                            <button 
                              onClick={() => setActiveActionMenu(activeActionMenu === registration.id ? null : registration.id)}
                              className="text-gray-400 hover:text-cyan-400 p-1 rounded hover:bg-gray-800/50"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Action Dropdown Menu */}
                            <AnimatePresence>
                              {activeActionMenu === registration.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
                                >
                                  <div className="py-1">
                                    {/* View Details */}
                                    <button
                                      onClick={() => handleViewDetails(registration)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2"
                                    >
                                      <Eye className="w-4 h-4 text-blue-400" />
                                      View Details
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {registration.payment_status === 'PAID' || registration.payment_status === 'completed' ? (
                            isCoordinator && registration.profile?.is_print ? (
                              <span className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400">
                                <Printer className="w-4 h-4" />
                                <span className="text-xs font-medium">Already Printed</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => onPrintQR && onPrintQR(registration)}
                                disabled={printingQR || !onPrintQR}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-green-400"
                              >
                                {printingQR ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Printer className="w-4 h-4" />
                                )}
                                <span className="text-xs font-medium">Print QR</span>
                              </button>
                            )
                          ) : (
                            <span className="text-gray-500 text-xs">Payment pending</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={hideActions ? 4 : 6} className="px-4 py-8 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Eye className="w-8 h-8 opacity-50" />
                      <p>No registrations found for this event</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsWithTeams;