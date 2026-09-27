import os

file_path = r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\frontend\src\components\layouts\AppLayout.tsx"
with open(file_path, "r") as f:
    content = f.read()

if "useNavigate" not in content:
    content = content.replace("import { Outlet } from 'react-router-dom';", "import { Outlet, useNavigate } from 'react-router-dom';")
    content = content.replace("const { user, logout } = useAuth();", "const { user, logout } = useAuth();\n  const navigate = useNavigate();")

with open(file_path, "w") as f:
    f.write(content)

page_code = """
import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { apiClient } from '../api/client';

export function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        apiClient.get('/notifications/').then(res => setNotifications(res.data)).catch(console.error);
    }, []);

    const markRead = (id: int) => {
        apiClient.put(`/notifications/${id}/read`).then(() => {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        }).catch(console.error);
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                <Bell className="h-6 w-6 text-blue-600" /> Notifications
            </h1>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No notifications.</div>
                ) : notifications.map((n) => (
                    <div key={n.id} className={`p-4 flex items-start gap-4 ${n.is_read ? 'bg-slate-50 opacity-75' : 'bg-white'}`}>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-slate-900">{n.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                            <span className="text-xs text-slate-400 mt-2 block">{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        {!n.is_read && (
                            <button onClick={() => markRead(n.id)} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" /> Mark read
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
"""

with open(r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\frontend\src\pages\NotificationsPage.tsx", "w") as f:
    f.write(page_code.strip())

index_path = r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\frontend\src\pages\index.ts"
with open(index_path, "a") as f:
    f.write("\nexport * from './NotificationsPage';\n")

routes_path = r"C:\Users\ASUS VIVOBOOK\OneDrive\Desktop\MetriSure\frontend\src\routes\index.tsx"
with open(routes_path, "r") as f:
    routes_content = f.read()

if "NotificationsPage" not in routes_content:
    routes_content = routes_content.replace("PlaceholderPage", "PlaceholderPage, NotificationsPage")
    routes_content = routes_content.replace('<Route path="/dashboard" element={<DashboardPage />} />', '<Route path="/dashboard" element={<DashboardPage />} />\n          <Route path="/notifications" element={<NotificationsPage />} />')
    with open(routes_path, "w") as f:
        f.write(routes_content)

print("Frontend updated for notifications.")
