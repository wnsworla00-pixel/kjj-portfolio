import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {writeFile,rename} from 'node:fs/promises';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), {
      name:'local-portfolio-editor',apply:'serve',
      configureServer(server){
        server.middlewares.use('/__editor/save',async(req,res)=>{
          const host=req.headers.host||'';
          if(req.method!=='POST'||!/^127\.0\.0\.1:\d+$|^localhost:\d+$/.test(host)||req.headers.origin!=='http://'+host||req.headers['content-type']!=='application/json'){
            res.statusCode=403;res.end('Local editor only');return;
          }
          try{
            let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>5_000_000)throw new Error('Too large');}
            const data=JSON.parse(body);
            if(!Array.isArray(data.projects)||!data.about||!data.intro||!data.fonts)throw new Error('Invalid portfolio');
            const target=path.resolve(__dirname,'src/portfolio.json');
            await writeFile(target+'.tmp',JSON.stringify({...data,contentSource:'project'},null,2),'utf8');
            await rename(target+'.tmp',target);
            res.setHeader('Content-Type','application/json');res.end(' {"saved":true}');
          }catch{res.statusCode=400;res.end('Unable to save portfolio');}
        });
      }
    }],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
