'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, DollarSign, Clock, Star, 
  Calendar, Video, CheckCircle, XCircle, 
  ChevronRight, MoreHorizontal, Bell 
} from 'lucide-react';

// --- Types ---
interface Lesson {
  id: string;
  title: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string;
  duration: number;
  price: number;
  student: {
    name: string;
    profileImage: string | null;
    email: string;
  };
  skill: {
    name: string;
  };
}

interface DashboardStats {
  earnings: number;
  students: number;
  hours: number;
  rating: number;
}

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({ earnings: 0, students: 0, hours: 0, rating: 0 });
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Lesson[]>([]);
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch User Stats
        const userRes = await fetch('/api/users/me', { headers });
        const userData = await userRes.json();
        
        // 2. Fetch All Lessons (we'll filter client-side for this demo, usually backend filters are better)
        const lessonsRes = await fetch('/api/lessons?role=teacher&limit=50', { headers });
        const lessonsData = await lessonsRes.json();
        const allLessons: Lesson[] = lessonsData.lessons || [];

        // Process Data
        const confirmed = allLessons.filter(l => l.status === 'CONFIRMED' && new Date(l.scheduledAt) > new Date());
        const pending = allLessons.filter(l => l.status === 'PENDING');
        
        // Mock Earnings Calculation (Sum of completed lessons)
        const completed = allLessons.filter(l => l.status === 'COMPLETED');
        const totalEarnings = completed.reduce((acc, curr) => acc + curr.price, 0);

        setUser(userData);
        setStats({
          earnings: totalEarnings,
          students: userData.stats?.lessonsAsTeacher || 0, // Using total lessons as proxy for students
          hours: userData.stats?.lessonsAsTeacher || 0, // Approx 1hr/lesson
          rating: userData.stats?.averageRating || 0,
        });
        setUpcomingLessons(confirmed.slice(0, 3)); // Top 3
        setPendingRequests(pending);

      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Actions ---
  const handleAction = async (lessonId: string, action: 'accept' | 'decline') => {
    // Note: You need a PATCH endpoint for this in your backend
    // For UI demo, we'll optimistically update the state
    alert(`${action === 'accept' ? 'Accepted' : 'Declined'} lesson request.`);
    setPendingRequests(prev => prev.filter(l => l.id !== lessonId));
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-gray-900 font-sans pb-20">
      
      {/* --- Header --- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Teacher View</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/profile" className="text-sm font-bold hover:underline">My Profile</Link>
          <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 relative">
            <Bell size={20} />
            {pendingRequests.length > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* --- 1. Welcome & Quick Stats --- */}
        <div>
          <h2 className="text-3xl font-bold mb-6">Welcome back, {user?.name.split(' ')[0]}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              label="Total Earnings" 
              value={`$${stats.earnings}`} 
              icon={<DollarSign size={24} className="text-green-600" />} 
              trend="+12% this month"
            />
            <StatCard 
              label="Total Students" 
              value={stats.students.toString()} 
              icon={<Users size={24} className="text-blue-600" />} 
            />
            <StatCard 
              label="Hours Taught" 
              value={`${stats.hours}h`} 
              icon={<Clock size={24} className="text-purple-600" />} 
            />
            <StatCard 
              label="Rating" 
              value={stats.rating.toFixed(1)} 
              icon={<Star size={24} className="text-yellow-500 fill-yellow-500" />} 
            />
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          
          {/* --- 2. LEFT COL: Action Center (Span 8) --- */}
          <div className="md:col-span-8 space-y-8">
            
            {/* Pending Requests */}
            <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Lesson Requests
                </h3>
                <span className="text-sm font-bold text-gray-400">{pendingRequests.length} Pending</span>
              </div>
              
              {pendingRequests.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {pendingRequests.map((lesson) => (
                    <div key={lesson.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row items-center gap-6">
                      <div className="flex items-center gap-4 flex-1 w-full">
                        <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden shrink-0">
                          <img src={lesson.student.profileImage || `https://ui-avatars.com/api/?name=${lesson.student.name}`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{lesson.student.name}</h4>
                          <p className="text-gray-500 text-sm">{lesson.title} • ${lesson.price}</p>
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mt-1">
                            <Calendar size={12} /> {new Date(lesson.scheduledAt).toLocaleDateString()} at {new Date(lesson.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <button 
                          onClick={() => handleAction(lesson.id, 'decline')}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-100 text-gray-600"
                        >
                          Decline
                        </button>
                        <button 
                          onClick={() => handleAction(lesson.id, 'accept')}
                          className="flex-1 px-6 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 shadow-md"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={24} />
                  </div>
                  <p>You're all caught up! No pending requests.</p>
                </div>
              )}
            </div>

            {/* Upcoming Schedule */}
            <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Upcoming Classes</h3>
                <Link href="/dashboard/schedule" className="text-sm font-bold text-indigo-600 hover:underline">View Calendar</Link>
              </div>

              {upcomingLessons.length > 0 ? (
                <div className="space-y-4">
                  {upcomingLessons.map((lesson) => (
                    <div key={lesson.id} className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-black transition-colors cursor-pointer bg-gray-50 hover:bg-white hover:shadow-md">
                      <div className="flex flex-col items-center justify-center w-16 h-16 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase">{new Date(lesson.scheduledAt).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="text-xl font-bold">{new Date(lesson.scheduledAt).getDate()}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-lg">{lesson.title}</h4>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold">Confirmed</span>
                        </div>
                        <p className="text-gray-500 text-sm">with {lesson.student.name}</p>
                        <div className="text-xs font-mono text-gray-400 mt-1">
                          {new Date(lesson.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({lesson.duration} mins)
                        </div>
                      </div>
                      <button className="p-3 bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 shadow-lg">
                        <Video size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No upcoming lessons scheduled.</p>
              )}
            </div>

          </div>

          {/* --- 3. RIGHT COL: Sidebar (Span 4) --- */}
          <div className="md:col-span-4 space-y-6">
            
            {/* Availability Quick Link */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Manage Schedule</h3>
                <p className="text-indigo-100 text-sm mb-6">Update your weekly availability slots to get more bookings.</p>
                <Link href="/dashboard/profile/schedule">
                  <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg">
                    Edit Availability
                  </button>
                </Link>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* Quick Actions List */}
            <div className="bg-white rounded-[2rem] border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold mb-4 px-2">Quick Actions</h3>
              <div className="space-y-1">
                <SidebarLink icon={<Users size={18} />} label="My Students" href="#" />
                <SidebarLink icon={<DollarSign size={18} />} label="Payout Settings" href="#" />
                <SidebarLink icon={<Star size={18} />} label="Read Reviews" href="#" />
                <SidebarLink icon={<CheckCircle size={18} />} label="Verify Profile" href="#" badge="New" />
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

// --- Helper Components ---

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between h-32 hover:border-gray-300 transition-colors">
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black">{value}</div>
        {trend && <div className="text-xs font-bold text-green-600 mt-1">{trend}</div>}
      </div>
    </div>
  );
}

function SidebarLink({ icon, label, href, badge }: { icon: React.ReactNode, label: string, href: string, badge?: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-black transition-colors group">
      <div className="flex items-center gap-3 font-medium">
        <span className="text-gray-400 group-hover:text-black transition-colors">{icon}</span>
        {label}
      </div>
      {badge ? (
        <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-full">{badge}</span>
      ) : (
        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
      )}
    </Link>
  );
}