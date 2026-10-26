import fs from 'node:fs/promises';
import {apps} from './apps.mjs';
import {createHash} from 'node:crypto';
const {APP_ID:app,APP_VERSION:version,SOURCE_SHA:sha,GITHUB_TOKEN:token,STORE_PUBLISH_TOKEN:publisher}=process.env;
const repo='guilhermeluiz44t/guila-store-downloads',tag=`${app}-v${version}`;
if(!apps[app]||!/^\d+\.\d+\.\d+$/.test(version)||!/^[a-f0-9]{40}$/.test(sha)||!token||!publisher)throw Error('Invalid publisher configuration');
async function api(path,options={}){const url=new URL(path,'https://api.github.com');if(!['api.github.com','uploads.github.com'].includes(url.hostname))throw Error('Unexpected API host');const r=await fetch(url,{...options,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28',...options.headers}});if(!r.ok)throw Error(`Release API HTTP ${r.status}`);return r.status===204?null:r.json();}
const releases=await api(`/repos/${repo}/releases?per_page=100`);let release=releases.find(r=>r.tag_name===tag),manifest;
if(release&&!release.draft){
 const asset=release.assets.find(a=>a.name===`${app}-${version}-release.json`);if(!asset)throw Error('Published release has no manifest');const r=await fetch(asset.browser_download_url);if(!r.ok)throw Error('Manifest unavailable');manifest=await r.json();if(manifest.sourceCommit!==sha)throw Error('Version already belongs to another source commit');
}else{
 const downloads=[];for(const [platform,arch] of apps[app].targets){
  const meta=JSON.parse(await fs.readFile(`artifacts/${app}-${platform}-${arch}.json`,'utf8'));if(meta.app!==app||meta.version!==version||meta.sourceCommit!==sha||meta.platform!==platform||meta.arch!==arch||!/^[A-Za-z0-9._-]+$/.test(meta.filename))throw Error('Artifact mismatch');
  const bytes=await fs.readFile('artifacts/'+meta.filename);if(createHash('sha256').update(bytes).digest('hex')!==meta.sha256||bytes.length!==meta.bytes)throw Error('Artifact checksum mismatch');
  downloads.push({platform:meta.platform,arch:meta.arch,bytes:meta.bytes,label:app==='arquivista'?(platform==='windows'?'Windows · Python':'macOS · Python'):(platform==='android'?'Android':platform==='windows'?'Windows · '+meta.arch:'macOS · '+(meta.arch==='arm64'?'Apple Silicon':'Intel')),size:(meta.bytes/1048576).toFixed(1)+' MB',sha256:meta.sha256,url:`https://github.com/${repo}/releases/download/${tag}/${meta.filename}`,access:'public',format:app==='arquivista'?'ZIP portátil · Python 3.9+':app==='aimforge'?'ZIP portátil':platform==='android'?'APK · Android 7 ou mais recente':platform==='windows'?'Instalador EXE':'Instalador DMG'});
 }
 manifest={version,sourceCommit:sha,releaseUrl:`https://github.com/${repo}/releases/tag/${tag}`,changes:`${apps[app].name} ${version}: pacote gerado e verificado automaticamente a partir das alterações enviadas pelo proprietário.`,downloads};
 if(!release)release=await api(`/repos/${repo}/releases`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tag_name:tag,target_commitish:process.env.GITHUB_SHA,name:`${apps[app].name} ${version}`,draft:true,body:manifest.changes+'\n\nA atualização é feita pelo download do pacote. Preserve seus dados locais antes de substituir a versão.'})});
 // Only unpublished drafts may be replaced after a failed upload. Published files are immutable.
 for(const asset of release.assets)await api(`/repos/${repo}/releases/assets/${asset.id}`,{method:'DELETE'});
 const upload=async(name,bytes,type)=>{const result=await api(release.upload_url.split('{')[0]+'?name='+encodeURIComponent(name),{method:'POST',headers:{'Content-Type':type,'Content-Length':String(bytes.length)},body:bytes});if(result.size!==bytes.length||(result.digest&&result.digest!=='sha256:'+createHash('sha256').update(bytes).digest('hex')))throw Error('Upload integrity check failed');};
 for(const download of downloads){const filename=new URL(download.url).pathname.split('/').at(-1);await upload(filename,await fs.readFile('artifacts/'+filename),'application/octet-stream');}
 await upload(`${app}-${version}-release.json`,Buffer.from(JSON.stringify(manifest,null,2)),'application/json');
 release=await api(`/repos/${repo}/releases/${release.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:false,make_latest:'false'})});
}
const response=await fetch(`https://guila-apps.pages.dev/api/releases/${app}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+publisher},body:JSON.stringify(manifest)});if(!response.ok)throw Error('Store publication failed: HTTP '+response.status);
console.log(`${app} ${version}: published to the Guila Store`);
