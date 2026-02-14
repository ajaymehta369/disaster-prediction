import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Activity, Loader2, ShieldAlert, Users, MessageSquareWarning, 
  PlusCircle, TrendingUp, Globe, Mic, MicOff, AudioLines, Zap, Target, Radar, 
  Cpu, Database, BrainCircuit, Network, Fingerprint, Layers, UserCircle, ScanEye, 
  Eye, Terminal, ChevronRight, BarChart3, Radio
} from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage, Type, FunctionDeclaration } from "@google/genai";
import { analyzeLocationRisk } from './services/geminiService';
import { PredictionResult, UserReport, Language } from './types';
import RiskCard from './components/RiskCard';
import ReportModal from './components/ReportModal';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { UI_STRINGS } from './translations';
import RiskMeter from './components/RiskMeter';

// Audio Helpers
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [communityReports, setCommunityReports] = useState<UserReport[]>([]);
  const [userName, setUserName] = useState<string>(localStorage.getItem('dg_user_name') || '');
  
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [inputTranscription, setInputTranscription] = useState('');
  const [outputTranscription, setOutputTranscription] = useState('');
  const sessionRef = useRef<any>(null);
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  const t = UI_STRINGS[lang];

  useEffect(() => {
    const saved = localStorage.getItem('dg_reports');
    if (saved) setCommunityReports(JSON.parse(saved));
    return () => stopVoiceSession();
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [systemLogs]);

  const addLog = (msg: string) => {
    setSystemLogs(prev => [...prev.slice(-15), `> ${msg}`]);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSystemLogs([]);
    
    const steps = [
      "INITIALIZING NEURAL CORE V4.2...",
      "SCANNING TECTONIC PLATE VECTORS...",
      "CALIBRATING SATELLITE RADAR...",
      "CROSS-REFERENCING HISTORICAL CYCLES...",
      "ANALYZING COMMUNITY FEED NODES...",
      "GENERATING THREAT VISUALIZATION...",
      "FINALIZING PREDICTIVE MATRIX..."
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      const currentStep = steps[stepIdx % steps.length];
      setLoadingStep(currentStep);
      addLog(currentStep);
      stepIdx++;
    }, 1000);

    try {
      console.log("for input", query, "with reports", communityReports,lang);
      const data = await analyzeLocationRisk(query, communityReports, lang);
      setResult(data);
      addLog("NEURAL LINK STABILIZED. RESULTS RENDERED.");
    } catch (err) {
      setError("NEURAL CORE SYNC FAILURE.");
      addLog("CRITICAL ERROR: STABILITY LOST.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const setUserIdentity = (name: string) => {
    setUserName(name);
    localStorage.setItem('dg_user_name', name);
    return "IDENTITY REGISTERED: USER " + name.toUpperCase();
  };

  const startVoiceSession = async () => {
    setVoiceStatus('connecting');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      const registerUserFn: FunctionDeclaration = {
        name: 'register_user_identity',
        description: 'Registers the users name into the biometric system.',
        parameters: {
          type: Type.OBJECT,
          properties: { name: { type: Type.STRING, description: 'The name of the user.' } },
          required: ['name'],
        },
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setVoiceStatus('active');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'register_user_identity') {
                  const res = setUserIdentity((fc.args as any).name);
                  sessionPromise.then(s => s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: res } } }));
                }
              }
            }
            if (message.serverContent?.inputTranscription) setInputTranscription(prev => prev + message.serverContent.inputTranscription!.text);
            if (message.serverContent?.outputTranscription) setOutputTranscription(prev => prev + message.serverContent.outputTranscription!.text);
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputCtx) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onclose: () => setVoiceStatus('idle'),
          onerror: (e) => setVoiceStatus('error'),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [registerUserFn] }],
          systemInstruction: `SYSTEM: BIOMETRIC VOICE INTERFACE. User: ${userName || 'UNIDENTIFIED'}. If unidentified, ask for name to calibrate. Once known, use technical Hinglish like: "Swaagat hai [Name], scans ready hain." Always sound high-tech.`
        }
      });
      sessionRef.current = sessionPromise;
    } catch (err) {
      setVoiceStatus('error');
    }
  };

  const stopVoiceSession = () => {
    if (sessionRef.current) { sessionRef.current.then((s: any) => s.close()); sessionRef.current = null; }
    if (audioContextsRef.current) { audioContextsRef.current.input.close(); audioContextsRef.current.output.close(); audioContextsRef.current = null; }
    setVoiceStatus('idle'); setInputTranscription(''); setOutputTranscription('');
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Background Neural Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      <nav className="border-b border-white/5 bg-slate-950/80 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-red-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center relative"><BrainCircuit className="text-red-500" size={28} /></div>
            </div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter uppercase glitch-text">DISASTERGUARD</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em]">Neural Predictive Ops</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             {userName && (
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Operator Identified</span>
                <span className="text-sm font-bold text-red-500">{userName.toUpperCase()}</span>
              </div>
            )}
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
              {(['en', 'hi'] as Language[]).map(l => (
                <button key={l} onClick={() => setLang(l)} className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${lang === l ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-10 relative">
        {/* Personalized Welcome */}
        {userName && !result && !loading && (
          <div className="mb-10 p-10 glass-effect rounded-[3rem] border-red-500/10 flex flex-col md:flex-row items-center gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="w-24 h-24 rounded-full border-2 border-red-500/30 flex items-center justify-center p-1">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden relative">
                <UserCircle size={60} className="text-slate-800" />
                <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent"></div>
              </div>
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Welcome Back, {userName}</h2>
              <p className="text-slate-500 text-sm max-w-xl">Neural link successfully calibrated with your voice signature. Operational status: <span className="text-emerald-500 font-bold">READY</span>. Enter coordinates to begin scanning.</p>
            </div>
            <div className="flex gap-4">
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Scans Run</p>
                <p className="text-xl font-black">24</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Risk Profile</p>
                <p className="text-xl font-black text-emerald-500">SAFE</p>
              </div>
            </div>
          </div>
        )}

        {/* Input Block */}
        <div className="max-w-4xl mx-auto mb-16 relative">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-transparent rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-5 flex items-center text-red-500/50"><MapPin size={22} /></div>
                <input 
                  type="text" value={query} onChange={(e) => setQuery(e.target.value)} 
                  placeholder={t.placeholder} 
                  className="w-full pl-14 pr-6 py-6 bg-slate-900 border border-white/10 rounded-2xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-lg font-medium placeholder:text-slate-700"
                />
              </div>
              <button 
                type="submit" disabled={loading} 
                className="px-10 py-6 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-2xl font-black uppercase flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:scale-[1.02] transition-all"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                <span>{loading ? "PROCESSING..." : t.sync}</span>
              </button>
            </div>
          </form>

          {/* System Console Ticker */}
          <div className="mt-8 glass-effect rounded-2xl p-6 border-white/5 mono text-[11px] overflow-hidden h-40 relative">
             <div className="absolute top-4 right-6 flex items-center gap-2 text-slate-600">
               <Terminal size={14} />
               <span>NEURAL_CON_V4.2</span>
             </div>
             <div className="space-y-1 overflow-y-auto h-full scroll-smooth">
                {systemLogs.map((log, i) => (
                  <div key={i} className={`${log.includes("CRITICAL") ? "text-red-500" : log.includes("STABILIZED") ? "text-emerald-500" : "text-slate-400"}`}>
                    <span className="text-red-500/40">[{new Date().toLocaleTimeString()}]</span> {log}
                  </div>
                ))}
                {!loading && systemLogs.length === 0 && <div className="text-slate-700 italic">WAITING FOR COMMAND INPUT_</div>}
                <div ref={logEndRef} />
             </div>
          </div>
        </div>

        {result ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in zoom-in duration-1000">
            <div className="lg:col-span-8 space-y-10">
              {/* Dynamic Visualization */}
              <div className="relative glass-effect rounded-[3rem] p-2 border-white/10 overflow-hidden group">
                <div className="scan-line"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent pointer-events-none"></div>
                
                <div className="absolute top-10 left-10 z-30 flex gap-4">
                  <div className="px-4 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-red-500/30 flex items-center gap-2">
                    <Radio size={14} className="text-red-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Render</span>
                  </div>
                  <div className="px-4 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2">
                    <ScanEye size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Layer: Anomalies</span>
                  </div>
                </div>

                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-slate-900">
                  {result.visualizationImage ? (
                    <img src={result.visualizationImage} alt="Neural Render" className="w-full h-full object-cover mix-blend-lighten opacity-80 group-hover:scale-105 transition-transform duration-[10s]" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                      <Radar size={80} className="animate-spin-slow mb-4 opacity-10" />
                      <p className="mono text-[10px] uppercase">Rendering Simulation Map...</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                  <div className="absolute bottom-12 left-12 right-12 z-30">
                     <h3 className="text-4xl font-black italic tracking-tighter uppercase mb-2 leading-none">{result.risks[0]?.type || 'Neural Analysis'}</h3>
                     <p className="text-slate-400 text-sm italic max-w-2xl leading-relaxed">"{result.summary}"</p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-effect rounded-3xl p-8 border-white/5 hover:border-red-500/20 transition-all group">
                   <div className="flex items-center justify-between mb-6">
                      <div className="p-3 bg-red-600/10 rounded-2xl text-red-500"><Target size={24} /></div>
                      <span className="text-[10px] font-black uppercase text-slate-600">Confidence</span>
                   </div>
                   <p className="text-5xl font-black tracking-tighter mb-2 italic">{result.predictionConfidence}%</p>
                   <RiskMeter value={result.predictionConfidence} label="" />
                </div>
                <div className="glass-effect rounded-3xl p-8 border-white/5 hover:border-cyan-500/20 transition-all group">
                   <div className="flex items-center justify-between mb-6">
                      <div className="p-3 bg-cyan-600/10 rounded-2xl text-cyan-500"><Cpu size={24} /></div>
                      <span className="text-[10px] font-black uppercase text-slate-600">Logic Core</span>
                   </div>
                   <p className="text-3xl font-black tracking-tighter mb-2 italic">CALIBRATED</p>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{result.modelMetadata.algorithmVersion}</p>
                </div>
                <div className="glass-effect rounded-3xl p-8 border-white/5 hover:border-orange-500/20 transition-all group">
                   <div className="flex items-center justify-between mb-6">
                      <div className="p-3 bg-orange-600/10 rounded-2xl text-orange-500"><Database size={24} /></div>
                      <span className="text-[10px] font-black uppercase text-slate-600">Knowledge Base</span>
                   </div>
                   <p className="text-3xl font-black tracking-tighter mb-2 italic">750K+</p>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Training Data Points</p>
                </div>
              </div>

              {/* Risks Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {result.risks.map((risk, i) => (
                  <RiskCard key={i} risk={risk} />
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-10">
              {/* Regional Forecast Dashboard */}
              <div className="glass-effect rounded-[2.5rem] p-8 border-cyan-500/20 bg-cyan-950/5 h-full">
                <div className="flex items-center gap-3 mb-10">
                  <div className="p-3 bg-cyan-600/20 rounded-2xl text-cyan-500"><Radar className="animate-spin-slow" size={24} /></div>
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">Future Hotspots</h3>
                </div>
                <div className="space-y-6">
                  {result.futureForecast.hotspots.map((h, i) => (
                    <div key={i} className="group cursor-default">
                      <div className="flex justify-between items-end mb-3">
                         <div className="flex items-center gap-3">
                           <div className="w-1 h-8 bg-cyan-500 rounded-full group-hover:scale-y-125 transition-transform"></div>
                           <div>
                             <p className="text-[10px] font-black uppercase text-slate-500">{h.timeframe}</p>
                             <p className="font-bold text-white uppercase">{h.location}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-lg font-black text-cyan-500 italic">{h.probabilityScore}%</p>
                           <p className="text-[9px] font-black text-slate-600 uppercase">Prob.</p>
                         </div>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 group-hover:border-cyan-500/30 transition-all">
                        <p className="text-[10px] font-black text-red-500 uppercase mb-1">{h.threat}</p>
                        <p className="text-xs text-slate-400 italic leading-relaxed">{h.reasoning}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-10 p-6 bg-slate-950/80 rounded-3xl border border-white/5 italic text-sm text-slate-500 leading-relaxed relative">
                   <div className="absolute -top-3 left-6 px-3 py-1 bg-cyan-600 rounded-full text-[9px] font-black uppercase text-white">Neural Outlook</div>
                   "{result.futureForecast.longTermOutlook}"
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty/Initial State */
          <div className="py-20 flex flex-col items-center">
            <div className="relative mb-20">
               <div className="absolute inset-0 bg-red-600 blur-[120px] opacity-10 animate-pulse"></div>
               <BrainCircuit size={120} className="text-slate-800 relative z-10" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl">
              {[
                { icon: <ShieldAlert />, title: "Anomaly Tracking" },
                { icon: <Network />, title: "Community Nodes" },
                { icon: <Database />, title: "Historical Sync" },
                { icon: <Fingerprint />, title: "Identity Match" },
              ].map((item, i) => (
                <div key={i} className="glass-effect p-8 rounded-[2rem] text-center border-white/5 hover:border-red-500/30 transition-all group">
                   <div className="w-16 h-16 rounded-2xl bg-slate-900/50 flex items-center justify-center mx-auto mb-6 text-slate-600 group-hover:text-red-500 transition-colors">{item.icon}</div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Futuristic Voice AI Dock */}
      <div className="fixed bottom-10 right-10 flex flex-col items-end gap-6 z-[100] pointer-events-none">
         {(voiceStatus === 'active' || voiceStatus === 'connecting') && (
          <div className="glass-effect p-8 rounded-[3rem] border-red-500/30 w-80 shadow-2xl animate-in slide-in-from-bottom-8 pointer-events-auto relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
             <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center relative shadow-lg ring-2 ring-red-500/20">
                   {voiceStatus === 'active' ? (
                     <div className="flex gap-1 items-end h-4">
                        <div className="w-1 bg-red-500 animate-[h-pulse_0.5s_infinite_0.1s] rounded-full"></div>
                        <div className="w-1 bg-red-500 animate-[h-pulse_0.7s_infinite_0.3s] rounded-full"></div>
                        <div className="w-1 bg-red-500 animate-[h-pulse_0.4s_infinite_0.2s] rounded-full"></div>
                        <div className="w-1 bg-red-500 animate-[h-pulse_0.6s_infinite_0.4s] rounded-full"></div>
                     </div>
                   ) : <Loader2 size={24} className="text-red-500 animate-spin" />}
                </div>
                <div>
                   <h4 className="text-xs font-black uppercase text-red-500 tracking-widest">
                     {userName ? `Operator: ${userName}` : 'Biometric Link...'}
                   </h4>
                   <p className="text-[9px] text-slate-500 font-black uppercase mt-1">Neural Frequency Lock</p>
                </div>
             </div>
             <div className="space-y-4 max-h-48 overflow-y-auto custom-scrollbar mono text-[11px] leading-relaxed">
                {inputTranscription && <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 text-slate-500">USER: {inputTranscription}</div>}
                {outputTranscription && <div className="p-4 bg-red-600/10 rounded-2xl border border-red-900/20 text-red-200">AI: {outputTranscription}</div>}
             </div>
          </div>
        )}
        <button 
          onClick={voiceStatus === 'idle' ? startVoiceSession : stopVoiceSession}
          className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 pointer-events-auto border-2 ${voiceStatus === 'active' ? 'bg-red-600 border-red-400 shadow-[0_0_50px_rgba(239,68,68,0.5)]' : 'bg-slate-900 border-white/10 hover:border-red-500/40'}`}
        >
          {voiceStatus === 'active' ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-slate-300" />}
        </button>
      </div>

      {/* Scrolling Live Footer Data */}
      <footer className="fixed bottom-0 left-0 w-full h-10 glass-effect border-t border-white/5 z-50 flex items-center px-6 overflow-hidden mono text-[10px] uppercase font-bold text-slate-500">
         <div className="flex items-center gap-4 shrink-0 pr-10 border-r border-white/10 mr-10">
           <Activity size={14} className="text-emerald-500" />
           <span>System Status: Optimal</span>
         </div>
         <div className="animate-[marquee_60s_linear_infinite] whitespace-nowrap flex gap-20">
           <span>Anomaly detected in South Pacific Basin: Magnitude 4.2</span>
           <span>Satellite Link 04: Connected</span>
           <span>Training cycle 12,842 complete</span>
           <span>Neural weight calibration: 99.4%</span>
           <span>Operator {userName || 'GUEST'} successfully logged in</span>
         </div>
      </footer>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onSubmit={() => {}} currentLocation={result?.location || query} />
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes h-pulse {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .animate-spin-slow { animation: spin 10s linear infinite; }
      `}</style>
    </div>
  );
};

export default App;
