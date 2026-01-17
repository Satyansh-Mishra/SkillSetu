'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // 1. Store the token & user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 2. Role-Based Redirect
      // Check if user is teacher or student and route accordingly
      if (data.user.role === 'TEACHER') {
        router.push('/dashboard/profile');
      } else {
        router.push('/dashboard/learner');
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white text-gray-900 selection:bg-black selection:text-white">
      
      {/* --- Left Side: Form --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="max-w-[440px] w-full">
          
          {/* Header */}
          <div className="mb-10">
            <Link href="/" className="flex items-center gap-2 mb-8 group">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:scale-95 transition-transform">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="font-bold text-xl tracking-tight">SkillSetu</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Welcome back</h1>
            <p className="text-gray-500">
              New to SkillSetu?{' '}
              <Link href="/signup" className="text-black font-semibold hover:underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Email address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-300"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium text-gray-500 hover:text-black">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-300"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white rounded-full py-4 font-bold text-sm tracking-wide hover:bg-gray-900 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
            By continuing, you agree to our{' '}
            <a href="#" className="underline hover:text-black">Terms of Service</a> and{' '}
            <a href="#" className="underline hover:text-black">Privacy Policy</a>.
          </div>
        </div>
      </div>

      {/* --- Right Side: Visual (Square Style Video) --- */}
      <div className="hidden lg:block w-1/2 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5 z-10"></div>
        <video
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-90"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="https://www.pexels.com/download/video/7205792/" type="video/webm" />
        </video>
        
        {/* Text Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-16 z-20 bg-gradient-to-t from-black/80 to-transparent text-white">
          <blockquote className="text-2xl font-medium leading-relaxed mb-4">
            "SkillSetu helped me turn my weekend photography hobby into a full-time teaching career."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm"></div>
            <div>
              <div className="font-bold">Jany Jenkins</div>
              <div className="text-sm text-white/70">Top Rated Mentor</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}