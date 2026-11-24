import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.2";
const db=createClient("https://ncfjussqankxpmcrhhij.supabase.co","sb_publishable_01DxOQWRyBJAdrUeXh7_gQ_j_qlTvtz");
const $=id=>document.getElementById(id);
const keys=["inicio","espacios","coleccion","nuestro_mundo"];
const labels={inicio:"Inicio",espacios:"Espacios",coleccion:"Colección",nuestro_mundo:"Nuestro mundo"};
let rows=[],currentImage=null,session=null;
const msg=(value)=>$("sectionContentMessage").textContent=value;
function preview(path){
 const box=$("sectionImagePreview");box.replaceChildren();box.hidden=!path;
 if(path){const url=db.storage.from("mubira-products").getPublicUrl(path).data.publicUrl;const img=document.createElement("img");img.src=url;img.alt="Imagen actual de la sección";box.append(img);}
}
function fill(key){
 const row=rows.find(r=>r.section_key===key)||{};
 $("sectionNavLabel").value=row.nav_label||labels[key];
 $("sectionEyebrow").value=row.eyebrow||"";
 $("sectionTitle").value=row.title||"";
 $("sectionDescription").value=row.description||"";
 $("sectionButtonText").value=row.button_text||"";
 currentImage=row.image_path||null;
 $("sectionImage").value="";
 $("removeSectionImage").checked=false;
 preview(currentImage);
 msg("Editando "+labels[key]+". Los cambios solo se publican cuando toques Guardar.");
}
async function loadRows(){
 const {data,error}=await db.from("site_sections").select("*");
 if(error){msg("No se pudieron cargar las secciones: "+error.message);return;}
 rows=data||[];fill($("sectionKey").value);
}
$("sectionKey").addEventListener("change",()=>fill($("sectionKey").value));
$("sectionImage").addEventListener("change",()=>{
 const file=$("sectionImage").files?.[0];const box=$("sectionImagePreview");box.replaceChildren();box.hidden=!file;
 if(file){if(file.size>35*1024*1024){$("sectionImage").value="";msg("La imagen supera 35 MB.");box.hidden=true;return;}const img=document.createElement("img");img.src=URL.createObjectURL(file);img.alt="Vista previa";box.append(img);}
});
$("saveSectionContent").addEventListener("click",async()=>{
 if(!session?.user){msg("Inicia sesión como propietario para guardar.");return;}
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
  } else if($("removeSectionImage").checked) nextPath=null;
  const payload={section_key:key,nav_label:$("sectionNavLabel").value.trim()||labels[key],eyebrow:$("sectionEyebrow").value.trim(),title:$("sectionTitle").value.trim(),description:$("sectionDescription").value.trim(),button_text:$("sectionButtonText").value.trim(),image_path:nextPath,updated_at:new Date().toISOString(),updated_by:session.user.id};
  const saved=await db.from("site_sections").upsert(payload,{onConflict:"section_key"});
  if(saved.error)throw saved.error;
  if(existing?.image_path && existing.image_path!==nextPath) await db.storage.from("mubira-products").remove([existing.image_path]);
  currentImage=nextPath;rows=rows.filter(r=>r.section_key!==key);rows.push(payload);
  preview(currentImage);$("sectionImage").value="";$("removeSectionImage").checked=false;
  msg("¡Sección actualizada! Abre o actualiza la tienda para ver los cambios.");
 }catch(error){
  if(uploadedPath) await db.storage.from("mubira-products").remove([uploadedPath]);
  msg("No se pudo guardar: "+error.message);
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
