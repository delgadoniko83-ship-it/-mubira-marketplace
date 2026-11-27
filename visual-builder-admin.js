import {createClient} from "https://esm.sh/@supabase/supabase-js@2.119.2";
const db=createClient("https://ncfjussqankxpmcrhhij.supabase.co","sb_publishable_01DxOQWRyBJAdrUeXh7_gQ_j_qlTvtz");
const $=id=>document.getElementById(id),stage=$("vbStage"),status=$("vbStatus");
let pages=[{id:"inicio",name:"Inicio"},{id:"espacios",name:"Espacios"},{id:"coleccion",name:"Colección"},{id:"estudio",name:"Nuestro mundo"}];
let theme=null,session=null,activePage="inicio",drafts={},pageMeta={},items=[],selected=null,mode="phone",drag=null,pendingFiles=new Map(),pendingBackgroundFiles=new Map(),historyByPage={},historyIndexByPage={};
const pageSlug=s=>s.toLocaleLowerCase("es-CO").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,42);
const say=t=>status.textContent=t,clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const uid=()=>"vb-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);
const url=p=>p?db.storage.from("mubira-products").getPublicUrl(p).data.publicUrl:"";
function clean(x){return {id:x.id||uid(),type:x.type||"text",left:clamp(x.left,0,100),top:clamp(x.top,0,100),width:clamp(x.width??80,8,100),height:clamp(x.height??90,30,600),text:String(x.text||""),font:clamp(x.font??24,10,64),color:x.color||"#30263a",background:x.background||"#ffffff",path:x.path||"",localUrl:x.localUrl||""};}
function snapshot(){
 drafts[activePage]=items.map(x=>({...x}));
 const state=JSON.stringify(items.map(({id,type,left,top,width,height,text,font,color,background,path,localUrl})=>({id,type,left,top,width,height,text,font,color,background,path,localUrl})));
 const history=historyByPage[activePage]||(historyByPage[activePage]=[]);
 let index=historyIndexByPage[activePage]??-1;
 if(index>=0&&history[index]===state)return;
 history.splice(index+1);history.push(state);if(history.length>60)history.shift();
 historyIndexByPage[activePage]=history.length-1;syncHistoryButtons();
}
function restoreHistory(next){
 const history=historyByPage[activePage]||[];let index=historyIndexByPage[activePage]??-1;
 if(next<0||next>=history.length)return;
 historyIndexByPage[activePage]=next;items=JSON.parse(history[next]).map(clean);selected=null;drafts[activePage]=items.map(x=>({...x}));render();syncProps();syncHistoryButtons();say(next===history.length-1?"Cambios restaurados.":"Historial recuperado.");
}
function syncHistoryButtons(){const i=historyIndexByPage[activePage]??-1,h=historyByPage[activePage]||[];$("vbUndo").disabled=i<=0;$("vbRedo").disabled=i<0||i>=h.length-1;}
function bringLayer(front){const i=items.findIndex(x=>x.id===selected);if(i<0)return;const [x]=items.splice(i,1);items.splice(front?items.length:0,0,x);snapshot();render();syncProps();say(front?"Elemento al frente.":"Elemento al fondo.");}
function renderPageTabs(){
 const host=$("vbPages");host.innerHTML="";
 pages.forEach((p,i)=>{const b=document.createElement("button");b.type="button";b.dataset.vbPage=p.id;b.className=p.id===activePage?"active":"";b.textContent=String(i+1).padStart(2,"0")+" · "+p.name;host.append(b);});
}
function switchPage(id){
 if(!pages.some(p=>p.id===id))return;
 if(items.length||!historyByPage[activePage])snapshot();activePage=id;items=(drafts[id]||[]).map(clean);selected=null;
 $("vbCurrentPage").textContent=pages.find(p=>p.id===id).name.toLocaleUpperCase("es-CO");
 renderPageTabs();if(!historyByPage[id])snapshot();render();syncProps();say("Editando "+pages.find(p=>p.id===id).name+". El borrador de las demás pantallas se conserva.");
}
function render(){
 stage.classList.toggle("desktop",mode==="desktop");
 const oldBg=stage.querySelector(".vb-bg-video");if(oldBg)oldBg.remove();
 const meta=pageMeta[activePage]||{};
 if(meta.background_type==="video"&&(meta.background_local_url||meta.background_path)){const bg=document.createElement("video");bg.className="vb-bg-video";bg.muted=true;bg.autoplay=true;bg.loop=true;bg.playsInline=true;bg.setAttribute("aria-label","Video de fondo de la pantalla");bg.src=meta.background_local_url||url(meta.background_path);stage.insertBefore(bg,stage.firstChild);}
 stage.style.background=meta.background_type==="color"?(meta.background_color||"#eee7f4"):"linear-gradient(145deg,#f8f2fa,#eee7f4)";
 $("vbEmpty").hidden=items.length>0;
 stage.querySelectorAll(".vb-element").forEach(n=>n.remove());
 for(const x of items){
  const el=document.createElement("div");el.className="vb-element"+(x.id===selected?" selected":"");el.dataset.id=x.id;
  Object.assign(el.style,{left:x.left+"%",top:x.top+"%",width:x.width+"%",height:x.height+"px",color:x.color,background:x.type==="panel"?x.background:"transparent",fontSize:x.font+"px"});
  if(x.type==="image"){const img=document.createElement("img");img.alt="Imagen";img.src=x.localUrl||url(x.path);el.append(img);}
  else {const child=document.createElement(x.type==="button"?"span":"div");child.className=x.type==="button"?"vb-button":"vb-copy";child.textContent=x.text||(x.type==="panel"?"Nueva sección":x.type==="button"?"Explorar":"Tu título");el.append(child);}
  el.addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();selected=x.id;syncProps();render();const r=stage.getBoundingClientRect();drag={id:x.id,x:e.clientX,y:e.clientY,left:x.left,top:x.top,w:r.width,h:r.height};stage.setPointerCapture(e.pointerId);});
  el.addEventListener("click",e=>{e.stopPropagation();selected=x.id;syncProps();render();});
  stage.append(el);
 }
}
function syncProps(){
 const x=items.find(v=>v.id===selected);
 for(const id of ["vbWidth","vbHeight","vbLeft","vbTop","vbText","vbFont","vbColor","vbBackground"])$(id).disabled=!x;
 if(!x)return;
 $("vbWidth").value=x.width;$("vbHeight").value=x.height;$("vbLeft").value=x.left;$("vbTop").value=x.top;$("vbText").value=x.text;$("vbFont").value=x.font;$("vbColor").value=x.color;$("vbBackground").value=x.background;
}
stage.addEventListener("pointermove",e=>{if(!drag)return;const x=items.find(v=>v.id===drag.id);if(!x)return;x.left=clamp(drag.left+(e.clientX-drag.x)/drag.w*100,0,100-x.width);x.top=clamp(drag.top+(e.clientY-drag.y)/drag.h*100,0,100);const el=stage.querySelector('[data-id="'+drag.id+'"]');if(el){el.style.left=x.left+"%";el.style.top=x.top+"%";}});
function stopDrag(){if(drag){drag=null;snapshot();}}
stage.addEventListener("pointerup",stopDrag);stage.addEventListener("pointercancel",stopDrag);
stage.addEventListener("click",e=>{if(e.target===stage){selected=null;syncProps();render();}});
function add(type){const x=clean({id:uid(),type,left:8,top:12+items.length*4,width:type==="image"?84:72,height:type==="panel"?140:type==="image"?160:70,text:type==="button"?"Explorar":type==="panel"?"Nueva sección":"Escribe tu título"});items.push(x);selected=x.id;snapshot();render();syncProps();say("Elemento agregado a "+activePage+".");}
$("vbAddImage").addEventListener("click",()=>$("vbImageFile").click());
$("vbImageFile").addEventListener("change",()=>{const f=$("vbImageFile").files?.[0];if(!f)return;if(!f.type.startsWith("image/")||f.size>8*1024*1024){say("Elige JPG, PNG o WebP de máximo 8 MB.");return;}const x=clean({id:uid(),type:"image",width:84,height:160,left:8,top:12});x.localUrl=URL.createObjectURL(f);items.push(x);pendingFiles.set(x.id,f);selected=x.id;snapshot();render();syncProps();$("vbImageFile").value="";say("Foto añadida. Se subirá al guardar el borrador.");});
$("vbAddText").addEventListener("click",()=>add("text"));$("vbAddButton").addEventListener("click",()=>add("button"));$("vbAddPanel").addEventListener("click",()=>add("panel"));
const props={vbWidth:["width",8,100],vbHeight:["height",30,600],vbLeft:["left",0,100],vbTop:["top",0,100],vbText:["text"],vbFont:["font",10,64],vbColor:["color"],vbBackground:["background"]};
for(const [id,[key,min,max]] of Object.entries(props))$(id).addEventListener("input",()=>{const x=items.find(v=>v.id===selected);if(!x)return;x[key]=min===undefined?$(id).value:clamp($(id).value,min,max);snapshot();render();});
$("vbUndo").addEventListener("click",()=>restoreHistory((historyIndexByPage[activePage]??0)-1));
$("vbRedo").addEventListener("click",()=>restoreHistory((historyIndexByPage[activePage]??-1)+1));
$("vbBringFront").addEventListener("click",()=>bringLayer(true));$("vbSendBack").addEventListener("click",()=>bringLayer(false));
$("vbDuplicate").addEventListener("click",()=>{const x=items.find(v=>v.id===selected);if(!x)return;const y=clean({...x,id:uid(),left:clamp(x.left+4,0,90),top:clamp(x.top+5,0,95)});items.push(y);selected=y.id;snapshot();render();syncProps();});
$("vbDelete").addEventListener("click",()=>{if(!selected)return;items=items.filter(v=>v.id!==selected);pendingFiles.delete(selected);selected=null;snapshot();render();syncProps();});
$("vbClear").addEventListener("click",()=>{if(!confirm("¿Vaciar solamente "+pages.find(p=>p.id===activePage).name+"?"))return;for(const item of items)pendingFiles.delete(item.id);items=[];selected=null;snapshot();render();syncProps();});
$("vbPhone").addEventListener("click",()=>{mode="phone";render();});$("vbDesktop").addEventListener("click",()=>{mode="desktop";render();});
$("vbPages").addEventListener("click",e=>{const b=e.target.closest("[data-vb-page]");if(b)switchPage(b.dataset.vbPage);});
$("vbAddPage").addEventListener("click",()=>{const name=prompt("Nombre de la nueva pantalla:");if(!name?.trim())return;const id=pageSlug(name);if(!id||pages.some(p=>p.id===id)){say("Ese nombre ya existe o no es válido. Prueba con otro.");return;}pages.push({id,name:name.trim().slice(0,48)});drafts[id]=[];pageMeta[id]={};switchPage(id);say("Pantalla creada como borrador. Todavía no aparece en la tienda pública.");});
$("vbRemovePage").addEventListener("click",()=>{const p=pages.find(x=>x.id===activePage);if(!p||["inicio","espacios","coleccion","estudio"].includes(p.id)){say("Las cuatro pantallas originales están protegidas.");return;}if(!confirm("¿Eliminar el borrador de «"+p.name+"»? Esta acción se guardará cuando pulses Guardar borradores."))return;snapshot();pages=pages.filter(x=>x.id!==p.id);delete drafts[p.id];delete pageMeta[p.id];pendingBackgroundFiles.delete(p.id);activePage="inicio";items=(drafts.inicio||[]).map(clean);selected=null;renderPageTabs();render();syncProps();say("Pantalla retirada del borrador. Guarda para confirmar el cambio.");});
$("vbBackgroundVideoButton").addEventListener("click",()=>$("vbBackgroundVideo").click());
$("vbBackgroundVideo").addEventListener("change",()=>{const f=$("vbBackgroundVideo").files?.[0];if(!f)return;if(!f.type.startsWith("video/")||f.size>30*1024*1024){say("Elige un video compatible de máximo 30 MB para cuidar la carga.");$("vbBackgroundVideo").value="";return;}const old=pageMeta[activePage]?.background_local_url;if(old)URL.revokeObjectURL(old);pageMeta[activePage]={...(pageMeta[activePage]||{}),background_type:"video",background_local_url:URL.createObjectURL(f),background_path:""};pendingBackgroundFiles.set(activePage,f);render();say("Video de fondo añadido. Se subirá al guardar el borrador.");$("vbBackgroundVideo").value="";});
$("vbClearBackground").addEventListener("click",()=>{delete pageMeta[activePage];pendingBackgroundFiles.delete(activePage);render();say("Fondo retirado de esta pantalla. Guarda para conservar el cambio.");});
async function load(){
 const {data:{session:s}}=await db.auth.getSession();session=s;
 if(!s?.user){say("Inicia sesión con Google en el administrador técnico.");return;}
 const [{data:p},{data:a}]=await Promise.all([db.from("admin_profiles").select("role").eq("user_id",s.user.id).maybeSingle(),db.from("admin_access").select("role").eq("user_id",s.user.id)]);
 if(!(p?.role==="owner"||(a||[]).some(v=>v.role==="technical_admin"))){say("Esta cuenta no tiene permiso para usar el Constructor Visual.");return;}
 const {data,error}=await db.from("site_themes").select("id,theme_key,name,settings").eq("is_active",true).maybeSingle();
 if(error||!data){say("No se encontró un ambiente activo. Abre Ambientes y selecciona uno.");return;}
 theme=data;const saved=data.settings?.visual_builder||{};
 if(saved.pages)drafts=saved.pages;else if(saved.elements?.length)drafts.inicio=saved.elements;
 if(Array.isArray(saved.page_list)&&saved.page_list.length)pages=saved.page_list.filter(p=>p&&p.id&&p.name);
 pageMeta=saved.page_meta&&typeof saved.page_meta==="object"?saved.page_meta:{};
 renderPageTabs();switchPage("inicio");say("Constructor listo. Puedes crear pantallas nuevas y asignarles fondos de video. Todo queda como borrador.");
}
$("vbSave").addEventListener("click",async()=>{
 if(!theme||!session?.user){say("No hay un ambiente activo o una sesión autorizada.");return;}
 snapshot();const btn=$("vbSave");btn.disabled=true;say("Guardando borradores de "+pages.length+" pantallas...");
 const uploaded=[];
 try{
  for(const [page,list] of Object.entries(drafts))for(const x of list){const file=pendingFiles.get(x.id);if(!file)continue;const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";const path="visual-builder/"+theme.theme_key+"/"+page+"/"+x.id+"-"+Date.now()+"."+ext;const {data,error}=await db.storage.from("mubira-products").upload(path,file,{upsert:false,contentType:file.type});if(error)throw error;x.path=data.path;x.localUrl="";uploaded.push(data.path);}
  for(const [page,file] of pendingBackgroundFiles){const ext=(file.name.split(".").pop()||"mp4").toLowerCase().replace(/[^a-z0-9]/g,"")||"mp4";const path="visual-builder/"+theme.theme_key+"/"+page+"/background-"+Date.now()+"."+ext;const {data,error}=await db.storage.from("mubira-products").upload(path,file,{upsert:false,contentType:file.type});if(error)throw error;pageMeta[page]={...(pageMeta[page]||{}),background_type:"video",background_path:data.path};delete pageMeta[page].background_local_url;uploaded.push(data.path);}
  const {data:latest,error:readError}=await db.from("site_themes").select("settings").eq("id",theme.id).single();if(readError)throw readError;
  const settings={...(latest.settings||{}),visual_builder:{version:3,updated_at:new Date().toISOString(),page_list:pages.map(({id,name})=>({id,name})),page_meta:pageMeta,pages:Object.fromEntries(Object.entries(drafts).map(([id,list])=>[id,list.map(({id:elementId,type,left,top,width,height,text,font,color,background,path})=>({id:elementId,type,left,top,width,height,text,font,color,background,path}))]))}};
  const {data:saved,error}=await db.from("site_themes").update({settings,updated_by:session.user.id}).eq("id",theme.id).select("id,settings").single();if(error)throw error;
  if(!saved?.settings?.visual_builder?.pages)throw new Error("No se pudo verificar el guardado.");
  theme.settings=saved.settings;pendingFiles.clear();pendingBackgroundFiles.clear();items=(drafts[activePage]||[]).map(clean);renderPageTabs();render();say("¡Guardado! "+pages.length+" pantallas y sus fondos quedaron como borradores. La tienda pública no se publicó ni se alteró.");
 }catch(e){if(uploaded.length)await db.storage.from("mubira-products").remove(uploaded);say("No se pudo guardar: "+(e.message||"Error desconocido"));}
 finally{btn.disabled=false;}
});
db.auth.onAuthStateChange((_e,s)=>{if(s?.user&&!theme)load();});load();
