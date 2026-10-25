import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const apps={aimforge:{repository:'guilhermeluiz44t/aimforge',base:'0.4.2'},arquivista:{repository:'guilhermeluiz44t/arquivista',base:'1.0.0'}};
const stable=v=>/^\d+\.\d+\.\d+$/.test(v??'');
const compare=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]-y[i];return 0;};
let selected;
if(process.env.INPUT_APP)selected=process.env.INPUT_APP==='all'?Object.keys(apps):[process.env.INPUT_APP];
else{try{selected=execFileSync('git',['diff','--name-only',process.env.BEFORE,'HEAD','--','requests'],{encoding:'utf8'}).split('\n').map(p=>/^requests\/([a-z-]+)\.json$/.exec(p)?.[1]).filter(Boolean);}catch{selected=Object.keys(apps);}}
const response=await fetch('https://guila-apps.pages.dev/api/catalog');if(!response.ok)throw Error('Store unavailable');const catalog=await response.json();
const releases=[],builds=[];
for(const app of [...new Set(selected)]){
 const config=apps[app];if(!config)throw Error('Unknown app');let request;try{request=JSON.parse(await fs.readFile(`requests/${app}.json`,'utf8'));}catch{continue;}
 if(request.app!==app||!/^[a-f0-9]{40}$/.test(request.sha)||!stable(request.baseVersion))throw Error('Invalid release request');
 const previous=catalog.apps.find(a=>a.id===app);if(previous?.sourceCommit===request.sha){console.log(`${app}: already published`);continue;}
 const base=previous?.version&&stable(previous.version)?previous.version:'0.0.0';
 let version=request.baseVersion;if(compare(version,base)<=0){const parts=base.split('.').map(Number);parts[2]++;version=parts.join('.');}
 const release={app,version,sha:request.sha,repository:config.repository};releases.push(release);
 builds.push({...release,platform:'windows',arch:app==='aimforge'?'x64':'any',runner:'windows-latest'}, {...release,platform:'mac',arch:app==='aimforge'?'arm64':'any',runner:'macos-15'});
}
await fs.appendFile(process.env.GITHUB_OUTPUT,`releases=${JSON.stringify(releases)}\nbuilds=${JSON.stringify(builds)}\nhas_apps=${releases.length>0}\n`);
