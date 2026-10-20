const META_PIXEL_ID = '606539268407910';

const PIXEL_HEAD = `<script>!function(f,b,e,v,n){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window,document);fbq('init','${META_PIXEL_ID}');fbq('track','PageView');window.addEventListener('load',function(){var s=document.createElement('script');s.async=!0;s.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(s)})</script>`;

const PIXEL_NOSCRIPT = `<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1"></noscript>`;

const LEAD_SCRIPT = `<script>(function(){var fired=false;function visible(el){if(!el)return false;var cs=window.getComputedStyle(el);return cs.display!=='none'&&cs.visibility!=='hidden'&&el.offsetParent!==null}function check(){if(fired)return;if(!visible(document.getElementById('success-message')))return;fired=true;if(typeof window.fbq==='function'){fbq('track','Lead',{content_name:'Club Leyendas de Bronco'})}}try{new MutationObserver(check).observe(document.documentElement,{attributes:true,childList:true,subtree:true,attributeFilter:['style','class']});document.addEventListener('submit',function(){setTimeout(check,1500);setTimeout(check,4000)},true);check()}catch(e){}})()</script>`;

class InjectHead { element(element) { element.append(PIXEL_HEAD, { html: true }); } }

class InjectBody {
  constructor(isClub) { this.isClub = isClub; }
  element(element) {
    element.prepend(PIXEL_NOSCRIPT, { html: true });
    if (this.isClub) element.append(LEAD_SCRIPT, { html: true });
  }
}

export async function onRequest(context) {
  const response = await context.next();
  try {
    const url = new URL(context.request.url);
    const isPagesDev = url.hostname.endsWith('.pages.dev');
    const isClub = url.pathname.replace(/\/+$/, '') === '/club-leyendas';
    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');
    if (!isPagesDev && !isHtml) return response;
    const headers = new Headers(response.headers);
    if (isPagesDev) headers.set('X-Robots-Tag', 'noindex');
    const out = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    if (!isHtml) return out;
    return new HTMLRewriter().on('head', new InjectHead()).on('body', new InjectBody(isClub)).transform(out);
  } catch (err) {
    return response;
  }
}
