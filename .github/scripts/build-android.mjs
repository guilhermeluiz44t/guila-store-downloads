import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const {APP_VERSION:version,ANDROID_KEYSTORE_BASE64:key,ANDROID_KEY_PASSWORD:password}=process.env;
if(!key||!password)throw Error('Private Android signing configuration missing');
const keystore=path.resolve(process.env.RUNNER_TEMP,'mnemoria-signing.p12');
await fs.writeFile(keystore,Buffer.from(key,'base64'),{mode:0o600});
const env={...process.env,ANDROID_KEYSTORE:keystore,APP_VERSION_CODE:String(1000+Number(process.env.GITHUB_RUN_NUMBER))};
function run(command,args,cwd='source/mobile'){const r=spawnSync(command,args,{cwd,env,stdio:'inherit'});if(r.status!==0)throw Error('Android build or verification failed');}
try{
 run('pnpm',['install','--frozen-lockfile']);run(process.execPath,['prepare.mjs']);run('pnpm',['exec','cap','sync','android']);
 run('chmod',['+x','gradlew'],'source/mobile/android');
 run('./gradlew',['--no-daemon','assembleRelease','assembleDebug','assembleDebugAndroidTest'],'source/mobile/android');
 const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;
 const versions=(await fs.readdir(path.join(sdk,'build-tools'))).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}));
 run(path.join(sdk,'build-tools',versions[0],'apksigner'),['verify','--verbose','--print-certs',path.resolve('source/mobile/android/app/build/outputs/apk/release/app-release.apk')],process.cwd());
 await fs.copyFile('source/mobile/android/app/build/outputs/apk/release/app-release.apk',`artifacts/Mnemoria-${version}-Android.apk`);
}finally{await fs.rm(keystore,{force:true});}
