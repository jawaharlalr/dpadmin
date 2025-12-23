import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Lock, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, ADMIN_UID, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Authenticate
      const userCredential = await login(email, password);
      const user = userCredential.user;

      // 2. Simple UID Check
      if (user.uid === ADMIN_UID) {
        toast.success("Welcome back, Admin!");
        navigate('/');
      } else {
        await logout();
        toast.error("Access Denied.");
      }

    } catch (error) {
      console.error("Login Error:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error("Invalid Email or Password");
      } else if (error.code === 'auth/too-many-requests') {
        toast.error("Too many failed attempts. Try again later.");
      } else {
        toast.error("Login failed. Check console for details.");
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-gradient-to-br from-brand-red via-brand-orange to-orange-400">
      
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-black/10 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-3xl"
      >
        <div className="p-8 md:p-10">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full text-brand-red">
              <UtensilsCrossed size={32} />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Admin Portal</h2>
            <p className="mt-2 text-gray-500">DP Evening Snacks & Sweets</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none">
                <Mail size={20} />
              </div>
              <input
                type="email"
                placeholder="Admin Email"
                className="pl-12 input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none">
                <Lock size={20} />
              </div>
              <input
                type="password"
                placeholder="Password"
                className="pl-12 input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="flex items-center justify-center gap-2 btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="loader border-t-white border-white/30"></div>
              ) : (
                <>
                  Sign In <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}