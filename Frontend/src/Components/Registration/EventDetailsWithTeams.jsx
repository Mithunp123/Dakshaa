import React, { useState, useEffect } from "react";
import { Users, Eye, Calendar, MapPin } from "lucide-react";
import TeamDetailsView from "../TeamManagement/TeamDetailsView";

const EventDetailsWithTeams = ({ event, registrations, showTeamDetails = true, hideActions = false }) => {
  const [isTeamEvent, setIsTeamEvent] = useState(false);

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
        />
      </div>
    );
  }

  // Individual event registrations table
  console.log(`👤 Individual Event "${event?.name}" - Registrations count:`, registrations?.length);
  console.log(`👤 Individual Event registrations:`, registrations);
  
  return (
    <div>
      {/* Individual Event Header */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-green-400 font-medium">Individual Event</p>
            <p className="text-gray-400 text-sm">Showing {registrations?.length || 0} individual participant registrations</p>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {registrations && registrations.length > 0 ? (
                registrations.map((registration, index) => (
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
                      <td className="px-4 py-3">
                        <button className="text-cyan-400 hover:text-cyan-300">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={hideActions ? 4 : 5} className="px-4 py-8 text-center text-gray-400">
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