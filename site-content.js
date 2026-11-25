import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.2";
const db = createClient("https://ncfjussqankxpmcrhhij.supabase.co","sb_publishable_01DxOQWRyBJAdrUeXh7_gQ_j_qlTvtz");
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const targets = {
  inicio: { nav:0, eyebrow:".hero-copy .eyebrow", title:".hero-copy h1", description:".hero-copy .hero-text", button:".hero-copy [data-go='1']", image:".hero-visual" },
  espacios: { nav:1, eyebrow:".page-intro .eyebrow", title:".page-intro h2", description:".page-intro > p:not(.eyebrow)", button:".page-intro .section-edit-cta", image:".page-intro" },
  coleccion: { nav:2, eyebrow:".section-heading .eyebrow", title:".section-heading h2", description:".section-heading .muted", button:".collection-count", image:".section-heading" },
  nuestro_mundo: { nav:3, eyebrow:".studio-copy .eyebrow", title:".studio-copy h2", description:".studio-copy > p:not(.eyebrow)", button:".studio-copy .button", image:".studio-art" }
};
function setText(el, value, multiline=false) { if (!el || value == null) return; el.textContent=value; if(multiline) el.style.whiteSpace="pre-line"; }
async function loadEditableSections(){
  try {
    const {data,error}=await db.from("site_sections").select("*");
    if(error) throw error;
    for(const row of data||[]){
      const t=targets[row.section_key]; if(!t) continue;
      const nav=document.querySelectorAll("[data-page-link]")[t.nav];
      setText(nav,row.nav_label);
      setText(document.querySelector(t.eyebrow),row.eyebrow);
      setText(document.querySelector(t.title),row.title,true);
      setText(document.querySelector(t.description),row.description);
      const button=document.querySelector(t.button);
      if(button && row.button_text){
        if(button.classList.contains("collection-count")) setText(button,row.button_text);
        else if(row.section_key==="inicio") button.childNodes[0].nodeValue=row.button_text+" ";
        else if(row.section_key==="nuestro_mundo") button.childNodes[0].nodeValue=row.button_text+" ";
        else setText(button,row.button_text);
      }
      const host=document.querySelector(t.image);
      if(row.section_key==="inicio" && host){
        // La foto de portada es una capa independiente; el ambiente sigue como fondo del tema.
        let cover=host.querySelector(".hero-editor-cover");
        if(row.image_path){
          const image=db.storage.from("mubira-products").getPublicUrl(row.image_path).data.publicUrl;
          if(!cover){cover=document.createElement("img");cover.className="hero-editor-cover";cover.alt="Fotografía de portada MUBIRA";host.append(cover);}
          cover.alt="Portada principal de MUBIRA";
          cover.loading="eager";cover.decoding="async";
          cover.style.position="absolute";cover.style.display="block";cover.style.visibility="visible";cover.style.opacity="1";
          cover.src=image;
          const layout={x:50,y:50,size:48,angle:0,shape:"rectangle",fit:"cover",...(row.image_settings||{})};
          // La portada es la fotografía protagonista del panel visual, no una tarjeta flotante.
          host.classList.add("has-cover-image");
          // La posición x/y mueve el centro de la portada; size controla su ancho.
          // El ambiente permanece intacto detrás de esta capa independiente.
          cover.style.setProperty("--mubira-cover-x",Number(layout.x)+"%");
          cover.style.setProperty("--mubira-cover-y",Number(layout.y)+"%");
          cover.style.setProperty("--mubira-cover-size",Math.max(18,Math.min(90,Number(layout.size)))+"%");
          cover.style.setProperty("--mubira-cover-angle",Number(layout.angle)+"deg");
          cover.style.inset="auto";cover.style.left=Number(layout.x)+"%";cover.style.top=Number(layout.y)+"%";
          cover.style.right="auto";cover.style.bottom="auto";
          cover.style.zIndex="8";cover.style.width=Math.max(18,Math.min(90,Number(layout.size)))+"%";cover.style.height="auto";
          cover.style.maxWidth="none";cover.style.maxHeight="none";
          cover.style.transform="translate(-50%,-50%) rotate("+Number(layout.angle)+"deg)";
          cover.style.transformOrigin="center";cover.style.borderRadius=layout.shape==="circle"?"50%":layout.shape==="rounded"?"12px":"0";
          cover.style.objectFit=layout.fit==="contain"?"contain":"cover";
          cover.style.objectPosition="center";
          cover.onerror=()=>{console.warn("MUBIRA: no se pudo cargar la imagen de portada",row.image_path);cover.classList.add("cover-image-error");host.classList.remove("has-cover-image");};
          cover.onload=()=>cover.classList.remove("cover-image-error");
        }else if(cover){cover.remove();host.classList.remove("has-cover-image");}
      }else if(row.image_path && host){
        const image=db.storage.from("mubira-products").getPublicUrl(row.image_path).data.publicUrl;
        host.classList.add("has-editor-image");
        host.style.backgroundImage="linear-gradient(90deg,rgba(20,16,28,.18),rgba(20,16,28,.04)),url('"+image.replace(/'/g,"%27")+"')";
        host.style.backgroundSize="cover";host.style.backgroundPosition="center";
      }else if(host){
        host.classList.remove("has-editor-image");host.style.removeProperty("background-image");host.style.removeProperty("background-size");host.style.removeProperty("background-position");
      }
    }
    const spacesCta=document.querySelector(".page-intro .section-edit-cta");
    if(spacesCta) spacesCta.hidden=false;
  } catch(error) { console.warn("Contenido editable de MUBIRA:",error.message); }
}
const spacesIntro=document.querySelector(".page-intro");
if(spacesIntro && !spacesIntro.querySelector(".section-edit-cta")){
 const a=document.createElement("a");a.className="button button-light section-edit-cta";a.href="#coleccion";a.dataset.go="2";a.textContent="Ver espacios ↗";a.hidden=true;spacesIntro.append(a);
 a.addEventListener("click",e=>{e.preventDefault();document.getElementById("pageDeck")?.scrollTo({left:2*document.getElementById("pageDeck").clientWidth,behavior:"smooth"});});
}

const spaceCardTargets = {
  salas: ".category-card.cat-living",
  comedores: ".category-card.cat-dining",
  habitaciones: ".category-card.cat-bedroom",
  decoracion: ".category-card.cat-decor"
};
async function loadEditableSpaceCards(){
  try{
    const {data,error}=await db.from("site_section_items").select("*").eq("section_key","espacios").order("sort_order");
    if(error) throw error;
    for(const item of data||[]){
      const card=document.querySelector(spaceCardTargets[item.item_key]);
      if(!card) continue;
      const eyebrow=card.querySelector("span"),title=card.querySelector("strong"),description=card.querySelector("small");
      if(eyebrow) eyebrow.textContent=item.eyebrow||"";
      if(title) title.textContent=item.title||"";
      if(description) description.textContent=item.description||"";
      if(item.title) card.dataset.category=item.title;
      if(item.image_path){
        const url=db.storage.from("mubira-products").getPublicUrl(item.image_path).data.publicUrl;
        card.classList.add("has-editor-image");
        card.style.backgroundImage="linear-gradient(0deg,rgba(28,19,43,.76),rgba(28,19,43,.04) 78%),url('"+url.replace(/'/g,"%27")+"')";
        card.style.backgroundSize="cover";
        card.style.backgroundPosition="center";
      }else{card.classList.remove("has-editor-image");card.style.removeProperty("background-image");card.style.removeProperty("background-size");card.style.removeProperty("background-position");}
    }
  }catch(error){console.warn("Tarjetas editables de MUBIRA:",error.message);}
}
async function loadPublishedVisualTheme(){
  try{
    const {data,error}=await db.from("site_themes").select("theme_key,name,settings").eq("is_active",true).maybeSingle();
    if(error)throw error;
    if(!data)return;
    const settings=data.settings||{},g=settings.global||{},root=document.documentElement;
    const vars={primary:g.primary,secondary:g.secondary,background:g.background,surface:g.surface,text:g.text};
    Object.entries(vars).forEach(([key,value])=>{if(value)root.style.setProperty("--mubira-"+key,value)});
    const fonts={"Manrope":"'Manrope',sans-serif","DM Sans":"'DM Sans',sans-serif","serif":"'Playfair Display',serif"};
    root.style.setProperty("--mubira-font",fonts[g.font]||fonts.Manrope);
    document.body.dataset.mubiraButtonStyle=g.buttonStyle||"gradient";
    document.body.dataset.mubiraTheme=data.theme_key||"";
    const imageTargets={
      inicio:document.querySelector(".hero"),
      espacios:document.querySelector(".spaces-page"),
      coleccion:document.querySelector(".collection"),
      nuestro_mundo:document.querySelector(".studio-art")
    };
    for(const [key,host] of Object.entries(imageTargets)){
      if(!host)continue;
      const item=settings.screens?.[key]||{};
      if(key==="inicio"){
        // Ambiente y portada usan capas DOM distintas: nunca comparten el mismo fondo.
        let environment=host.querySelector(":scope > .hero-environment");
        if(!environment){environment=document.createElement("div");environment.className="hero-environment";environment.setAttribute("aria-hidden","true");host.prepend(environment);}
        if(item.image_path){
          const url=db.storage.from("mubira-products").getPublicUrl(item.image_path).data.publicUrl;
          const opacity=Math.max(0,Math.min(0.7,Number(item.overlay||0)/100));
          environment.style.backgroundImage="linear-gradient(rgba(22,16,30,"+opacity+"),rgba(22,16,30,"+opacity+")),url("+JSON.stringify(url)+")";
          environment.style.backgroundSize="cover";environment.style.backgroundPosition=item.position||"center";
          host.classList.add("mubira-theme-photo");
        }else{
          environment.style.removeProperty("background-image");environment.style.removeProperty("background-size");environment.style.removeProperty("background-position");
          host.classList.remove("mubira-theme-photo");
        }
      }else if(item.image_path){
        const url=db.storage.from("mubira-products").getPublicUrl(item.image_path).data.publicUrl;
        const opacity=Math.max(0,Math.min(0.7,Number(item.overlay||0)/100));
        host.style.backgroundImage="linear-gradient(rgba(22,16,30,"+opacity+"),rgba(22,16,30,"+opacity+")),url("+JSON.stringify(url)+")";
        host.style.backgroundSize="cover";host.style.backgroundPosition=item.position||"center";
        host.classList.add("mubira-theme-photo");
      }else{
        host.classList.remove("mubira-theme-photo");
        host.style.removeProperty("background-image");host.style.removeProperty("background-size");host.style.removeProperty("background-position");
      }
    }
  }catch(error){console.warn("Tema visual publicado de MUBIRA:",error.message);}
}
Promise.all([loadEditableSections(),loadEditableSpaceCards()]).then(loadPublishedVisualTheme);
setInterval(()=>{Promise.all([loadEditableSections(),loadEditableSpaceCards()]).then(loadPublishedVisualTheme);},12000);
