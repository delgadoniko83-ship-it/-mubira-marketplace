import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.2";
const catalogClient=createClient("https://ncfjussqankxpmcrhhij.supabase.co","sb_publishable_01DxOQWRyBJAdrUeXh7_gQ_j_qlTvtz");
let products=[
{id:1,name:"Sofá Nórdico",category:"Salas",detail:"Tapizado de muestra · 3 puestos",price:1890000,icon:"🛋️",tag:"DESTACADO",tone:"#ded8cb",video:""},
{id:2,name:"Mesa Roble",category:"Comedores",detail:"Madera de muestra · 4 puestos",price:980000,icon:"🪵",tag:"DISEÑO",tone:"#e5d6c3",video:""},
{id:3,name:"Silla Serena",category:"Comedores",detail:"Diseño contemporáneo",price:420000,icon:"🪑",tag:"NOVEDAD",tone:"#d8ddd5",video:""},
{id:4,name:"Lámpara Aura",category:"Decoración",detail:"Iluminación decorativa",price:265000,icon:"💡",tag:"DETALLE",tone:"#e8dfd1",video:""},
{id:5,name:"Cama Nativa",category:"Habitaciones",detail:"Base y cabecero de muestra",price:2150000,icon:"🛏️",tag:"CONFORT",tone:"#d9d9d0",video:""},
{id:6,name:"Poltrona Alba",category:"Salas",detail:"Sillón auxiliar de muestra",price:790000,icon:"🪑",tag:"SELECCIÓN",tone:"#e5d9cf",video:""},
{id:7,name:"Florero Tierra",category:"Decoración",detail:"Accesorio decorativo",price:95000,icon:"🏺",tag:"DETALLE",tone:"#ded5c8",video:""},
{id:8,name:"Escritorio Línea",category:"Habitaciones",detail:"Espacio de trabajo",price:1150000,icon:"🪵",tag:"FUNCIONAL",tone:"#d8d4c9",video:""}
];
let cart=[],activePage=0,catalogIsLive=false,activePromotion=null;
const money=n=>new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
const grid=document.getElementById("productGrid"),deck=document.getElementById("pageDeck");
const pages=[...document.querySelectorAll(".page-panel")],dots=[...document.querySelectorAll("#pageDots button")];
function safeText(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));}
function renderProducts(list=products){grid.innerHTML=list.length?list.map(p=>`<article class="product-card"><button type="button" class="product-open" data-open-product="${safeText(p.id)}" aria-label="Ver detalles de ${safeText(p.name)}"><div class="product-art" style="background:${p.tone}"><span class="product-tag">${safeText(p.tag)}</span>${p.image_url?`<img class="product-photo" src="${safeText(p.image_url)}" alt="${safeText(p.name)}" loading="lazy">`:`<span class="shape" aria-hidden="true">${safeText(p.icon)}</span>`}</div><span class="product-open-label">VER PRODUCTO ↗</span></button><div class="product-info"><h3>${safeText(p.name)}</h3><p>${safeText(p.detail)}</p><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add-button" data-add="${safeText(p.id)}">Agregar +</button></div></div></article>`).join(""):'<p class="no-results">No encontramos productos con esa búsqueda.</p>'}
async function loadLiveCatalog(){try{const {data,error}=await catalogClient.from("products").select("id,name,short_description,price,is_featured,categories(name),product_media(media_type,storage_path,is_primary,sort_order)").eq("status","published").order("created_at",{ascending:false});if(error)throw error;if(!data?.length)return;catalogIsLive=true;products=data.map(p=>{const media=p.product_media||[];const photo=media.find(m=>m.media_type==="image"&&m.is_primary)||media.find(m=>m.media_type==="image");const clip=media.find(m=>m.media_type==="video");const url=path=>path?catalogClient.storage.from("mubira-products").getPublicUrl(path).data.publicUrl:"";return{id:p.id,name:p.name,category:p.categories?.name||"Muebles",detail:p.short_description||"Mueble de MUBIRA",price:Number(p.price)||0,icon:"🛋️",tag:p.is_featured?"DESTACADO":"MUBIRA",tone:"#e6dce8",image_url:url(photo?.storage_path),video:url(clip?.storage_path)};});}catch(error){console.warn("Catálogo de MUBIRA: se mantienen los productos de muestra.",error.message);}}

const visualBuilderPublicPages=["inicio","espacios","coleccion","estudio"];
const visualBuilderOriginalNames={inicio:"Inicio",espacios:"Espacios",coleccion:"Colección",estudio:"Nuestro mundo"};
const visualBuilderOriginalDots=new Map(["inicio","espacios","coleccion","estudio"].map((id,i)=>[id,dots[i]]));
const visualBuilderDynamicIds=new Set();
function visualBuilderPublicUrl(path){return path?catalogClient.storage.from("mubira-products").getPublicUrl(path).data.publicUrl:"";}
function visualBuilderPublicText(value){return String(value??"");}
function visualBuilderValidPageId(id){return typeof id==="string"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)&&!visualBuilderPublicPages.includes(id)&&id.length<=48&&(!document.getElementById(id)||document.getElementById(id).classList.contains("page-panel"));}
function createVisualBuilderPublicPage(page){
 const section=document.createElement("section");
 section.id=page.id;section.className="page-panel mubira-dynamic-page";section.dataset.page=String(pages.length);
 const heading=document.createElement("h2");heading.className="mubira-dynamic-page-title";heading.textContent=visualBuilderPublicText(page.name||"MUBIRA");
 section.append(heading);deck.append(section);
 const dot=document.createElement("button");dot.type="button";dot.setAttribute("aria-label","Ir a "+heading.textContent);
 dot.addEventListener("click",()=>goToPage(Number(dot.dataset.pageIndex)));
 document.getElementById("pageDots").append(dot);
 const nav=document.createElement("a");nav.href="#"+page.id;nav.textContent=heading.textContent;nav.dataset.pageLink="";nav.dataset.mubiraDynamicNav=page.id;
 nav.addEventListener("click",e=>{e.preventDefault();goToPage(Number(nav.dataset.pageLink));document.querySelector(".main-nav").classList.remove("open");});
 document.querySelector(".main-nav").append(nav);
 visualBuilderDynamicIds.add(page.id);
 return {section,dot,nav};
}
function applyVisualBuilderPageOrder(pageList){
 const requested=Array.isArray(pageList)?pageList:[];
 const entries=[],seen=new Set();
 for(const page of requested){
  if(!page||typeof page.id!=="string"||seen.has(page.id))continue;
  if(visualBuilderPublicPages.includes(page.id)){entries.push({id:page.id,name:visualBuilderOriginalNames[page.id]});seen.add(page.id);continue;}
  if(!visualBuilderValidPageId(page.id))continue;
  entries.push({id:page.id,name:visualBuilderPublicText(page.name||"Nueva pantalla").slice(0,48)});seen.add(page.id);
 }
 for(const id of visualBuilderPublicPages)if(!seen.has(id))entries.push({id,name:visualBuilderOriginalNames[id]});
 for(const id of [...visualBuilderDynamicIds]){
  if(!entries.some(page=>page.id===id)){
   document.getElementById(id)?.remove();
   document.querySelector('[data-mubira-dynamic-nav="'+id+'"]')?.remove();
   visualBuilderDynamicIds.delete(id);
  }
 }
 const byId=new Map(pages.filter(section=>visualBuilderPublicPages.includes(section.id)).map(section=>[section.id,section]));
 const dotById=new Map(visualBuilderOriginalDots);
 const navById=new Map([...document.querySelectorAll(".main-nav a")].filter(link=>visualBuilderPublicPages.includes((link.getAttribute("href")||"").slice(1))).map(link=>[(link.getAttribute("href")||"").slice(1),link]));
 for(const page of entries){
  if(!byId.has(page.id)){
   const created=createVisualBuilderPublicPage(page);byId.set(page.id,created.section);dotById.set(page.id,created.dot);navById.set(page.id,created.nav);
  }
  const nav=navById.get(page.id),dot=dotById.get(page.id);
  if(nav&& !visualBuilderPublicPages.includes(page.id))nav.textContent=page.name;
  if(dot)dot.setAttribute("aria-label","Ir a "+page.name);
 }
 const ordered=entries.map(page=>byId.get(page.id)).filter(Boolean);
 const orderedDots=entries.map(page=>dotById.get(page.id)).filter(Boolean);
 ordered.forEach((section,i)=>{section.dataset.page=String(i);deck.append(section);});
 orderedDots.forEach((dot,i)=>{dot.dataset.pageIndex=String(i);document.getElementById("pageDots").append(dot);});
 pages.splice(0,pages.length,...ordered);dots.splice(0,dots.length,...orderedDots);
 entries.forEach((page,i)=>{const nav=navById.get(page.id);if(nav)nav.dataset.pageLink=String(i);});
 document.querySelectorAll("[data-go]").forEach(link=>{const id=(link.getAttribute("href")||"").slice(1);const index=pages.findIndex(section=>section.id===id);if(index>=0)link.dataset.go=String(index);});
 deck.scrollLeft=0;activePage=0;updateNavigation();
}
function renderVisualBuilderPublic(settings){
 const builder=settings?.visual_builder;
 if(!builder||!builder.pages||typeof builder.pages!=="object")return;
 for(const [pageId,sectionItems] of Object.entries(builder.pages)){
  if(!visualBuilderPublicPages.includes(pageId)&&!visualBuilderDynamicIds.has(pageId))continue;
  const section=document.getElementById(pageId);if(!section)continue;
  const meta=builder.page_meta?.[pageId]||{};
  const list=Array.isArray(sectionItems)?sectionItems:[];
  section.querySelectorAll(".mubira-visual-public-layer,.mubira-visual-public-background").forEach(node=>node.remove());
  if(meta.background_type==="video"&&meta.background_path){
   const video=document.createElement("video");video.className="mubira-visual-public-background";video.muted=true;video.autoplay=true;video.loop=true;video.playsInline=true;video.preload="metadata";video.src=visualBuilderPublicUrl(meta.background_path);video.setAttribute("aria-label","Video ambiental de MUBIRA");section.prepend(video);
  }
  if(meta.background_type==="color"&&meta.background_color)section.style.background=meta.background_color;
  if(!list.length)continue;
  const layer=document.createElement("div");layer.className="mubira-visual-public-layer";layer.setAttribute("aria-label","Diseño visual MUBIRA");
  for(const item of list){
   if(!item||item.hidden||!["image","text","button","panel"].includes(item.type))continue;
   const el=document.createElement("div");el.className="mubira-visual-public-element mubira-visual-"+item.type;
   Object.assign(el.style,{left:Math.max(0,Math.min(100,Number(item.left)||0))+"%",top:Math.max(0,Math.min(100,Number(item.top)||0))+"%",width:Math.max(8,Math.min(100,Number(item.width)||80))+"%",height:Math.max(30,Math.min(600,Number(item.height)||90))+"px",color:item.color||"#30263a",fontSize:Math.max(10,Math.min(64,Number(item.font)||24))+"px"});
   if(item.type==="image"&&item.path){const img=document.createElement("img");img.src=visualBuilderPublicUrl(item.path);img.alt="Imagen de MUBIRA";img.loading="lazy";el.append(img);}
   else{const label=visualBuilderPublicText(item.text||(item.type==="panel"?"Nueva sección":item.type==="button"?"Explorar":"Tu título"));if(item.type==="panel"){el.textContent=label;el.style.background=item.background||"#ffffff";}else if(item.type==="button"){const destination=String(item.link||"").trim();let safeHref="";if(/^https:\/\//i.test(destination)){try{const parsed=new URL(destination);if(parsed.protocol==="https:")safeHref=parsed.href;}catch{}}else if(/^(mailto:|tel:)/i.test(destination)){safeHref=destination;}else if(/^#[a-z0-9-]+$/i.test(destination)&&document.getElementById(destination.slice(1))?.classList.contains("page-panel")){safeHref=destination;}if(safeHref){const anchor=document.createElement("a");anchor.className="mubira-visual-public-button";anchor.href=safeHref;anchor.textContent=label;if(/^https:\/\//i.test(safeHref)){anchor.target="_blank";anchor.rel="noopener noreferrer";}el.append(anchor);}else{el.textContent=label;el.setAttribute("aria-label",label);}}else{el.textContent=label;}}
   layer.append(el);
  }
  if(layer.childElementCount)section.append(layer);
 }
}
async function loadVisualBuilderPublic(){
 try{
  const {data,error}=await catalogClient.from("site_themes").select("settings").eq("is_active",true).maybeSingle();
  if(error)throw error;
  if(data?.settings){applyVisualBuilderPageOrder(data.settings.visual_builder?.page_list);renderVisualBuilderPublic(data.settings);}
 }catch(error){console.info("Diseño visual personalizado no disponible; se conserva la tienda base.",error?.message||error);}
}

function calculateCartTotals(){
 const subtotal=cart.reduce((sum,p)=>sum+Number(p.price)*p.qty,0);
 let discount=0,shipping=0;const benefits=[];
 if(activePromotion?.is_active){
  const type=activePromotion.incentive_type;
  const headline=String(activePromotion.headline||"Beneficio MUBIRA");
  const message=String(activePromotion.message||"");
  if(type==="percentage"){
   const percent=Math.max(0,Math.min(100,Number(activePromotion.incentive_value)||0));
   discount=Math.round(subtotal*percent/100);
   if(discount>0)benefits.push({type:"percentage",label:percent.toLocaleString("es-CO")+"% de descuento",description:message||headline,discount_amount:discount,shipping_amount:0});
  }else if(type==="free_shipping"){
   benefits.push({type:"free_shipping",label:"TRANSPORTE GRATIS",description:message||headline,discount_amount:0,shipping_amount:0});
  }else if(type==="special"){
   const gift=/regalo|obsequio/i.test(headline+" "+message);
   benefits.push({type:gift?"gift":"special",label:gift?"REGALO GRATIS":headline,description:message,discount_amount:0,shipping_amount:0});
  }
 }
 return {subtotal,discount,shipping,total:Math.max(0,subtotal-discount+shipping),benefits};
}
function renderCart(){
 const count=cart.reduce((n,p)=>n+p.qty,0),totals=calculateCartTotals();
 document.getElementById("cartCount").textContent=count;
 document.getElementById("cartSubtotal").textContent=money(totals.subtotal);
 document.getElementById("cartTotal").textContent=money(totals.total);
 const discountRow=document.getElementById("cartDiscountRow");discountRow.hidden=totals.discount<=0;
 document.getElementById("cartDiscount").textContent="− "+money(totals.discount);
 const shippingRow=document.getElementById("cartShippingRow");shippingRow.hidden=!totals.benefits.some(b=>b.type==="free_shipping");
 document.getElementById("cartShipping").textContent="GRATIS";
 const benefitsBox=document.getElementById("cartBenefits");
 benefitsBox.innerHTML=totals.benefits.length?totals.benefits.map(b=>`<article class="checkout-benefit ${b.type==="gift"?"gift":""}"><strong>${safeText(b.label)}</strong>${b.description?`<span>${safeText(b.description)}</span>`:""}${b.discount_amount?`<b class="benefit-saving">Ahorras ${money(b.discount_amount)}</b>`:""}</article>`).join(""):'<p class="checkout-no-benefit">Tus beneficios y promociones aplicables aparecerán aquí.</p>';
 const box=document.getElementById("cartItems");
 box.innerHTML=cart.length?cart.map(p=>`<div class="cart-row"><span>${safeText(p.name)} × ${p.qty}<br><b>${money(p.price*p.qty)}</b></span><button data-remove="${safeText(p.id)}">Quitar</button></div>`).join(""):'<p class="muted">Tu bolsa está vacía.</p>';
}
function openCart(){document.getElementById("cartPanel").classList.add("open");document.getElementById("cartPanel").setAttribute("aria-hidden","false");document.getElementById("scrim").classList.add("show")}
function closeCart(){document.getElementById("cartPanel").classList.remove("open");document.getElementById("cartPanel").setAttribute("aria-hidden","true");document.getElementById("scrim").classList.remove("show")}
function goToPage(index){activePage=Math.max(0,Math.min(pages.length-1,index));deck.scrollTo({left:activePage*deck.clientWidth,behavior:"smooth"});updateNavigation()}
function updateNavigation(){const index=Math.round(deck.scrollLeft/Math.max(deck.clientWidth,1));activePage=index;dots.forEach((dot,i)=>dot.classList.toggle("active",i===index));document.getElementById("prevPage").disabled=index===0;document.getElementById("nextPage").disabled=index===pages.length-1;document.querySelectorAll("[data-page-link]").forEach(a=>a.classList.toggle("active",Number(a.dataset.pageLink)===index));}
grid.addEventListener("click",e=>{const add=e.target.closest("[data-add]");if(add){const id=add.dataset.add,p=products.find(x=>String(x.id)===String(id)),found=cart.find(x=>String(x.id)===String(id));if(p){found?found.qty++:cart.push({...p,qty:1});renderCart();}return;}const opener=e.target.closest("[data-open-product]");if(opener){const p=products.find(x=>String(x.id)===String(opener.dataset.openProduct));if(p)openProductModal(p,opener);}});
const productModal=document.getElementById("productModal");
let modalProduct=null,lastProductFocus=null;
function closeProductModal(){if(productModal.hidden)return;const video=document.getElementById("productModalVideo");video.pause();video.removeAttribute("src");video.load();productModal.hidden=true;document.body.style.overflow="";if(lastProductFocus)lastProductFocus.focus();}
function openProductModal(product,trigger){modalProduct=product;lastProductFocus=trigger;const video=document.getElementById("productModalVideo"),art=document.getElementById("productModalArt"),note=document.getElementById("productModalVideoNote");document.getElementById("productModalTitle").textContent=product.name;document.getElementById("productModalDescription").textContent=product.detail;document.getElementById("productModalPrice").textContent=money(product.price);art.style.background=product.tone;art.innerHTML=product.image_url?'<img class="product-modal-photo" src="'+safeText(product.image_url)+'" alt="'+safeText(product.name)+'">' : '<span aria-hidden="true">'+safeText(product.icon)+'</span>';video.pause();video.removeAttribute("src");video.hidden=true;art.hidden=false;document.getElementById("productModalMedia").classList.remove("has-video");if(product.video){video.src=product.video;video.hidden=false;art.hidden=false;document.getElementById("productModalMedia").classList.add("has-video");note.hidden=true;video.play().catch(()=>{});}else{note.hidden=false;}productModal.hidden=false;document.body.style.overflow="hidden";document.querySelector(".product-modal-close").focus();}
productModal.addEventListener("click",e=>{if(e.target.closest("[data-close-product]"))closeProductModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!productModal.hidden)closeProductModal();});
document.getElementById("productModalAdd").addEventListener("click",()=>{if(!modalProduct)return;const found=cart.find(x=>x.id===modalProduct.id);found?found.qty++:cart.push({...modalProduct,qty:1});renderCart();closeProductModal();});


const checkoutForm=document.getElementById("checkoutForm");
async function loadActivePromotion(){try{const {data,error}=await catalogClient.from("promotion_settings").select("is_active,incentive_type,incentive_value,headline,message").eq("id",1).maybeSingle();if(!error)activePromotion=data?.is_active?data:null;}catch(error){console.warn("No se pudieron cargar beneficios MUBIRA:",error);}renderCart();}
loadActivePromotion();
const checkoutStatus=document.getElementById("checkoutStatus");
const whatsappLink=document.getElementById("orderWhatsAppLink");
checkoutForm.addEventListener("submit",async e=>{
 e.preventDefault();
 if(!cart.length){checkoutStatus.textContent="Agrega al menos un producto.";return;}
 if(!catalogIsLive){checkoutStatus.textContent="El catálogo todavía muestra productos de demostración. Publica tus productos propios antes de recibir pedidos.";return;}
 const submit=document.getElementById("checkoutSubmit");
 const formData=new FormData(checkoutForm);
 const items=cart.map(p=>({product_id:p.id,name:p.name,category:p.category,quantity:p.qty,unit_price:Number(p.price),line_total:Number(p.price)*p.qty}));
 const totals=calculateCartTotals();const total=totals.total;
 submit.disabled=true;submit.textContent="Guardando pedido…";checkoutStatus.textContent="Estamos registrando tu pedido en MUBIRA…";whatsappLink.hidden=true;
 try{
  const payload={customer_name:String(formData.get("customer_name")||"").trim(),customer_phone:String(formData.get("customer_phone")||"").trim(),customer_city:String(formData.get("customer_city")||"").trim(),customer_address:String(formData.get("customer_address")||"").trim(),customer_notes:String(formData.get("customer_notes")||"").trim()||null,items,subtotal:totals.subtotal,discount_amount:totals.discount,shipping_amount:totals.shipping,benefits:totals.benefits,total,payment_method:"cash_on_delivery",status:"new",source:"storefront"};
  const {data,error}=await catalogClient.from("orders").insert(payload).select("id,order_number").single();
  if(error)throw error;
  const lines=items.map(x=>x.quantity+" × "+x.name+" — "+money(x.line_total)).join("\n");
  const message=["Hola, MUBIRA. Acabo de registrar el pedido #"+data.order_number+".","Nombre: "+payload.customer_name,"Celular: "+payload.customer_phone,"Ciudad: "+payload.customer_city,"Dirección: "+payload.customer_address,"Productos:",lines,"Subtotal: "+money(totals.subtotal),totals.discount>0?"Descuento aplicado: -"+money(totals.discount):"",totals.benefits.some(b=>b.type==="free_shipping")?"TRANSPORTE GRATIS":"",...totals.benefits.filter(b=>b.type!=="free_shipping").map(b=>b.label+": "+b.description),"Total final a pagar al recibir: "+money(total),"Pago: contra entrega",payload.customer_notes?"Notas: "+payload.customer_notes:""].filter(Boolean).join("\n");
  whatsappLink.href="https://wa.me/?text="+encodeURIComponent(message);
  whatsappLink.hidden=false;
  checkoutStatus.textContent="¡Pedido #"+data.order_number+" guardado! Ya está en el administrador comercial de MUBIRA.";
  cart=[];renderCart();
  checkoutForm.reset();
 }catch(error){console.error("MUBIRA pedido:",error);checkoutStatus.textContent="No pudimos guardar el pedido. Revisa tu conexión e inténtalo de nuevo.";}
 finally{submit.disabled=false;submit.textContent="Confirmar pedido";}
});

document.getElementById("cartItems").addEventListener("click",e=>{const id=e.target.dataset.remove;if(id){cart=cart.filter(p=>String(p.id)!==String(id));renderCart();}});
document.getElementById("cartButton").addEventListener("click",openCart);document.getElementById("closeCart").addEventListener("click",closeCart);document.getElementById("scrim").addEventListener("click",closeCart);
document.getElementById("searchInput").addEventListener("input",e=>{const q=e.target.value.trim().toLocaleLowerCase("es");renderProducts(products.filter(p=>(p.name+" "+p.category+" "+p.detail).toLocaleLowerCase("es").includes(q)));if(q)goToPage(2);});
document.querySelectorAll("[data-category]").forEach(a=>a.addEventListener("click",()=>{renderProducts(products.filter(p=>p.category===a.dataset.category));goToPage(2);}));
document.querySelectorAll("[data-go]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();goToPage(Number(a.dataset.go));}));
document.querySelectorAll("[data-page-link]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();goToPage(Number(a.dataset.pageLink));document.querySelector(".main-nav").classList.remove("open");}));
document.querySelectorAll(".brand[href='#inicio'],.footer-brand").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();goToPage(0)}));
document.getElementById("prevPage").addEventListener("click",()=>goToPage(activePage-1));document.getElementById("nextPage").addEventListener("click",()=>goToPage(activePage+1));
dots.forEach((dot,i)=>dot.addEventListener("click",()=>goToPage(i)));
document.getElementById("menuToggle").addEventListener("click",()=>document.querySelector(".main-nav").classList.toggle("open"));
deck.addEventListener("scroll",()=>{window.requestAnimationFrame(updateNavigation)},{passive:true});
deck.addEventListener("wheel",e=>{if(Math.abs(e.deltaY)<Math.abs(e.deltaX)||Math.abs(e.deltaY)<18)return;const panel=pages[activePage],canScroll=panel.scrollHeight>panel.clientHeight+4,atTop=panel.scrollTop<=0,atBottom=panel.scrollTop+panel.clientHeight>=panel.scrollHeight-3;if(canScroll&&((e.deltaY>0&&!atBottom)||(e.deltaY<0&&!atTop)))return;e.preventDefault();goToPage(activePage+(e.deltaY>0?1:-1));},{passive:false});
document.addEventListener("keydown",e=>{if(["INPUT","TEXTAREA"].includes(document.activeElement.tagName))return;if(e.key==="ArrowRight"||e.key==="PageDown"){e.preventDefault();goToPage(activePage+1)}if(e.key==="ArrowLeft"||e.key==="PageUp"){e.preventDefault();goToPage(activePage-1)}if(e.key==="Escape")closeCart()});

const eraNames={past:"PAST / HERITAGE",present:"PRESENT / NOW",future:"FUTURE / LIVING"};
const eraColors={past:"#6b4935",present:"#527f94",future:"#17151f"};
document.querySelectorAll("[data-era-choice]").forEach(button=>button.addEventListener("click",()=>{
 const era=button.dataset.eraChoice;
 document.body.dataset.era=era;
 document.querySelectorAll("[data-era-choice]").forEach(item=>item.classList.toggle("selected",item===button));
 const stamp=document.querySelector(".era-stamp");if(stamp)stamp.textContent="MUBIRA / "+eraNames[era];
 const theme=document.querySelector('meta[name="theme-color"]');if(theme)theme.setAttribute("content",eraColors[era]);
}));

document.getElementById("year").textContent=new Date().getFullYear();loadLiveCatalog().then(()=>renderProducts());loadVisualBuilderPublic();renderProducts();renderCart();updateNavigation();