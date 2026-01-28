import React, { useState, useEffect } from "react";
import { Users, Eye, Calendar, MapPin } from "lucide-react";
import TeamDetailsView from "../TeamManagement/TeamDetailsView";

const EventDetailsWithTeams = ({ event, registrations, showTeamDetails = true }) => {
  const [isTeamEvent, setIsTeamEvent] = useState(false);

  useEffect(() => {
    // Check if this is a team event based on event name/category
    const teamEventKeywords = ['paper presentation', 'team', 'group', 'mct'];
    const eventName = event?.name?.toLowerCase() || '';
    const eventCategory = event?.category?.toLowerCase() || '';
    
    const isTeamBased = teamEventKeywords.some(keyword => 
      eventName.includes(keyword) || eventCategory.includes(keyword)
    );
    
    setIsTeamEvent(isTeamBased);
  }, [event]);

  // For team events, show TeamDetailsView only
  // For individual events, show individual registrations table
  if (isTeamEvent && showTeamDetails) {
    return (
      <TeamDetailsView
        eventId={event?.id}
        eventName={event?.name}
        showHeader={true}
      />
    );
  }

  // Individual event registrations table
  return (
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {registrations?.map((registration, index) => (
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
                <td className="px-4 py-3">
                  <button className="text-cyan-400 hover:text-cyan-300">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventDetailsWithTeams;