import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { MoodEntry } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { Camera, MessageSquare, Sparkles, TrendingUp, History, User } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';

export function HomeScreen({ onNavigate }: { onNavigate: (tab: 'home' | 'scan' | 'chat' | 'insights') => void }) {
  const { profile, user } = useAuth();
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'moodHistory'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const moods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MoodEntry));
      setRecentMoods(moods);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching moods:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const latestMood = recentMoods[0];

  return (
    <div className="p-6 space-y-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-sm font-mono text-primary uppercase tracking-widest">System Status</h2>
          <h1 className="text-3xl font-bold tracking-tighter">Welcome, {profile?.name.split(' ')[0]}</h1>
        </div>
        <div className="h-12 w-12 rounded-full border border-primary/50 flex items-center justify-center bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Current Mood Status */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <Card className="border-primary/30 bg-primary/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Current State</CardTitle>
          </CardHeader>
          <CardContent>
            {latestMood ? (
              <div className="flex items-center gap-4">
                <div className="text-5xl">{getMoodEmoji(latestMood.mood)}</div>
                <div>
                  <h3 className="text-2xl font-bold capitalize">{latestMood.mood}</h3>
                  <p className="text-xs text-muted-foreground uppercase font-mono">
                    Detected via {latestMood.source} • {Math.round(latestMood.confidence * 100)}% confidence
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-muted-foreground italic">No mood data detected. Start a scan.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <ActionCard
          icon={<Camera className="h-6 w-6" />}
          title="SCAN FACE"
          description="Visual Analysis"
          onClick={() => onNavigate('scan')}
        />
        <ActionCard
          icon={<MessageSquare className="h-6 w-6" />}
          title="AI CHAT"
          description="Empathetic Support"
          onClick={() => onNavigate('chat')}
        />
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
            <History className="h-4 w-4" /> Recent Logs
          </h3>
          <Button variant="link" size="sm" className="text-xs uppercase font-bold" onClick={() => onNavigate('insights')}>
            View All
          </Button>
        </div>
        
        <ScrollArea className="h-[200px] rounded-md border border-border/50 bg-card/30 p-4">
          {recentMoods.length > 0 ? (
            <div className="space-y-4">
              {recentMoods.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                    <div>
                      <p className="text-sm font-bold capitalize">{entry.mood}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono">
                        {new Date(entry.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono border-primary/30 text-primary">
                    {entry.source}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">
              System logs empty.
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center p-6 rounded-xl border border-border/50 bg-card/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
    >
      <div className="mb-3 text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </div>
      <h3 className="text-xs font-bold tracking-widest uppercase mb-1">{title}</h3>
      <p className="text-[10px] text-muted-foreground uppercase font-mono">{description}</p>
    </button>
  );
}

function getMoodEmoji(mood: string) {
  switch (mood) {
    case 'happy': return '😊';
    case 'sad': return '😢';
    case 'tired': return '😴';
    case 'stressed': return '😫';
    case 'calm': return '😌';
    case 'energetic': return '⚡';
    default: return '😐';
  }
}
