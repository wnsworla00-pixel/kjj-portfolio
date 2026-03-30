import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Move, 
  Music, 
  Theater, 
  Mail, 
  Instagram, 
  Phone, 
  Edit3, 
  Check, 
  Plus, 
  Trash2,
  ChevronRight,
  Lightbulb,
  ArrowLeft,
  Image as ImageIcon,
  Type,
  Maximize,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from './lib/utils';
import { PortfolioData, Project } from './types';
import { INITIAL_DATA } from './constants';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const EditableText = ({ 
  value, 
  onChange, 
  className, 
  multiline = false,
  isEditMode,
  tag: Tag = 'span' as any
}: { 
  value: string; 
  onChange: (val: string) => void; 
  className?: string; 
  multiline?: boolean;
  isEditMode: boolean;
  tag?: any;
}) => {
  if (!isEditMode) return <Tag className={className}>{value}</Tag>;

  return multiline ? (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("w-full bg-white/10 border border-white/20 rounded p-2 focus:outline-none focus:border-orange-500", className)}
      rows={4}
    />
  ) : (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("bg-white/10 border border-white/20 rounded px-2 py-1 focus:outline-none focus:border-orange-500", className)}
    />
  );
};

export default function App() {
  const [data, setData] = useState<PortfolioData>(INITIAL_DATA);
  const [backupData, setBackupData] = useState<PortfolioData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedGenre, setExpandedGenre] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const selectedProject = data.projects.find(p => p.id === selectedProjectId) || null;

  const enhanceImage = async () => {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Proceed after opening dialog as per guidelines
      }

      setIsEnhancing(true);

      // 1. Get current image base64 from server
      const filename = data.designerPhoto.startsWith("/") ? data.designerPhoto.slice(1) : data.designerPhoto;
      const res = await fetch(`/api/image/${filename}`);
      if (!res.ok) throw new Error("Failed to load image from server");
      const { base64, mimeType } = await res.json();

      // 2. Call Gemini to enhance
      const apiKey = (process.env as any).API_KEY;
      if (!apiKey) {
        await window.aistudio.openSelectKey();
        setIsEnhancing(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64,
                mimeType: mimeType,
              },
            },
            {
              text: 'Upscale this image to 2K resolution and enhance the quality, making it look professional and sharp. Remove any noise and improve the lighting.',
            },
          ],
        },
        config: {
          imageConfig: {
            imageSize: "2K"
          }
        }
      });

      let enhancedBase64 = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          enhancedBase64 = part.inlineData.data;
          break;
        }
      }

      if (!enhancedBase64) throw new Error("Failed to generate enhanced image");

      // 3. Save back to server
      const saveRes = await fetch("/api/image/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, base64: enhancedBase64 })
      });

      if (!saveRes.ok) throw new Error("Failed to save enhanced image");

      // 4. Force refresh image
      setData(prev => ({ ...prev, designerPhoto: `${filename}?t=${Date.now()}` }));
      alert("Image enhanced successfully!");

    } catch (error: any) {
      console.error("Enhancement failed:", error);
      const errorMsg = typeof error === 'string' ? error : JSON.stringify(error);
      
      if (errorMsg.includes("403") || errorMsg.includes("PERMISSION_DENIED")) {
        alert("이 기능은 결제가 활성화된(Paid) 프로젝트의 API 키가 필요합니다. \n\n1. ai.google.dev/gemini-api/docs/billing 에서 빌링 설정을 확인해 주세요. \n2. 다시 나타나는 창에서 유료 프로젝트의 키를 선택해 주세요.");
        await window.aistudio.openSelectKey();
      } else if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      } else {
        alert("이미지 강화에 실패했습니다. API 키 상태를 확인하고 다시 시도해 주세요.");
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  // Group projects by genre
  const groupedProjects = data.projects.reduce((acc, project) => {
    const genre = project.genre || "Other";
    if (!acc[genre]) acc[genre] = [];
    acc[genre].push(project);
    return acc;
  }, {} as Record<string, Project[]>);

  const genreOrder = ["MUSICAL", "THEATRE", "DANCE", "CONCERT"];
  const genres = Object.keys(groupedProjects).sort((a, b) => {
    const indexA = genreOrder.indexOf(a.toUpperCase());
    const indexB = genreOrder.indexOf(b.toUpperCase());
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('bulhandang_portfolio_data_v3');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Merge with INITIAL_DATA to ensure new fields exist
        setData({
          ...INITIAL_DATA,
          ...parsed,
          style: { ...INITIAL_DATA.style, ...(parsed.style || {}) },
          fonts: { ...INITIAL_DATA.fonts, ...(parsed.fonts || {}) }
        });
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bulhandang_portfolio_data_v3', JSON.stringify(data));
  }, [data]);

  // Apply dynamic fonts
  useEffect(() => {
    document.documentElement.style.setProperty('--font-sans', data.fonts.sans);
    document.documentElement.style.setProperty('--font-serif', data.fonts.serif);
  }, [data.fonts]);

  const updateField = (path: string, value: string) => {
    const newData = { ...data };
    const keys = path.split('.');
    let current: any = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setData(newData);
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: "New Project Title",
      genre: "Genre",
      role: "Role",
      year: new Date().getFullYear().toString(),
      description: "Project description goes here...",
      images: ["https://picsum.photos/seed/new/1200/800"]
    };
    setData(prev => ({ ...prev, projects: [newProject, ...prev.projects] }));
  };

  const removeProject = (id: string) => {
    setData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden selection:bg-orange-500/30" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Atmospheric Background */}
      <div className="fixed inset-0 z-0">
        <div className="atmosphere absolute inset-0" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b-0 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-orange-500" />
          <span className="font-serif text-xl tracking-widest uppercase" style={{ fontFamily: 'var(--font-serif)' }}>{data.studioName}</span>
        </div>
        <div className="flex items-center gap-4">
          {isEditMode && (
            <div className="hidden lg:flex items-center gap-4 glass px-4 py-1 rounded-full">
              <div className="flex items-center gap-2 text-xs opacity-60">
                <Type className="w-3 h-3" /> Sans:
                <input 
                  value={data.fonts.sans} 
                  onChange={(e) => updateField('fonts.sans', e.target.value)}
                  className="bg-transparent border-b border-white/20 w-24 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 text-xs opacity-60">
                <Type className="w-3 h-3" /> Serif:
                <input 
                  value={data.fonts.serif} 
                  onChange={(e) => updateField('fonts.serif', e.target.value)}
                  className="bg-transparent border-b border-white/20 w-24 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 text-xs opacity-60 border-l border-white/10 pl-4">
                <Maximize className="w-3 h-3" /> Sizes:
                <input 
                  value={data.style.h1Size} 
                  onChange={(e) => updateField('style.h1Size', e.target.value)}
                  className="bg-transparent border-b border-white/20 w-12 focus:outline-none"
                  placeholder="H1"
                />
                <input 
                  value={data.style.h2Size} 
                  onChange={(e) => updateField('style.h2Size', e.target.value)}
                  className="bg-transparent border-b border-white/20 w-12 focus:outline-none"
                  placeholder="H2"
                />
                <input 
                  value={data.style.bodySize} 
                  onChange={(e) => updateField('style.bodySize', e.target.value)}
                  className="bg-transparent border-b border-white/20 w-12 focus:outline-none"
                  placeholder="Body"
                />
                <input 
                  value={data.style.hanjaSize} 
                  onChange={(e) => updateField('style.hanjaSize', e.target.value)}
                  className="bg-transparent border-b border-white/20 w-12 focus:outline-none"
                  placeholder="Hanja"
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <button 
                  onClick={() => {
                    if (backupData) setData(backupData);
                    setIsEditMode(false);
                    setBackupData(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full glass hover:bg-red-500/20 text-red-500 transition-all text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setIsEditMode(false);
                    setBackupData(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white transition-all text-sm font-medium"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  setBackupData(JSON.parse(JSON.stringify(data)));
                  setIsEditMode(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass hover:bg-white/10 transition-all text-sm font-medium"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-64 pb-20 px-6 max-w-7xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center"
        >
          {/* Logo Section */}
          <div className="mb-12 w-full max-w-xl relative group flex flex-col items-center">
            <img 
              src={data.logoUrl} 
              alt="Bul-Han-Dang Logo" 
              className="w-full h-auto object-contain max-h-[80px] opacity-80"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              referrerPolicy="no-referrer"
            />
            {isEditMode && (
              <div className="mt-4 w-64 glass px-4 py-2 rounded-full flex items-center gap-3">
                <ImageIcon className="w-4 h-4 opacity-50" />
                <input 
                  value={data.logoUrl} 
                  onChange={(e) => updateField('logoUrl', e.target.value)}
                  className="bg-transparent border-none text-[11px] w-full focus:outline-none"
                  placeholder="Logo URL or /Logo.png"
                />
              </div>
            )}
          </div>

          <h1 className={cn("font-serif mb-6 tracking-tighter text-glow flex items-center justify-center opacity-60", `text-${data.style.h1Size}`)} style={{ fontFamily: 'var(--font-serif)' }}>
            <div className="text-4xl md:text-[5rem] leading-none relative inline-block">
              <EditableText 
                value={data.studioName} 
                onChange={(v) => updateField('studioName', v)} 
                isEditMode={isEditMode}
              />
              {/* Hanja positioned next to '당' and lower with a different brush style */}
              <span 
                className="absolute -right-20 bottom-0 opacity-40 whitespace-nowrap"
                style={{ 
                  fontFamily: "'Zhi Mang Xing', cursive", 
                  fontSize: '0.35em',
                  transform: 'translateY(15%)'
                }}
              >
                <EditableText 
                  value={data.studioNameHanja} 
                  onChange={(v) => updateField('studioNameHanja', v)} 
                  isEditMode={isEditMode}
                />
              </span>
            </div>
          </h1>
          <p className={cn("font-light tracking-[0.3em] uppercase opacity-70", `text-${data.style.bodySize}`)}>
            Lighting Design
          </p>
        </motion.div>
      </section>

      {/* 01. Intro Section */}
      <section className="relative py-32 px-6 max-w-4xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="space-y-12 text-center"
        >
          <div className={cn("inline-block px-4 py-1 glass rounded-full tracking-widest uppercase opacity-60 font-sans font-medium", `text-${data.style.accentSize}`)}>
            01. Intro
          </div>
          <blockquote className={cn("font-sans italic leading-tight text-white/90 font-medium", `text-${data.style.h2Size}`)}>
            "<EditableText 
              value={data.intro.quote} 
              onChange={(v) => updateField('intro.quote', v)} 
              isEditMode={isEditMode}
            />"
          </blockquote>
          <div className={cn("font-light leading-relaxed opacity-70 max-w-2xl mx-auto", `text-${data.style.bodySize}`)}>
            <EditableText 
              value={data.intro.description} 
              onChange={(v) => updateField('intro.description', v)} 
              multiline
              isEditMode={isEditMode}
            />
          </div>
        </motion.div>
      </section>

      {/* 02. Works Section (Swapped) */}
      <section className="relative py-32 px-6 max-w-7xl mx-auto z-10">
        <div className="flex flex-col items-center mb-16">
          <div className={cn("inline-block px-4 py-1 glass rounded-full tracking-widest uppercase opacity-60 mb-8 font-sans font-medium", `text-${data.style.accentSize}`)}>
            02. Works
          </div>
          <div className="flex items-center gap-4">
            <h2 className={cn("font-sans font-medium", `text-${data.style.h2Size}`)}>Portfolio</h2>
            {isEditMode && (
              <button 
                onClick={addProject}
                className="p-2 glass rounded-full hover:bg-orange-500 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6 max-w-2xl mx-auto">
          <AnimatePresence mode="popLayout">
            {genres.map((genre) => (
              <motion.div
                key={genre}
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                {/* Genre Header */}
                <div 
                  onClick={() => setExpandedGenre(expandedGenre === genre ? null : genre)}
                  className={cn(
                    "p-6 glass rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer text-center transition-all duration-500 glass-hover",
                    expandedGenre === genre && "ring-1 ring-orange-500/30 bg-white/5"
                  )}
                >
                  <h3 className={cn("font-sans text-white/60 group-hover:text-orange-500 transition-colors uppercase tracking-tight font-medium", `text-${data.style.h2Size}`)}>
                    {genre}
                  </h3>
                  <motion.div
                    animate={{ rotate: expandedGenre === genre ? 180 : 0 }}
                    className="w-8 h-8 rounded-full glass flex items-center justify-center text-orange-500"
                  >
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </motion.div>
                </div>

                {/* Performance List (Level 2) */}
                <AnimatePresence>
                  {expandedGenre === genre && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-3 pl-4 border-l border-white/10 ml-4"
                    >
                      {groupedProjects[genre].map((project) => (
                        <div key={project.id} className="space-y-3">
                          <div 
                            onClick={() => !isEditMode && setSelectedProjectId(project.id)}
                            className={cn(
                              "p-4 glass rounded-2xl flex items-center justify-center relative cursor-pointer glass-hover transition-all hover:bg-orange-500/10 border-transparent hover:border-orange-500/30",
                              isEditMode && "cursor-default"
                            )}
                          >
                            <div className="flex flex-col items-center text-center gap-1">
                              <span className="text-orange-500 font-mono text-[10px] tracking-widest">{project.year}</span>
                              <h4 className={cn("font-sans font-medium", `text-${data.style.bodySize}`)}>
                                <EditableText 
                                  value={project.title} 
                                  onChange={(v) => updateProject(project.id, 'title', v)} 
                                  isEditMode={isEditMode}
                                />
                              </h4>
                            </div>
                            
                            {!isEditMode && (
                              <div className="absolute right-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            )}
                            
                            {isEditMode && (
                              <div className="absolute right-4 flex items-center gap-2">
                                <button 
                                  onClick={() => setSelectedProjectId(project.id)}
                                  className="p-1.5 glass rounded-lg hover:bg-orange-500 transition-colors"
                                  title="Edit Details"
                                >
                                  <Maximize className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeProject(project.id);
                                  }}
                                  className="p-1.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* 03. About Section (Swapped) */}
      <section className="relative py-32 px-6 max-w-7xl mx-auto z-10">
        <div className="space-y-12">
          <div className={cn("inline-block px-4 py-1 glass rounded-full tracking-widest uppercase opacity-60 font-sans font-medium", `text-${data.style.accentSize}`)}>
            03. About Designer
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-[0.7fr_1.3fr] gap-12 md:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="aspect-[3/4] glass rounded-[32px] overflow-hidden relative shadow-2xl">
                <img 
                  src={data.designerPhoto} 
                  alt="Designer" 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0502]/60 via-transparent to-transparent" />
              </div>
              {isEditMode && (
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 glass px-4 py-2 rounded-2xl">
                    <ImageIcon className="w-4 h-4 opacity-50" />
                    <input 
                      type="text" 
                      value={data.designerPhoto} 
                      onChange={(e) => updateField('designerPhoto', e.target.value)}
                      className="bg-transparent border-none text-xs w-full focus:outline-none"
                      placeholder="Photo URL or /about.png"
                    />
                  </div>
                  <button
                    onClick={enhanceImage}
                    disabled={isEnhancing}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white rounded-2xl text-xs font-medium transition-all"
                  >
                    {isEnhancing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Enhance Photo Quality (AI)
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>

            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className={cn("font-sans tracking-tight font-medium", `text-${data.style.h1Size}`)}>
                  <EditableText 
                    value={data.about.name} 
                    onChange={(v) => updateField('about.name', v)} 
                    isEditMode={isEditMode}
                  />
                </h2>
                <p className={cn("text-orange-500 font-mono tracking-[0.2em] uppercase", `text-${data.style.accentSize}`)}>
                  <EditableText 
                    value={data.about.role} 
                    onChange={(v) => updateField('about.role', v)} 
                    isEditMode={isEditMode}
                  />
                </p>
              </div>
              <div className="space-y-6">
                <blockquote className={cn("font-sans italic text-white/90 border-l-2 border-orange-500 pl-6 leading-snug font-medium", `text-${data.style.h2Size}`)}>
                  "<EditableText 
                    value={data.about.quote} 
                    onChange={(v) => updateField('about.quote', v)} 
                    isEditMode={isEditMode}
                  />"
                </blockquote>
                <p className={cn("font-light leading-relaxed opacity-60 max-w-xl", `text-${data.style.bodySize}`)}>
                  <EditableText 
                    value={data.about.description} 
                    onChange={(v) => updateField('about.description', v)} 
                    multiline
                    isEditMode={isEditMode}
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 04. Contact Section */}
      <section className="relative py-32 px-6 max-w-7xl mx-auto z-10">
        <div className="glass rounded-[40px] p-12 md:p-20 flex flex-col items-center text-center space-y-12 overflow-hidden relative">
          <div className="atmosphere absolute inset-0 opacity-20 scale-150" />
          
          <div className="relative z-10 space-y-4">
            <div className={cn("inline-block px-4 py-1 glass rounded-full tracking-widest uppercase opacity-60 mb-4 font-sans font-medium", `text-${data.style.accentSize}`)}>
              04. Contact
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
            <a href={`mailto:${data.contact.email}`} className="glass glass-hover p-8 rounded-3xl flex flex-col items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <Mail className="w-6 h-6" />
              </div>
              <span className={cn("font-light opacity-60", `text-${data.style.bodySize}`)}>
                <EditableText 
                  value={data.contact.email} 
                  onChange={(v) => updateField('contact.email', v)} 
                  isEditMode={isEditMode}
                />
              </span>
            </a>
            <a href={`https://instagram.com/${data.contact.instagram.replace('@', '')}`} target="_blank" className="glass glass-hover p-8 rounded-3xl flex flex-col items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <Instagram className="w-6 h-6" />
              </div>
              <span className={cn("font-light opacity-60", `text-${data.style.bodySize}`)}>
                <EditableText 
                  value={data.contact.instagram} 
                  onChange={(v) => updateField('contact.instagram', v)} 
                  isEditMode={isEditMode}
                />
              </span>
            </a>
            <a href={`tel:${data.contact.phone.replace(/\s/g, '')}`} className="glass glass-hover p-8 rounded-3xl flex flex-col items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <Phone className="w-6 h-6" />
              </div>
              <span className={cn("font-light opacity-60", `text-${data.style.bodySize}`)}>
                <EditableText 
                  value={data.contact.phone} 
                  onChange={(v) => updateField('contact.phone', v)} 
                  isEditMode={isEditMode}
                />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 text-center z-10 opacity-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center items-center gap-4 border-t border-white/10 pt-8">
          <p className={cn("tracking-widest uppercase", `text-${data.style.accentSize}`)}>
            © 2026 KJJ. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProjectId && selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedProjectId(null)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl max-h-[90vh] glass rounded-[40px] overflow-hidden shadow-2xl flex flex-col"
            >
              <button 
                onClick={() => setSelectedProjectId(null)}
                className="absolute top-6 right-6 z-20 p-3 glass rounded-full hover:bg-orange-500 transition-colors group"
              >
                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>

              <div className="overflow-y-auto p-8 md:p-16 space-y-12 custom-scrollbar">
                {/* Modal Header */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-orange-500 font-mono text-xs tracking-[0.3em] uppercase opacity-60">
                    <span>{selectedProject.year}</span>
                    <span className="w-1 h-1 rounded-full bg-orange-500/30" />
                    <span>{selectedProject.genre}</span>
                  </div>
                  <h2 className={cn("font-sans font-medium tracking-tight", `text-${data.style.h1Size}`)}>
                    <EditableText 
                      value={selectedProject.title} 
                      onChange={(v) => updateProject(selectedProject.id, 'title', v)} 
                      isEditMode={isEditMode}
                    />
                  </h2>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-y border-white/5 py-12">
                  <div className="space-y-3">
                    <h4 className="text-orange-500 font-mono text-[10px] tracking-widest uppercase opacity-40">Role</h4>
                    <p className={cn("font-light opacity-80", `text-${data.style.h2Size}`)}>
                      <EditableText 
                        value={selectedProject.role} 
                        onChange={(v) => updateProject(selectedProject.id, 'role', v)} 
                        isEditMode={isEditMode}
                      />
                    </p>
                  </div>
                  {selectedProject.venue && (
                    <div className="space-y-3">
                      <h4 className="text-orange-500 font-mono text-[10px] tracking-widest uppercase opacity-40">Venue</h4>
                      <p className={cn("font-light opacity-80 italic", `text-${data.style.h2Size}`)}>
                        <EditableText 
                          value={selectedProject.venue} 
                          onChange={(v) => updateProject(selectedProject.id, 'venue', v)} 
                          isEditMode={isEditMode}
                        />
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-6">
                  <h4 className="text-orange-500 font-mono text-xs tracking-widest uppercase opacity-60">Project Description</h4>
                  <div className={cn("font-light leading-relaxed opacity-70 whitespace-pre-wrap max-w-3xl", `text-${data.style.bodySize}`)}>
                    <EditableText 
                      value={selectedProject.description || ""} 
                      onChange={(v) => updateProject(selectedProject.id, 'description', v)} 
                      multiline
                      isEditMode={isEditMode}
                    />
                  </div>
                </div>

                {/* Images Grid */}
                <div className="space-y-8">
                  <h4 className="text-orange-500 font-mono text-xs tracking-widest uppercase opacity-60">Visuals</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {(selectedProject.images || []).map((img, idx) => (
                      <div key={idx} className="space-y-4 group/img">
                        <div className="aspect-video glass rounded-3xl overflow-hidden relative">
                          <img src={img} alt="" className="w-full h-full object-cover opacity-90 group-hover/img:opacity-100 transition-all duration-700 hover:scale-105" referrerPolicy="no-referrer" />
                        </div>
                        {isEditMode && (
                          <div className="flex gap-2 px-2">
                            <input 
                              type="text" 
                              value={img} 
                              onChange={(e) => {
                                const newImages = [...(selectedProject.images || [])];
                                newImages[idx] = e.target.value;
                                updateProject(selectedProject.id, 'images', newImages);
                              }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-orange-500/50"
                              placeholder="Image URL"
                            />
                            <button 
                              onClick={() => {
                                const newImages = (selectedProject.images || []).filter((_, i) => i !== idx);
                                updateProject(selectedProject.id, 'images', newImages);
                              }}
                              className="p-2 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {isEditMode && (
                      <button 
                        onClick={() => {
                          const newImages = [...(selectedProject.images || []), "https://picsum.photos/seed/new/1200/800"];
                          updateProject(selectedProject.id, 'images', newImages);
                        }}
                        className="aspect-video glass rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-white/5 border border-dashed border-white/10 group"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                          <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-mono tracking-widest uppercase opacity-40">Add Image</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Mode Helper Toast */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] glass px-6 py-3 rounded-full flex items-center gap-3 text-sm font-medium border-orange-500/50 shadow-2xl shadow-orange-500/20"
          >
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Edit Mode Active: Click on any text or image URL to modify.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
