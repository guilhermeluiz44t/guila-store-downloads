import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const {APP_ID:app,APP_VERSION:version,SOURCE_SHA:sha,TARGET_PLATFORM:platform,TARGET_ARCH:arch}=process.env;
if(!['aimforge','arquivista'].includes(app)||!/^\d+\.\d+\.\d+$/.test(version)||!/^[a-f0-9]{40}$/.test(sha))throw Error('Invalid build request');
const run=(command,args,cwd='source')=>{const result=spawnSync(command,args,{cwd,stdio:'inherit',shell:false});if(result.status!==0)throw Error(`${command} failed`);};
const actual=spawnSync('git',['rev-parse','HEAD'],{cwd:'source',encoding:'utf8'}).stdout.trim();if(actual!==sha)throw Error('Source commit mismatch');
await fs.mkdir('artifacts',{recursive:true});
const filename=`${app==='aimforge'?'AimForge':'Arquivista'}-${version}-${platform}-${arch}.zip`,target=path.resolve('artifacts',filename);
if(app==='aimforge'){
 const pkg=JSON.parse(await fs.readFile('source/package.json','utf8'));pkg.version=version;await fs.writeFile('source/package.json',JSON.stringify(pkg,null,2));
 // Engine tests and updater trust-boundary tests run before packaging.
 const tests=(await fs.readdir('source/tests')).filter(f=>f.endsWith('.test.js')).map(f=>'tests/'+f);run(process.execPath,['--test',...tests]);
 run(process.execPath,['node_modules/electron/install.js']);
 run(process.execPath,['node_modules/electron-builder/out/cli/cli.js',platform==='windows'?'--win':'--mac','zip',platform==='windows'?'--x64':'--arm64','--publish','never']);
 const outputs=(await fs.readdir('source/releases')).filter(f=>f.endsWith('.zip'));if(outputs.length!==1)throw Error('Expected one installer');await fs.copyFile('source/releases/'+outputs[0],target);
 // Launch the real packaged runtime, then exit after the renderer loads.
 const marker=path.resolve('smoke-ok.txt');let executable;
 if(platform==='windows')executable=path.resolve('source/releases/win-unpacked/AimForge.exe');
 else executable=path.resolve('source/releases/mac-arm64/AimForge.app/Contents/MacOS/AimForge');
 const smoke=spawnSync(executable,['--smoke-test','--disable-gpu'],{timeout:60000,env:{...process.env,GUILA_SMOKE_MARKER:marker},stdio:'inherit'});
 if(smoke.status!==0||(await fs.readFile(marker,'utf8'))!=='AIMFORGE_SMOKE_OK')throw Error('Packaged app smoke test failed');
}else{
 let init=await fs.readFile('source/arquivista/__init__.py','utf8');init=init.replace(/__version__\s*=\s*"[^"]+"/,`__version__ = "${version}"`);await fs.writeFile('source/arquivista/__init__.py',init);
 run('python',['-m','unittest','tests.test_updates']);run('python',['-c',"from arquivista.updates import get_update; result=get_update(); assert result.get('supported') and 'error' not in result; print('Live update endpoint verified by the real Python client')"]);run(process.execPath,['--check','web/app.js']);run(process.execPath,['tests/test_interface.cjs']);
 run('python',[path.resolve('.github/scripts/package-arquivista.py'),target]);
}
const file=await fs.readFile(target),sha256=createHash('sha256').update(file).digest('hex');
await fs.writeFile(`artifacts/${app}-${platform}.json`,JSON.stringify({app,version,sourceCommit:sha,filename,platform,arch,bytes:file.length,sha256},null,2));
console.log(`${app} ${version}: ${platform} package ready and checked`);
