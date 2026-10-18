const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = __dirname;
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function element(tag='div') { return {tag, value:'0', children:[], hidden:false, attrs:{}, events:{}, parentElement:{hidden:false}, setAttribute(k,v){this.attrs[k]=v}, addEventListener(k,fn){this.events[k]=fn}, append(...items){this.children.push(...items)}, replaceChildren(...items){this.children=[...items]}}; }
const ids = new Map();
const buttons = ['mobile','tablet','laptop','desktop','compare'].map(mode=>({...element('button'),dataset:{mode}}));
const document = {getElementById(id){if(!ids.has(id))ids.set(id,element());return ids.get(id)},querySelectorAll(){return buttons},createElement:element};
const context = vm.createContext({document, URLSearchParams, location:{hash:''}, history:{replaceState(){}}});
vm.runInContext(code,context,{filename:'gallery-inline.js'});
let cases=0;
for(let n=0;n<6;n++)for(const mode of ['mobile','tablet','laptop','desktop','compare']){
 vm.runInContext('el("section").value="'+n+'"; mode="'+mode+'"; render();',context);
 if(mode==='compare'){
  assert.equal(ids.get('compare').children.length,3);
  for(const figure of ids.get('compare').children){
   const link=figure.children[1];assert.ok(fs.existsSync(path.join(root,link.href)),link.href);
  }
 }else{
  for(const id of ['preview','original','prompt']){
   const el=ids.get(id), ref=id==='preview'?el.src:el.href;
   assert.ok(fs.existsSync(path.join(root,ref)),ref);
  }
 }
 assert.equal(buttons.filter(b=>b.attrs['aria-pressed']==='true').length,1);
 cases++;
}
const markdownFiles=['README.md','RESPONSIVE_SPEC.md'];
for(const name of markdownFiles){
 const text=fs.readFileSync(path.join(root,name),'utf8');
 for(const match of text.matchAll(/\]\(([^)]+)\)/g)){
  if(!match[1].startsWith('http'))assert.ok(fs.existsSync(path.join(root,match[1])),name+':'+match[1]);
 }
}
assert.ok(fs.existsSync(path.join(root,'mobile-menu.png')));
const pngs=fs.readdirSync(root).filter(f=>f.endsWith('.png')).map(file=>{
 const b=fs.readFileSync(path.join(root,file));assert.equal(b.toString('ascii',1,4),'PNG');
 return {file,width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
});
const report={galleryCases:cases,allLinksExist:true,pngs,note:'Checks cover gallery script and files, not browser rendering or responsive site implementation.'};
fs.writeFileSync(path.join(root,'validation.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({galleryCases:cases,allLinksExist:true,pngCount:pngs.length},null,2));

