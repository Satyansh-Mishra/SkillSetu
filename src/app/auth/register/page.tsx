'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Eye, EyeOff, Loader2, ArrowRight, 
  CheckCircle2, AlertCircle, Check 
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // State for generic errors
  const [generalError, setGeneralError] = useState('');
  // State for specific Zod validation errors
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
  });

  // Password Strength Calc
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    return score;
  };
  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneralError('');
    setValidationErrors([]);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details && Array.isArray(data.details)) {
          setValidationErrors(data.details.map((err: any) => err.message));
        } else {
          setGeneralError(data.error || 'Registration failed');
        }
        setIsLoading(false);
        return;
      }

      // --- Success ---
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on Role
      if (data.user.role === 'TEACHER') {
        router.push('/dashboard/profile');
      } else {
        router.push('/dashboard/learner');
      }

    } catch (err) {
      setGeneralError('Connection failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white text-gray-900 selection:bg-black selection:text-white">
      
      {/* --- Left Side: Form --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="max-w-[440px] w-full">
          
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2 mb-8 group">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:scale-95 transition-transform">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="font-bold text-xl tracking-tight">SkillSetu</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Create an account</h1>
            <p className="text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-black font-semibold hover:underline underline-offset-4">
                Log in
              </Link>
            </p>
          </div>

          {/* Role Selector (Pill Style) */}
          <div className="mb-8 p-1 bg-gray-100 rounded-xl flex">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'STUDENT' })}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                formData.role === 'STUDENT' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              I want to Learn
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'TEACHER' })}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                formData.role === 'TEACHER' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              I want to Teach
            </button>
          </div>

          {/* Validation Errors */}
          {(generalError || validationErrors.length > 0) && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-1">
                <AlertCircle size={16} /> 
                {generalError || 'Please fix the following:'}
              </div>
              {validationErrors.length > 0 && (
                <ul className="space-y-1 mt-2 pl-6 list-disc">
                  {validationErrors.map((err, idx) => (
                    <li key={idx} className="text-xs text-red-600 font-medium">
                      {err}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Name */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-300"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-gray-700">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-1 outline-none transition-all placeholder:text-gray-300 ${
                    validationErrors.length > 0 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 focus:border-black focus:ring-black'
                  }`}
                  placeholder="Create a password"
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

              {/* Password Strength Meter */}
              {formData.password && (
                <div className="flex gap-1 h-1 mt-3 transition-all duration-500">
                  {[1, 2, 3, 4].map((level) => (
                    <div 
                      key={level}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        strength >= level 
                          ? (strength < 2 ? 'bg-red-500' : strength < 3 ? 'bg-yellow-500' : 'bg-green-500')
                          : 'bg-gray-100'
                      }`}
                    />
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Must contain 8+ chars, uppercase, lowercase, and number.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white rounded-full py-4 font-bold text-sm tracking-wide hover:bg-gray-900 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Create Account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
            By creating an account, you agree to our{' '}
            <a href="#" className="underline hover:text-black">Terms of Service</a> and{' '}
            <a href="#" className="underline hover:text-black">Privacy Policy</a>.
          </div>
        </div>
      </div>

      {/* --- Right Side: Visual --- */}
      <div className="hidden lg:block w-1/2 bg-gray-50 relative overflow-hidden">
        {/* Abstract/Tech Background Video */}
        <div className="absolute inset-0 bg-black/10 z-10"></div>
        <video
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-80"
          autoPlay
          muted
          loop
          playsInline
        >
          {/* Using a different Square asset to distinguish from Login page */}
          <source src="https://www.pexels.com/download/video/6324565/" type="video/webm" />
        </video>
        
        {/* Overlay Content */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-12 z-20 text-center">
           <h2 className="text-4xl font-bold text-white mb-6 drop-shadow-lg">
             {formData.role === 'TEACHER' ? 'Share your knowledge.' : 'Unlock your potential.'}
           </h2>
           <div className="inline-flex flex-col gap-3 text-left">
             {[
               'Join 10,000+ active learners',
               'Earn certificates & badges',
               'Access 1-on-1 mentorship'
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-3 text-white/90 font-medium bg-black/20 backdrop-blur-md p-3 rounded-lg border border-white/10">
                 <div className="bg-green-400 rounded-full p-0.5">
                   <Check size={12} className="text-black" />
                 </div>
                 {item}
               </div>
             ))}
           </div>
        </div>
      </div>

    </div>
  );
}