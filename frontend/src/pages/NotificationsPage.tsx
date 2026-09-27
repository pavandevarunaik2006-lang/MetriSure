import { useEffect, useState } from 'react';
import { Bell, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = () => {
    setLoading(true);
    apiClient.get('/notifications/')
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.items) ? res.data.items : []);
        setNotifications(items);
      })
      .catch(err => {
        console.error("Failed to load notifications:", err);
        setError(err.message || 'Failed to load notifications');
      })
      .finally(() => setLoading(false));
  };

  const markRead = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    apiClient.put(`/notifications/${id}/read`).then(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }).catch(console.error);
  };

  const handleNotificationClick = (n: any) => {
    if (!n.is_read) {
      markRead(n.id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="h-6 w-6 text-blue-600" /> Notifications
        </h1>
        {notifications.some(n => !n.is_read) && (
          <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-full">
            {notifications.filter(n => !n.is_read).length} Unread
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 bg-rose-50">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Bell className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">No notifications</p>
            <p className="text-xs text-slate-400 mt-1">You're all caught up with alerts and activities.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              onClick={() => handleNotificationClick(n)}
              className={`p-4 flex items-start gap-4 transition-colors cursor-pointer hover:bg-slate-50 ${n.is_read ? 'bg-slate-50/60 opacity-80' : 'bg-white'}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{n.title}</h3>
                  {!n.is_read && (
                    <span className="h-2 w-2 rounded-full bg-blue-600 inline-block"></span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-slate-400">{n.created_at ? new Date(n.created_at).toLocaleString() : 'Recent'}</span>
                  {n.link && (
                    <span className="text-xs text-blue-600 flex items-center gap-0.5 font-medium hover:underline">
                      View details <ExternalLink className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
              {!n.is_read && (
                <button 
                  onClick={(e) => markRead(n.id, e)} 
                  className="text-slate-400 hover:text-blue-600 text-sm font-medium flex items-center gap-1 p-1 rounded transition-colors"
                  title="Mark as read"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}