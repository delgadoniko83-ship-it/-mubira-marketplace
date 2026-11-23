const products=[
{id:1,name:"Sofá Nórdico",category:"Salas",detail:"Tapizado de muestra · 3 puestos",price:1890000,icon:"🛋️",tag:"DESTACADO",tone:"#ded8cb"},
{id:2,name:"Mesa Roble",category:"Comedores",detail:"Madera de muestra · 4 puestos",price:980000,icon:"🪵",tag:"DISEÑO",tone:"#e5d6c3"},
{id:3,name:"Silla Serena",category:"Comedores",detail:"Diseño contemporáneo",price:420000,icon:"🪑",tag:"NOVEDAD",tone:"#d8ddd5"},
{id:4,name:"Lámpara Aura",category:"Decoración",detail:"Iluminación decorativa",price:265000,icon:"💡",tag:"DETALLE",tone:"#e8dfd1"},
{id:5,name:"Cama Nativa",category:"Habitaciones",detail:"Base y cabecero de muestra",price:2150000,icon:"🛏️",tag:"CONFORT",tone:"#d9d9d0"},
{id:6,name:"Poltrona Alba",category:"Salas",detail:"Sillón auxiliar de muestra",price:790000,icon:"🪑",tag:"SELECCIÓN",tone:"#e5d9cf"},
{id:7,name:"Florero Tierra",category:"Decoración",detail:"Accesorio decorativo",price:95000,icon:"🏺",tag:"DETALLE",tone:"#ded5c8"},
{id:8,name:"Escritorio Línea",category:"Habitaciones",detail:"Espacio de trabajo",price:1150000,icon:"🪵",tag:"FUNCIONAL",tone:"#d8d4c9"}
];
let cart=[],activePage=0;
const money=n=>new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n);
const grid=document.getElementById("productGrid"),deck=document.getElementById("pageDeck");
const pages=[...document.querySelectorAll(".page-panel")],dots=[...document.querySelectorAll("#pageDots button")];
function renderProducts(list=products){grid.innerHTML=list.length?list.map(p=>`<article class="product-card"><div class="product-art" style="background:${p.tone}"><span class="product-tag">${p.tag}</span><span class="shape" aria-hidden="true">${p.icon}</span></div><div class="product-info"><h3>${p.name}</h3><p>${p.detail}</p><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add-button" data-add="${p.id}">Agregar +</button></div></div></article>`).join(""):'<p class="no-results">No encontramos productos con esa búsqueda.</p>'}
function renderCart(){document.getElementById("cartCount").textContent=cart.reduce((n,p)=>n+p.qty,0);document.getElementById("cartTotal").textContent=money(cart.reduce((n,p)=>n+p.price*p.qty,0));const box=document.getElementById("cartItems");box.innerHTML=cart.length?cart.map(p=>`<div class="cart-row"><span>${p.name} × ${p.qty}<br><b>${money(p.price*p.qty)}</b></span><button data-remove="${p.id}">Quitar</button></div>`).join(""):'<p class="muted">Tu bolsa está vacía.</p>'}
function openCart(){document.getElementById("cartPanel").classList.add("open");document.getElementById("cartPanel").setAttribute("aria-hidden","false");document.getElementById("scrim").classList.add("show")}
function closeCart(){document.getElementById("cartPanel").classList.remove("open");document.getElementById("cartPanel").setAttribute("aria-hidden","true");document.getElementById("scrim").classList.remove("show")}
function goToPage(index){activePage=Math.max(0,Math.min(pages.length-1,index));deck.scrollTo({left:activePage*deck.clientWidth,behavior:"smooth"});updateNavigation()}
function updateNavigation(){const index=Math.round(deck.scrollLeft/Math.max(deck.clientWidth,1));activePage=index;dots.forEach((dot,i)=>dot.classList.toggle("active",i===index));document.getElementById("prevPage").disabled=index===0;document.getElementById("nextPage").disabled=index===pages.length-1;document.querySelectorAll("[data-page-link]").forEach(a=>a.classList.toggle("active",Number(a.dataset.pageLink)===index));}
grid.addEventListener("click",e=>{const id=Number(e.target.dataset.add);if(id){const p=products.find(x=>x.id===id),found=cart.find(x=>x.id===id);found?found.qty++:cart.push({...p,qty:1});renderCart();}});
document.getElementById("cartItems").addEventListener("click",e=>{const id=Number(e.target.dataset.remove);if(id){cart=cart.filter(p=>p.id!==id);renderCart();}});
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
document.getElementById("year").textContent=new Date().getFullYear();renderProducts();renderCart();updateNavigation();