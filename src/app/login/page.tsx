"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login({ email, password });
        } catch (err: any) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-md w-full space-y-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white dark:border-slate-800 relative z-10 transition-all duration-300">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 text-white mb-6 shadow-lg shadow-orange-500/30 transform transition-transform hover:scale-105 duration-300">
                        <LogIn size={32} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                        Sign in to access your admin dashboard
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl animate-shake">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group">
                            <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-1 block">
                                Email Address
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                    <Mail size={18} />
                                </span>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-1 block">
                                Password
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded transition-colors"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500 dark:text-slate-400">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <a href="#" className="font-medium text-orange-500 hover:text-orange-600 transition-colors">
                                Forgot password?
                            </a>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 shadow-lg shadow-orange-500/30"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Enter your credentials to manage the platform.
                    </p>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>
        </div>
    );
}
