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
      if(row.image_path){
        const image=db.storage.from("mubira-products").getPublicUrl(row.image_path).data.publicUrl;
        const host=document.querySelector(t.image);
        if(host){
          host.classList.add("has-editor-image");
          host.style.backgroundImage="linear-gradient(90deg,rgba(20,16,28,.18),rgba(20,16,28,.04)),url('"+image.replace(/'/g,"%27")+"')";
          host.style.backgroundSize="cover";
          host.style.backgroundPosition="center";
        }
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
loadEditableSections();
