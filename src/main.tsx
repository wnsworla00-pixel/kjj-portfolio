import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
async function start(){
  if(import.meta.env.DEV){
    if(new URLSearchParams(location.search).has('editor')){
      await import('./index.css');
      const {default:App}=await import('./App.tsx');
      createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
      return;
    }
  }
  const {default:PortfolioApp}=await import('./PortfolioApp.tsx');
  createRoot(document.getElementById('root')!).render(<StrictMode><PortfolioApp/></StrictMode>);
}
start();
