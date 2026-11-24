import {createClient} from "https://esm.sh/@supabase/supabase-js@2.119.2";
const db=createClient("https://ncfjussqankxpmcrhhij.supabase.co","sb_publishable_01DxOQWRyBJAdrUeXh7_gQ_j_qlTvtz");
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let currentUser=null,canManage=false;
function say(s){$("technicalInviteMessage").textContent=s;}
async function accessCheck(){
 const {data:{session}}=await db.auth.getSession();currentUser=session?.user||null;
 if(!currentUser)return;
 await db.rpc("claim_technical_admin_invite");
 const [{data:p},{data:r}]=await Promise.all([
  db.from("admin_profiles").select("role").eq("user_id",currentUser.id).maybeSingle(),
  db.from("admin_access").select("role").eq("user_id",currentUser.id)
 ]);
 canManage=p?.role==="owner"||(r||[]).some(x=>x.role==="technical_admin");
 if(canManage){await Promise.all([loadInvites(),loadAudit()]);}
}
async function loadInvites(){
 const box=$("technicalInviteList");
 const {data,error}=await db.from("technical_admin_invites").select("*").order("created_at",{ascending:false});
 if(error){box.textContent="No se pudieron consultar los accesos: "+error.message;return;}
 if(!data?.length){box.textContent="Todavía no hay correos autorizados adicionales.";return;}
 box.innerHTML=data.map(x=>'<div class="access-row"><div><strong>'+esc(x.email)+'</strong><small>'+(x.is_active?(x.claimed_by?"Acceso activo · ya inició sesión":"Invitación activa · pendiente de primer ingreso"):"Acceso retirado")+' · agregado '+new Date(x.created_at).toLocaleString("es-CO")+'</small></div>'+(x.is_active?'<button class="secondary" data-revoke="'+esc(x.claimed_by||"")+'" data-invite="'+esc(x.id)+'">Retirar acceso</button>':'<span>Inactivo</span>')+'</div>').join("");
 box.querySelectorAll("[data-invite]").forEach(b=>b.addEventListener("click",async()=>{
  if(!confirm("¿Retirar el acceso técnico de "+b.closest(".access-row").querySelector("strong").textContent+"?"))return;
  b.disabled=true;
  const {error}=await db.rpc("revoke_technical_admin_access",{target_user_id:b.dataset.revoke||null,target_invite_id:b.dataset.invite});
  if(error){say("No se pudo retirar el acceso: "+error.message);b.disabled=false;return;}
  say("Acceso retirado correctamente.");await loadInvites();
 }));
}
$("technicalInviteForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!canManage){say("No tienes permiso para autorizar cuentas.");return;}
 const email=$("technicalInviteEmail").value.trim().toLowerCase();
 if(!email){say("Escribe un correo válido.");return;}
 const button=$("technicalInviteSave");button.disabled=true;say("Guardando autorización...");
 try{
  const {data:existing,error:findError}=await db.from("technical_admin_invites").select("id").ilike("email",email).maybeSingle();
  if(findError)throw findError;
  const payload={email,role:"technical_admin",is_active:true,created_by:currentUser.id,claimed_by:null,claimed_at:null};
  const result=existing?await db.from("technical_admin_invites").update(payload).eq("id",existing.id):await db.from("technical_admin_invites").insert(payload);
  if(result.error)throw result.error;
  $("technicalInviteEmail").value="";say("Correo autorizado. La persona debe entrar con Google usando exactamente ese correo.");await loadInvites();
 }catch(err){say("No se pudo autorizar: "+err.message);}
 finally{button.disabled=false;}
});
function changedFields(oldData,newData){
 if(!oldData)return Object.keys(newData||{}).filter(k=>!["id","updated_at","updated_by","created_at"].includes(k)).slice(0,12).join(", ")||"Registro creado";
 if(!newData)return Object.keys(oldData||{}).filter(k=>!["id","updated_at","updated_by","created_at"].includes(k)).slice(0,12).join(", ")||"Registro eliminado";
 const keys=new Set([...Object.keys(oldData||{}),...Object.keys(newData||{})]);
 return [...keys].filter(k=>JSON.stringify(oldData?.[k])!==JSON.stringify(newData?.[k])&&!["updated_at","updated_by","created_at"].includes(k)).slice(0,12).join(", ")||"Actualización de registro";
}
async function loadAudit(){
 const box=$("technicalAuditList");
 const {data,error}=await db.from("admin_change_log").select("id,table_name,record_id,action,actor_id,actor_email,changed_at,old_data,new_data").order("changed_at",{ascending:false}).limit(100);
 if(error){box.textContent="No se pudo cargar el historial: "+error.message;return;}
 if(!data?.length){box.textContent="Aún no hay modificaciones registradas.";return;}
 const labels={site_sections:"Portada o pantalla",site_section_items:"Tarjeta de Espacios",products:"Producto / precio / inventario",promotion_settings:"Configuración de promoción",promotion_campaigns:"Campaña de marketing"};
 box.innerHTML=data.map(x=>'<article class="audit-row"><div class="audit-top"><span class="audit-action">'+esc(x.action)+'</span><small>'+new Date(x.changed_at).toLocaleString("es-CO")+'</small></div><strong>'+esc(labels[x.table_name]||x.table_name)+'</strong><small>Responsable: '+esc(x.actor_email||x.actor_id||"Cuenta no identificada")+'</small><div class="audit-fields">Campos: '+esc(changedFields(x.old_data,x.new_data))+'</div></article>').join("");
}
$("refreshTechnicalAudit").addEventListener("click",loadAudit);
db.auth.onAuthStateChange(()=>setTimeout(accessCheck,0));
accessCheck();
