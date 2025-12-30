import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../../services/supabaseService';
import { Edit2, Save, X, Users } from 'lucide-react';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ price: 0, capacity: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await supabaseService.getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (event) => {
    setEditingId(event.event_id);
    setEditForm({ price: event.price, capacity: event.capacity });
  };

  const handleUpdate = async (eventId) => {
    try {
      await supabaseService.updateEvent(eventId, editForm);
      setEditingId(null);
      fetchEvents();
    } catch (error) {
      alert('Update failed: ' + error.message);
    }
  };

  if (loading) return <div className="text-center p-10">Loading Admin Data...</div>;

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Event Management</h2>
        <div className="bg-blue-600 px-4 py-2 rounded-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          <span>Total Events: {events.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto bg-gray-800 rounded-xl border border-gray-700">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-900/50">
              <th className="p-4">Event ID</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price (₹)</th>
              <th className="p-4">Capacity</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.event_id} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                <td className="p-4 font-mono text-sm">{event.event_id}</td>
                <td className="p-4 capitalize">{event.category}</td>
                <td className="p-4">
                  {editingId === event.event_id ? (
                    <input 
                      type="number" 
                      value={editForm.price}
                      onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                      className="bg-gray-900 border border-gray-600 rounded px-2 py-1 w-24"
                    />
                  ) : (
                    `₹${event.price}`
                  )}
                </td>
                <td className="p-4">
                  {editingId === event.event_id ? (
                    <input 
                      type="number" 
                      value={editForm.capacity}
                      onChange={(e) => setEditForm({...editForm, capacity: e.target.value})}
                      className="bg-gray-900 border border-gray-600 rounded px-2 py-1 w-24"
                    />
                  ) : (
                    event.capacity
                  )}
                </td>
                <td className="p-4">
                  {editingId === event.event_id ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(event.event_id)} className="text-green-500 hover:text-green-400">
                        <Save className="w-5 h-5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-400">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEditing(event)} className="text-blue-500 hover:text-blue-400">
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
