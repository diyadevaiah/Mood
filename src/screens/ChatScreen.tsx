import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getChatResponse, detectMoodFromText } from '../lib/gemini';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, User, Bot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function ChatScreen() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hello ${profile?.name.split(' ')[0] || 'there'}. I am MoodMirror AI. How are you feeling today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !user) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // Analyze mood from text occasionally
      if (messages.length % 3 === 0) {
        const moodResult = await detectMoodFromText(userMessage);
        await addDoc(collection(db, 'users', user.uid, 'moodHistory'), {
          userId: user.uid,
          timestamp: serverTimestamp(),
          mood: moodResult.mood,
          source: 'text',
          confidence: moodResult.confidence,
          aiSuggestions: moodResult.suggestions
        });
      }

      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const aiResponse = await getChatResponse(history, userMessage);
      setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (error) {
      console.error("Chat Error:", error);
      toast.error("Communication link unstable. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-4 relative overflow-hidden">
      <div className="text-center mb-4">
        <h2 className="text-sm font-mono text-primary uppercase tracking-widest">Neural Link</h2>
        <h1 className="text-2xl font-bold tracking-tighter">AI Assistant</h1>
      </div>

      <ScrollArea className="flex-1 pr-4 mb-4" ref={scrollRef}>
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                    m.role === 'user' ? 'bg-primary/10 border-primary/30' : 'bg-muted border-border'
                  }`}>
                    {m.role === 'user' ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-card border border-border/50 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-2 items-center bg-card border border-border/50 p-3 rounded-2xl rounded-tl-none">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs font-mono uppercase tracking-widest animate-pulse">Processing...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="relative mt-auto">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="pr-12 h-12 bg-card/50 border-border/50 rounded-2xl focus-visible:ring-primary"
          disabled={loading}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={loading || !input.trim()}
          className="absolute right-1 top-1 h-10 w-10 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
