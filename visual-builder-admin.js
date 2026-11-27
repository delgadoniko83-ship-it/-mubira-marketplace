import {createClient} from "https://esm.sh/@supabase/supabase-js@2.119.2";
const db=createClient("https://ncfjussqankxpmcrhhij.supabase.co","sb_publishable_01DxOQWRyBJAdrUeXh7_gQ_j_qlTvtz");
const $=id=>document.getElementById(id);
const stage=$("vbStage"),status=$("vbStatus");
let theme=null,items=[],selected=null,mode="phone",drag=null,pendingFiles=new Map(),session=null;
const say=t=>{status.textContent=t};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
const uid=()=> "el-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);
const publicUrl=p=>p?db.storage.from("mubira-products").getPublicUrl(p).data.publicUrl:"";
function normalize(x){return {id:x.id||uid(),type:x.type||"text",left:clamp(x.left,0,100),top:clamp(x.top,0,100),width:clamp(x.width||80,8,100),height:clamp(x.height||90,30,600),text:String(x.text||""),font:clamp(x.font||24,10,64),color:x.color||"#30263a",background:x.background||"#ffffff",path:x.path||"",localUrl:x.localUrl||""};}
function selectItem(id){selected=id;render();syncProps();}
function render(){
 stage.classList.toggle("desktop",mode==="desktop");
 $("vbModeLabel").textContent=mode==="phone"?"VISTA CELULAR":"VISTA COMPUTADOR";
 $("vbEmpty").hidden=items.length>0;
 stage.querySelectorAll(".vb-element").forEach(n=>n.remove());
 items.forEach(item=>{
  const el=document.createElement("div");el.className="vb-element"+(item.id===selected?" selected":"");el.dataset.id=item.id;
  Object.assign(el.style,{left:item.left+"%",top:item.top+"%",width:item.width+"%",height:item.height+"px",color:item.color,background:item.type==="panel"?item.background:"transparent",fontSize:item.font+"px"});
  if(item.type==="image"){
   const img=document.createElement("img");img.alt="Imagen del diseño";img.src=item.localUrl||publicUrl(item.path);el.append(img);
  }else if(item.type==="button"){
   const span=document.createElement("span");span.className="vb-button";span.textContent=item.text||"Botón";el.append(span);
  }else if(item.type==="panel"){
   const span=document.createElement("span");span.className="vb-copy";span.textContent=item.text||"Nueva sección";el.append(span);
  }else{
   const span=document.createElement("span");span.className="vb-copy";span.textContent=item.text||"Escribe tu título";el.append(span);
  }
  el.addEventListener("pointerdown",e=>startDrag(e,item.id));
  el.addEventListener("click",e=>{e.stopPropagation();selectItem(item.id)});
  stage.append(el);
 });
}
function syncProps(){
 const x=items.find(i=>i.id===selected),ids=["vbWidth","vbHeight","vbLeft","vbTop","vbText","vbFont","vbColor","vbBackground"];
 ids.forEach(id=>$(id).disabled=!x);
 if(!x)return;
 $("vbWidth").value=x.width;$("vbHeight").value=x.height;$("vbLeft").value=x.left;$("vbTop").value=x.top;$("vbText").value=x.text;$("vbFont").value=x.font;$("vbColor").value=x.color;$("vbBackground").value=x.background;
}
function startDrag(e,id){
 e.preventDefault();e.stopPropagation();selectItem(id);
 const item=items.find(x=>x.id===id),rect=stage.getBoundingClientRect();
 drag={id,x:e.clientX,y:e.clientY,left:item.left,top:item.top,w:rect.width,h:rect.height};
 e.currentTarget.setPointerCapture(e.pointerId);
}
stage.addEventListener("pointermove",e=>{
 if(!drag)return;const item=items.find(x=>x.id===drag.id);if(!item)return;
 item.left=clamp(drag.left+(e.clientX-drag.x)/drag.w*100,0,100-item.width);
 item.top=clamp(drag.top+(e.clientY-drag.y)/drag.h*100,0,100);
 render();
});
stage.addEventListener("pointerup",()=>{drag=null});
stage.addEventListener("pointercancel",()=>{drag=null});
stage.addEventListener("click",e=>{if(e.target===stage){selected=null;render();syncProps()}});
function add(type){const item=normalize({type,left:10+items.length*2,top:12+items.length*5,width:type==="image"?78:70,height:type==="panel"?130:type==="image"?150:70,text:type==="button"?"Explorar":type==="panel"?"Nueva sección":"Tu nuevo título"});items.push(item);selectItem(item.id);say("Elemento agregado. Arrástralo hasta donde quieras.");}
$("vbAddImage").addEventListener("click",()=>$("vbImageFile").click());
$("vbImageFile").addEventListener("change",()=>{
 const file=$("vbImageFile").files?.[0];if(!file)return;
 if(!file.type.startsWith("image/")||file.size>8*1024*1024){say("Usa JPG, PNG o WebP de máximo 8 MB.");$("vbImageFile").value="";return;}
 const item=normalize({type:"image",width:82,height:160,left:9,top:12});item.localUrl=URL.createObjectURL(file);item.file=file;items.push(item);pendingFiles.set(item.id,file);selectItem(item.id);$("vbImageFile").value="";
 say("Fotografía añadida. Se subirá al guardar el borrador.");
});
$("vbAddText").addEventListener("click",()=>add("text"));
$("vbAddButton").addEventListener("click",()=>add("button"));
$("vbAddPanel").addEventListener("click",()=>add("panel"));
const props={vbWidth:["width",8,100],vbHeight:["height",30,600],vbLeft:["left",0,100],vbTop:["top",0,100],vbText:["text"],vbFont:["font",10,64],vbColor:["color"],vbBackground:["background"]};
Object.entries(props).forEach(([id,[key,min,max]])=>$(id).addEventListener("input",()=>{
 const item=items.find(x=>x.id===selected);if(!item)return;
 item[key]=min===undefined?$(id).value:clamp($(id).value,min,max);render();
}));
$("vbDuplicate").addEventListener("click",()=>{const x=items.find(i=>i.id===selected);if(!x)return;const copy=normalize({...x,id:uid(),left:clamp(x.left+4,0,90),top:clamp(x.top+5,0,95),path:x.path});delete copy.localUrl;items.push(copy);selectItem(copy.id);say("Elemento duplicado.");});
$("vbDelete").addEventListener("click",()=>{if(!selected)return;items=items.filter(i=>i.id!==selected);pendingFiles.delete(selected);selected=null;render();syncProps();say("Elemento eliminado del borrador.");});
$("vbClear").addEventListener("click",()=>{if(!confirm("¿Vaciar todos los elementos de este diseño?"))return;items=[];pendingFiles.clear();selected=null;render();syncProps();});
$("vbPhone").addEventListener("click",()=>{mode="phone";render()});
$("vbDesktop").addEventListener("click",()=>{mode="desktop";render()});
async function load(){
 const {data:{session:s}}=await db.auth.getSession();session=s;
 if(!s?.user){say("Inicia sesión en el administrador técnico para abrir el constructor.");return;}
 const [{data:p,error:pe},{data:r,error:re}]=await Promise.all([
  db.from("admin_profiles").select("role").eq("user_id",s.user.id).maybeSingle(),
  db.from("admin_access").select("role").eq("user_id",s.user.id)
 ]);
 if(!((!pe&&p?.role==="owner")||(!re&&(r||[]).some(v=>v.role==="technical_admin")))){say("Esta cuenta no tiene permisos para editar el diseño.");return;}
 const {data,error}=await db.from("site_themes").select("id,theme_key,name,settings,is_active").eq("is_active",true).maybeSingle();
 if(error||!data){say("No se encontró un ambiente activo. Guarda o activa primero un ambiente en la biblioteca.");return;}
 theme=data;items=(data.settings?.visual_builder?.elements||[]).map(normalize);render();syncProps();
 say("Listo: ambiente activo «"+data.name+"». Tus cambios se guardan como borrador y no alteran la tienda.");
}
$("vbSave").addEventListener("click",async()=>{
 if(!theme||!session?.user){say("No hay sesión autorizada o ambiente activo.");return;}
 const button=$("vbSave");button.disabled=true;say("Guardando diseño y fotografías...");
 const uploaded=[];
 try{
  for(const item of items){
   const file=pendingFiles.get(item.id);if(!file)continue;
   const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
   const path="visual-builder/"+theme.theme_key+"/"+item.id+"-"+Date.now()+"."+ext;
   const {data,error}=await db.storage.from("mubira-products").upload(path,file,{upsert:false,contentType:file.type});
   if(error)throw error;item.path=data.path;uploaded.push(data.path);item.localUrl="";
  }
  const {data:latest,error:readError}=await db.from("site_themes").select("settings").eq("id",theme.id).single();
  if(readError)throw readError;
  const settings={...(latest.settings||{}),visual_builder:{version:1,updated_at:new Date().toISOString(),elements:items.map(({id,type,left,top,width,height,text,font,color,background,path})=>({id,type,left,top,width,height,text,font,color,background,path}))}};
  const {data:saved,error}=await db.from("site_themes").update({settings,updated_by:session.user.id}).eq("id",theme.id).select("id,settings").single();
  if(error)throw error;
  if(!saved?.settings?.visual_builder||saved.settings.visual_builder.elements.length!==items.length)throw new Error("No se pudo verificar el diseño guardado.");
  theme.settings=saved.settings;pendingFiles.clear();render();say("Borrador guardado y verificado. La tienda pública no se ha modificado.");
 }catch(error){
  if(uploaded.length){const {error:cleanup}=await db.storage.from("mubira-products").remove(uploaded);if(cleanup)console.warn("Limpieza de imágenes temporales:",cleanup.message);}
  say("No se pudo guardar el borrador: "+(error.message||"Error desconocido"));
 }finally{button.disabled=false;}
});
db.auth.onAuthStateChange((_e,s)=>{if(s?.user&&!theme)load()});
load();
