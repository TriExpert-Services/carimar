import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, nombre: string, telefono?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  isAdmin: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getErrorMessage = (error: string): string => {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password. Please try again.',
    'Email not confirmed': 'Please confirm your email address before logging in.',
    'User already registered': 'This email is already registered. Please sign in instead.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
    'Unable to validate email address: invalid format': 'Please enter a valid email address.',
    'signup_disabled': 'New registrations are currently disabled.',
    'over_email_send_rate_limit': 'Too many requests. Please wait a moment and try again.',
    'email_exists': 'This email is already registered. Please sign in instead.',
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }

  return error || 'An unexpected error occurred. Please try again.';
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        setSession(session);
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
        setLoading(false);
      })();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    console.log('Loading profile for user:', userId);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    console.log('User profile data:', data);
    console.log('User profile error:', error);

    if (data && !error) {
      setUser(data as User);
      console.log('User role set to:', data.role);
    } else {
      console.error('Failed to load user profile:', error);
    }
  };

  const signUp = async (email: string, password: string, nombre: string, telefono?: string) => {
    console.log('Starting signup process for:', email);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      throw new Error(getErrorMessage(authError.message));
    }

    if (!authData.user) {
      throw new Error('Registration failed. Please try again.');
    }

    console.log('Auth user created:', authData.user.id);

    await new Promise(resolve => setTimeout(resolve, 500));

    let retries = 3;
    let profileCreated = false;
    let lastError = null;

    while (retries > 0 && !profileCreated) {
      try {
        console.log(`Attempting to create profile (${4 - retries}/3)...`);

        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            nombre,
            telefono,
            role: 'client',
            idioma_preferido: 'en',
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          lastError = profileError;

          if (profileError.code === '23505') {
            console.log('Profile already exists, attempting to load...');
            profileCreated = true;
            break;
          }

          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          console.log('Profile created successfully');
          profileCreated = true;
        }
      } catch (err: any) {
        console.error('Unexpected error during profile creation:', err);
        lastError = err;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!profileCreated && lastError) {
      console.error('Failed to create profile after retries:', lastError);
      const errorMsg = (lastError as any)?.message || 'Unable to create user profile';
      throw new Error(`Registration failed: ${getErrorMessage(errorMsg)}`);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    await loadUserProfile(authData.user.id);
  };

  const signIn = async (email: string, password: string) => {
    console.log('Starting sign in process for:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      throw new Error(getErrorMessage(error.message));
    }

    if (!data.user) {
      throw new Error('Sign in failed. Please try again.');
    }

    console.log('User signed in successfully:', data.user.id);

    await new Promise(resolve => setTimeout(resolve, 200));
    await loadUserProfile(data.user.id);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  };

  const reloadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserProfile(session.user.id);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, reloadProfile, isAdmin, isClient }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
