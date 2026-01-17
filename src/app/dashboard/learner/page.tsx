'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Clock, Calendar, Search, Plus, X, 
  MapPin, Edit3, Save, Loader2, Video, CheckCircle2 
} from 'lucide-react';

// --- Types ---
interface Skill {
  id: string;
  name: string;
  category: string;
}

interface User {
  id: string;
  name: string;
  bio: string;
  location: string;
  profileImage: string;
  skillsToLearn: Skill[];
  stats: {
    lessonsAsStudent: number;
    totalReviews: number;
  };
}

interface Lesson {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
  teacher: { name: string; profileImage: string };
}

export default function LearnerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', location: '' });
  
  // Skill Search State
  const [skillQuery, setSkillQuery] = useState('');
  const [skillResults, setSkillResults] = useState<Skill[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- 1. Initial Data Fetch ---
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [userRes, lessonsRes] = await Promise.all([
        fetch('/api/users/me', { headers }),
        fetch('/api/lessons?role=student&status=CONFIRMED', { headers })
      ]);

      const userData = await userRes.json();
      const lessonsData = await lessonsRes.json();

      setUser(userData);
      setEditForm({ 
        name: userData.name, 
        bio: userData.bio || '', 
        location: userData.location || '' 
      });
      
      // Filter for future lessons only
      const future = (lessonsData.lessons || []).filter((l: any) => 
        new Date(l.scheduledAt) > new Date()
      );
      setUpcomingLessons(future);

    } catch (error) {
      console.error('Load failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- 2. Search Skills ---
  useEffect(() => {
    const searchSkills = async () => {
      if (skillQuery.length < 2) {
        setSkillResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/skills?query=${skillQuery}`);
        const data = await res.json();
        setSkillResults(data.skills || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    const timeout = setTimeout(searchSkills, 300); // Debounce
    return () => clearTimeout(timeout);
  }, [skillQuery]);

  // --- 3. Actions (Update Profile, Add/Remove Skill) ---
  
  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(editForm)
    });
    setIsEditing(false);
    fetchData(); // Refresh
  };

  const handleAddSkill = async (skillId: string) => {
    const token = localStorage.getItem('token');
    await fetch('/api/users/me/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ skillId, type: 'learn' })
    });
    setSkillQuery('');
    fetchData();
  };

  const handleRemoveSkill = async (skillId: string) => {
    const token = localStorage.getItem('token');
    await fetch('/api/users/me/skills', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ skillId, type: 'learn' })
    });
    fetchData();
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-20">
      
      {/* --- Header --- */}
      <div className="bg-black text-white pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-800 rounded-full blur-[100px] opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-end gap-8">
          
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gray-800 shrink-0">
            <img 
              src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=333&color=fff`} 
              className="w-full h-full object-cover" 
            />
          </div>

          {/* Info */}
          <div className="flex-1 mb-2">
            <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <span className="flex items-center gap-1"><MapPin size={14} /> {user.location || 'No location set'}</span>
              <span className="flex items-center gap-1"><Calendar size={14} /> Member since {new Date().getFullYear()}</span>
            </div>
          </div>

          {/* Edit Button */}
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full font-bold text-sm transition-all"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
        <div className="grid md:grid-cols-3 gap-8">

          {/* --- LEFT COL: Stats & Bio (Span 1) --- */}
          <div className="space-y-6">
            
            {/* Quick Stats */}
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Lessons Taken</div>
                  <div className="text-3xl font-black">{user.stats.lessonsAsStudent}</div>
                </div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                  <BookOpen size={24} />
                </div>
              </div>
              <div className="h-px bg-gray-100"></div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Reviews Given</div>
                  <div className="text-3xl font-black">{user.stats.totalReviews}</div>
                </div>
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
              </div>
            </div>

            {/* Bio Card */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <h3 className="font-bold mb-4">About Me</h3>
              {isEditing ? (
                <div className="space-y-3">
                  <input 
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-black transition-colors"
                    placeholder="Full Name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  />
                  <input 
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-black transition-colors"
                    placeholder="Location (e.g. New York)"
                    value={editForm.location}
                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  />
                  <textarea 
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-black transition-colors h-32 resize-none"
                    placeholder="Write a short bio..."
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  />
                  <button 
                    onClick={handleSaveProfile}
                    className="w-full py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              ) : (
                <p className="text-gray-600 leading-relaxed text-sm">
                  {user.bio || "No bio added yet. Click edit to introduce yourself!"}
                </p>
              )}
            </div>

          </div>

          {/* --- RIGHT COL: Learning & Schedule (Span 2) --- */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Upcoming Schedule */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock size={20} /> Upcoming Lessons
              </h2>
              {upcomingLessons.length > 0 ? (
                <div className="space-y-3">
                  {upcomingLessons.map(lesson => (
                    <div key={lesson.id} className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="bg-black text-white w-14 h-14 rounded-xl flex flex-col items-center justify-center">
                          <span className="text-xs font-bold uppercase">{new Date(lesson.scheduledAt).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          <span className="text-xl font-bold">{new Date(lesson.scheduledAt).getDate()}</span>
                        </div>
                        <div>
                          <div className="font-bold text-lg">{lesson.title}</div>
                          <div className="text-gray-500 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {new Date(lesson.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • with {lesson.teacher.name}
                          </div>
                        </div>
                      </div>
                      <button className="p-3 bg-gray-100 rounded-full text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
                        <Video size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400">
                  <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No upcoming lessons booked.</p>
                </div>
              )}
            </div>

            {/* Skills I'm Learning */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BookOpen size={20} /> Skills I Want to Learn
              </h2>
              
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                {/* Search Bar */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 font-medium outline-none focus:ring-2 focus:ring-black transition-all placeholder:text-gray-400"
                    placeholder="Search skills to add (e.g. Python, Guitar)..."
                    value={skillQuery}
                    onChange={(e) => setSkillQuery(e.target.value)}
                  />
                  {/* Search Results Dropdown */}
                  {skillResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {skillResults.map(skill => (
                        <button
                          key={skill.id}
                          onClick={() => handleAddSkill(skill.id)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-none flex justify-between items-center group"
                        >
                          <span className="font-medium">{skill.name}</span>
                          <span className="text-xs text-gray-400 uppercase group-hover:text-black">{skill.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills List */}
                <div className="flex flex-wrap gap-3">
                  {user.skillsToLearn.map(skill => (
                    <div key={skill.id} className="group bg-black text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 pr-2">
                      {skill.name}
                      <button 
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="p-1 hover:bg-gray-800 rounded-full transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {user.skillsToLearn.length === 0 && (
                    <p className="text-gray-400 text-sm">Start by adding a skill above!</p>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}