import {createClient} from "https://esm.sh/@supabase/supabase-js@2.119.2";
const db=createClient("https://ncfjussqankxpmcrhhij.supabase.co","sb_publishable_01DxOQWRyBJAdrUeXh7_gQ_j_qlTvtz");
const $=id=>document.getElementById(id);
const screens=[["inicio","Inicio"],["espacios","Espacios"],["coleccion","Colección"],["nuestro_mundo","Nuestro mundo"]];
let themes=[],current=null,screenImages={};
const msg=t=>{$("themeStudioMessage").textContent=t};
const slug=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48);
function baseSettings(){return {global:{primary:"#c934a6",secondary:"#8e78d7",background:"#f7f3fa",surface:"#ffffff",text:"#30263a",buttonStyle:"gradient",font:"Manrope"},screens:{}}}
function fill(row){
 current=row;const s=row.settings||baseSettings(),g=s.global||{};
 $("themeName").value=row.name||"";$("themeDescription").value=row.description||"";
 for(const k of ["primary","secondary","background","surface","text"])$( "theme"+k[0].toUpperCase()+k.slice(1)).value=g[k]||baseSettings().global[k];
 $("themeButtonStyle").value=g.buttonStyle||"gradient";$("themeFont").value=g.font||"Manrope";
 const active=row.is_active;$("themeActiveState").textContent=active?"AMBIENTE PUBLICADO":"BORRADOR";
 $("themeActivate").disabled=active;$("themeSave").disabled=false;
 const key=$("themeScreen").value;const p=s.screens?.[key]||{};
 $("themeScreenOverlay").value=p.overlay??"25";$("themeScreenPosition").value=p.position||"center";
 $("themeScreenImagePreview").innerHTML=p.image_path?'<small>Imagen guardada en este ambiente.</small>':'<small>Sin imagen propia para esta pantalla.</small>';
}
async function loadThemes(){
 const {data,error}=await db.from("site_themes").select("*").order("created_at",{ascending:false});
 if(error){msg("No se pudieron cargar los ambientes: "+error.message);return}
 themes=data||[];const sel=$("themeSelect");sel.innerHTML="";
 themes.forEach(t=>{const o=document.createElement("option");o.value=t.id;o.textContent=(t.is_active?"● ":"")+t.name;sel.append(o)});
 if(!themes.length){msg("Crea tu primer ambiente visual.");return}
 const chosen=themes.find(t=>t.is_active)||themes[0];sel.value=chosen.id;fill(chosen);msg("Ambientes cargados. Puedes editar un borrador o crear uno nuevo.");
}
function collect(){
 const settings=structuredClone(current?.settings||baseSettings());settings.global={...(settings.global||{}),primary:$("themePrimary").value,secondary:$("themeSecondary").value,background:$("themeBackground").value,surface:$("themeSurface").value,text:$("themeText").value,buttonStyle:$("themeButtonStyle").value,font:$("themeFont").value};
 settings.screens=settings.screens||{};
 return settings;
}
$("themeSelect").addEventListener("change",()=>{const t=themes.find(x=>x.id===$("themeSelect").value);if(t)fill(t)});
$("themeNew").addEventListener("click",()=>{
 const name=prompt("Nombre del nuevo ambiente (ej. Navidad elegante):");if(!name?.trim())return;
 const settings=collect();current={id:null,theme_key:"",name:name.trim().slice(0,80),description:"Nuevo ambiente visual",settings,is_active:false};
 $("themeName").value=current.name;$("themeDescription").value=current.description;$("themeActiveState").textContent="NUEVO BORRADOR";$("themeActivate").disabled=true;msg("Nuevo ambiente preparado. Guarda para crearlo.");
});
$("themeScreen").addEventListener("change",()=>{if(current)fill(current)});
$("themeScreenImage").addEventListener("change",()=>{
 const f=$("themeScreenImage").files?.[0];if(!f)return;
 if(!f.type.startsWith("image/")){msg("Selecciona una imagen.");return}
 const url=URL.createObjectURL(f);$("themeScreenImagePreview").innerHTML='<img alt="Vista previa de la pantalla" src="'+url+'"><small>Vista previa local. Guarda el ambiente para subirla.</small>';
});
$("themeSave").addEventListener("click",async()=>{
 if(!current){msg("Selecciona o crea un ambiente primero.");return}
 const user=(await db.auth.getUser()).data.user;if(!user){msg("Inicia sesión nuevamente.");return}
 const button=$("themeSave");button.disabled=true;msg("Guardando ambiente...");
 try{
  const settings=collect(),key=$("themeScreen").value,file=$("themeScreenImage").files?.[0];
  if(file){
   if(file.size>8*1024*1024)throw new Error("La imagen debe pesar máximo 8 MB. Usa una imagen WebP o JPG comprimida.");
   const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
   const themeKey=current.theme_key||slug($("themeName").value)+"-"+Date.now();
   const path="site-themes/"+themeKey+"/"+key+"-"+Date.now()+"."+ext;
   const {error:up}=await db.storage.from("mubira-products").upload(path,file,{upsert:false,contentType:file.type});if(up)throw up;
   settings.screens[key]={...(settings.screens[key]||{}),image_path:path,overlay:Number($("themeScreenOverlay").value),position:$("themeScreenPosition").value};
  }else{
   settings.screens[key]={...(settings.screens[key]||{}),overlay:Number($("themeScreenOverlay").value),position:$("themeScreenPosition").value};
  }
  const name=$("themeName").value.trim();if(name.length<2)throw new Error("Escribe un nombre de al menos 2 caracteres.");
  const theme_key=current.theme_key||slug(name)+"-"+Date.now();
  const payload={theme_key,name,description:$("themeDescription").value.trim(),settings,updated_by:user.id};
  let result;
  if(current.id)result=await db.from("site_themes").update(payload).eq("id",current.id).select().single();
  else result=await db.from("site_themes").insert({...payload,created_by:user.id,is_active:false}).select().single();
  if(result.error)throw result.error;
  current=result.data;$("themeScreenImage").value="";await loadThemes();$("themeSelect").value=current.id;fill(current);msg("Ambiente guardado como borrador. Publícalo cuando quieras mostrarlo en la tienda.");
 }catch(e){msg("No se pudo guardar: "+e.message)}
 finally{button.disabled=false}
});
$("themeActivate").addEventListener("click",async()=>{
 if(!current?.id){msg("Guarda primero este ambiente.");return}
 if(!confirm("¿Publicar este ambiente para todos los visitantes de MUBIRA?"))return;
 const b=$("themeActivate");b.disabled=true;msg("Publicando ambiente...");
 try{
  const {error:off}=await db.from("site_themes").update({is_active:false}).eq("is_active",true);if(off)throw off;
  const {error:on}=await db.from("site_themes").update({is_active:true,updated_by:(await db.auth.getUser()).data.user.id}).eq("id",current.id);if(on)throw on;
  await loadThemes();msg("Ambiente publicado. La tienda lo reflejará automáticamente.");
 }catch(e){msg("No se pudo publicar: "+e.message);b.disabled=false}
});
$("themeRefresh").addEventListener("click",loadThemes);
const {data:{session}}=await db.auth.getSession();if(session?.user)loadThemes();
db.auth.onAuthStateChange((_e,s)=>{if(s?.user)loadThemes()});
