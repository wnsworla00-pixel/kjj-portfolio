export interface Project {
  id: string;
  title: string;
  genre: string;
  role: string;
  venue?: string;
  year: string;
  description?: string;
  images?: string[];
}

export interface PortfolioData {
  name: string;
  studioName: string;
  studioNameHanja: string;
  designerPhoto: string;
  logoUrl: string;
  fonts: {
    sans: string;
    serif: string;
  };
  style: {
    h1Size: string;
    h2Size: string;
    bodySize: string;
    accentSize: string;
    hanjaSize: string;
  };
  intro: {
    quote: string;
    description: string;
  };
  projects: Project[];
  about: {
    name: string;
    role: string;
    quote: string;
    description: string;
  };
  contact: {
    email: string;
    instagram: string;
    phone: string;
  };
}
