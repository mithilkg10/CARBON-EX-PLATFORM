// Run after npm install and with jsdom available: node tests/mobile-navigation.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const {JSDOM} = require('jsdom');
const dom = new JSDOM('<html><body><div id="root"></div></body></html>', {url:'http://localhost',pretendToBeVisual:true});
for (const key of ['window','document','navigator','HTMLElement','HTMLInputElement','Element','Node','NodeFilter','CustomEvent','MutationObserver','Event','KeyboardEvent','MouseEvent','DocumentFragment']) Object.defineProperty(global,key,{value:dom.window[key],configurable:true});
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
global.IS_REACT_ACT_ENVIRONMENT = true;
let breakpoint;
window.matchMedia=()=>({matches:false,addEventListener:(_,fn)=>{breakpoint=fn},removeEventListener:()=>{}});
const rootDir=path.resolve(__dirname,'..');
const originalResolve=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...args){if(request.startsWith('@/'))request=path.join(rootDir,request.slice(2));return originalResolve.call(this,request,parent,...args)};
for(const ext of ['.tsx','.ts'])require.extensions[ext]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const React=require('react'),{act}=React;
const load=Module._load;
Module._load=function(request,...args){if(request==='next/navigation')return {usePathname:()=>'/dashboard',useRouter:()=>({push:()=>{}})};if(request==='next/link')return {__esModule:true,default:({children,onClick,...props})=>React.createElement('a',{...props,onClick:(event)=>{event.preventDefault();onClick?.(event)}},children)};return load.call(this,request,...args)};
const {createRoot}=require('react-dom/client');const {Sidebar}=require('../components/dashboard/sidebar.tsx');const root=createRoot(document.getElementById('root'));
async function click(el){assert.ok(el);await act(async()=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));}
(async()=>{
await act(async()=>root.render(React.createElement(Sidebar,{userRole:'company',userName:'Mobile reviewer'})));
await click(document.querySelector('button[aria-label="Open navigation"]'));
assert.ok(document.querySelector('[role="dialog"]'));assert.equal(document.querySelectorAll('nav[aria-label="Mobile navigation"] a').length,4);
assert.equal(document.querySelector('nav[aria-label="Mobile navigation"] a[aria-current="page"]').getAttribute('href'),'/dashboard');
await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
assert.equal(document.querySelector('[role="dialog"]'),null);
await click(document.querySelector('button[aria-label="Open navigation"]'));
const link=document.querySelector('nav[aria-label="Mobile navigation"] a');link.addEventListener('click',e=>e.preventDefault());await click(link);assert.equal(document.querySelector('[role="dialog"]'),null);
await act(async()=>root.render(React.createElement(Sidebar,{userRole:'regulator',userName:'Regulator reviewer'})));
await click(document.querySelector('button[aria-label="Open navigation"]'));assert.equal(document.querySelectorAll('nav[aria-label="Mobile navigation"] a').length,3);
await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
await click(document.querySelector('button[aria-label="Collapse sidebar"]'));assert.ok(document.querySelector('button[aria-label="Expand sidebar"]'));
await act(async()=>root.unmount());dom.window.close();console.log('PASS: drawer opens, role-specific links, current-page label, Escape close, route close, desktop collapse.');
})().catch(e=>{console.error(e);dom.window.close();process.exitCode=1});
