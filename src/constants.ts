import { PortfolioData } from './types';

export const INITIAL_DATA: PortfolioData = {
  name: "김재준 (Jae-Jun Kim)",
  studioName: "불한당",
  mainTitleImageUrl: "/title.png",
  studioNameHanjaUrl: "/bhd.png",
  designerPhoto: "/03.png",
  logoUrl: "https://drive.google.com/file/d/1ZyPDxFDvk3IyNv0T1nfv1gFpRQ9l6XyK/view?usp=sharing",
  fonts: {
    sans: "'Inter', sans-serif",
    serif: "'Cormorant Garamond', serif"
  },
  textStyles: {
    'copyright': { size: 8, color: '#f97316', opacity: 0.6 },
    'about.name': { size: 40, color: '#FFFFFF', opacity: 1 },
    'about.englishName': { size: 24, color: '#FFFFFF', opacity: 0.6 },
    'heroSub': { size: 13, color: '#FFFFFF', opacity: 1 }
  },
  intro: {
    quote: "무대 위에서 '불(빛)을 하는' 자, 불한당(不汗黨).",
    description: "조명 디자인 스튜디오 [불한당]은 무대 위에서 '불(빛)'을 다루는(do light) 곳입니다.\n\n현실의 경계를 넘어 무대라는 공간 위에서 수많은 이야기가 자유롭게 펼쳐지는 역동적인 과정은, 마치 어떤 틀에도 얽매이지 않는 '불한당'의 기개와 닮아 있습니다.\n\n그 거침없는 자유로움을 빛으로 그려내고자 '불을 한다(do light)'는 의지를 담았습니다. 우리는 빛을 통해 무대의 공기를 바꾸고, 그 안에서 피어나는 모든 찰나에 생명력을 불어넣습니다."
  },
  projects: [
    {
      id: 'p1',
      title: "[Performance Title A]",
      genre: "Dance",
      role: "Lighting Designer",
      location: "Seoul, Korea",
      year: "2025",
      images: []
    },
    {
      id: 'p2',
      title: "[Performance Title B]",
      genre: "Musical",
      role: "Assistant Lighting Designer / Programmer",
      location: "Seoul, Korea",
      year: "2024",
      images: []
    },
    {
      id: 'p3',
      title: "[Performance Title C]",
      genre: "Theatre",
      role: "Lighting Designer",
      location: "Seoul, Korea",
      year: "2024",
      images: []
    },
    {
      id: 'p4',
      title: "[Performance Title D]",
      genre: "Other",
      role: "Lighting Designer",
      location: "Seoul, Korea",
      year: "2024",
      images: []
    }
  ],
  about: {
    name: "김재준",
    englishName: "Jae-Jun Kim",
    role: "Lighting Designer",
    quote: "극의 공간안에 있는 것 처럼",
    description: "관객이 극의 흐름에 자연스럽게 젖어들 수 있도록, 보이지 않는 곳에서 조명을 비추는 디자이너 김재준입니다.",
    education: ["용인대학교 연극학과 학사"]
  },
  contact: {
    email: "wnsworla00@gmail.com",
    instagram: "@bhd_light",
    phone: "010 3050 6111"
  },
  copyright: "© 2026 KJJ. ALL RIGHTS RESERVED."
};
