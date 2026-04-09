import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { detectMoodFromImage } from '../lib/gemini';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';

export function ScanScreen() {
  const { user } = useAuth();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera Access Error:", error);
      toast.error("Camera access denied. Please enable permissions.");
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || !user) return;

    setScanning(true);
    setResult(null);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];

      try {
        const aiResult = await detectMoodFromImage(base64Image);
        
        // Save to Firestore
        await addDoc(collection(db, 'users', user.uid, 'moodHistory'), {
          userId: user.uid,
          timestamp: serverTimestamp(),
          mood: aiResult.mood,
          source: 'face',
          confidence: aiResult.confidence,
          aiSuggestions: aiResult.suggestions
        });

        setResult(aiResult);
        toast.success(`Mood detected: ${aiResult.mood}`);
      } catch (error) {
        console.error("Analysis Error:", error);
        toast.error("AI analysis failed. Please try again.");
      } finally {
        setScanning(false);
      }
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-md mx-auto h-full flex flex-col">
      <div className="text-center">
        <h2 className="text-sm font-mono text-primary uppercase tracking-widest">Biometric Interface</h2>
        <h1 className="text-2xl font-bold tracking-tighter">Emotional Scan</h1>
      </div>

      <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-primary/30 bg-black group">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanning Overlay */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/10 flex flex-col items-center justify-center z-20"
            >
              <div className="scanline" />
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary animate-pulse">Analyzing Patterns...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Viewfinder UI */}
        <div className="absolute inset-0 pointer-events-none border-[20px] border-transparent">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/50" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/50" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/50" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/50" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {!result && !scanning && (
          <div className="text-center space-y-4 py-8">
            <p className="text-sm text-muted-foreground uppercase font-mono tracking-tight">
              Position your face within the frame for optimal biometric reading.
            </p>
            <Button 
              size="lg" 
              className="w-full h-16 rounded-2xl text-lg font-bold tracking-widest"
              onClick={captureAndAnalyze}
            >
              <Camera className="mr-2 h-6 w-6" /> START SCAN
            </Button>
          </div>
        )}

        {result && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-4"
          >
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Analysis Result</CardTitle>
                  <Badge className="bg-primary text-primary-foreground uppercase text-[10px] tracking-widest">
                    {Math.round(result.confidence * 100)}% Match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{getMoodEmoji(result.mood)}</span>
                  <h3 className="text-2xl font-bold capitalize">{result.mood}</h3>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-primary flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> System Suggestions
                  </p>
                  <ul className="space-y-2">
                    {result.suggestions.map((s: string, i: number) => (
                      <li key={i} className="text-xs bg-background/50 p-2 rounded border border-border/50 flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
            <Button 
              variant="outline" 
              className="w-full border-border/50"
              onClick={() => setResult(null)}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> NEW SCAN
            </Button>
          </motion.div>
        )}
      </div>
    </div>
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
