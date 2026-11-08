import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const buildId = `v279-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
const buildTime = new Date().toISOString();

export default defineConfig(({mode})=>({
  base:process.env.VITE_BASE_PATH || '/',
  define:{__NEXPEN_BUILD_ID__:JSON.stringify(buildId),__NEXPEN_BUILD_TIME__:JSON.stringify(buildTime)},
  server:{proxy:{
    '/api/isin/twse':{target:'https://isin.twse.com.tw',changeOrigin:true,rewrite:()=>'/isin/C_public.jsp?strMode=2'},
    '/api/isin/tpex':{target:'https://isin.twse.com.tw',changeOrigin:true,rewrite:()=>'/isin/C_public.jsp?strMode=4'},
    '/api/quotes/twse':{target:'https://openapi.twse.com.tw',changeOrigin:true,rewrite:()=>'/v1/exchangeReport/STOCK_DAY_ALL'},
    '/api/quotes/tpex':{target:'https://www.tpex.org.tw',changeOrigin:true,rewrite:()=>'/openapi/v1/tpex_mainboard_quotes'}
  }},
  plugins:[react(), {
    name:'nexpen-build-version',
    generateBundle(){this.emitFile({type:'asset',fileName:'version.json',source:JSON.stringify({version:'v279',buildId,buildTime})})}
  }, VitePWA({
    injectRegister:null,
    registerType:'prompt',
    includeAssets:['icon.svg'],
    manifest:{name:'NEXPEN 記帳',short_name:'NEXPEN',description:'完全本機儲存的 iPhone 記帳應用',theme_color:'#e8edf8',background_color:'#e8edf8',display:'standalone',start_url:'.',icons:[{src:'icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]},
    workbox:{navigateFallback:'index.html',globPatterns:['**/*.{js,css,html,svg,png}'],cleanupOutdatedCaches:true}
  })]
}));
