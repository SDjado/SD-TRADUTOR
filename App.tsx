
import React, { useState, useEffect, useRef } from 'react';
import { AppState, DocumentSummary, SavedDocument, SUPPORTED_LANGUAGES, UrgencyLevel } from './types';
import { Layout } from './components/Layout';
import { HistoryItem } from './components/HistoryItem';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('sd_tradutor_history');
    const savedLang = localStorage.getItem('sd_tradutor_lang');
    return {
      view: 'home',
      history: saved ? JSON.parse(saved) : [],
      targetLanguage: savedLang || 'Português'
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    localStorage.setItem('sd_tradutor_history', JSON.stringify(state.history));
  }, [state.history]);

  useEffect(() => {
    localStorage.setItem('sd_tradutor_lang', state.targetLanguage);
  }, [state.targetLanguage]);

  const startCamera = async () => {
    setState(prev => ({ ...prev, view: 'camera' }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Por favor, permita o acesso à câmera.");
      setState(prev => ({ ...prev, view: 'home' }));
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        stopCamera();
        processImage(imageData);
      }
    }
  };

  const processImage = async (imageData: string) => {
    setIsLoading(true);
    setState(prev => ({ ...prev, view: 'processing', currentImage: imageData }));
    
    try {
      const summary = await geminiService.analyzeDocument(imageData, state.targetLanguage);
      const newDoc: SavedDocument = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        image: imageData,
        summary: summary,
        originalLanguage: 'Auto',
        targetLanguage: state.targetLanguage
      };

      setState(prev => ({
        ...prev,
        view: 'result',
        currentSummary: summary,
        history: [newDoc, ...prev.history]
      }));
    } catch (err) {
      console.error(err);
      alert("Falha ao analisar o documento. Tente novamente.");
      setState(prev => ({ ...prev, view: 'home' }));
    } finally {
      setIsLoading(false);
    }
  };

  const playSummary = async () => {
    if (!state.currentSummary) return;
    
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }

    setIsAudioLoading(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      
      const textToSpeak = `Documento do tipo ${state.currentSummary.type} de ${state.currentSummary.sender}. 
      Resumo: ${state.currentSummary.briefExplanation}. 
      Ações necessárias: ${state.currentSummary.requiredActions.join(', ')}. 
      A urgência é ${state.currentSummary.urgency}.`;

      const audioData = await geminiService.generateSpeech(textToSpeak, state.targetLanguage);
      
      const dataInt16 = new Int16Array(audioData);
      const frameCount = dataInt16.length;
      const buffer = ctx.createBuffer(1, frameCount, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = playbackSpeed;
      source.connect(ctx.destination);
      source.start();
      audioSourceRef.current = source;
      
      source.onended = () => {
        audioSourceRef.current = null;
      };
    } catch (err) {
      console.error("Erro na reprodução de áudio:", err);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(prev => ({ ...prev, targetLanguage: e.target.value }));
  };

  const renderHome = () => (
    <Layout title="SD Tradutor">
      <div className="flex flex-col gap-6 py-4">
        {/* Language Selection Bar - High Visibility */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-4 shadow-sm">
          <label className="text-[10px] font-bold text-indigo-400 uppercase mb-2 block tracking-wider">Eu entendo / I understand:</label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a6 6 0 011.084 3.463c.404.3.841.564 1.311.78a.5.5 0 11-.426.904 8.013 8.013 0 01-1.353-.74 8.01 8.01 0 01-4.706 1.134.5.5 0 01.127-.992 7.01 7.01 0 004.14-.997 5.99 5.99 0 01-1.32-2.553L4.93 9.475a.5.5 0 01-.86-.51l1.05-1.768A5.986 5.986 0 015 6H3a1 1 0 010-2h3V3a1 1 0 011-1zM7.5 6a4.996 4.996 0 00.75 2.502L10.373 6H7.5z" clipRule="evenodd" />
              </svg>
            </div>
            <select 
              value={state.targetLanguage}
              onChange={handleLanguageChange}
              className="flex-1 bg-transparent text-lg font-bold text-indigo-900 border-none focus:ring-0 cursor-pointer outline-none"
            >
              {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.name}>{l.flag} {l.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={startCamera}
            className="flex flex-col items-center justify-center gap-3 bg-indigo-600 text-white p-8 rounded-3xl shadow-lg active:scale-95 transition-all"
          >
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-bold text-lg">Escanear</span>
          </button>

          <label className="flex flex-col items-center justify-center gap-3 bg-white text-slate-700 p-8 rounded-3xl border-2 border-slate-100 shadow-sm active:scale-95 transition-all cursor-pointer">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => processImage(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }
              }} 
            />
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-lg">Galeria</span>
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg">Histórico Recente</h3>
            <span className="text-xs text-indigo-600 font-semibold">Ver todos</span>
          </div>
          <div className="flex flex-col gap-3">
            {state.history.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                <p>Nenhum documento ainda.</p>
              </div>
            ) : (
              state.history.slice(0, 5).map(doc => (
                <HistoryItem 
                  key={doc.id} 
                  doc={doc} 
                  onClick={() => setState(prev => ({ ...prev, view: 'result', currentImage: doc.image, currentSummary: doc.summary }))} 
                />
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );

  const renderCamera = () => (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <div className="absolute inset-8 border-2 border-white/50 rounded-2xl pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-lg"></div>
        </div>
      </div>
      <div className="bg-slate-900 px-6 py-10 flex items-center justify-between safe-bottom">
        <button onClick={() => { stopCamera(); setState(prev => ({ ...prev, view: 'home' })); }} className="text-white font-medium">
          Cancelar
        </button>
        <button 
          onClick={captureImage}
          className="w-20 h-20 bg-white rounded-full border-4 border-indigo-500 p-1 flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        >
          <div className="w-full h-full bg-white rounded-full border-2 border-slate-200"></div>
        </button>
        <div className="w-12 h-12"></div>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center p-8">
      <div className="w-64 h-64 mb-8 relative">
        <img src={state.currentImage} className="w-full h-full object-cover rounded-3xl opacity-50 grayscale" alt="Processando" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="absolute left-0 right-0 bottom-0 top-0 overflow-hidden pointer-events-none rounded-3xl">
           <div className="w-full h-1 bg-indigo-500 absolute animate-[scan_2s_infinite]"></div>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Analisando Documento...</h2>
      <p className="text-slate-500 text-center animate-pulse">Traduzindo e criando resumo em {state.targetLanguage}</p>
      <style>{`
        @keyframes scan {
          0% { top: 0% }
          50% { top: 100% }
          100% { top: 0% }
        }
      `}</style>
    </div>
  );

  const renderResult = () => {
    if (!state.currentSummary) return null;
    const urgency = state.currentSummary.urgency;
    const urgencyColors = {
      [UrgencyLevel.LOW]: 'bg-green-100 text-green-700',
      [UrgencyLevel.MEDIUM]: 'bg-yellow-100 text-yellow-700',
      [UrgencyLevel.HIGH]: 'bg-orange-100 text-orange-700',
      [UrgencyLevel.CRITICAL]: 'bg-red-100 text-red-700 border border-red-200 animate-pulse',
    };

    return (
      <Layout 
        title="Resumo do Documento" 
        onBack={() => setState(prev => ({ ...prev, view: 'home' }))}
      >
        <div className="flex flex-col gap-6 pb-40">
          <div className="rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-white p-2">
             <img src={state.currentImage} className="w-full max-h-48 object-cover rounded-2xl" alt="Doc Capturado" />
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${urgencyColors[urgency]}`}>
                  Prioridade {urgency === UrgencyLevel.LOW ? 'Baixa' : urgency === UrgencyLevel.MEDIUM ? 'Média' : 'Alta'}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-2">{state.currentSummary.type}</h2>
                <p className="text-slate-500 font-medium">{state.currentSummary.sender}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {state.currentSummary.dueDate && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Vencimento</span>
                  <span className="text-sm font-semibold text-slate-700">{state.currentSummary.dueDate}</span>
                </div>
              )}
              {state.currentSummary.value && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Valor</span>
                  <span className="text-sm font-semibold text-slate-700">{state.currentSummary.value}</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Explicação Rápida
              </h4>
              <p className="text-slate-600 leading-relaxed text-sm bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                {state.currentSummary.briefExplanation}
              </p>
            </div>

            <div className="mb-2">
              <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                O que fazer agora:
              </h4>
              <ul className="space-y-3">
                {state.currentSummary.requiredActions.map((action, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-600">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Audio sticky controls */}
        <div className="fixed bottom-0 left-0 right-0 p-6 max-w-md mx-auto bg-white/90 backdrop-blur-lg border-t border-slate-200 safe-bottom shadow-2xl rounded-t-3xl">
          <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <div className="flex gap-2">
                   {[0.75, 1, 1.25, 1.5].map(s => (
                     <button 
                      key={s} 
                      onClick={() => setPlaybackSpeed(s)}
                      className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-colors ${playbackSpeed === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                     >
                       {s}x
                     </button>
                   ))}
                </div>
                <div className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                  Idioma: {state.targetLanguage}
                </div>
             </div>
             
             <button 
                onClick={playSummary}
                disabled={isAudioLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 text-lg"
              >
                {isAudioLoading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
                {isAudioLoading ? 'Gerando Áudio...' : 'Ouvir Resumo'}
              </button>
          </div>
        </div>
      </Layout>
    );
  };

  switch (state.view) {
    case 'camera': return renderCamera();
    case 'processing': return renderProcessing();
    case 'result': return renderResult();
    default: return renderHome();
  }
};

export default App;
