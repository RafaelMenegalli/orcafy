"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const META_PIXEL_ID = "3486809008159107";
const NEXOFY_PUBLIC_KEY = "cmu4ga7xz002njx048er5hwrc";

/** Script de UTMs da Nexofy: guarda UTMs/click IDs e os repassa para links e formulários. */
const NEXOFY_UTM_SCRIPT = `(function(){
  var K=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','src','sck','fbclid','gclid','ttclid'];
  var S='nexofy_utm',TTL=2592000000;
  function save(o){
    try{localStorage.setItem(S,JSON.stringify({t:Date.now(),v:o}))}catch(e){}
    try{document.cookie=S+'='+encodeURIComponent(JSON.stringify(o))+';path=/;max-age=2592000;SameSite=Lax'}catch(e){}
  }
  function read(){
    try{var r=JSON.parse(localStorage.getItem(S)||'null');if(r&&r.v&&Date.now()-r.t<TTL)return r.v}catch(e){}
    var m=document.cookie.match('(?:^|; )'+S+'=([^;]*)');
    if(m){try{return JSON.parse(decodeURIComponent(m[1]))}catch(e){}}
    return {};
  }
  function fromUrl(){
    var q=new URLSearchParams(location.search),o={};
    K.forEach(function(k){var v=q.get(k);if(v)o[k]=v});
    return o;
  }
  var incoming=fromUrl();
  var data=Object.keys(incoming).length?incoming:read();
  if(Object.keys(incoming).length)save(incoming);
  window.nexofyUtm=data;
  if(!Object.keys(data).length)return;
  function link(a){
    var h=a.getAttribute('href');
    if(!h||/^(#|mailto:|tel:|javascript:)/i.test(h))return;
    var u;try{u=new URL(h,location.href)}catch(e){return}
    if(u.protocol!=='http:'&&u.protocol!=='https:')return;
    var changed=false;
    K.forEach(function(k){if(data[k]&&!u.searchParams.get(k)){u.searchParams.set(k,data[k]);changed=true}});
    if(changed)a.setAttribute('href',u.toString());
  }
  function form(f){
    if(f.getAttribute('data-nexofy'))return;
    f.setAttribute('data-nexofy','1');
    K.forEach(function(k){
      if(!data[k]||f.querySelector('[name="'+k+'"]'))return;
      var i=document.createElement('input');i.type='hidden';i.name=k;i.value=data[k];f.appendChild(i);
    });
  }
  function apply(){
    var a=document.getElementsByTagName('a');for(var i=0;i<a.length;i++)link(a[i]);
    var f=document.getElementsByTagName('form');for(var j=0;j<f.length;j++)form(f[j]);
  }
  apply();
  document.addEventListener('DOMContentLoaded',apply);
  document.addEventListener('click',function(e){
    var t=e.target;
    while(t&&t.tagName!=='A')t=t.parentElement;
    if(t)link(t);
  },true);
  if(window.MutationObserver)new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
})();`;

/** Código base do Meta Pixel (o PageView é enviado pelo nexofy.js com data-auto-page-view). */
const META_PIXEL_SCRIPT = `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');`;

/**
 * Scripts de rastreamento da Nexofy (UTMs + Meta Pixel + nexofy.js).
 * - Não carregam nas páginas públicas de orçamento (/p/...), que são visitadas
 *   pelos clientes dos prestadores, não por leads do Orçafy.
 * - Pixel e nexofy.js só rodam em produção, para não enviar eventos de testes locais.
 */
export function TrackingScripts() {
  const pathname = usePathname();
  if (pathname?.startsWith("/p/")) return null;
  const isProd = process.env.NODE_ENV === "production";

  return (
    <>
      <Script id="nexofy-utm" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: NEXOFY_UTM_SCRIPT }} />
      {isProd && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: META_PIXEL_SCRIPT }} />
          <Script
            id="nexofy-tracker"
            src="https://appnexofy.com.br/nexofy.js"
            strategy="afterInteractive"
            data-public-key={NEXOFY_PUBLIC_KEY}
            data-auto-page-view="true"
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}
    </>
  );
}
