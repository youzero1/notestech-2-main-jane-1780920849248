import React, { useEffect, useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Music2, Mic, DollarSign, Users, ChevronDown, ChevronUp, Plus, Play, RotateCcw, Volume2, Share2, Pause, VolumeX } from "lucide-react";
import { AIMusicTools } from "@/components/music/AIMusicTools";
import { TrackList } from "@/components/music/TrackList";
import { TrackUploader } from "@/components/music/TrackUploader";
import { TrackFilters } from "@/components/music/TrackFilters";
import { CollaborationHub } from "@/components/music/CollaborationHub";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link, useSearchParams } from "react-router-dom";
import { MembershipGuard } from "@/components/auth/MembershipGuard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TextGeneratorTool {
  id: string;
  icon: string;
  label: string;
  description: string;
  shortcode: string;
}

const TEXT_GENERATOR_TOOLS: TextGeneratorTool[] = [
  { 
    id: 'simile',
    icon: 'A=B',
    label: 'Simile',
    description: 'Create a simile about a thing or concept.',
    shortcode: 'A=B'
  },
  { 
    id: 'rhyme',
    icon: 'A_A',
    label: 'Rhyme',
    description: 'Generate rhyming words and phrases.',
    shortcode: 'A_A'
  },
  { 
    id: 'alliteration',
    icon: '/AA',
    label: 'Alliteration',
    description: 'Create alliterative phrases.',
    shortcode: '/AA'
  },
  { 
    id: 'wordplay',
    icon: 'W',
    label: 'Word Play',
    description: 'Generate creative word play and puns.',
    shortcode: 'W'
  },
  { 
    id: 'link',
    icon: '⭾',
    label: 'Link',
    description: 'Connect ideas with creative transitions.',
    shortcode: '⭾'
  },
  { 
    id: 'combine',
    icon: '⊕',
    label: 'Combine',
    description: 'Merge different concepts together.',
    shortcode: '⊕'
  },
  { 
    id: 'rap',
    icon: 'R.A.P.',
    label: 'Rap',
    description: 'Generate rap-style lyrics.',
    shortcode: 'R.A.P.'
  },
  { 
    id: 'flow',
    icon: '~',
    label: 'Flow',
    description: 'Create smooth flowing phrases.',
    shortcode: '~'
  },
  { 
    id: 'image',
    icon: '🖼',
    label: 'Image',
    description: 'Generate descriptive imagery.',
    shortcode: '🖼'
  },
];

const AudioWaveform = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [audioData, setAudioData] = useState<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const animationFrameRef = useRef<number>();
  const bufferLength = 100;

  useEffect(() => {
    // Initialize audio context and nodes
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    gainNodeRef.current = audioContextRef.current.createGain();

    // Connect nodes
    gainNodeRef.current.connect(audioContextRef.current.destination);
    analyserRef.current.connect(gainNodeRef.current);

    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const updateWaveform = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);
    
    const normalizedData = Array.from(dataArray).map(value => (value - 128) / 128);
    setAudioData(normalizedData.slice(0, bufferLength));
    
    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  };

  const startOscillator = () => {
    if (!audioContextRef.current || !analyserRef.current) return;

    oscillatorRef.current = audioContextRef.current.createOscillator();
    oscillatorRef.current.connect(analyserRef.current);
    oscillatorRef.current.start();
    updateWaveform();
  };

  const stopOscillator = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopOscillator();
    } else {
      startOscillator();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleRepeat = () => {
    setIsRepeating(!isRepeating);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handlePlaySound = () => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    oscillator.connect(audioContext.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), 500); // Stop after 500ms
  };

  return (
    <div className="bg-[#1E1E20] rounded-lg p-4 border border-[#2C2C30]">
      <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
        {/* Play Controls */}
        <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
          <button
            onClick={togglePlay}
            className={`w-10 h-10 rounded-full ${
              isPlaying ? 'bg-[#B8996D]' : 'bg-black/40 hover:bg-black/60'
            } flex items-center justify-center transition-colors`}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-black" />
            ) : (
              <Play className="h-5 w-5 text-neutral-400" fill="currentColor" />
            )}
          </button>
          <button 
            onClick={toggleRepeat}
            className={`w-10 h-10 rounded-full ${
              isRepeating ? 'bg-[#B8996D]' : 'bg-black/40 hover:bg-black/60'
            } flex items-center justify-center transition-colors`}
          >
            <RotateCcw className={`h-5 w-5 ${
              isRepeating ? 'text-black' : 'text-neutral-400'
            }`} />
          </button>
          <button 
            onClick={toggleMute}
            className={`w-10 h-10 rounded-full ${
              isMuted ? 'bg-[#B8996D]' : 'bg-black/40 hover:bg-black/60'
            } flex items-center justify-center transition-colors`}
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-black" />
            ) : (
              <Volume2 className="h-5 w-5 text-neutral-400" />
            )}
          </button>
        </div>

        {/* Waveform */}
        <div className="w-full h-16 bg-black/40 rounded-lg relative overflow-hidden sm:flex-1">
          <div className="absolute inset-0 flex items-center px-2">
            {audioData.map((value, i) => (
              <div
                key={i}
                className="flex-1 mx-[0.5px] bg-[#B8996D]/40 transition-all duration-75"
                style={{ height: `${Math.abs(value * 100)}%` }}
              />
            ))}
          </div>
          <div className="absolute top-0 left-1/2 h-full w-0.5 bg-white"></div>
        </div>

        {/* Track Controls */}
        <div className="flex items-center justify-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
          <button className="px-3 py-1.5 bg-black/40 rounded text-xs text-neutral-400 hover:bg-black/60">
            BPM
          </button>
          <button className="px-3 py-1.5 bg-black/40 rounded text-xs text-neutral-400 hover:bg-black/60">
            KEY
          </button>
          <button className="w-8 h-8 bg-black/40 rounded flex items-center justify-center hover:bg-black/60">
            <Share2 className="h-4 w-4 text-neutral-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Music = () => {
  const [refreshTracks, setRefreshTracks] = React.useState(0);
  const [sortBy, setSortBy] = React.useState('date-new');
  const [genre, setGenre] = React.useState('all');
  const [timePeriod, setTimePeriod] = React.useState('all');
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = React.useState('create');
  const [temperature, setTemperature] = React.useState(0.7);
  const [inputText, setInputText] = React.useState('');
  const [isTextGeneratorExpanded, setIsTextGeneratorExpanded] = React.useState(true);
  const [selectedTool, setSelectedTool] = useState<string>('simile');
  const [isAudioGeneratorExpanded, setIsAudioGeneratorExpanded] = React.useState(true);
  const [instrumentValues, setInstrumentValues] = useState({
    'pop punk': 50,
    'funky': 50,
    'ele. guitar': 50,
    'bass': 50
  });
  const [density, setDensity] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [chaos, setChaos] = useState(0);
  const [drums, setDrums] = useState(true);
  const [bass, setBass] = useState(true);
  const [other, setOther] = useState(true);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'business' || tab === 'create' || tab === 'collaborate') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleUploadSuccess = () => {
    setRefreshTracks(prev => prev + 1);
  };

  const handleSliderChange = (name: string, value: number) => {
    setInstrumentValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSliderDrag = (e: React.MouseEvent, name: string, sliderRef: HTMLDivElement) => {
    const rect = sliderRef.getBoundingClientRect();
    const width = rect.width;
    const left = rect.left;
    
    const handleMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.clientX - left;
      const percentage = Math.max(0, Math.min(100, (x / width) * 100));
      handleSliderChange(name, Math.round(percentage));
    };

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const generateText = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a thing or concept.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingText(true);
    setGeneratedText(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-text', {
        body: {
          prompt: inputText,
          tool: selectedTool,
          temperature: temperature,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setGeneratedText(data.content);
    } catch (error) {
      console.error('Error generating text:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingText(false);
    }
  };

  return (
    <DashboardLayout headerTitle="Creator Suite">
      <div className="min-h-screen">
        <div className="p-3 sm:p-4 md:p-6 lg:p-0">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            {/* <h1 className="text-xl md:text-2xl font-semibold text-white">Creator Suite</h1> */}
          </div>

          <div className="space-y-4 md:space-y-6">
            {/* Text Generator Section */}
            <div className="rounded-lg bg-[#1C1C1C] p-3 sm:p-4 md:p-6 lg:mx-0 mb-4 md:mb-6 border border-[#2C2C30] mt-10 sm:mt-0">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3 max-w-[75%]">
                  <div className="min-w-0">
                    <h2 className="text-base md:text-lg font-medium truncate">Text Generator</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setIsTextGeneratorExpanded(!isTextGeneratorExpanded)}
                  className="text-[#987D4D] hover:text-[#C5A87D] flex items-center gap-2 transition-colors duration-200 ml-2 shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.33301 4.33337L9.66634 9.66671" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8.46967 4.46971C8.17678 4.7626 8.17678 5.23748 8.46967 5.53037C8.76256 5.82326 9.23744 5.82326 9.53033 5.53037L8.46967 4.46971ZM13.197 1.8637C13.4899 1.57081 13.4899 1.09594 13.197 0.803044C12.9041 0.510151 12.4292 0.510151 12.1363 0.803044L13.197 1.8637ZM9.53033 5.53037L13.197 1.8637L12.1363 0.803044L8.46967 4.46971L9.53033 5.53037Z" fill="currentColor"/>
                    <path d="M0.802678 12.1363C0.509785 12.4292 0.509784 12.9041 0.802678 13.197C1.09557 13.4899 1.57044 13.4899 1.86334 13.197L0.802678 12.1363ZM5.53 9.53033C5.8229 9.23744 5.8229 8.76256 5.53 8.46967C5.23711 8.17678 4.76224 8.17678 4.46934 8.46967L5.53 9.53033ZM1.86334 13.197L5.53 9.53033L4.46934 8.46967L0.802678 12.1363L1.86334 13.197Z" fill="currentColor"/>
                    <path d="M10.333 1.15775C10.8334 1.15064 12.4906 0.806391 12.8419 1.15775C13.1933 1.50912 12.849 3.16627 12.8419 3.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1.15775 10.3334C1.15064 10.8338 0.806391 12.4909 1.15775 12.8423C1.50912 13.1936 3.16627 12.8494 3.66667 12.8423" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[14px]">Expand</span>
                </button>
              </div>
              
              {/* Expandable Content */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isTextGeneratorExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                {/* Tool buttons row */}
                <div className="flex flex-wrap gap-[5px] mb-4 md:mb-6">
                  {TEXT_GENERATOR_TOOLS.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedTool(tool.id)}
                      className={`w-[62px] h-[62px] rounded-lg flex flex-col items-center justify-center gap-1
                        transition-all duration-200 ease-in-out p-2
                        ${tool.id === selectedTool
                          ? 'bg-[#B8996D] text-black' 
                          : 'bg-[#2C2C2C] hover:bg-[#363636] border border-[#2C2C30]'
                        }`}
                    >
                      <span className="text-[10px]">{tool.icon}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-current"></span>
                    </button>
                  ))}
                </div>

                {/* Selected Tool Content */}
                <div className="grid grid-cols-1 lg:grid-cols-[300px,minmax(0,400px)] gap-4">
                  {/* Tool Info */}
                  <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2C2C30]">
                    <div className="text-[#B8996D] mb-1 md:mb-2">
                      {TEXT_GENERATOR_TOOLS.find(t => t.id === selectedTool)?.shortcode}
                    </div>
                    <h3 className="text-lg md:text-xl mb-1 md:mb-2">
                      {TEXT_GENERATOR_TOOLS.find(t => t.id === selectedTool)?.label}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {TEXT_GENERATOR_TOOLS.find(t => t.id === selectedTool)?.description}
                    </p>
                  </div>

                  {/* Input Area Card */}
                  <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2C2C30]">
                    <div className="space-y-12">
                      {/* Input field with character count */}
                      <div>
                        <label className="block text-sm text-neutral-200 mb-3">
                          Enter a thing or concept:
                        </label>
                        <div className="relative mb-6">
                          <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            maxLength={25}
                            className="w-full bg-transparent border-b border-[#333333] h-10 px-0 text-sm focus:outline-none focus:border-[#B8996D] transition-colors"
                            placeholder=""
                          />
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                            {inputText.length}/25
                          </div>
                        </div>
                      </div>

                      {/* Temperature and Run button in one line */}
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-neutral-200">Temperature</span>
                        <div className="w-24 relative">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full appearance-none bg-transparent cursor-pointer 
                              [&::-webkit-slider-runnable-track]:rounded-full 
                              [&::-webkit-slider-runnable-track]:bg-[#2C2C2C] 
                              [&::-webkit-slider-runnable-track]:h-0.5 
                              [&::-webkit-slider-thumb]:appearance-none 
                              [&::-webkit-slider-thumb]:h-2 
                              [&::-webkit-slider-thumb]:w-2 
                              [&::-webkit-slider-thumb]:rounded-full 
                              [&::-webkit-slider-thumb]:bg-[#B8996D] 
                              [&::-webkit-slider-thumb]:mt-[-2.5px] 
                              hover:[&::-webkit-slider-thumb]:bg-[#C5A87D]"
                          />
                        </div>
                        <span className="text-xs text-neutral-400">{temperature}</span>
                        <button 
                          className="h-7 px-4 bg-[#B8996D] text-black rounded-lg hover:bg-[#C5A87D] transition-colors text-xs font-medium ml-auto"
                          onClick={generateText}
                          disabled={isGeneratingText || !inputText.trim()}
                        >
                          {isGeneratingText ? "Generating..." : "Run"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Generated Text Card */}
                  {generatedText && (
                    <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2C2C30] max-h-[150px] overflow-y-auto">
                      <h3 className="text-lg md:text-xl mb-2 text-[#B8996D]">Generated Text</h3>
                      <p className="text-sm text-white">{generatedText}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Audio Generator Section */}
            <div className="rounded-lg bg-[#1C1C1C] p-3 sm:p-4 md:p-6 lg:mx-0 mb-4 md:mb-6 border border-[#2C2C30]">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3 max-w-[75%]">
                  <div className="min-w-0">
                    <h2 className="text-base md:text-lg font-medium truncate">Audio Generator</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAudioGeneratorExpanded(!isAudioGeneratorExpanded)}
                  className="text-[#987D4D] hover:text-[#C5A87D] flex items-center gap-2 transition-colors duration-200 ml-2 shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.33301 4.33337L9.66634 9.66671" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8.46967 4.46971C8.17678 4.7626 8.17678 5.23748 8.46967 5.53037C8.76256 5.82326 9.23744 5.82326 9.53033 5.53037L8.46967 4.46971ZM13.197 1.8637C13.4899 1.57081 13.4899 1.09594 13.197 0.803044C12.9041 0.510151 12.4292 0.510151 12.1363 0.803044L13.197 1.8637ZM9.53033 5.53037L13.197 1.8637L12.1363 0.803044L8.46967 4.46971L9.53033 5.53037Z" fill="currentColor"/>
                    <path d="M0.802678 12.1363C0.509785 12.4292 0.509784 12.9041 0.802678 13.197C1.09557 13.4899 1.57044 13.4899 1.86334 13.197L0.802678 12.1363ZM5.53 9.53033C5.8229 9.23744 5.8229 8.76256 5.53 8.46967C5.23711 8.17678 4.76224 8.17678 4.46934 8.46967L5.53 9.53033ZM1.86334 13.197L5.53 9.53033L4.46934 8.46967L0.802678 12.1363L1.86334 13.197Z" fill="currentColor"/>
                    <path d="M10.333 1.15775C10.8334 1.15064 12.4906 0.806391 12.8419 1.15775C13.1933 1.50912 12.849 3.16627 12.8419 3.66667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M1.15775 10.3334C1.15064 10.8338 0.806391 12.4909 1.15775 12.8423C1.50912 13.1936 3.16627 12.8494 3.66667 12.8423" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span className="text-[14px]">Expand</span>
                </button>
              </div>

              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isAudioGeneratorExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                {/* Main Content */}
                <div className="flex flex-col gap-4">
                  {/* Prompt and Instruments Section */}
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Left Side - Prompt and Tags */}
                    <div className="flex-1 space-y-4">
                      {/* Prompt Input */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Add a prompt..."
                          className="w-full bg-[#1E1E1E] rounded-lg h-10 sm:h-12 px-3 sm:px-4 text-sm focus:outline-none focus:bg-[#1E1E1E]"
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#2C2C2C] rounded-md">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Tags */}
                      <div className="space-y-2 overflow-x-auto">
                        <div className="flex flex-wrap gap-2">
                          {/* First row tags */}
                          <div className="flex flex-wrap gap-2">
                            {['more', 'squelchy club mix', 'hard rock', 'bagpipes'].map((tag) => (
                              <button
                                key={tag}
                                className="px-3 py-1.5 bg-[#1E1E1E] rounded-md text-xs hover:bg-[#2C2C2C] transition-colors border border-[#2C2C30] text-neutral-400 whitespace-nowrap"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Second row tags */}
                        <div className="flex flex-wrap gap-2">
                          {['trumpet', 'a capella beatboxer', 'harmonica', 'cello punk song'].map((tag) => (
                            <button
                              key={tag}
                              className="px-3 py-1.5 bg-[#1E1E1E] rounded-md text-xs hover:bg-[#2C2C2C] transition-colors border border-[#2C2C30] text-neutral-400 whitespace-nowrap"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Instrument Controls */}
                    <div className="w-full lg:w-[280px] bg-[#1E1E1E] rounded-lg p-3">
                      <div className="flex flex-col gap-3">
                        {Object.entries(instrumentValues).map(([name, value]) => (
                          <div key={name} className="flex items-center gap-3">
                            <span className="text-xs sm:text-sm text-neutral-400 w-16 sm:w-20">{name}</span>
                            <div 
                              className="flex-1 h-8 relative cursor-pointer"
                              onMouseDown={(e) => {
                                const sliderTrack = e.currentTarget;
                                const rect = sliderTrack.getBoundingClientRect();
                                
                                const handleMove = (moveEvent: MouseEvent) => {
                                  const x = moveEvent.clientX - rect.left;
                                  const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                                  handleSliderChange(name, Math.round(percentage));
                                };
                                
                                const handleUp = () => {
                                  document.removeEventListener('mousemove', handleMove);
                                  document.removeEventListener('mouseup', handleUp);
                                };
                                
                                handleMove(e.nativeEvent);
                                document.addEventListener('mousemove', handleMove);
                                document.addEventListener('mouseup', handleUp);
                              }}
                            >
                              {/* Slider track */}
                              <div className="absolute top-1/2 -translate-y-1/2 bg-[#5C5047] rounded-[17px] w-full"
                                   style={{ height: '24px' }}>
                                {/* Left side of slider */}
                                <div 
                                  className="absolute h-full bg-[#CBBEB4] rounded-l-[17px]"
                                  style={{ width: `${value}%` }}
                                />
                              </div>
                              {/* Slider handle */}
                              <div 
                                className="absolute top-1/2 bg-[#987D4D] rounded-full hover:scale-110 transition-transform"
                                style={{ 
                                  left: `${value}%`, 
                                  transform: 'translateX(-50%) translateY(-50%)',
                                  width: '24px',
                                  height: '24px'
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Controls Section */}
                  <div className="bg-[#1E1E20] p-4 rounded-lg border border-[#2C2C30]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Control Groups */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-full bg-black/40 rounded-full px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-center gap-2 sm:gap-3">
                          {/* Density Controls */}
                          {[0, 1, 2].map((value) => (
                            <button 
                              key={value}
                              onClick={() => setDensity(value)}
                              className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center transition-colors
                                ${density === value ? 'bg-[#B8996D]' : 'bg-black/40 hover:bg-black/60'}`}
                            >
                              <span className={`text-xs sm:text-sm ${density === value ? 'text-black' : 'text-neutral-400'}`}>
                                {value === 0 ? '★' : value === 1 ? '〰' : '∿'}
                              </span>
                            </button>
                          ))}
                        </div>
                        <span className="text-xs sm:text-sm text-neutral-500">Density</span>
                      </div>

                      {/* Brightness Control */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-full bg-black/40 rounded-full px-3 py-2 flex items-center justify-center gap-2">
                          {[0, 1, 2].map((value) => (
                            <button 
                              key={value}
                              onClick={() => setBrightness(value)}
                              className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center transition-colors
                                ${brightness === value ? 'bg-[#B8996D]' : 'bg-black/40 hover:bg-black/60'}`}
                            >
                              <span className={`text-xs sm:text-sm ${brightness === value ? 'text-black' : 'text-neutral-400'}`}>
                                {value === 0 ? '○' : value === 1 ? '◐' : '●'}
                              </span>
                            </button>
                          ))}
                        </div>
                        <span className="text-xs sm:text-sm text-neutral-500">Brightness</span>
                      </div>

                      {/* Chaos Control */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-full bg-black/40 rounded-full px-3 py-2 flex items-center justify-center gap-2">
                          {[0, 1, 2].map((value) => (
                            <button 
                              key={value}
                              onClick={() => setChaos(value)}
                              className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center transition-colors
                                ${chaos === value ? 'bg-[#B8996D]' : 'bg-black/40 hover:bg-black/60'}`}
                            >
                              <span className={`text-xs sm:text-sm ${chaos === value ? 'text-black' : 'text-neutral-400'}`}>
                                {value === 0 ? '⚪' : value === 1 ? '⚡' : '💥'}
                              </span>
                            </button>
                          ))}
                        </div>
                        <span className="text-xs sm:text-sm text-neutral-500">Chaos</span>
                      </div>

                      {/* Sound Controls */}
                      <div className="flex items-center justify-center gap-4 sm:gap-6">
                        {/* Sound control buttons */}
                        {[
                          { label: 'Drums', state: drums, setState: setDrums },
                          { label: 'Bass', state: bass, setState: setBass },
                          { label: 'Other', state: other, setState: setOther }
                        ].map(({ label, state, setState }) => (
                          <div key={label} className="flex flex-col items-center gap-2">
                            <button 
                              onClick={() => setState(!state)}
                              className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center transition-colors
                                ${state ? 'bg-[#B8996D]' : 'bg-black/40 hover:bg-black/60'}`}
                            >
                              <Volume2 className={`h-4 sm:h-5 w-4 sm:w-5 ${state ? 'text-black' : 'text-[#B8996D]'}`} />
                            </button>
                            <span className="text-xs sm:text-sm text-neutral-500">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Audio Waveform */}
                  <AudioWaveform />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Music;
