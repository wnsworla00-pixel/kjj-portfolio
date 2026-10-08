import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
async function start(){
 if(location.pathname.replace(/\/$/,'')==='/editor'){
  await import('./index.css');
  const {default:EditorEntry}=await import('./EditorEntry');
  createRoot(document.getElementById('root')!).render(<StrictMode><EditorEntry/></StrictMode>);
  return;
 }
 const {default:PortfolioApp}=await import('./PortfolioApp');
 createRoot(document.getElementById('root')!).render(<StrictMode><PortfolioApp/></StrictMode>);
}
start();
