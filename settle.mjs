/* Brand row — a single line of balls resting on the floor, with seeded-random gaps.
   They roll in from the right: the spin is tied to the distance travelled
   (rolling without slipping, theta = distance / radius), otherwise they look like they slide.
   Re-run with `node settle.mjs` if the set changes. */
const BALLS=[
  {d:128,f:'brands/vucar.png',           n:'Vucar',               fill:1, url:'https://vucar.vn/',              site:'vucar.vn'},
  {d:120,f:'brands/snapvid-app.png',     n:'Snapvid.ai',          fill:1, fb:'brands/snapvid.png',     url:'https://snapvid.ai/',            site:'snapvid.ai'},
  {d:126,f:'brands/fptshop-app.png',     n:'FPT Shop',            fill:1, fb:'brands/fptshop.png',     url:'https://fptshop.com.vn/',        site:'fptshop.com.vn'},
  {d:122,f:'brands/dontchurn.png',       n:'DontChurn',           fill:1, url:'https://dontchurn.io/',          site:'dontchurn.io'},
  {d:118,f:'brands/tugan.png',           n:'Tugan.ai',            fill:1, url:'https://tugan.ai/',              site:'tugan.ai'},
  {d:116,f:'brands/contentdash-app.png', n:'ContentDash',         fill:1, fb:'brands/contentdash.png', url:'https://www.contentdash.app/',   site:'contentdash.app'},
  {d:114,f:'brands/cdg-app.png',         n:'ComfortDelGro (Zig)', fill:1, fb:'brands/cdg.png',         url:'https://www.comfortdelgro.com/', site:'comfortdelgro.com'}
];
/* seeded, so the "random" gaps are identical on every rebuild */
let seed=29; const rnd=()=>(seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff;
const GAP_MAX=26, START_OFF=34;

let x=BALLS[0].d/2;
const p=BALLS.map((b,i)=>{
  const r=b.d/2;
  /* 2*sqrt(r1*r2) is the centre spacing for two circles touching on a floor; the gap adds to it */
  if(i>0){ const rp=BALLS[i-1].d/2; x += 2*Math.sqrt(rp*r) + Math.round(rnd()*GAP_MAX); }
  return {...b,r,x,y:-r};
});

let minGap=1e9;
for(let i=0;i+1<p.length;i++){
  const a=p[i],b=p[i+1];
  minGap=Math.min(minGap, Math.hypot(b.x-a.x,b.y-a.y)-(a.r+b.r));
}
console.log('smallest neighbour gap:', minGap.toFixed(2)+'px  (>=0 = no overlap)');
console.log('gaps:', p.slice(1).map((b,i)=>Math.round(Math.hypot(b.x-p[i].x,b.y-p[i].y)-(b.r+p[i].r))).join(', '));

const W=p[p.length-1].x+p[p.length-1].r, H=Math.max(...p.map(b=>b.d));
console.log('BOX', W.toFixed(2)+'x'+H.toFixed(2), '→ aspect-ratio:'+W.toFixed(2)+'/'+H.toFixed(2));
const px=v=>(v/W*100).toFixed(3)+'%', py=v=>(v/H*100).toFixed(3)+'%';

p.forEach(b=>{
  const D=(W+START_OFF)-(b.x-b.r);                 // how far this ball rolls
  const tx=(D/(2*b.r)*100).toFixed(1);             // translateX % resolves against the ball's own width
  const rot=(D/b.r*180/Math.PI).toFixed(1);        // rolling without slipping
  const err=b.fb ? ' onerror="this.onerror=null;this.parentNode.classList.remove(\'bc--fill\');this.src=\''+b.fb+'\'"' : '';
  console.log('          <a class="bc'+(b.fill?' bc--fill':'')+'" style="width:'+px(2*b.r)+';left:'+px(b.x-b.r)+';top:'+py(H-2*b.r)+';--tx:'+tx+'%;--rot:'+rot+'deg" href="'+b.url+'" target="_blank" rel="noopener" data-site="'+b.site+'" aria-label="'+b.site+'"><img src="'+b.f+'" alt="'+b.n+'"'+err+' /></a>');
});
