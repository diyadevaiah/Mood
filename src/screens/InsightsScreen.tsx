import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { MoodEntry } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, Activity, Calendar } from 'lucide-react';

const MOOD_VALUES: Record<string, number> = {
  'happy': 5,
  'energetic': 4,
  'calm': 3,
  'tired': 2,
  'stressed': 1,
  'sad': 0
};

const MOOD_COLORS: Record<string, string> = {
  'happy': '#facc15',
  'energetic': '#f97316',
  'calm': '#22c55e',
  'tired': '#94a3b8',
  'stressed': '#ef4444',
  'sad': '#3b82f6'
};

export function InsightsScreen() {
  const { user } = useAuth();
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'moodHistory'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MoodEntry));
      setMoods(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Process data for charts
  const moodCounts = moods.reduce((acc, curr) => {
    acc[curr.mood] = (acc[curr.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(moodCounts).map(([name, value]) => ({ name, value }));

  const timelineData = [...moods].reverse().map(m => ({
    time: new Date(m.timestamp?.toDate()).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    value: MOOD_VALUES[m.mood] || 0,
    mood: m.mood
  }));

  return (
    <div className="p-6 space-y-6 max-w-md mx-auto h-full overflow-y-auto pb-24">
      <div className="text-center">
        <h2 className="text-sm font-mono text-primary uppercase tracking-widest">Data Visualization</h2>
        <h1 className="text-2xl font-bold tracking-tighter">Emotional Insights</h1>
      </div>

      {moods.length < 3 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <Activity className="h-12 w-12 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground text-sm italic">Insufficient data for analysis.<br/>Record more moods to unlock insights.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mood Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" /> Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.name] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff', fontSize: '12px', textTransform: 'capitalize' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mood Timeline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Timeline Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineData}>
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={[0, 5]} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg shadow-xl">
                              <p className="text-[10px] text-zinc-400 uppercase font-mono">{payload[0].payload.time}</p>
                              <p className="text-sm font-bold capitalize" style={{ color: MOOD_COLORS[payload[0].payload.mood] }}>
                                {payload[0].payload.mood}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {timelineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.mood] || '#8884d8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard 
              label="TOTAL LOGS" 
              value={moods.length.toString()} 
              icon={<Activity className="h-4 w-4" />} 
            />
            <StatCard 
              label="STREAK" 
              value="5 DAYS" 
              icon={<Calendar className="h-4 w-4" />} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
          <div className="text-primary">{icon}</div>
        </div>
        <p className="text-2xl font-bold tracking-tighter">{value}</p>
      </CardContent>
    </Card>
  );
}
