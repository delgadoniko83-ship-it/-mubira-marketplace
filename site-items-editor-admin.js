import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.2";
const db=createClient("https://ncfjussqankxpmcrhhij.supabase.co","sb_publishable_01DxOQWRyBJAdrUeXh7_gQ_j_qlTvtz");
const $=id=>document.getElementById(id);
const items={
 salas:{label:"Salas",eyebrow:"01 / RELAJARSE",title:"Salas",description:"El placer de llegar a casa ↗",sort_order:1},
 comedores:{label:"Comedores",eyebrow:"02 / COMPARTIR",title:"Comedores",description:"Donde pasan las mejores cosas ↗",sort_order:2},
 habitaciones:{label:"Habitaciones",eyebrow:"03 / DESCANSAR",title:"Habitaciones",description:"Tu pausa favorita ↗",sort_order:3},
 decoracion:{label:"Decoración",eyebrow:"04 / EXPRESAR",title:"Decoración",description:"Los detalles son todo ↗",sort_order:4}
};
let rows=[],session=null,currentImage=null;
const msg=value=>$("spaceItemMessage").textContent=value;
function preview(path){
 const box=$("spaceItemImagePreview");box.replaceChildren();box.hidden=!path;
 if(path){const url=db.storage.from("mubira-products").getPublicUrl(path).data.publicUrl;const img=document.createElement("img");img.src=url;img.alt="Fotografía actual de la tarjeta";box.append(img);}
}
function fill(key){
 const item=items[key],row=rows.find(r=>r.item_key===key)||{};
 $("spaceItemEyebrow").value=row.eyebrow??item.eyebrow;
 $("spaceItemTitle").value=row.title??item.title;
 $("spaceItemDescription").value=row.description??item.description;
 currentImage=row.image_path||null;
 $("spaceItemImage").value="";$("removeSpaceItemImage").checked=false;preview(currentImage);
 msg("Editando "+item.label+". Los cambios se publican al guardar.");
}
async function loadRows(){
 const {data,error}=await db.from("site_section_items").select("*").eq("section_key","espacios").order("sort_order");
 if(error){msg("No se pudieron cargar las tarjetas: "+error.message);return;}
 rows=data||[];fill($("spaceItemKey").value);
}
$("spaceItemKey").addEventListener("change",()=>fill($("spaceItemKey").value));
$("spaceItemImage").addEventListener("change",()=>{
 const file=$("spaceItemImage").files?.[0],box=$("spaceItemImagePreview");box.replaceChildren();box.hidden=!file;
 if(!file)return;
 if(file.size>35*1024*1024){$("spaceItemImage").value="";box.hidden=true;msg("La imagen supera 35 MB.");return;}
 const img=document.createElement("img");img.src=URL.createObjectURL(file);img.alt="Vista previa";box.append(img);
});
$("saveSpaceItem").addEventListener("click",async()=>{
 if(!session?.user){msg("Inicia sesión como propietario para guardar.");return;}
 const key=$("spaceItemKey").value,item=items[key],existing=rows.find(r=>r.item_key===key);
 const button=$("saveSpaceItem");button.disabled=true;msg("Guardando tarjeta...");
 let nextPath=currentImage,uploadedPath=null;
 try{
  const file=$("spaceItemImage").files?.[0];
  if(file){
   const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
   const path="site-space-cards/"+key+"/"+Date.now()+"."+ext;
   const upload=await db.storage.from("mubira-products").upload(path,file,{contentType:file.type,upsert:false});
   if(upload.error)throw upload.error;uploadedPath=upload.data.path;nextPath=uploadedPath;
  }else if($("removeSpaceItemImage").checked)nextPath=null;
  const payload={section_key:"espacios",item_key:key,eyebrow:$("spaceItemEyebrow").value.trim(),title:$("spaceItemTitle").value.trim()||item.title,description:$("spaceItemDescription").value.trim(),image_path:nextPath,sort_order:item.sort_order,updated_at:new Date().toISOString(),updated_by:session.user.id};
  const saved=await db.from("site_section_items").upsert(payload,{onConflict:"section_key,item_key"});
  if(saved.error)throw saved.error;
  if(existing?.image_path&&existing.image_path!==nextPath)await db.storage.from("mubira-products").remove([existing.image_path]);
  rows=rows.filter(r=>r.item_key!==key);rows.push(payload);currentImage=nextPath;
  $("spaceItemImage").value="";$("removeSpaceItemImage").checked=false;preview(currentImage);
  msg("¡Tarjeta actualizada! Actualiza la tienda para ver la nueva fotografía y los textos.");
 }catch(error){
  if(uploadedPath)await db.storage.from("mubira-products").remove([uploadedPath]);
  msg("No se pudo guardar: "+error.message);
 }finally{button.disabled=false;}
});
async function init(){
 const {data:{session:s}}=await db.auth.getSession();session=s;
 if(!s?.user){msg("Inicia sesión primero con la cuenta propietaria de MUBIRA.");return;}
 const {data,error}=await db.from("admin_profiles").select("role").eq("user_id",s.user.id).maybeSingle();
 if(error||data?.role!=="owner"){msg("Esta cuenta no tiene permisos de propietario.");return;}
 await loadRows();
}
db.auth.onAuthStateChange((_event,s)=>{session=s;if(s?.user)loadRows();});
init();
