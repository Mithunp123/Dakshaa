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
      
      // Only fetch coordinator assigned events
      if (profile?.role === 'event_coordinator') {
        const { data: coords, error: coordError } = await supabase
          .from('event_coordinators')
          .select('event_id')
          .eq('user_id', user.id);
        
        if (coordError) {
          console.error('❌ Error fetching coordinator assignments:', coordError);
        }
        
        const assignedEventIds = coords?.map(c => c.event_id) || []; // These are TEXT event_ids
        
        console.log('🎯 Assigned Event IDs from coordinators table:', assignedEventIds);
        console.log('📊 Number of assigned events:', assignedEventIds.length);
        
        if (assignedEventIds.length > 0) {
          // Query events using TEXT event_id field
          const { data: assignedEvents, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .in('event_id', assignedEventIds);
          
          if (eventsError) {
            console.error('❌ Error fetching events:', eventsError);
          }
          
          console.log('📊 Found events by event_id TEXT field:', assignedEvents?.length);
          console.log('📊 Events data:', assignedEvents?.map(e => ({ id: e.id, event_id: e.event_id, name: e.name })));
          events = assignedEvents || [];
        }
      }
      
      console.log('👤 Coordinator Role:', profile?.role);
      console.log('📋 Final Assigned Events for Registration:', events.length);
      setAssignedEvents(events);
    } catch (error) {
      console.error('Error fetching assigned events:', error);
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

  return <RegistrationManagement coordinatorEvents={assignedEvents} hideFinancials={true} />;
};

export default RegistrationPage;