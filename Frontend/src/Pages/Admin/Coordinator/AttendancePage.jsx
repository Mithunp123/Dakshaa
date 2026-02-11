import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import AttendanceManagement from '../SuperAdmin/AttendanceManagement';
import { useNavigate } from 'react-router-dom';
import { Printer } from 'lucide-react';

const AttendancePage = () => {
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      
      console.log('👤 AttendancePage - User Role:', profile?.role);
      
      // Only fetch coordinator assigned events for event_coordinator role
      if (profile?.role === 'event_coordinator') {
        const { data: coords, error: coordError } = await supabase
          .from('event_coordinators')
          .select('event_id')
          .eq('user_id', user.id);
        
        if (coordError) {
          console.error('❌ Error fetching coordinator assignments:', coordError);
          setAssignedEvents([]);
          setLoading(false);
          return;
        }
        
        const assignedEventIds = coords?.map(c => c.event_id) || [];
        
        console.log('🎯 AttendancePage - Assigned Event IDs:', assignedEventIds);
        console.log('📊 AttendancePage - Number of assigned events:', assignedEventIds.length);
        
        // If no events are assigned to the coordinator, show empty list
        if (assignedEventIds.length === 0) {
          console.log('⚠️ No events assigned to this coordinator');
          setAssignedEvents([]);
          setLoading(false);
          return;
        }
        
        // Fetch the actual event details (event_id is stored as TEXT in event_coordinators)
        const { data: eventDataByText, error: eventErrorByText } = await supabase
          .from('events')
          .select('id, name, event_id, event_key, category')
          .in('event_id', assignedEventIds)
          .eq('is_active', true);

        if (eventErrorByText) {
          console.error('❌ Error fetching event details by event_id:', eventErrorByText);
        }

        if (eventDataByText && eventDataByText.length > 0) {
          events = eventDataByText;
        } else {
          // Fallback: in case assigned IDs are UUIDs
          const { data: eventDataById, error: eventErrorById } = await supabase
            .from('events')
            .select('id, name, event_id, event_key, category')
            .in('id', assignedEventIds)
            .eq('is_active', true);

          if (eventErrorById) {
            console.error('❌ Error fetching event details by id:', eventErrorById);
            setAssignedEvents([]);
            setLoading(false);
            return;
          }

          events = eventDataById || [];
        }
        console.log('✅ Fetched coordinator events for attendance:', events.length);
      } else {
        // For super_admin, don't pass coordinator events (null = show all)
        console.log('👑 Super Admin - showing all events');
        events = null;
      }
      
      setAssignedEvents(events);
    } catch (error) {
      console.error('❌ Error in fetchAssignedEvents:', error);
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

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => navigate('/admin/coordinator/attendance/print-qr')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-lg"
        >
          <Printer size={18} />
          <span>Print QR Badges</span>
        </button>
      </div>
      <AttendanceManagement coordinatorEvents={assignedEvents} />
    </div>
  );
};

export default AttendancePage;
