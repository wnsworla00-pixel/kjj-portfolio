import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  Lightbulb,
  ArrowLeft,
  Image as ImageIcon,
  Type,
  Maximize,
  X,
  Sparkles,
  Loader2,
  Download,
  Upload,
  LogIn,
  LogOut,
  AlertCircle,
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from './lib/utils';
import { PortfolioData, Project } from './types';
import { INITIAL_DATA } from './constants';
import { db, auth } from './firebase';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  getDocFromServer,
  collection
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';

// Error Handling Spec for Firestore
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Error Boundary Component
class ErrorBoundary extends React.Component<any, any> {
  state: any;
  props: any;
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error) errorMessage = `Firebase Error: ${parsed.error} (${parsed.operationType} at ${parsed.path})`;
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0502] text-white p-6">
          <div className="glass p-8 rounded-[32px] max-w-md w-full text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-serif">Application Error</h2>
            <p className="opacity-70 text-sm leading-relaxed">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-orange-500 rounded-full font-medium hover:bg-orange-600 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  tag: Tag = 'span' as any,
  path,
  selectedPath,
  onSelect,
  style = {}
}: { 
  value: string; 
  onChange: (val: string) => void; 
  className?: string; 
  multiline?: boolean;
  isEditMode: boolean;
  tag?: any;
  path: string;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  style?: React.CSSProperties;
}) => {
  const isSelected = selectedPath === path;
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  if (!isEditMode) {
    return (
      <Tag 
        className={cn(className, "whitespace-pre-wrap")} 
        style={style}
      >
        {value}
      </Tag>
    );
  }

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <div 
      className={cn(
        "relative group/edit",
        isSelected && "ring-2 ring-orange-500 ring-offset-2 ring-offset-black rounded-sm"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(path);
      }}
    >
      {multiline ? (
        <textarea
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onBlur={handleBlur}
          className={cn(
            "w-full bg-white/10 border border-white/20 rounded p-2 focus:outline-none focus:border-orange-500 whitespace-pre-wrap resize-none overflow-hidden", 
            className
          )}
          style={{...style, minHeight: '100px'}}
          rows={1}
          ref={(el) => {
            if (el) {
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
            }
          }}
        />
      ) : (
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "bg-white/10 border border-white/20 rounded px-2 py-1 focus:outline-none focus:border-orange-500", 
            className
          )}
          style={style}
        />
      )}
      <div className="absolute -top-6 left-0 bg-orange-500 text-[8px] px-1 rounded opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none uppercase tracking-tighter">
        {path}
      </div>
    </div>
  );
};

const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

export default function App() {
  return (
    <ErrorBoundary>
      <PortfolioApp />
    </ErrorBoundary>
  );
}

const compressBase64Image = (base64: string, maxWidth = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64 || !base64.startsWith('data:image/')) {
      resolve(base64);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width *= maxWidth / height;
          height = maxWidth;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/webp', quality));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
};

function PortfolioApp() {
  const [data, setData] = useState<PortfolioData>(() => {
    try {
      const draft = localStorage.getItem('portfolio_draft');
      if (draft) return JSON.parse(draft);
    } catch (e) {
      console.error("Failed to load draft", e);
    }
    return INITIAL_DATA;
  });
  const [backupData, setBackupData] = useState<PortfolioData | null>(null);
  const [isEditMode, setIsEditMode] = useState(() => {
    return localStorage.getItem('portfolio_draft') !== null;
  });
  const isEditModeRef = useRef(isEditMode);

  useEffect(() => {
    isEditModeRef.current = isEditMode;
    if (isEditMode) {
      try {
        localStorage.setItem('portfolio_draft', JSON.stringify(data));
      } catch (e) {
        console.warn("Failed to save draft to localStorage (likely quota exceeded).", e);
        // Optionally, we could clear the draft if it's too big, but just catching the error prevents the crash.
      }
    } else {
      localStorage.removeItem('portfolio_draft');
    }
  }, [isEditMode, data]);
  const [expandedGenre, setExpandedGenre] = useState<string | null>(null);
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDesignerPhotoModal, setShowDesignerPhotoModal] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [displayProjects, setDisplayProjects] = useState<Project[]>(data.projects);

  useEffect(() => {
    if (!isEditMode) {
      setDisplayProjects(data.projects);
    }
  }, [isEditMode, data.projects]);

  const isAdmin = user?.email === "wnsworla00@gmail.com" && user?.emailVerified;

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = () => signOut(auth);

  const saveToFirebase = async (newData: PortfolioData): Promise<boolean> => {
    if (!isAdmin) {
      alert("Admin 권한이 없습니다.");
      return false;
    }

    // Update display projects on save
    setDisplayProjects(newData.projects);

    let dataToSave = { ...newData };
    let jsonString = JSON.stringify(dataToSave);
    let sizeInBytes = new Blob([jsonString]).size;

    if (sizeInBytes > 900000) { // ~900KB to be safe
      setIsLoading(true);
      try {
        if (dataToSave.logoUrl) dataToSave.logoUrl = await compressBase64Image(dataToSave.logoUrl, 600, 0.5);
        if (dataToSave.mainTitleImageUrl) dataToSave.mainTitleImageUrl = await compressBase64Image(dataToSave.mainTitleImageUrl, 800, 0.5);
        if (dataToSave.studioNameHanjaUrl) dataToSave.studioNameHanjaUrl = await compressBase64Image(dataToSave.studioNameHanjaUrl, 600, 0.5);
        if (dataToSave.designerPhoto) dataToSave.designerPhoto = await compressBase64Image(dataToSave.designerPhoto, 600, 0.5);
        
        dataToSave.projects = await Promise.all(dataToSave.projects.map(async (project) => {
          if (!project.images) return project;
          const compressedImages = await Promise.all(project.images.map(img => compressBase64Image(img, 600, 0.5)));
          return { ...project, images: compressedImages };
        }));

        jsonString = JSON.stringify(dataToSave);
        sizeInBytes = new Blob([jsonString]).size;
      } catch (e) {
        console.error("Compression failed", e);
      }
      setIsLoading(false);
    }

    if (sizeInBytes > 900000) {
      alert(`데이터 용량이 너무 큽니다! (현재: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB / 최대: 1MB)\n\nFirebase Firestore의 문서 용량 제한(1MB)을 초과했습니다. 이미지를 삭제하거나 외부 이미지 링크(URL)를 사용해주세요.`);
      return false;
    }

    const path = 'portfolios/main';
    try {
      await setDoc(doc(db, path), dataToSave);
      alert("성공적으로 저장되었습니다.");
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return false;
    }
  };

  const exportData = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulhandang_portfolio.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          try {
            const parsed = JSON.parse(re.target?.result as string);
            setData(parsed);
            alert('Data imported successfully!');
          } catch (err) {
            alert('Failed to parse JSON file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

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
  const groupedProjects = displayProjects.reduce((acc, project) => {
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

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore connection test
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Load data from Firestore
  useEffect(() => {
    if (!isAuthReady) return;

    const path = 'portfolios/main';
    const unsubscribe = onSnapshot(doc(db, path), (snapshot) => {
      if (snapshot.exists()) {
        const remoteData = snapshot.data() as PortfolioData;
        setData(prev => {
          // If we are in edit mode AND we have actual modified data (not just initial), keep it
          const isInitial = JSON.stringify(prev.projects) === JSON.stringify(INITIAL_DATA.projects);
          if (isEditModeRef.current && !isInitial) return prev;
          
          const merged = {
            ...INITIAL_DATA,
            ...remoteData,
            style: { ...INITIAL_DATA.style, ...(remoteData.style || {}) },
            fonts: { ...INITIAL_DATA.fonts, ...(remoteData.fonts || {}) },
            textStyles: { ...INITIAL_DATA.textStyles, ...(remoteData.textStyles || {}) }
          };
          
          // Sync display projects when loading from server
          setDisplayProjects(merged.projects);
          return merged;
        });
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  // Apply dynamic fonts
  useEffect(() => {
    document.documentElement.style.setProperty('--font-sans', data.fonts.sans);
    document.documentElement.style.setProperty('--font-serif', data.fonts.serif);
  }, [data.fonts]);

  // Migration for Google Drive links
  useEffect(() => {
    if (isLoading) return;
    
    let changed = false;
    const newData = JSON.parse(JSON.stringify(data));

    if (newData.designerPhoto && newData.designerPhoto.includes('drive.google.com') && !newData.designerPhoto.includes('uc?export=view')) {
      newData.designerPhoto = formatImageUrl(newData.designerPhoto);
      changed = true;
    }

    newData.projects = newData.projects.map((p: Project) => {
      const newImages = p.images?.map(img => {
        if (img && img.includes('drive.google.com') && !img.includes('uc?export=view')) {
          changed = true;
          return formatImageUrl(img);
        }
        return img;
      });
      return { ...p, images: newImages };
    });

    if (changed) {
      setData(newData);
      setDisplayProjects(newData.projects);
    }
  }, [isLoading]);

  const [currentSize, setCurrentSize] = useState(0);
  const [bulkUrls, setBulkUrls] = useState("");
  const [showBulkInput, setShowBulkInput] = useState(false);

  const fixAllDriveLinks = () => {
    let count = 0;
    const newData = JSON.parse(JSON.stringify(data));
    
    const fix = (url: string) => {
      if (url && url.includes('drive.google.com') && !url.includes('lh3.googleusercontent.com')) {
        const fixed = formatImageUrl(url);
        if (fixed !== url) {
          count++;
          return fixed;
        }
      }
      return url;
    };

    if (newData.designerPhoto) {
      const fixed = fix(newData.designerPhoto);
      if (fixed !== newData.designerPhoto) {
        newData.designerPhoto = fixed;
      }
    }
    
    newData.projects = newData.projects.map((p: Project) => ({
      ...p,
      images: p.images?.map(fix)
    }));

    if (count > 0) {
      setData(newData);
      setDisplayProjects(newData.projects);
      alert(`${count}개의 구글 드라이브 링크가 이미지 전용 주소로 복구되었습니다. [Save to Cloud]를 눌러 저장해 주세요.`);
    } else {
      alert("이미 모든 링크가 최적화되어 있거나 수정할 링크가 없습니다.");
    }
  };

  const formatImageUrl = (url: string) => {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('drive.google.com')) {
      const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        // Use lh3.googleusercontent.com/d/ID which is more reliable for embedding than uc?export=view
        return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
      }
    }
    return url;
  };

  useEffect(() => {
    const size = new Blob([JSON.stringify(data)]).size;
    setCurrentSize(size);
  }, [data]);

  const updateField = (path: string, value: any) => {
    setData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const getTextStyle = (path: string, type?: 'h1' | 'h2' | 'h3' | 'body' | 'accent') => {
    const custom = data.textStyles?.[path];
    let size = 12;
    let color = "#FFFFFF";
    let opacity = 1;

    if (custom) {
      size = custom.size;
      color = custom.color;
      opacity = custom.opacity;
    } else {
      const defaults: Record<string, any> = {
        h1: { size: 72, color: "#FFFFFF", opacity: 1 },
        h2: { size: 15, color: "#FFFFFF", opacity: 1 },
        h3: { size: 13, color: "#FFFFFF", opacity: 1 },
        body: { size: 13, color: "#FFFFFF", opacity: 1 },
        accent: { size: 12, color: "#f97316", opacity: 0.8 }
      };
      const s = type ? defaults[type] : defaults.body;
      size = s.size;
      color = s.color;
      opacity = s.opacity;
    }
    
    const isLabel = path.toLowerCase().includes('label');
    const fontSize = isLabel ? `calc(${size}pt * var(--label-scale, 1))` : `${size}pt`;
    return { fontSize, color, opacity };
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
    setDisplayProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleImageDrop = async (e: React.DragEvent, onImageProcessed: (base64: string) => void) => {
    if (!isEditMode) return;
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files) as File[];
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (!imageFile) return;

    try {
      const compressedBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Use webp to preserve transparency while compressing
            resolve(canvas.toDataURL('image/webp', 0.8));
          };
          img.onerror = reject;
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
      onImageProcessed(compressedBase64);
    } catch (err) {
      console.error("Failed to compress image", err);
    }
  };

  const addProject = (genre?: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: "New Project Title",
      genre: genre || "Genre",
      role: "Role",
      location: "Location",
      year: "2020",
      images: []
    };
    setData(prev => ({ ...prev, projects: [newProject, ...prev.projects] }));
    // Also update display projects if adding
    setDisplayProjects(prev => [newProject, ...prev]);
  };

  const removeProject = (id: string) => {
    setData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
    setDisplayProjects(prev => prev.filter(p => p.id !== id));
  };

  const StyleSettings = () => {
    if (!selectedPath) {
      return (
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-mono opacity-40">
          <Sparkles className="w-3 h-3" />
          Select text to edit style
        </div>
      );
    }

    const currentStyle = data.textStyles?.[selectedPath] || { size: 18, color: "#FFFFFF", opacity: 1 };
    
    const updateStyle = (field: string, value: any) => {
      setData(prev => ({
        ...prev,
        textStyles: {
          ...prev.textStyles,
          [selectedPath]: {
            ...currentStyle,
            [field]: value
          }
        }
      }));
    };

    return (
      <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-mono">
        <div className="flex items-center gap-2 p-2 glass rounded-xl border border-white/10">
          <div className="text-orange-500 font-bold truncate max-w-[80px]">{selectedPath}</div>
          <div className="flex items-center gap-3 border-l border-white/10 pl-3">
            <div className="flex flex-col gap-1">
              <span className="opacity-40">Size (pt)</span>
              <input 
                type="number"
                value={currentStyle.size} 
                onChange={(e) => updateStyle('size', parseInt(e.target.value) || 0)}
                className="bg-white/5 border border-white/10 rounded px-1 w-10 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="opacity-40">Color</span>
              <input 
                type="color"
                value={currentStyle.color} 
                onChange={(e) => updateStyle('color', e.target.value)}
                className="bg-transparent border-none w-5 h-5 cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="opacity-40">Opacity</span>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={currentStyle.opacity} 
                onChange={(e) => updateStyle('opacity', parseFloat(e.target.value))}
                className="w-12 accent-orange-500"
              />
            </div>
            <button 
              onClick={() => {
                setData(prev => {
                  const newStyles = { ...prev.textStyles };
                  delete newStyles[selectedPath];
                  return { ...prev, textStyles: newStyles };
                });
              }}
              className="p-1 hover:text-red-500 transition-colors"
              title="Reset to default"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0502] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden selection:bg-orange-500/30" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Atmospheric Background */}
      <div className="fixed inset-0 z-0">
        <div className="atmosphere absolute inset-0" />
      </div>

      {/* Navbar & Admin Panel */}
      <div className="fixed top-0 left-0 right-0 z-[110] flex flex-col">
        <nav className="glass border-b-0 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {!isVercel && (
              <>
                <Lightbulb className="w-6 h-6 text-orange-500" />
                <span className="font-serif text-xl tracking-widest uppercase" style={{ fontFamily: 'var(--font-serif)' }}>{data.studioName}</span>
              </>
            )}
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
                <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                  <button 
                    onClick={async () => {
                      if (confirm("서버의 데이터로 복구하시겠습니까? 현재 수정 중인 내용은 사라집니다.")) {
                        setIsLoading(true);
                        const path = 'portfolios/main';
                        try {
                          const snap = await getDocFromServer(doc(db, path));
                          if (snap.exists()) {
                            const remoteData = snap.data() as PortfolioData;
                            const merged = {
                              ...INITIAL_DATA,
                              ...remoteData,
                              style: { ...INITIAL_DATA.style, ...(remoteData.style || {}) },
                              fonts: { ...INITIAL_DATA.fonts, ...(remoteData.fonts || {}) },
                              textStyles: { ...INITIAL_DATA.textStyles, ...(remoteData.textStyles || {}) }
                            };
                            setData(merged);
                            setDisplayProjects(merged.projects);
                            alert("서버 데이터가 복구되었습니다.");
                          } else {
                            alert("서버에 저장된 데이터가 없습니다.");
                          }
                        } catch (e) {
                          console.error(e);
                          alert("데이터 복구 중 오류가 발생했습니다.");
                        }
                        setIsLoading(false);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 glass rounded-full text-[10px] uppercase tracking-widest font-mono text-white/60 hover:text-orange-500 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Restore from Server
                  </button>

                  <div className="flex flex-col items-end gap-1 px-4 border-l border-white/10">
                    <div className="text-[9px] uppercase tracking-tighter text-white/40 font-mono">Storage Status</div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            (currentSize / 1048576) > 0.9 ? "bg-red-500" : (currentSize / 1048576) > 0.7 ? "bg-orange-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${Math.min(100, (currentSize / 1048576) * 100)}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono",
                        (currentSize / 1048576) > 0.9 ? "text-red-500" : "text-white/60"
                      )}>
                        {(currentSize / 1024).toFixed(1)}KB / 1024KB
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={fixAllDriveLinks}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-500 border border-orange-500/30 rounded-full text-[10px] uppercase tracking-widest font-mono hover:bg-orange-500 hover:text-white transition-all"
                  >
                    <LinkIcon className="w-3 h-3" />
                    Force Fix All Google Drive Links
                  </button>

                  <button 
                    onClick={exportData}
                    className="p-1.5 glass rounded-lg hover:bg-white/10 transition-all"
                    title="Export Data (JSON)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={importData}
                    className="p-1.5 glass rounded-lg hover:bg-white/10 transition-all"
                    title="Import Data (JSON)"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              {!isVercel && (
                <>
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
                        onClick={async () => {
                          const success = await saveToFirebase(data);
                          if (success) {
                            setIsEditMode(false);
                            setBackupData(null);
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white transition-all text-sm font-medium"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      {isAdmin && (
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
                      {user ? (
                        <button 
                          onClick={logout}
                          className="flex items-center gap-2 px-4 py-2 rounded-full glass hover:bg-white/10 transition-all text-sm font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      ) : (
                        <button 
                          onClick={login}
                          className="flex items-center gap-2 px-4 py-2 rounded-full glass hover:bg-white/10 transition-all text-sm font-medium"
                        >
                          <LogIn className="w-4 h-4" />
                          Login
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </nav>
        
        {/* Style Editor Panel */}
        <AnimatePresence>
          {isEditMode && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="glass border-b border-white/10 overflow-hidden"
            >
              <div className="p-4 max-w-7xl mx-auto overflow-x-auto">
                <StyleSettings />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hero Section */}
      <section className="relative pt-[180px] md:pt-[220px] lg:pt-[280px] pb-20 px-6 max-w-7xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center gap-8 md:gap-12"
        >
          {/* Main Hero Image Section */}
          <div 
            className={cn(
              "relative group/maintitle flex flex-col items-center w-full max-w-2xl",
              isEditMode && "p-4 border border-dashed border-white/10 rounded-3xl hover:border-orange-500/30 transition-colors"
            )}
            onDragOver={(e) => {
              if (isEditMode) e.preventDefault();
            }}
            onDrop={(e) => handleImageDrop(e, (base64) => updateField('mainTitleImageUrl', base64))}
          >
            <img 
              src={data.mainTitleImageUrl || undefined} 
              alt={data.studioName}
              className="w-full h-auto max-h-[320px] md:max-h-[480px] object-contain"
              referrerPolicy="no-referrer"
            />
            
            {isEditMode && (
              <div className="mt-4 w-72 glass px-4 py-2 rounded-full flex items-center gap-3" style={{ textShadow: 'none', letterSpacing: 'normal' }}>
                <ImageIcon className="w-4 h-4 opacity-50" />
                <input 
                  value={data.mainTitleImageUrl || ''} 
                  onChange={(e) => updateField('mainTitleImageUrl', e.target.value)}
                  className="bg-transparent border-none text-[11px] w-full focus:outline-none placeholder-white/50"
                  placeholder="통합 메인 이미지 URL"
                />
              </div>
            )}
          </div>
          <div className="font-light tracking-[0.15em] uppercase ml-[0.15em]" style={getTextStyle('heroSub', 'body')}>
            <EditableText 
              value={data.heroSub || "Lighting Design"} 
              onChange={(v) => updateField('heroSub', v)} 
              isEditMode={isEditMode}
              path="heroSub"
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
              style={getTextStyle('heroSub', 'body')}
            />
          </div>
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
          <div className="inline-block px-4 py-1 glass rounded-full tracking-widest uppercase font-sans font-medium" style={getTextStyle('introLabel', 'accent')}>
            01. Intro
          </div>
          <div className="font-sans italic leading-snug text-white/90 font-medium" style={getTextStyle('intro.quote', 'h2')}>
            "<EditableText 
              value={data.intro.quote} 
              onChange={(v) => updateField('intro.quote', v)} 
              isEditMode={isEditMode}
              path="intro.quote"
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
              style={getTextStyle('intro.quote', 'h2')}
            />"
          </div>
          <div className="font-light leading-[1.8] max-w-2xl mx-auto text-center opacity-80 tracking-tight" style={getTextStyle('intro.description', 'body')}>
            <EditableText 
              value={data.intro.description} 
              onChange={(v) => updateField('intro.description', v)} 
              multiline
              isEditMode={isEditMode}
              path="intro.description"
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
              style={getTextStyle('intro.description', 'body')}
            />
          </div>
        </motion.div>
      </section>

      {/* 02. Works Section (Swapped) */}
      <section className="relative py-16 px-6 max-w-7xl mx-auto z-10">
        <div className="flex flex-col items-center mb-12">
          <div className="inline-block px-4 py-1 glass rounded-full tracking-widest uppercase mb-6 font-sans font-medium" style={getTextStyle('worksLabel', 'accent')}>
            02. Works
          </div>
          {isEditMode && (
            <button 
              onClick={() => addProject()}
              className="p-2 glass rounded-full hover:bg-orange-500 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
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
                    "p-3 glass rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer text-center transition-all duration-500 glass-hover",
                    expandedGenre === genre && "ring-1 ring-orange-500/30 bg-white/5"
                  )}
                >
                  <h3 className="font-sans text-white/60 group-hover:text-orange-500 transition-colors uppercase tracking-tight font-medium" style={getTextStyle(`genre.${genre}`, 'h3')}>
                    <EditableText 
                      value={genre} 
                      onChange={(v) => {
                        setData(prev => ({
                          ...prev,
                          projects: prev.projects.map(p => p.genre === genre ? { ...p, genre: v } : p)
                        }));
                        setDisplayProjects(prev => prev.map(p => p.genre === genre ? { ...p, genre: v } : p));
                      }} 
                      isEditMode={isEditMode}
                      path={`genre.${genre}`}
                      selectedPath={selectedPath}
                      onSelect={setSelectedPath}
                      style={getTextStyle(`genre.${genre}`, 'h3')}
                    />
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
                      {(() => {
                        const projectsByYear = groupedProjects[genre].reduce((acc, project) => {
                          const year = project.year || "Unknown";
                          if (!acc[year]) acc[year] = [];
                          acc[year].push(project);
                          return acc;
                        }, {} as Record<string, Project[]>);
                        
                        const allYears = Array.from(new Set([...Object.keys(projectsByYear), "2026", "2025", "2024", "2023", "2022"])).sort((a, b) => b.localeCompare(a));

                        return allYears.map(year => {
                          const yearProjects = projectsByYear[year] || [];
                          if (!isEditMode && yearProjects.length === 0) return null;

                          const yearKey = `${genre}-${year}`;
                          const isYearExpanded = expandedYears[yearKey];

                          return (
                            <div key={year} className="space-y-3 mb-6">
                              <div 
                                onClick={() => setExpandedYears(prev => ({ ...prev, [yearKey]: !prev[yearKey] }))}
                                className="flex items-center justify-between py-2 px-4 glass rounded-xl cursor-pointer hover:bg-white/5 transition-colors border border-white/5"
                              >
                                <span className="text-orange-500 font-mono text-[11px] tracking-widest opacity-80">{year}</span>
                                <motion.div
                                  animate={{ rotate: isYearExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <ChevronDown className="w-4 h-4 text-orange-500/50" />
                                </motion.div>
                              </div>
                              
                              <AnimatePresence>
                                {isYearExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    {yearProjects.length === 0 ? (
                                      isEditMode && (
                                        <div className="text-white/20 text-[10px] italic pl-4 py-2">No projects in {year}</div>
                                      )
                                    ) : (
                                      <div className="space-y-3 pl-2 pt-2 pb-2">
                                        {yearProjects.map((project) => (
                                          <div key={project.id} className="space-y-3">
                                            <div 
                                              onClick={() => !isEditMode && setSelectedProjectId(project.id)}
                                              className={cn(
                                                "p-4 glass rounded-2xl flex items-center justify-center relative cursor-pointer glass-hover transition-all hover:bg-orange-500/10 border-transparent hover:border-orange-500/30",
                                                isEditMode && "cursor-default"
                                              )}
                                            >
                                              <div className="flex flex-col items-center text-center gap-1">
                                                <span className="text-orange-500 font-mono text-[10px] tracking-widest" style={getTextStyle(`projects.${project.id}.year`, 'accent')}>
                                                  <EditableText 
                                                    value={project.year} 
                                                    onChange={(v) => updateProject(project.id, 'year', v)} 
                                                    isEditMode={isEditMode}
                                                    path={`projects.${project.id}.year`}
                                                    selectedPath={selectedPath}
                                                    onSelect={setSelectedPath}
                                                    style={getTextStyle(`projects.${project.id}.year`, 'accent')}
                                                  />
                                                </span>
                                                <h4 className="font-sans font-medium" style={getTextStyle(`projects.${project.id}.title`, 'body')}>
                                                  <EditableText 
                                                    value={project.title} 
                                                    onChange={(v) => updateProject(project.id, 'title', v)} 
                                                    isEditMode={isEditMode}
                                                    path={`projects.${project.id}.title`}
                                                    selectedPath={selectedPath}
                                                    onSelect={setSelectedPath}
                                                    style={getTextStyle(`projects.${project.id}.title`, 'body')}
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
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        });
                      })()}
                      
                      {isEditMode && (
                        <div 
                          onClick={() => addProject(genre)}
                          className="p-4 glass rounded-2xl flex items-center justify-center cursor-pointer glass-hover transition-all hover:bg-orange-500/10 border border-dashed border-white/20 hover:border-orange-500/50 text-white/40 hover:text-orange-500"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Plus className="w-4 h-4" /> Add Item to {genre}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* 03. About Section (Swapped) */}
      <section className="relative py-16 px-6 max-w-7xl mx-auto z-10">
        <div className="space-y-12 flex flex-col items-center">
          <div className="inline-block px-4 py-1 glass rounded-full tracking-widest uppercase font-sans font-medium" style={getTextStyle('aboutLabel', 'accent')}>
            03. About Designer
          </div>
          
          <div className="grid grid-cols-[0.6fr_1.4fr] md:grid-cols-[0.4fr_1.6fr] gap-x-6 md:gap-x-20 gap-y-8 md:gap-y-4 items-start w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={cn(
                "relative group md:row-span-2",
                isEditMode && "p-4 border border-dashed border-white/10 rounded-[40px] hover:border-orange-500/30 transition-colors"
              )}
              onDragOver={(e) => {
                if (isEditMode) e.preventDefault();
              }}
              onDrop={(e) => handleImageDrop(e, (base64) => updateField('designerPhoto', base64))}
            >
              <div 
                onClick={() => !isEditMode && setShowDesignerPhotoModal(true)}
                className={cn(
                  "aspect-[3/4] glass rounded-[24px] md:rounded-[32px] overflow-hidden relative shadow-2xl",
                  !isEditMode && "cursor-pointer"
                )}
              >
                <img 
                  src={data.designerPhoto || undefined} 
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
                      onChange={(e) => updateField('designerPhoto', formatImageUrl(e.target.value))}
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

            <div className="space-y-4">
              <div className="text-orange-500 font-mono tracking-[0.2em] uppercase" style={getTextStyle('about.role', 'accent')}>
                <EditableText 
                  value={data.about.role} 
                  onChange={(v) => updateField('about.role', v)} 
                  isEditMode={isEditMode}
                  path="about.role"
                  selectedPath={selectedPath}
                  onSelect={setSelectedPath}
                  style={getTextStyle('about.role', 'accent')}
                />
              </div>
              <div className="flex items-baseline gap-1 flex-wrap">
                <h2 className="font-sans tracking-tight font-medium">
                  <EditableText 
                    value={data.about.name} 
                    onChange={(v) => updateField('about.name', v)} 
                    isEditMode={isEditMode}
                    path="about.name"
                    selectedPath={selectedPath}
                    onSelect={setSelectedPath}
                    style={getTextStyle('about.name', 'h1')}
                  />
                </h2>
                <div className="font-sans tracking-tight font-medium">
                  <EditableText 
                    value={data.about.englishName || ""} 
                    onChange={(v) => updateField('about.englishName', v)} 
                    isEditMode={isEditMode}
                    path="about.englishName"
                    selectedPath={selectedPath}
                    onSelect={setSelectedPath}
                    style={getTextStyle('about.englishName', 'h2')}
                  />
                </div>
              </div>
              {/* Education Items (Moved under role) */}
              <div className="font-light text-white/40 space-y-1 -mt-2" style={getTextStyle('about.education', 'accent')}>
                {(data.about.education || []).map((edu, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <EditableText 
                      value={edu} 
                      onChange={(v) => {
                        const newEdu = [...(data.about.education || [])];
                        newEdu[idx] = v;
                        setData(prev => ({
                          ...prev,
                          about: { ...prev.about, education: newEdu }
                        }));
                      }} 
                      isEditMode={isEditMode}
                      path={`about.education.${idx}`}
                      selectedPath={selectedPath}
                      onSelect={setSelectedPath}
                      style={getTextStyle(`about.education.${idx}`, 'accent')}
                    />
                    {isEditMode && (
                      <button 
                        onClick={() => {
                          const newEdu = (data.about.education || []).filter((_, i) => i !== idx);
                          setData(prev => ({
                            ...prev,
                            about: { ...prev.about, education: newEdu }
                          }));
                        }}
                        className="p-1 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {isEditMode && (
                  <button 
                    onClick={() => {
                      const newEdu = [...(data.about.education || []), "New Education Item"];
                      setData(prev => ({
                        ...prev,
                        about: { ...prev.about, education: newEdu }
                      }));
                    }}
                    className="flex items-center gap-2 text-[10px] text-white/30 hover:text-white/60 transition-colors mt-1"
                  >
                    <Plus className="w-2 h-2" /> Add Item
                  </button>
                )}
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 md:col-start-2 space-y-6 md:-mt-8">
              <div className="relative font-light leading-[1.8] opacity-70 max-w-xl pl-6 tracking-tight" style={getTextStyle('about.description', 'body')}>
                <div className="absolute left-0 top-0 w-[2px] h-[80%] bg-orange-500" />
                <EditableText 
                  value={data.about.description} 
                  onChange={(v) => updateField('about.description', v)} 
                  multiline
                  isEditMode={isEditMode}
                  path="about.description"
                  selectedPath={selectedPath}
                  onSelect={setSelectedPath}
                  style={getTextStyle('about.description', 'body')}
                />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 04. Contact Section */}
      <section className="relative py-12 md:py-32 px-6 max-w-7xl mx-auto z-10">
        <div className="glass rounded-[32px] md:rounded-[40px] p-6 md:p-20 flex flex-col items-center text-center space-y-6 md:space-y-12 overflow-hidden relative">
          <div className="atmosphere absolute inset-0 opacity-20 scale-150" />
          
          <div className="relative z-10 space-y-2 md:space-y-4">
            <div className="inline-block px-4 py-1 glass rounded-full tracking-widest uppercase mb-2 md:mb-4 font-sans font-medium" style={getTextStyle('contactLabel', 'accent')}>
              04. Contact
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 w-full max-w-4xl">
            <a href={`mailto:${data.contact.email}`} className="glass glass-hover p-4 md:p-8 rounded-2xl md:rounded-3xl flex flex-col items-center gap-2 md:gap-4 group">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <Mail className="w-4 h-4 md:w-6 md:h-6" />
              </div>
              <div className="font-light opacity-60 text-xs md:text-base" style={getTextStyle('contact.email', 'body')}>
                <EditableText 
                  value={data.contact.email} 
                  onChange={(v) => updateField('contact.email', v)} 
                  isEditMode={isEditMode}
                  path="contact.email"
                  selectedPath={selectedPath}
                  onSelect={setSelectedPath}
                  style={getTextStyle('contact.email', 'body')}
                />
              </div>
            </a>
            <a href={`https://instagram.com/${data.contact.instagram.replace('@', '')}`} target="_blank" className="glass glass-hover p-4 md:p-8 rounded-2xl md:rounded-3xl flex flex-col items-center gap-2 md:gap-4 group">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <Instagram className="w-4 h-4 md:w-6 md:h-6" />
              </div>
              <div className="font-light opacity-60 text-xs md:text-base" style={getTextStyle('contact.instagram', 'body')}>
                <EditableText 
                  value={data.contact.instagram} 
                  onChange={(v) => updateField('contact.instagram', v)} 
                  isEditMode={isEditMode}
                  path="contact.instagram"
                  selectedPath={selectedPath}
                  onSelect={setSelectedPath}
                  style={getTextStyle('contact.instagram', 'body')}
                />
              </div>
            </a>
            <a href={`tel:${data.contact.phone.replace(/\s/g, '')}`} className="glass glass-hover p-4 md:p-8 rounded-2xl md:rounded-3xl flex flex-col items-center gap-2 md:gap-4 group">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                <Phone className="w-4 h-4 md:w-6 md:h-6" />
              </div>
              <div className="font-light opacity-60 text-xs md:text-base" style={getTextStyle('contact.phone', 'body')}>
                <EditableText 
                  value={data.contact.phone} 
                  onChange={(v) => updateField('contact.phone', v)} 
                  isEditMode={isEditMode}
                  path="contact.phone"
                  selectedPath={selectedPath}
                  onSelect={setSelectedPath}
                  style={getTextStyle('contact.phone', 'body')}
                />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 text-center z-10 opacity-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center items-center gap-4 border-t border-white/10 pt-8">
          <div className="tracking-widest uppercase" style={getTextStyle('copyright', 'accent')}>
            <EditableText 
              value={data.copyright || "© 2026 KJJ. ALL RIGHTS RESERVED."} 
              onChange={(v) => updateField('copyright', v)} 
              isEditMode={isEditMode}
              path="copyright"
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
              style={getTextStyle('copyright', 'accent')}
            />
          </div>
        </div>
      </footer>

      {/* Designer Photo Modal */}
      <AnimatePresence>
        {showDesignerPhotoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDesignerPhotoModal(false)}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-sm max-h-full"
            >
              <img 
                src={data.designerPhoto || undefined} 
                alt="Designer Full"
                className="w-full h-full object-contain rounded-2xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setShowDesignerPhotoModal(false)}
                className="absolute top-4 right-4 p-3 glass rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProjectId && selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setSelectedProjectId(null)} />
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
                    <div>
                      <EditableText 
                        value={selectedProject.year} 
                        onChange={(v) => updateProject(selectedProject.id, 'year', v)} 
                        isEditMode={isEditMode}
                        path={`projects.${selectedProject.id}.year`}
                        selectedPath={selectedPath}
                        onSelect={setSelectedPath}
                        style={getTextStyle(`projects.${selectedProject.id}.year`, 'accent')}
                      />
                    </div>
                    <div className="w-1 h-1 rounded-full bg-orange-500/30" />
                    <div>
                      <EditableText 
                        value={selectedProject.genre} 
                        onChange={(v) => updateProject(selectedProject.id, 'genre', v)} 
                        isEditMode={isEditMode}
                        path={`projects.${selectedProject.id}.genre`}
                        selectedPath={selectedPath}
                        onSelect={setSelectedPath}
                        style={getTextStyle(`projects.${selectedProject.id}.genre`, 'accent')}
                      />
                    </div>
                  </div>
                  <h2 className="font-sans font-medium tracking-tight" style={getTextStyle(`projects.${selectedProject.id}.title`, 'h1')}>
                    <EditableText 
                      value={selectedProject.title} 
                      onChange={(v) => updateProject(selectedProject.id, 'title', v)} 
                      isEditMode={isEditMode}
                      path={`projects.${selectedProject.id}.title`}
                      selectedPath={selectedPath}
                      onSelect={setSelectedPath}
                      style={getTextStyle(`projects.${selectedProject.id}.title`, 'h1')}
                    />
                  </h2>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-y border-white/5 py-12">
                  <div className="space-y-3">
                    <h4 className="text-orange-500 font-mono text-[10px] tracking-widest uppercase opacity-40">Role</h4>
                    <div className="font-light opacity-80" style={getTextStyle(`projects.${selectedProject.id}.role`, 'h2')}>
                      <EditableText 
                        value={selectedProject.role} 
                        onChange={(v) => updateProject(selectedProject.id, 'role', v)} 
                        isEditMode={isEditMode}
                        path={`projects.${selectedProject.id}.role`}
                        selectedPath={selectedPath}
                        onSelect={setSelectedPath}
                        style={getTextStyle(`projects.${selectedProject.id}.role`, 'h2')}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-orange-500 font-mono text-[10px] tracking-widest uppercase opacity-40">Location</h4>
                    <div className="font-light opacity-80" style={getTextStyle(`projects.${selectedProject.id}.location`, 'h2')}>
                      <EditableText 
                        value={selectedProject.location || ""} 
                        onChange={(v) => updateProject(selectedProject.id, 'location', v)} 
                        isEditMode={isEditMode}
                        path={`projects.${selectedProject.id}.location`}
                        selectedPath={selectedPath}
                        onSelect={setSelectedPath}
                        style={getTextStyle(`projects.${selectedProject.id}.location`, 'h2')}
                      />
                    </div>
                  </div>
                </div>

                {/* Bulk URL Input (New) */}
                {isEditMode && (
                  <div className="p-8 glass rounded-[32px] border border-orange-500/20 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-orange-500 font-mono text-[11px] uppercase tracking-[0.2em]">
                        <LinkIcon className="w-4 h-4" />
                        Bulk Add Image URLs
                      </div>
                      <button 
                        onClick={() => setShowBulkInput(!showBulkInput)}
                        className="px-4 py-1.5 glass rounded-full text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all"
                      >
                        {showBulkInput ? "Close Input" : "Open Bulk Input"}
                      </button>
                    </div>
                    
                    {showBulkInput && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <p className="text-[10px] text-white/30 leading-relaxed">
                          여러 개의 이미지 주소를 한꺼번에 넣을 수 있습니다. <br/>
                          주소들을 **엔터(줄바꿈)**나 **쉼표(,)**로 구분해서 아래 칸에 붙여넣어 주세요.
                        </p>
                        <textarea 
                          value={bulkUrls}
                          onChange={(e) => setBulkUrls(e.target.value)}
                          placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.png&#10;..."
                          className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-5 text-xs font-mono focus:outline-none focus:border-orange-500/50 custom-scrollbar placeholder:opacity-20"
                        />
                        <button 
                          onClick={() => {
                            const urls = bulkUrls.split(/[\n,]+/).map(u => u.trim()).filter(u => u.length > 0).map(formatImageUrl);
                            if (urls.length > 0) {
                              const newImages = [...(selectedProject.images || []), ...urls];
                              updateProject(selectedProject.id, 'images', newImages);
                              setBulkUrls("");
                              setShowBulkInput(false);
                              alert(`${urls.length}개의 이미지가 추가되었습니다.`);
                            }
                          }}
                          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                        >
                          <Check className="w-4 h-4" />
                          Add {bulkUrls.split(/[\n,]+/).filter(u => u.trim().length > 0).length} Images Now
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Images Grid */}
                <div 
                  className={cn(
                    "space-y-8",
                    isEditMode && "p-4 border border-dashed border-white/10 rounded-3xl hover:border-orange-500/30 transition-colors"
                  )}
                  onDragOver={(e) => {
                    if (isEditMode) e.preventDefault();
                  }}
                  onDrop={async (e) => {
                    if (!isEditMode) return;
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files) as File[];
                    const imageFiles = files.filter(file => file.type.startsWith('image/'));
                    if (imageFiles.length === 0) return;

                    const newImages = [...(selectedProject.images || [])];

                    for (const file of imageFiles) {
                      try {
                        const compressedBase64 = await new Promise<string>((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              const MAX_WIDTH = 600;
                              const MAX_HEIGHT = 600;
                              let width = img.width;
                              let height = img.height;

                              if (width > height) {
                                if (width > MAX_WIDTH) {
                                  height *= MAX_WIDTH / width;
                                  width = MAX_WIDTH;
                                }
                              } else {
                                if (height > MAX_HEIGHT) {
                                  width *= MAX_HEIGHT / height;
                                  height = MAX_HEIGHT;
                                }
                              }

                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext('2d');
                              ctx?.drawImage(img, 0, 0, width, height);
                              
                              // Use webp to preserve transparency while compressing
                              resolve(canvas.toDataURL('image/webp', 0.6));
                            };
                            img.onerror = reject;
                            img.src = event.target?.result as string;
                          };
                          reader.onerror = reject;
                          reader.readAsDataURL(file);
                        });
                        newImages.push(compressedBase64);
                      } catch (err) {
                        console.error("Failed to compress image", err);
                      }
                    }
                    updateProject(selectedProject.id, 'images', newImages);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-orange-500 font-mono text-xs tracking-widest uppercase opacity-60">Visuals</h4>
                    {isEditMode && (
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">Drag & Drop Images Here</span>
                        <button 
                          onClick={() => {
                            const newImages = [...(selectedProject.images || []), ""];
                            updateProject(selectedProject.id, 'images', newImages);
                          }}
                          className="p-2 glass rounded-full hover:bg-orange-500 transition-colors text-white/60 hover:text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {(selectedProject.images || []).map((img, idx) => (
                      <div key={idx} className="space-y-4 group/img">
                        <div 
                          className={cn(
                            "aspect-video glass rounded-3xl overflow-hidden relative",
                            !isEditMode && img && "cursor-pointer"
                          )}
                          onClick={() => {
                            if (!isEditMode && img) setSelectedImage(img);
                          }}
                        >
                          {img ? (
                            <img src={img || undefined} alt="" className="w-full h-full object-cover opacity-90 group-hover/img:opacity-100 transition-all duration-700 hover:scale-105" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/20 text-xs font-mono">
                              No Image URL
                            </div>
                          )}
                        </div>
                        {isEditMode && (
                          <div className="flex gap-2 px-2">
                            <input 
                              type="text" 
                              value={img} 
                              onChange={(e) => {
                                const newImages = [...(selectedProject.images || [])];
                                newImages[idx] = formatImageUrl(e.target.value);
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
                          const newImages = [...(selectedProject.images || []), ""];
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

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
          >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setSelectedImage(null)} />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 z-20 p-3 glass rounded-full hover:bg-orange-500 transition-colors group"
            >
              <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            >
              <img 
                src={selectedImage} 
                alt="Enlarged view" 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl cursor-pointer"
                referrerPolicy="no-referrer"
                onClick={() => setSelectedImage(null)}
              />
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
