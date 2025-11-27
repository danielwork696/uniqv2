import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Settings, 
  Terminal as TerminalIcon, 
  Zap, 
  FileVideo, 
  Play, 
  Download, 
  Layers, 
  Cpu, 
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { unikalizeVideo, ProcessSettings, GeneratedFileInfo } from './api/unikalize';

/**
 * ============================================================================
 * 📁 TYPES
 * ============================================================================
 */

// UI representation of the result
interface ResultCardData {
  id: string;
  originalName: string;
  videoUrl: string;
  filtersSummary: string;
}

interface LogEntry {
  id: string;
  text: string;
  timestamp: string;
  type: 'info' | 'process' | 'success' | 'error';
}

/**
 * ============================================================================
 * 🔧 UTILS
 * ============================================================================
 */

const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + now.getMilliseconds().toString().padStart(3, '0');
};

/**
 * ============================================================================
 * 🧩 UI COMPONENTS
 * ============================================================================
 */

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between py-2 border-b border-[#1F2530] last:border-0 hover:bg-[#131922] transition-colors">
    <span className="text-gray-300 text-sm font-medium">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out ${
        checked ? 'bg-[#22E58F]' : 'bg-gray-600'
      }`}
    >
      <div
        className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform duration-200 ease-in-out ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  </div>
);

const Terminal = ({ logs }: { logs: LogEntry[] }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-[#0E1217] rounded-xl border border-[#1F2530] overflow-hidden shadow-lg">
      <div className="bg-[#131922] px-4 py-2 border-b border-[#1F2530] flex items-center gap-2">
        <TerminalIcon size={14} className="text-[#22E58F]" />
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Process_Log_Output</span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar min-h-[200px] max-h-[300px] lg:max-h-full">
        {logs.length === 0 && (
          <div className="text-gray-600 italic">Waiting for input stream...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 animate-fadeIn">
            <span className="text-gray-600 select-none">[{log.timestamp}]</span>
            <span className={`
              ${log.type === 'error' ? 'text-red-400' : ''}
              ${log.type === 'success' ? 'text-[#22E58F]' : ''}
              ${log.type === 'process' ? 'text-blue-400' : ''}
              ${log.type === 'info' ? 'text-gray-300' : ''}
            `}>
              {log.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

// Updated ResultCard to show actual VIDEO
const ResultCard = ({ result }: { result: ResultCardData }) => {
  return (
    <div className="bg-[#131922] rounded-xl border border-[#1F2530] overflow-hidden group hover:border-[#22E58F] transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,229,143,0.1)]">
      <div className="relative aspect-video overflow-hidden bg-black">
        <video 
          src={result.videoUrl} 
          controls 
          className="w-full h-full object-cover"
          preload="metadata"
        />
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] text-[#22E58F] font-mono border border-[#22E58F]/30 pointer-events-none">
          FFMPEG PROCESSED
        </div>
      </div>
      
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="text-white text-sm font-bold font-mono">{result.id}</h4>
            <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{result.originalName}</p>
          </div>
          <a 
            href={result.videoUrl} 
            download 
            className="text-gray-400 hover:text-[#22E58F] transition-colors"
          >
            <Download size={16} />
          </a>
        </div>
        
        <div className="space-y-1">
          <div className="flex flex-col text-[10px] text-gray-400">
            <span>Applied Filters:</span>
            <span className="text-gray-300 line-clamp-2 leading-tight">
              {result.filtersSummary}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Uploader = ({ file, setFile }: { file: File | null; setFile: (f: File | null) => void }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('video/')) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  if (file) {
    return (
      <div className="w-full p-4 bg-[#131922] border border-[#22E58F]/50 rounded-xl relative group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#22E58F]/10 flex items-center justify-center text-[#22E58F]">
            <FileVideo size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{file.name}</h3>
            <p className="text-sm text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
          <button 
            onClick={() => setFile(null)}
            className="p-2 hover:bg-[#1F2530] rounded-lg text-gray-400 hover:text-red-400 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="absolute -top-2 -right-2">
           <div className="bg-[#22E58F] text-[#0E1217] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
             <CheckCircle size={10} /> READY
           </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        w-full h-32 rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer
        ${isDragging ? 'border-[#22E58F] bg-[#22E58F]/5' : 'border-[#1F2530] bg-[#131922] hover:border-gray-500'}
      `}
    >
      <input type="file" accept="video/mp4,video/quicktime,video/x-m4v" onChange={handleFileSelect} className="hidden" id="video-upload" />
      <label htmlFor="video-upload" className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
        <Upload size={24} className={isDragging ? 'text-[#22E58F] mb-2' : 'text-gray-400 mb-2'} />
        <span className="text-sm text-gray-300 font-medium">Click to upload or drag video</span>
        <span className="text-xs text-gray-500 mt-1">MP4, MOV (Max 500MB)</span>
      </label>
    </div>
  );
};

/**
 * ============================================================================
 * 🚀 MAIN APP COMPONENT
 * ============================================================================
 */

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<ResultCardData[]>([]);
  
  // Settings State
  const [settings, setSettings] = useState<ProcessSettings>({
    brightness: true,
    contrast: true,
    saturation: true,
    mirror: false,
    rotation: true,
    zoom: true,
    audioSpeed: true,
    audioVolume: true,
    audioPitch: false,
    copies: 3
  });

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(),
      text,
      timestamp: formatTime(),
      type
    }]);
  }, []);

  const handleSettingChange = (key: keyof ProcessSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!file) {
      addLog("Error: No source file selected", "error");
      return;
    }

    setIsProcessing(true);
    setResults([]);
    setLogs([]);
    
    addLog("Initializing backend connection...", "info");
    addLog(`Source: ${file.name} [${(file.size / 1024 / 1024).toFixed(2)}MB]`, "info");
    addLog(`Requested copies: ${settings.copies}`, "info");
    
    try {
      addLog("Uploading file & starting FFmpeg job...", "process");
      
      // REAL BACKEND CALL
      const copies = await unikalizeVideo(file, settings);
      
      addLog("Backend processing completed successfully.", "success");
      addLog(`Received ${copies.length} unique video files.`, "success");

      setResults(
        copies.map(c => ({
          id: c.id,
          originalName: file.name,
          videoUrl: c.url,
          filtersSummary: c.filters
        }))
      );

    } catch (error: any) {
      console.error(error);
      addLog(`Critical Error: ${error.message || "Failed to contact backend"}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1217] text-white p-4 md:p-8 font-sans selection:bg-[#22E58F] selection:text-[#0E1217]">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F2530] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#22E58F] to-[#148F5C] rounded-lg flex items-center justify-center shadow-lg shadow-[#22E58F]/20">
              <Zap className="text-[#0E1217]" size={24} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ReelUnique</h1>
              <p className="text-xs text-gray-400 font-mono tracking-wider">FULL-STACK UNIKALIZER</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="px-3 py-1.5 rounded-md bg-[#131922] border border-[#1F2530] flex items-center gap-2">
              <Layers size={14} className="text-[#22E58F]" />
              <span className="text-xs font-medium text-gray-300">Anti-Duplicate Algo</span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-[#131922] border border-[#1F2530] flex items-center gap-2">
              <Cpu size={14} className="text-[#22E58F]" />
              <span className="text-xs font-medium text-gray-300">FFmpeg Node.js</span>
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
          
          {/* Left Column: Controls (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Uploader Section */}
            <section className="space-y-3">
              <h2 className="text-sm uppercase text-gray-500 font-bold tracking-wider flex items-center gap-2">
                <FileVideo size={16} /> Source Input
              </h2>
              <Uploader file={file} setFile={setFile} />
            </section>

            {/* Settings Section */}
            <section className="bg-[#131922] rounded-xl border border-[#1F2530] p-5 shadow-lg flex-1">
              <div className="flex items-center gap-2 mb-6 text-[#22E58F]">
                <Settings size={18} />
                <h2 className="font-bold">Generation Settings</h2>
              </div>

              {/* Slider */}
              <div className="mb-8">
                <div className="flex justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300">Unique Copies Count</span>
                  <span className="text-sm font-bold text-[#22E58F] bg-[#22E58F]/10 px-2 rounded">
                    {settings.copies}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={settings.copies}
                  onChange={(e) => handleSettingChange('copies', parseInt(e.target.value))}
                  className="w-full h-2 bg-[#0E1217] rounded-lg appearance-none cursor-pointer accent-[#22E58F]"
                />
                <div className="flex justify-between mt-1 text-[10px] text-gray-600 font-mono">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Visual Toggles */}
              <div className="space-y-1 mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Visual Processing</h3>
                <Toggle label="Random Brightness" checked={settings.brightness} onChange={(v) => handleSettingChange('brightness', v)} />
                <Toggle label="Random Contrast" checked={settings.contrast} onChange={(v) => handleSettingChange('contrast', v)} />
                <Toggle label="Random Saturation" checked={settings.saturation} onChange={(v) => handleSettingChange('saturation', v)} />
                <Toggle label="Smart Crop / Zoom" checked={settings.zoom} onChange={(v) => handleSettingChange('zoom', v)} />
                <Toggle label="Micro Rotation (±2°)" checked={settings.rotation} onChange={(v) => handleSettingChange('rotation', v)} />
                <Toggle label="Mirror / Flip" checked={settings.mirror} onChange={(v) => handleSettingChange('mirror', v)} />
              </div>

              {/* Audio Toggles */}
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Audio Processing</h3>
                <Toggle label="Micro Speed (±2%)" checked={settings.audioSpeed} onChange={(v) => handleSettingChange('audioSpeed', v)} />
                <Toggle label="Random Volume" checked={settings.audioVolume} onChange={(v) => handleSettingChange('audioVolume', v)} />
                <Toggle label="Pitch Shift" checked={settings.audioPitch} onChange={(v) => handleSettingChange('audioPitch', v)} />
              </div>
            </section>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={!file || isProcessing}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-200
                ${!file || isProcessing 
                  ? 'bg-[#1F2530] text-gray-500 cursor-not-allowed' 
                  : 'bg-[#22E58F] text-[#0E1217] hover:bg-[#1FD684] hover:shadow-[#22E58F]/30 hover:-translate-y-1'
                }
              `}
            >
              {isProcessing ? (
                <>
                  <Activity className="animate-spin" /> Uploading & Processing...
                </>
              ) : (
                <>
                  <Zap fill="currentColor" /> Generate {settings.copies} Unique Versions
                </>
              )}
            </button>
          </div>

          {/* Right Column: Terminal & Results (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
            
            {/* Terminal (Fixed Height) */}
            <div className="h-1/3 min-h-[200px]">
               <Terminal logs={logs} />
            </div>

            {/* Results Gallery (Scrollable) */}
            <div className="flex-1 bg-[#0E1217] rounded-xl flex flex-col overflow-hidden">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-sm uppercase text-gray-500 font-bold tracking-wider flex items-center gap-2">
                   <Layers size={16} /> Generated Gallery
                 </h2>
                 {results.length > 0 && (
                   <span className="text-xs text-[#22E58F] bg-[#22E58F]/10 px-2 py-1 rounded-full">
                     {results.length} files ready
                   </span>
                 )}
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                 {results.length === 0 ? (
                   <div className="h-full border-2 border-dashed border-[#1F2530] rounded-xl flex flex-col items-center justify-center text-gray-600 gap-4 bg-[#131922]/50">
                     <Activity size={48} className="opacity-20" />
                     <p>Ready to process. Upload a video to start.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                     {results.map((res) => (
                       <ResultCard key={res.id} result={res} />
                     ))}
                   </div>
                 )}
               </div>
            </div>
          </div>

        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0E1217; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1F2530; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #374151; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}
