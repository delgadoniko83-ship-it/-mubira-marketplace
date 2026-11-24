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
let cart=[],activePage=0,catalogIsLive=false;
const money=n=>new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
const grid=document.getElementById("productGrid"),deck=document.getElementById("pageDeck");
const pages=[...document.querySelectorAll(".page-panel")],dots=[...document.querySelectorAll("#pageDots button")];
function safeText(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));}
function renderProducts(list=products){grid.innerHTML=list.length?list.map(p=>`<article class="product-card"><button type="button" class="product-open" data-open-product="${safeText(p.id)}" aria-label="Ver detalles de ${safeText(p.name)}"><div class="product-art" style="background:${p.tone}"><span class="product-tag">${safeText(p.tag)}</span>${p.image_url?`<img class="product-photo" src="${safeText(p.image_url)}" alt="${safeText(p.name)}" loading="lazy">`:`<span class="shape" aria-hidden="true">${safeText(p.icon)}</span>`}</div><span class="product-open-label">VER PRODUCTO ↗</span></button><div class="product-info"><h3>${safeText(p.name)}</h3><p>${safeText(p.detail)}</p><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add-button" data-add="${safeText(p.id)}">Agregar +</button></div></div></article>`).join(""):'<p class="no-results">No encontramos productos con esa búsqueda.</p>'}
async function loadLiveCatalog(){try{const {data,error}=await catalogClient.from("products").select("id,name,short_description,price,is_featured,categories(name),product_media(media_type,storage_path,is_primary,sort_order)").eq("status","published").order("created_at",{ascending:false});if(error)throw error;if(!data?.length)return;catalogIsLive=true;products=data.map(p=>{const media=p.product_media||[];const photo=media.find(m=>m.media_type==="image"&&m.is_primary)||media.find(m=>m.media_type==="image");const clip=media.find(m=>m.media_type==="video");const url=path=>path?catalogClient.storage.from("mubira-products").getPublicUrl(path).data.publicUrl:"";return{id:p.id,name:p.name,category:p.categories?.name||"Muebles",detail:p.short_description||"Mueble de MUBIRA",price:Number(p.price)||0,icon:"🛋️",tag:p.is_featured?"DESTACADO":"MUBIRA",tone:"#e6dce8",image_url:url(photo?.storage_path),video:url(clip?.storage_path)};});}catch(error){console.warn("Catálogo de MUBIRA: se mantienen los productos de muestra.",error.message);}}
function renderCart(){document.getElementById("cartCount").textContent=cart.reduce((n,p)=>n+p.qty,0);document.getElementById("cartTotal").textContent=money(cart.reduce((n,p)=>n+p.price*p.qty,0));const box=document.getElementById("cartItems");box.innerHTML=cart.length?cart.map(p=>`<div class="cart-row"><span>${p.name} × ${p.qty}<br><b>${money(p.price*p.qty)}</b></span><button data-remove="${p.id}">Quitar</button></div>`).join(""):'<p class="muted">Tu bolsa está vacía.</p>'}
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
const checkoutStatus=document.getElementById("checkoutStatus");
const whatsappLink=document.getElementById("orderWhatsAppLink");
checkoutForm.addEventListener("submit",async e=>{
 e.preventDefault();
 if(!cart.length){checkoutStatus.textContent="Agrega al menos un producto.";return;}
 if(!catalogIsLive){checkoutStatus.textContent="El catálogo todavía muestra productos de demostración. Publica tus productos propios antes de recibir pedidos.";return;}
 const submit=document.getElementById("checkoutSubmit");
 const formData=new FormData(checkoutForm);
 const items=cart.map(p=>({product_id:p.id,name:p.name,category:p.category,quantity:p.qty,unit_price:Number(p.price),line_total:Number(p.price)*p.qty}));
 const total=items.reduce((sum,item)=>sum+item.line_total,0);
 submit.disabled=true;submit.textContent="Guardando pedido…";checkoutStatus.textContent="Estamos registrando tu pedido en MUBIRA…";whatsappLink.hidden=true;
 try{
  const payload={customer_name:String(formData.get("customer_name")||"").trim(),customer_phone:String(formData.get("customer_phone")||"").trim(),customer_city:String(formData.get("customer_city")||"").trim(),customer_address:String(formData.get("customer_address")||"").trim(),customer_notes:String(formData.get("customer_notes")||"").trim()||null,items,subtotal:total,total,payment_method:"cash_on_delivery",status:"new",source:"storefront"};
  const {data,error}=await catalogClient.from("orders").insert(payload).select("id,order_number").single();
  if(error)throw error;
  const lines=items.map(x=>x.quantity+" × "+x.name+" — "+money(x.line_total)).join("\n");
  const message=["Hola, MUBIRA. Acabo de registrar el pedido #"+data.order_number+".","Nombre: "+payload.customer_name,"Celular: "+payload.customer_phone,"Ciudad: "+payload.customer_city,"Dirección: "+payload.customer_address,"Productos:",lines,"Total: "+money(total),"Pago: contra entrega",payload.customer_notes?"Notas: "+payload.customer_notes:""].filter(Boolean).join("\n");
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

document.getElementById("year").textContent=new Date().getFullYear();loadLiveCatalog().then(()=>renderProducts());renderProducts();renderCart();updateNavigation();