export interface Project {
  id: string;
  title: string;
  genre: string;
  role: string;
  year: string;
  description?: string;
  images?: string[];
  location?: string;
}

export interface PortfolioData {
  name: string;
  studioName: string;
  mainTitleImageUrl?: string;
  studioNameHanjaUrl: string;
  heroSub?: string;
  designerPhoto: string;
  logoUrl: string;
  copyright?: string;
  fonts: {
    sans: string;
    serif: string;
  };
  style?: {
    h1Size: number;
    h1Color: string;
    h1Opacity: number;
    h2Size: number;
    h2Color: string;
    h2Opacity: number;
    bodySize: number;
    bodyColor: string;
    bodyOpacity: number;
    accentSize: number;
    accentColor: string;
    accentOpacity: number;
  };
  textStyles: {
    [path: string]: {
      size: number;
      color: string;
      opacity: number;
    };
  };
  intro: {
    quote: string;
    description: string;
  };
  projects: Project[];
  about: {
    name: string;
    englishName?: string;
    role: string;
    quote: string;
    description: string;
    education?: string[];
  };
  contact: {
    email: string;
    instagram: string;
    phone: string;
  };
}
