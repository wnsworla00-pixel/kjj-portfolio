import { PortfolioData } from './types';

export const INITIAL_DATA: PortfolioData = {
  name: "김재준 (Jae-Jun Kim)",
  studioName: "불한당",
  studioNameHanja: "不汗黨",
  designerPhoto: "/03.png",
  logoUrl: "/Logo.png",
  fonts: {
    sans: "'Inter', sans-serif",
    serif: "'Cormorant Garamond', serif"
  },
  style: {
    h1Size: "7xl", // md:text-9xl
    h2Size: "3xl", // md:text-4xl (Reduced from 4xl)
    bodySize: "lg", // md:text-xl
    accentSize: "xs", // tracking-widest labels
    hanjaSize: "2xl" // Hanja text next to title
  },
  intro: {
    quote: "무대 위에서 '불(빛)을 하는' 자, 불한당(不汗黨).",
    description: "조명 디자인 스튜디오 [불한당]은 무대 위에서 '불(빛)'을 다루는(do light) 곳입니다. 현실의 경계를 넘어 무대라는 공간 위에서 수많은 이야기가 자유롭게 펼쳐지는 역동적인 과정은, 마치 어떤 틀에도 얽매이지 않는 '불한당'의 기개와 닮아 있습니다. 그 거침없는 자유로움을 빛으로 그려내고자 '불을 한다(do light)'는 의지를 담았습니다. 우리는 빛을 통해 무대의 공기를 바꾸고, 그 안에서 피어나는 모든 찰나에 생명력을 불어넣습니다."
  },
  projects: [
    {
      id: 'p1',
      title: "[Performance Title A]",
      genre: "Dance",
      role: "Lighting Designer",
      venue: "National Theater of Korea",
      year: "2025",
      description: "공연의 디자인적인 내용을 여기에 담아보세요. 빛의 각도와 색감, 무대 연출 의도 등을 상세히 기록할 수 있습니다.",
      images: ["https://picsum.photos/seed/stage1/1200/800", "https://picsum.photos/seed/stage2/1200/800"]
    },
    {
      id: 'p2',
      title: "[Performance Title B]",
      genre: "Musical",
      role: "Assistant Lighting Designer / Programmer",
      year: "2024",
      description: "뮤지컬 작업의 화려한 큐 연출과 프로그래밍 과정을 설명해보세요.",
      images: ["https://picsum.photos/seed/stage3/1200/800"]
    },
    {
      id: 'p3',
      title: "[Performance Title C]",
      genre: "Theatre",
      role: "Lighting Designer",
      year: "2024",
      description: "연극 무대에서의 정교한 빛의 미학에 대해 설명해보세요.",
      images: ["https://picsum.photos/seed/stage4/1200/800"]
    },
    {
      id: 'p4',
      title: "[Performance Title D]",
      genre: "Concert",
      role: "Lighting Designer",
      year: "2024",
      description: "콘서트 무대의 역동적인 조명 연출에 대해 설명해보세요.",
      images: ["https://picsum.photos/seed/stage5/1200/800"]
    }
  ],
  about: {
    name: "김재준 (Jae-Jun Kim)",
    role: "Lighting Designer / Director of Bul-Han-Dang",
    quote: "무대 위에서 빛은 또 하나의 배우입니다.",
    description: "관객이 극의 흐름에 자연스럽게 젖어들 수 있도록, 보이지 않는 곳에서 가장 치열하게 '불을 하는(do light)' 디자이너 김재준입니다."
  },
  contact: {
    email: "wnsworla20@naver.com",
    instagram: "@bhd_light",
    phone: "010 3050 6111"
  }
};
