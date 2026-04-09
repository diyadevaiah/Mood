/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/sonner';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ScanScreen } from './screens/ScanScreen';
import { ChatScreen } from './screens/ChatScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Home, Camera, MessageSquare, BarChart3, LogOut } from 'lucide-react';
import { Button } from './components/ui/button';
import { auth } from './lib/firebase';
import { signOut } from 'firebase/auth';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'scan' | 'chat' | 'insights'>('home');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
        <div className="scanline" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center z-20"
        >
          <h1 className="text-6xl font-bold glitch-text mb-4" data-text="MOOD MIRROR">
            MOOD MIRROR
          </h1>
          <div className="flex items-center justify-center gap-2 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-mono text-sm tracking-widest uppercase">Initializing System...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen onNavigate={setActiveTab} />;
      case 'scan': return <ScanScreen />;
      case 'chat': return <ChatScreen />;
      case 'insights': return <InsightsScreen />;
      default: return <HomeScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="noise-bg" />
      
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border/50 px-6 py-3 z-40">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <NavButton 
            active={activeTab === 'home'} 
            onClick={() => setActiveTab('home')} 
            icon={<Home className="h-6 w-6" />} 
            label="Home" 
          />
          <NavButton 
            active={activeTab === 'scan'} 
            onClick={() => setActiveTab('scan')} 
            icon={<Camera className="h-6 w-6" />} 
            label="Scan" 
          />
          <NavButton 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
            icon={<MessageSquare className="h-6 w-6" />} 
            label="Chat" 
          />
          <NavButton 
            active={activeTab === 'insights'} 
            onClick={() => setActiveTab('insights')} 
            icon={<BarChart3 className="h-6 w-6" />} 
            label="Insights" 
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut(auth)}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-6 w-6" />
          </Button>
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      <span className="text-[10px] uppercase font-bold tracking-tighter">{label}</span>
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="w-1 h-1 rounded-full bg-primary mt-1"
        />
      )}
    </button>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </ErrorBoundary>
  );
}
