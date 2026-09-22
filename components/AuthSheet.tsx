import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getAuthErrorMessage, isValidPassword, PASSWORD_REQUIREMENTS_TEXT } from '@/lib/auth';
interface AuthSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthSheet: React.FC<AuthSheetProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: 'Enter your email first',
        description: 'Please enter the email you used to sign up so we can send a reset link.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast({
        title: 'Reset link sent',
        description: 'Please check your email to create a new password.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getAuthErrorMessage(error),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!isValidPassword(password)) {
          throw new Error(PASSWORD_REQUIREMENTS_TEXT);
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        
        if (error) throw error;
        
        toast({
          title: 'Account created!',
          description: 'Please verify your email before signing in.'
        });
        setPassword('');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.'
        });
        onClose();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getAuthErrorMessage(error),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black opacity-50 z-[1000]"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-[#1A1A1A] z-[1001] shadow-2xl transition-transform duration-300 ${isOpen ? 'animate-slide-in-right' : ''}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-white hover:text-gray-300 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="flex flex-col h-full px-10 pt-24 pb-10">
          <h2 className="text-white text-4xl font-medium mb-2">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            {isSignUp 
              ? 'Join us to create and manage your events' 
              : 'Welcome back! Please sign in to continue'}
          </p>

          <form onSubmit={handleAuth} className="flex flex-col gap-6">
            <div>
              <label htmlFor="email" className="block text-white text-sm font-medium mb-2 uppercase tracking-wide">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-[#FA76FF] transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-white text-sm font-medium mb-2 uppercase tracking-wide">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-[#FA76FF] transition-colors"
                placeholder="••••••••"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] text-gray-400">{PASSWORD_REQUIREMENTS_TEXT}</p>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="shrink-0 text-[11px] text-white hover:text-[#FA76FF] transition-colors disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FA76FF] text-black font-medium py-3 px-6 uppercase text-sm border border-black hover:bg-[#ff8fff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
