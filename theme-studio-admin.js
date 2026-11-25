import {createClient} from "https://esm.sh/@supabase/supabase-js@2.119.2";
const db=createClient("https://ncfjussqankxpmcrhhij.supabase.co","sb_publishable_01DxOQWRyBJAdrUeXh7_gQ_j_qlTvtz");
const $=id=>document.getElementById(id);
const screens=[["inicio","Inicio"],["espacios","Espacios"],["coleccion","Colección"],["nuestro_mundo","Nuestro mundo"]];
let themes=[],current=null;
const msg=t=>{$("themeStudioMessage").textContent=t};
const slug=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48);
const baseSettings=()=>({global:{primary:"#c934a6",secondary:"#8e78d7",background:"#f7f3fa",surface:"#ffffff",text:"#30263a",buttonStyle:"gradient",font:"Manrope"},screens:{}});
const publicImage=path=>path?db.storage.from("mubira-products").getPublicUrl(path).data.publicUrl:"";
function fill(row){
 current=row;const s=row.settings||baseSettings(),g=s.global||{};
 $("themeName").value=row.name||"";$("themeDescription").value=row.description||"";
 for(const k of ["primary","secondary","background","surface","text"])$("theme"+k[0].toUpperCase()+k.slice(1)).value=g[k]||baseSettings().global[k];
 $("themeButtonStyle").value=g.buttonStyle||"gradient";$("themeFont").value=g.font||"Manrope";
 $("themeActiveState").textContent=row.is_active?"AMBIENTE APLICADO EN LA TIENDA":(row.theme_key==="mubira-base"?"MUBIRA ORIGINAL":"BORRADOR GUARDADO");
 $("themeActivate").disabled=!!row.is_active;$("themeDelete").disabled=row.theme_key==="mubira-base";
 $("themeSave").disabled=row.theme_key==="mubira-base";
 if(row.theme_key==="mubira-base")msg("MUBIRA Original es la copia de seguridad: puedes aplicarla, pero no editarla ni eliminarla.");
 const key=$("themeScreen").value,p=s.screens?.[key]||{};
 $("themeScreenOverlay").value=p.overlay??"25";$("themeScreenPosition").value=p.position||"center";
 const url=publicImage(p.image_path);
 $("themeScreenImagePreview").innerHTML=url?'<img alt="Portada guardada" src="'+url+'"><small>Imagen guardada para '+screens.find(x=>x[0]===key)?.[1]+'.</small>':'<small>Esta pantalla todavía no tiene una imagen propia.</small>';
}
function renderLibrary(){
 const host=$("themeLibrary");if(!host)return;host.innerHTML="";
 if(!themes.length){host.textContent="Todavía no hay ambientes guardados.";return}
 themes.forEach(t=>{
  const card=document.createElement("article");card.className="theme-library-card"+(t.is_active?" is-active":"");
  const title=document.createElement("strong");title.textContent=t.name+(t.theme_key==="mubira-base"?" · ORIGINAL":"");
  const state=document.createElement("small");state.textContent=t.is_active?"Aplicado a la tienda":"Guardado · No publicado";
  const actions=document.createElement("div");actions.className="theme-library-actions";
  const edit=document.createElement("button");edit.type="button";edit.className="secondary";edit.textContent="Abrir / editar";edit.addEventListener("click",()=>{ $("themeSelect").value=t.id;fill(t);msg("Ambiente seleccionado: "+t.name);});
  const apply=document.createElement("button");apply.type="button";apply.className="primary";apply.textContent=t.is_active?"Ya aplicado":"Aplicar en tienda";apply.disabled=!!t.is_active;apply.addEventListener("click",()=>activateTheme(t));
  const del=document.createElement("button");del.type="button";del.className="secondary";del.textContent=t.is_active?"Restaurar Original y eliminar":"Eliminar";del.disabled=t.theme_key==="mubira-base";del.addEventListener("click",()=>deleteTheme(t));
  actions.append(edit,apply,del);card.append(title,state,actions);host.append(card);
 });
}
async function loadThemes(){
 const {data,error}=await db.from("site_themes").select("*").order("created_at",{ascending:true});
 if(error){msg("No se pudieron cargar los ambientes: "+error.message);return}
 themes=data||[];
 const original=themes.find(t=>t.theme_key==="mubira-base");
 if(!original){msg("Atención: no aparece MUBIRA Original. No publiques cambios hasta restaurarlo.");}
 const sel=$("themeSelect");sel.innerHTML="";
 themes.forEach(t=>{const o=document.createElement("option");o.value=t.id;o.textContent=(t.is_active?"● ":"")+t.name;sel.append(o)});
 renderLibrary();
 const chosen=themes.find(t=>t.is_active)||original||themes[0];
 if(chosen){sel.value=chosen.id;fill(chosen);}
 if(original)msg("Biblioteca lista. MUBIRA Original está protegido y no se puede eliminar.");
}
function collect(){
 const settings=structuredClone(current?.settings||baseSettings());
 settings.global={...(settings.global||{}),primary:$("themePrimary").value,secondary:$("themeSecondary").value,background:$("themeBackground").value,surface:$("themeSurface").value,text:$("themeText").value,buttonStyle:$("themeButtonStyle").value,font:$("themeFont").value};
 settings.screens=settings.screens||{};return settings;
}
$("themeSelect").addEventListener("change",()=>{const t=themes.find(x=>x.id===$("themeSelect").value);if(t)fill(t)});
$("themeNew").addEventListener("click",()=>{
 const name=prompt("Nombre del nuevo ambiente (ej. Navidad elegante):");if(!name?.trim())return;
 current={id:null,theme_key:"",name:name.trim().slice(0,80),description:"Nuevo ambiente visual",settings:collect(),is_active:false};
 $("themeName").value=current.name;$("themeDescription").value=current.description;$("themeActiveState").textContent="NUEVO AMBIENTE · AÚN NO GUARDADO";$("themeSave").disabled=false;$("themeActivate").disabled=true;$("themeDelete").disabled=true;
 $("themeScreenImage").value="";$("themeScreenImagePreview").innerHTML="<small>Elige una imagen para esta pantalla o guarda el ambiente primero.</small>";
 msg("Ahora pulsa Guardar ambiente para que aparezca en tu biblioteca.");
});
$("themeScreen").addEventListener("change",()=>{if(current)fill(current)});
$("themePickImage").addEventListener("click",()=>{$("themeScreenImage").click()});
$("themeScreenImage").addEventListener("change",()=>{
 const f=$("themeScreenImage").files?.[0];if(!f)return;
 if(!f.type.startsWith("image/")){msg("El archivo elegido no es una imagen. Usa JPG, PNG o WebP.");$("themeScreenImage").value="";return}
 if(f.size>8*1024*1024){msg("La imagen supera 8 MB. Elige una más liviana.");$("themeScreenImage").value="";return}
 const url=URL.createObjectURL(f);$("themeScreenImagePreview").innerHTML='<img alt="Vista previa de la imagen elegida" src="'+url+'"><small>'+f.name+' · '+(f.size/1024/1024).toFixed(2)+' MB · Pendiente de guardar.</small>';
 msg("Imagen seleccionada correctamente. Ahora guarda el ambiente.");
});
$("themeSave").addEventListener("click",async()=>{
 if(!current){msg("Primero selecciona o crea un ambiente.");return}
 const {data:{user}}=await db.auth.getUser();if(!user){msg("Tu sesión terminó. Vuelve a entrar con Google.");return}
 const button=$("themeSave");button.disabled=true;msg("Guardando ambiente e imagen...");
 let uploadedPath=null;
 try{
  const name=$("themeName").value.trim();if(name.length<2)throw new Error("Escribe un nombre de al menos 2 caracteres.");
  const duplicate=themes.find(t=>t.id!==current.id&&t.name.trim().toLocaleLowerCase("es-CO")===name.toLocaleLowerCase("es-CO"));
  if(duplicate)throw new Error("Ese nombre ya está ocupado por «"+duplicate.name+"». Elige otro nombre para no duplicar ambientes.");
  const themeKey=current.theme_key||slug(name)+"-"+Date.now();
  const settings=collect(),screenKey=$("themeScreen").value,file=$("themeScreenImage").files?.[0];
  if(file){
   const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
   uploadedPath="site-themes/"+themeKey+"/"+screenKey+"-"+Date.now()+"."+ext;
   const {error:up}=await db.storage.from("mubira-products").upload(uploadedPath,file,{upsert:false,contentType:file.type});if(up)throw up;
   settings.screens[screenKey]={...(settings.screens[screenKey]||{}),image_path:uploadedPath,overlay:Number($("themeScreenOverlay").value),position:$("themeScreenPosition").value};
  }else settings.screens[screenKey]={...(settings.screens[screenKey]||{}),overlay:Number($("themeScreenOverlay").value),position:$("themeScreenPosition").value};
  const payload={theme_key:themeKey,name,description:$("themeDescription").value.trim(),settings,updated_by:user.id};
  const result=current.id?await db.from("site_themes").update(payload).eq("id",current.id).select().single():await db.from("site_themes").insert({...payload,created_by:user.id,is_active:false}).select().single();
  if(result.error)throw result.error;
  current=result.data;$("themeScreenImage").value="";await loadThemes();$("themeSelect").value=current.id;fill(current);msg("Guardado correctamente. Ya aparece en tu biblioteca como borrador; todavía no cambia la tienda.");
 }catch(e){
  if(uploadedPath)await db.storage.from("mubira-products").remove([uploadedPath]);
  msg("No se pudo guardar: "+(e.message||"Error desconocido"));
 }finally{button.disabled=false}
});
async function activateTheme(t){
 if(!t?.id)return;
 const name=t.name;
 if(!confirm("Vas a aplicar «"+name+"» en la tienda pública para todos los clientes. ¿Continuar?"))return;
 const button=$("themeActivate");
 button.disabled=true;msg("Aplicando ambiente de forma segura...");
 try{
  const {error}=await db.rpc("apply_site_theme",{p_theme_id:t.id});
  if(error)throw error;
  await loadThemes();const applied=themes.find(x=>x.id===t.id);if(applied){$("themeSelect").value=applied.id;fill(applied)}
  msg("«"+name+"» quedó aplicado. La tienda pública lo carga automáticamente.");
 }catch(e){msg("No se pudo aplicar: "+(e.message||"Error desconocido"));await loadThemes()}
 finally{button.disabled=!!current?.is_active}
}
async function deleteTheme(t){
 if(!t||t.theme_key==="mubira-base"){msg("MUBIRA Original está protegido y no se puede eliminar.");return}
 const original=themes.find(x=>x.theme_key==="mubira-base");
 if(!original){msg("No aparece MUBIRA Original. Por seguridad no se puede eliminar ningún ambiente.");return}
 const active=!!t.is_active;
 const promptText=active
  ?"«"+t.name+"» está aplicado en la tienda. Para eliminarlo primero se restaurará MUBIRA Original y después se borrará este ambiente y sus imágenes. ¿Continuar?"
  :"¿Eliminar definitivamente «"+t.name+"» y sus imágenes? Esta acción no se puede deshacer.";
 if(!confirm(promptText))return;
 const button=$("themeDelete");button.disabled=true;msg(active?"Restaurando MUBIRA Original antes de eliminar...":"Eliminando «"+t.name+"»...");
 try{
  if(active){
   const {error:applyError}=await db.rpc("apply_site_theme",{p_theme_id:original.id});
   if(applyError)throw applyError;
   await loadThemes();
   t=themes.find(x=>x.id===t.id);
   if(!t)throw new Error("El ambiente ya no aparece en la biblioteca. Actualiza para verificar.");
  }
  const {data:paths,error}=await db.rpc("delete_site_theme",{p_theme_id:t.id});
  if(error)throw error;
  let storageWarning="";
  if(Array.isArray(paths)&&paths.length){
   const {error:storageError}=await db.storage.from("mubira-products").remove(paths);
   if(storageError)storageWarning=" El registro se eliminó, pero no se pudieron borrar todas las imágenes: "+storageError.message;
  }
  if(current?.id===t.id)current=null;
  await loadThemes();msg("«"+t.name+"» fue eliminado de la biblioteca."+storageWarning);
 }catch(e){msg("No se pudo eliminar «"+t.name+"»: "+(e.message||"Error desconocido"))}
 finally{button.disabled=current?.theme_key==="mubira-base"}
}
$("themeActivate").addEventListener("click",()=>activateTheme(current));
$("themeDelete").addEventListener("click",()=>current&&deleteTheme(current));
$("themeRefresh").addEventListener("click",loadThemes);
const {data:{session}}=await db.auth.getSession();if(session?.user)loadThemes();
db.auth.onAuthStateChange((_e,s)=>{if(s?.user)loadThemes()});
