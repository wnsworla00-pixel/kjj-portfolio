import {execFile} from 'node:child_process';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';

const execute=promisify(execFile);
const repository='https://github.com/wnsworla00-pixel/kjj-portfolio.git';

// Publish only the saved content from a fresh main checkout. Local code edits
// and the editor's divergent development history must never be pushed here.
export async function publishPortfolio(content:string){
  const directory=await mkdtemp(path.join(tmpdir(),'bulhandang-publish-'));
  const git=(args:string[])=>execute('git',args,{cwd:directory,timeout:90_000,maxBuffer:1024*1024,windowsHide:true,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}});
  try{
    await git(['clone','--depth','1','--single-branch','--branch','main',repository,'.']);
    await writeFile(path.join(directory,'src/portfolio.json'),content,'utf8');
    await git(['add','--','src/portfolio.json']);
    const {stdout}=await git(['diff','--cached','--name-only']);
    if(!stdout.trim())return {published:true,unchanged:true};
    await git(['-c','user.name=Bulhandang Studio','-c','user.email=wnsworla00-pixel@users.noreply.github.com','commit','-m','Update portfolio from local editor']);
    await git(['push','origin','HEAD:main']);
    return {published:true,unchanged:false};
  }finally{await rm(directory,{recursive:true,force:true});}
}
