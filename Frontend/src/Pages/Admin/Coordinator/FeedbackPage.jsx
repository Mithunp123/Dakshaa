import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import FeedbackReport from '../SuperAdmin/FeedbackReport';

const FeedbackPage = () => {
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

      if (profile?.role === 'event_coordinator') {
        const { data: coords, error: coordError } = await supabase
          .from('event_coordinators')
          .select('event_id')
          .eq('user_id', user.id);

        if (coordError) {
          console.error('Error fetching coordinator assignments:', coordError);
          setAssignedEvents([]);
          setLoading(false);
          return;
        }

        const assignedEventIds = coords?.map(c => c.event_id) || [];

        if (assignedEventIds.length === 0) {
          setAssignedEvents([]);
          setLoading(false);
          return;
        }

        // Fetch event details by event_id (text field)
        const { data: eventDataByText, error: eventErrorByText } = await supabase
          .from('events')
          .select('id, name, event_id, category')
          .in('event_id', assignedEventIds)
          .eq('is_active', true);

        if (eventErrorByText) {
          console.error('Error fetching event details by event_id:', eventErrorByText);
        }

        if (eventDataByText && eventDataByText.length > 0) {
          events = eventDataByText;
        } else {
          // Fallback: check if assigned IDs are UUIDs
          const { data: eventDataById, error: eventErrorById } = await supabase
            .from('events')
            .select('id, name, event_id, category')
            .in('id', assignedEventIds)
            .eq('is_active', true);

          if (eventErrorById) {
            console.error('Error fetching event details by id:', eventErrorById);
            setAssignedEvents([]);
            setLoading(false);
            return;
          }

          events = eventDataById || [];
        }
      }

      setAssignedEvents(events);
    } catch (error) {
      console.error('Error in fetchAssignedEvents:', error);
      setAssignedEvents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return <FeedbackReport coordinatorEvents={assignedEvents} />;
};

export default FeedbackPage;
