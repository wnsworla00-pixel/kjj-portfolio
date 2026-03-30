import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, Edit2, Save, X, Camera, Mail, Instagram, 
  ExternalLink, ChevronRight, Github, Send, MessageSquare,
  Sparkles, Zap, Palette, Layout, Smartphone, Globe
} from 'lucide-react';
import { intro, about, projects, contact } from './constants';

// 텍스트 편집을 위한 컴포넌트
const EditableText = ({ 
  value, 
  onSave, 
  isTextArea = false, 
  className = "",
  isEditMode = false
}) => {
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  if (!isEditMode) {
    return <span className={className}>{value}</span>;
  }

  return isTextArea ? (
    <textarea
      value={tempValue}
      onChange={(e) => {
        setTempValue(e.target.value);
        onSave(e.target.value);
      }}
      className={`w-full bg-white/10 border border-white/20 rounded p-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white ${className}`}
      rows={4}
    />
  ) : (
    <input
      type="text"
      value={tempValue}
      onChange={(e) => {
        setTempValue(e.target.value);
        onSave(e.target.value);
      }}
      className={`bg-white/10 border border-white/20 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white ${className}`}
    />
  );
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [data, setData] = useState({ intro, about, projects, contact });
  const [backupData, setBackupData] = useState(null);

  // 데이터 저장 함수
  const handleSave = (section, field, value, index = null) => {
    setData(prev => {
      const newData = { ...prev };
      if (index !== null) {
        const newProjects = [...newData.projects];
        newProjects[index] = { ...newProjects[index], [field]: value };
        newData.projects = newProjects;
      } else {
        newData[section] = { ...newData[section], [field]: value };
      }
      return newData;
    });
  };

  const startEditing = () => {
    setBackupData(JSON.parse(JSON.stringify(data)));
    setIsEditMode(true);
  };

  const cancelEditing = () => {
    setData(backupData);
    setIsEditMode(false);
  };

  const saveToLocal = () => {
    setIsEditMode(false);
    console.log("최종 저장 데이터:", data);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-black text-white' : 'bg-stone-50 text-stone-900'}`}>
      {/* 상단 네비게이션 바 */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center font-bold text-white">不</div>
          <span className="font-serif italic tracking-widest text-lg">BUL-HAN-DANG</span>
        </div>
        <div className="flex items-center gap-4">
          {isEditMode ? (
            <>
              <button 
                onClick={cancelEditing}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
              >
                <X size={16} /> 취소
              </button>
              <button 
                onClick={saveToLocal}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 transition-all text-sm font-medium"
              >
                <Save size={16} /> 변경사항 저장
              </button>
            </>
          ) : (
            <button 
              onClick={startEditing}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              title="편집 모드"
            >
              <Edit2 size={20} />
            </button>
          )}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      {/* 히어로 섹션 (인트로) */}
      <section className="h-screen flex flex-col justify-center items-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full animate-pulse delay-1000" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="z-10 text-center max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl font-serif italic mb-8 leading-tight">
            <EditableText 
              value={data.intro.quote} 
              onSave={(val) => handleSave('intro', 'quote', val)}
              isEditMode={isEditMode}
            />
          </h1>
          <p className="text-lg md:text-xl text-stone-400 font-light max-w-2xl mx-auto leading-relaxed">
            <EditableText 
              value={data.intro.description} 
              onSave={(val) => handleSave('intro', 'description', val)}
              isTextArea
              isEditMode={isEditMode}
            />
          </p>
        </motion.div>
      </section>

      {/* 자기소개 섹션 (사진 크기 조절 포함) */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-20 items-center">
          <div className="relative group">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img 
                src={data.about.image} 
                alt="Designer" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                referrerPolicy="no-referrer"
              />
            </div>
            {isEditMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <button className="p-4 bg-white/20 rounded-full backdrop-blur-md text-white">
                  <Camera size={24} />
                </button>
              </div>
            )}
          </div>
          
          <div>
            <span className="text-orange-600 font-mono tracking-widest text-sm uppercase mb-4 block">About Designer</span>
            <h2 className="text-4xl md:text-6xl font-serif italic mb-8">
              <EditableText 
                value={data.about.name} 
                onSave={(val) => handleSave('about', 'name', val)}
                isEditMode={isEditMode}
              />
            </h2>
            <p className="text-xl text-stone-400 font-light leading-relaxed mb-12">
              <EditableText 
                value={data.about.description} 
                onSave={(val) => handleSave('about', 'description', val)}
                isTextArea
                isEditMode={isEditMode}
              />
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="text-xs text-stone-500 uppercase tracking-widest block mb-2">Role</span>
                <p className="font-medium">
                  <EditableText 
                    value={data.about.title} 
                    onSave={(val) => handleSave('about', 'title', val)}
                    isEditMode={isEditMode}
                  />
                </p>
              </div>
              <div>
                <span className="text-xs text-stone-500 uppercase tracking-widest block mb-2">Location</span>
                <p className="font-medium">
                  <EditableText 
                    value={data.contact.address} 
                    onSave={(val) => handleSave('contact', 'address', val)}
                    isEditMode={isEditMode}
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 프로젝트 섹션 */}
      <section className="py-32 px-6 bg-stone-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-20">
            <div>
              <span className="text-orange-600 font-mono tracking-widest text-sm uppercase mb-4 block">Selected Works</span>
              <h2 className="text-4xl md:text-6xl font-serif italic">Lighting Projects</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {data.projects.map((project, index) => (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="group cursor-pointer"
              >
                <div className="aspect-[16/10] rounded-2xl overflow-hidden mb-6 border border-white/10 relative">
                  <img 
                    src={project.image} 
                    alt={project.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <ExternalLink className="text-white" />
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-orange-600 font-mono uppercase tracking-widest mb-2 block">
                    <EditableText 
                      value={project.category} 
                      onSave={(val) => handleSave('projects', 'category', val, index)}
                      isEditMode={isEditMode}
                    />
                  </span>
                  <h3 className="text-2xl font-serif italic">
                    <EditableText 
                      value={project.title} 
                      onSave={(val) => handleSave('projects', 'title', val, index)}
                      isEditMode={isEditMode}
                    />
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 하단 연락처 섹션 */}
      <footer className="py-32 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl md:text-8xl font-serif italic mb-12 tracking-tighter">Let's do light.</h2>
          <div className="flex flex-wrap justify-center gap-12 text-lg font-light text-stone-400">
            <a href={`mailto:${data.contact.email}`} className="hover:text-orange-600 transition-colors flex items-center gap-2">
              <Mail size={20} /> 
              <EditableText 
                value={data.contact.email} 
                onSave={(val) => handleSave('contact', 'email', val)}
                isEditMode={isEditMode}
              />
            </a>
            <a href="#" className="hover:text-orange-600 transition-colors flex items-center gap-2">
              <Instagram size={20} /> 
              <EditableText 
                value={data.contact.instagram} 
                onSave={(val) => handleSave('contact', 'instagram', val)}
                isEditMode={isEditMode}
              />
            </a>
          </div>
          <div className="mt-32 pt-8 border-t border-white/5 flex justify-between items-center text-xs text-stone-600 uppercase tracking-widest">
            <p>© 2024 BUL-HAN-DANG. All rights reserved.</p>
            <p>Designed with passion</p>
          </div>
        </div>
      </footer>
    </div>
  );
}