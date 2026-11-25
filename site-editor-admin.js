import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.2";
const db=createClient("https://ncfjussqankxpmcrhhij.supabase.co","sb_publishable_01DxOQWRyBJAdrUeXh7_gQ_j_qlTvtz");
const $=id=>document.getElementById(id);
const labels={inicio:"Inicio",espacios:"Espacios",coleccion:"Colección",nuestro_mundo:"Nuestro mundo"};
const defaultCover={x:72,y:55,size:48,angle:0,shape:"rounded",fit:"contain"};
let rows=[],currentImage=null,session=null;
const msg=value=>$("sectionContentMessage").textContent=value;
function coverSettings(row){return {...defaultCover,...(row?.image_settings||{})};}
function readCoverControls(){return {x:Number($("coverX").value),y:Number($("coverY").value),size:Number($("coverSize").value),angle:Number($("coverAngle").value),shape:$("coverShape").value,fit:$("coverFit").value};}
function writeCoverControls(s){$("coverX").value=s.x;$("coverY").value=s.y;$("coverSize").value=s.size;$("coverAngle").value=s.angle;$("coverShape").value=s.shape;$("coverFit").value=s.fit;}
function applyCoverStyle(img,s){
 img.style.left=Number(s.x)+"%";img.style.top=Number(s.y)+"%";img.style.right="auto";img.style.bottom="auto";
 img.style.width=Number(s.size)+"%";img.style.height="72%";img.style.maxWidth="90%";img.style.maxHeight="86%";
 img.style.transform="translate(-50%,-50%) rotate("+Number(s.angle)+"deg)";
 img.style.borderRadius=s.shape==="circle"?"50%":s.shape==="rectangle"?"4px":"18px";
 img.style.objectFit=s.fit==="cover"?"cover":"contain";
 img.style.background=s.shape==="circle"?"rgba(255,255,255,.16)":"rgba(255,255,255,.10)";
}
function refreshCoverPreview(){const img=$("sectionImagePreview").querySelector("img");if(img)applyCoverStyle(img,readCoverControls());}
function preview(path){
 const box=$("sectionImagePreview");box.replaceChildren();box.hidden=!path;
 if(path){const url=db.storage.from("mubira-products").getPublicUrl(path).data.publicUrl;const img=document.createElement("img");img.src=url;img.alt="Imagen de portada";box.append(img);if($("sectionKey").value==="inicio")applyCoverStyle(img,readCoverControls());}
}
function fill(key){
 const row=rows.find(r=>r.section_key===key)||{};
 $("sectionNavLabel").value=row.nav_label||labels[key];$("sectionEyebrow").value=row.eyebrow||"";
 $("sectionTitle").value=row.title||"";$("sectionDescription").value=row.description||"";$("sectionButtonText").value=row.button_text||"";
 currentImage=row.image_path||null;writeCoverControls(coverSettings(row));$("coverLayoutControls").hidden=key!=="inicio";
 $("sectionImage").value="";$("removeSectionImage").checked=false;preview(currentImage);
 msg("Editando "+labels[key]+". Los cambios solo se publican cuando toques Guardar.");
}
async function loadRows(){
 const {data,error}=await db.from("site_sections").select("*");
 if(error){msg("No se pudieron cargar las secciones: "+error.message);return;}
 rows=data||[];fill($("sectionKey").value);
}
$("sectionKey").addEventListener("change",()=>fill($("sectionKey").value));
["coverX","coverY","coverSize","coverAngle","coverShape","coverFit"].forEach(id=>$(id).addEventListener("input",refreshCoverPreview));
$("coverReset").addEventListener("click",()=>{writeCoverControls(defaultCover);refreshCoverPreview();});
$("sectionImage").addEventListener("change",()=>{
 const file=$("sectionImage").files?.[0],box=$("sectionImagePreview");box.replaceChildren();box.hidden=!file;
 if(file){if(file.size>35*1024*1024){$("sectionImage").value="";msg("La imagen supera 35 MB.");box.hidden=true;return;}
 const img=document.createElement("img");img.src=URL.createObjectURL(file);img.alt="Vista previa";box.append(img);if($("sectionKey").value==="inicio")applyCoverStyle(img,readCoverControls());}
});
$("saveSectionContent").addEventListener("click",async()=>{
 if(!session?.user){msg("Inicia sesión con una cuenta autorizada para guardar.");return;}
 const key=$("sectionKey").value,existing=rows.find(r=>r.section_key===key);
 const button=$("saveSectionContent");button.disabled=true;msg("Guardando cambios...");
 let nextPath=currentImage,uploadedPath=null;
 try{
  const file=$("sectionImage").files?.[0];
  if(file){
   const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
   const path="site-sections/"+key+"/"+Date.now()+"."+ext;
   const up=await db.storage.from("mubira-products").upload(path,file,{contentType:file.type,upsert:false});
   if(up.error)throw up.error;uploadedPath=up.data.path;nextPath=uploadedPath;
  }else if($("removeSectionImage").checked)nextPath=null;
  const imageSettings=key==="inicio"?readCoverControls():(existing?.image_settings||{});
  const payload={section_key:key,image_settings:imageSettings,nav_label:$("sectionNavLabel").value.trim()||labels[key],eyebrow:$("sectionEyebrow").value.trim(),title:$("sectionTitle").value.trim(),description:$("sectionDescription").value.trim(),button_text:$("sectionButtonText").value.trim(),image_path:nextPath,updated_at:new Date().toISOString(),updated_by:session.user.id};
  const saved=await db.from("site_sections").upsert(payload,{onConflict:"section_key"}).select("*").single();
  if(saved.error)throw saved.error;
  if(saved.data.section_key!==key||saved.data.image_path!==nextPath||JSON.stringify(saved.data.image_settings||{})!==JSON.stringify(imageSettings))throw new Error("La base de datos no confirmó todos los ajustes de la portada.");
  let storageNote="";
  if(existing?.image_path&&existing.image_path!==nextPath){const removed=await db.storage.from("mubira-products").remove([existing.image_path]);if(removed.error)storageNote=" La portada sí se actualizó, pero no se pudo retirar la imagen anterior: "+removed.error.message;}
  currentImage=nextPath;rows=rows.filter(r=>r.section_key!==key);rows.push(saved.data);
  preview(currentImage);$("sectionImage").value="";$("removeSectionImage").checked=false;
  msg("Portada y posición guardadas y verificadas."+storageNote+" Actualiza la tienda para ver el resultado.");
 }catch(error){
  if(uploadedPath){const cleanup=await db.storage.from("mubira-products").remove([uploadedPath]);if(cleanup.error)console.warn("No se pudo limpiar la imagen temporal:",cleanup.error);}
  msg("No se pudo guardar o verificar la portada: "+error.message);
 }finally{button.disabled=false;}
});
async function init(){
 const {data:{session:s}}=await db.auth.getSession();session=s;
 if(!s?.user){msg("Inicia sesión con una cuenta autorizada para el administrador técnico.");return;}
 await db.rpc("claim_technical_admin_invite");
 const [{data:profile,error:profileError},{data:roles,error:rolesError}]=await Promise.all([
  db.from("admin_profiles").select("role").eq("user_id",s.user.id).maybeSingle(),
  db.from("admin_access").select("role").eq("user_id",s.user.id)
 ]);
 const allowed=(!profileError&&profile?.role==="owner")||(!rolesError&&(roles||[]).some(r=>r.role==="technical_admin"));
 if(!allowed){msg("Esta cuenta no tiene permisos técnicos.");return;}
 await loadRows();
}
db.auth.onAuthStateChange((_event,s)=>{session=s;if(s?.user)loadRows();});
init();
