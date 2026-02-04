import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import RegistrationManagement from '../SuperAdmin/RegistrationManagement';

const RegistrationPage = () => {
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedEvents();
  }, []);

  const fetchAssignedEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      let events = [];
      
      console.log('👤 User Role:', profile?.role);
      
      // Only fetch coordinator assigned events for event_coordinator role
      if (profile?.role === 'event_coordinator') {
        const { data: coords, error: coordError } = await supabase
          .from('event_coordinators')
          .select('event_id')
          .eq('user_id', user.id);
        
        if (coordError) {
          console.error('❌ Error fetching coordinator assignments:', coordError);
          setAssignedEvents([]);
          return;
        }
        
        const assignedEventIds = coords?.map(c => c.event_id) || [];
        
        console.log('🎯 Assigned Event IDs from coordinators table:', assignedEventIds);
        console.log('📊 Number of assigned events:', assignedEventIds.length);
        
        // If no events are assigned to the coordinator, show empty list
        if (assignedEventIds.length === 0) {
          console.log('⚠️ No events assigned to this coordinator');
          setAssignedEvents([]);
          return;
        }
        
        // Query events using TEXT event_id field
        const { data: assignedEvents, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            event_id,
            name,
            title,
            event_name,
            description,
            venue,
            category,
            event_type,
            type,
            price,
            capacity,
            is_team_event,
            min_team_size,
            max_team_size,
            is_open,
            is_active
          `)
          .in('event_id', assignedEventIds)
          .eq('is_active', true);
        
        if (eventsError) {
          console.error('❌ Error fetching events:', eventsError);
          setAssignedEvents([]);
          return;
        }
        
        console.log('📊 Found events by event_id TEXT field:', assignedEvents?.length);
        console.log('📊 Events data:', assignedEvents?.map(e => ({ id: e.id, event_id: e.event_id, name: e.name, is_team_event: e.is_team_event })));
        events = assignedEvents || [];
      } else if (profile?.role === 'super_admin') {
        // Super admin can see all events
        const { data: allEvents, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            event_id,
            name,
            title,
            event_name,
            description,
            venue,
            category,
            event_type,
            type,
            price,
            capacity,
            is_team_event,
            min_team_size,
            max_team_size,
            is_open,
            is_active
          `)
          .eq('is_active', true);
        
        if (eventsError) {
          console.error('❌ Error fetching all events:', eventsError);
        }
        
        events = allEvents || [];
      } else {
        // Other roles have no access to events
        console.log('⚠️ User role does not have access to event management');
        events = [];
      }
      
      console.log('📋 Final Assigned Events for Registration:', events.length);
      setAssignedEvents(events);
    } catch (error) {
      console.error('Error fetching assigned events:', error);
      setAssignedEvents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  // Show message if coordinator has no assigned events
  if (assignedEvents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center p-8 max-w-md mx-auto">
          <div className="mb-6">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l6 6m0-6l-6 6" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">No Events Assigned</h2>
            <p className="text-gray-400 text-center">
              You currently have no events assigned to coordinate. Please contact your administrator to assign events to your account.
            </p>
          </div>
          <div className="p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
            <p className="text-blue-300 text-sm">
              <strong>Note:</strong> Only super administrators can assign events to coordinators.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <RegistrationManagement coordinatorEvents={assignedEvents} hideFinancials={true} />;
};

export default RegistrationPage;