/* Sports pile - EXACT TANGENCY, physically stable, true real-world proportions.
   basketball + football resting on the floor, touching each other
   tennis nested in the V between them (two contact points = a genuinely stable seat)
   shuttlecock LYING ON ITS SIDE on the floor beside the football.
     It is not stood upright: the illustration's cork is a rounded dome, so an upright
     shuttlecock reads as balancing on a curve. On its side it simply rests.
   Sizes: basketball 24.0cm, football 22.0cm, tennis 6.7cm, shuttlecock 8.5cm long / 6.5cm skirt. */
const BASK=76;                                   // basketball diameter in px = 24.0cm
const cm=v=>+(BASK*v/24).toFixed(3);
const R={bask:BASK/2, foot:cm(22)/2, tenn:cm(6.7)/2};
const SH={len:cm(8.5), skirt:cm(6.5)};
const ART_LONG=0.96, ART_WIDE=0.79;              // how much of the square PNG the drawing fills
const PAD=42;
const eq=(a,b,t=1e-6)=>Math.abs(a-b)<t;

const bask={x:R.bask, y:-R.bask};
const dx=Math.sqrt((R.bask+R.foot)**2-(R.bask-R.foot)**2);
const foot={x:bask.x+dx, y:-R.foot};

const d1=R.bask+R.tenn, d2=R.foot+R.tenn;
const D=Math.hypot(foot.x-bask.x,foot.y-bask.y);
const a=(d1*d1-d2*d2+D*D)/(2*D), h=Math.sqrt(d1*d1-a*a);
const ux=(foot.x-bask.x)/D, uy=(foot.y-bask.y)/D;
const mx=bask.x+a*ux, my=bask.y+a*uy;
const pA={x:mx-h*uy,y:my+h*ux}, pB={x:mx+h*uy,y:my-h*ux};
const T=(pA.y<pB.y)?pA:pB;

/* the lying shuttlecock is only `skirt` tall, so it tucks in close where the ball curves away */
const halfAtSkirt=Math.sqrt(Math.max(R.foot**2-(R.foot-SH.skirt)**2,0));
const shLeft=foot.x+halfAtSkirt+2;
/* rendered as a square box with the image rotated 90deg; the drawing then sits ART_WIDE tall
   inside it, so the box must hang (1-ART_WIDE)/2 of its size below the floor to touch down */
const box=SH.len/ART_LONG;
const TILT=74.57, LOWEST_ABOVE_BOX_BOTTOM=0.2227;
const drop=box*LOWEST_ABOVE_BOX_BOTTOM;

console.log('bask-foot touch:', eq(Math.hypot(foot.x-bask.x,foot.y-bask.y), R.bask+R.foot));
console.log('tenn-bask touch:', eq(Math.hypot(T.x-bask.x,T.y-bask.y), R.bask+R.tenn));
console.log('tenn-foot touch:', eq(Math.hypot(T.x-foot.x,T.y-foot.y), R.foot+R.tenn));
console.log('tennis above floor:', (-(T.y+R.tenn)).toFixed(1)+'px');
console.log('shuttle clears football at skirt height:', (shLeft-foot.x).toFixed(1), '>=', halfAtSkirt.toFixed(1));

const H=-(T.y-R.tenn);
const W=shLeft+SH.len+PAD*2;
const px=v=>(v/W*100).toFixed(3)+'%', py=v=>(v/H*100).toFixed(3)+'%';
console.log('BOX', W.toFixed(2)+'x'+H.toFixed(2), '→ aspect-ratio:'+W.toFixed(2)+'/'+H.toFixed(2));
const ball=(c,r,em)=>`          <span class="sball" style="width:${px(2*r)};left:${px(c.x-r+PAD)};top:${py(H+c.y-r)};font-size:${px(2*r).replace('%','')}cqw">${em}</span>`;
console.log(ball(bask,R.bask,'🏀'));
console.log(ball(foot,R.foot,'⚽'));
console.log(ball(T,R.tenn,'🎾'));
console.log("tilt",TILT+"deg  offset",(-drop).toFixed(2));
console.log(`          <span class="sball sball--shuttle" style="width:${px(box)};left:${px(shLeft-(box-SH.len)/2+PAD)};bottom:${py(-drop)};font-size:${px(box).replace('%','')}cqw"><img src="sports/shuttlecock.png" alt="" onerror="this.remove()" /><i>🏸</i></span>`);
