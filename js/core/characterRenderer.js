(function(U){
  /* Etapa 1 — base humana V6.8: cuatro direcciones. Sin reglas de juego ni equipo aún. */
  const shade=(hex,amount)=>{const n=parseInt(hex.slice(1),16),c=v=>Math.max(0,Math.min(255,v));return `rgb(${c((n>>16)+amount)},${c(((n>>8)&255)+amount)},${c((n&255)+amount)})`};
  function ell(c,x,y,rx,ry,fill){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
  function seg(c,x1,y1,x2,y2,w,fill){c.strokeStyle=fill;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke()}
  function rr(c,x,y,w,h,r,fill,stroke){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y,x+r,y);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.2;c.stroke()}}
  function head(c,b,dir){
    const side=dir==='left'?-1:dir==='right'?1:0;
    ell(c,side*2,-112,side?15:17,19,b.skin);
    if(dir==='up'){rr(c,-17,-132,34,25,5,b.hair);return}
    rr(c,side?-20*side:-17,-132,side?25:34,16,5,b.hair);
    if(side){ell(c,side*8,-114,2,2,'#17120f');seg(c,side*9,-101,side*14,-100,1.2,'rgba(0,0,0,.32)')}else{ell(c,-5.5,-112,2,2,'#17120f');ell(c,5.5,-112,2,2,'#17120f');seg(c,-3,-100,3,-100,1.2,'rgba(0,0,0,.32)');rr(c,-6,-102,12,3,1.5,'#2f221d')}
  }
  function cape(c,b,dir){c.fillStyle=b.cape;c.strokeStyle=shade(b.cape,-20);c.lineWidth=1.2;c.beginPath();if(dir==='up'||dir==='down'){c.moveTo(-18,-78);c.bezierCurveTo(-28,-78,-34,-70,-35,-61);c.lineTo(-25,56);c.quadraticCurveTo(-12,48,-3,66);c.quadraticCurveTo(0,71,3,66);c.quadraticCurveTo(12,48,25,56);c.lineTo(35,-61);c.bezierCurveTo(34,-70,28,-78,18,-78);c.quadraticCurveTo(0,-70,-18,-78)}else{rr(c,dir==='left'?6:-24,-78,18,145,9,b.cape,shade(b.cape,-20));return}c.closePath();c.fill();c.stroke()}
  function equipment(c,v,dir){
    const eq=v.equipment||{};
    if(eq.chest)rr(c,-23,-61,46,58,9,v.colors.armor,'rgba(20,14,11,.35)');
    if(eq.head)rr(c,-18,-136,36,22,5,shade(v.colors.armor,-6),'rgba(20,14,11,.3)');
  }
  function held(c,v,dir){
    if(!v.showWeapon)return;const eq=v.equipment||{},item=eq.weapon&&U.itemDefs[eq.weapon.id],shield=!!eq.shield;
    const drawShield=()=>{c.fillStyle='#756a5e';c.strokeStyle='#d2b56f';c.lineWidth=3;c.beginPath();c.ellipse(dir==='left'?-34:dir==='right'?34:-31,0,18,25,0,0,Math.PI*2);c.fill();c.stroke()};
    if(shield&&dir!=='left')drawShield();
    if(item){c.save();c.translate(dir==='left'?-38:38,8);c.rotate(dir==='left'?-1.05:dir==='right'?1.05:.25);if(item.ranged){c.strokeStyle='#8a6235';c.lineWidth=5;c.beginPath();c.arc(0,-28,22,-1.25,1.25);c.stroke()}else{c.strokeStyle='#d8dfe2';c.lineWidth=item.twoHand?7:5;c.beginPath();c.moveTo(0,8);c.lineTo(0,item.twoHand?-82:-58);c.stroke();c.strokeStyle='#b58d52';c.lineWidth=6;c.beginPath();c.moveTo(-10,-4);c.lineTo(10,-4);c.stroke()}c.restore()}
    /* La vista izquierda es la única donde el escudo debe quedar sobre todas las capas. */
    if(shield&&dir==='left')drawShield();
  }
  function front(c,b,dir,v){
    const side=dir==='left'?-1:dir==='right'?1:0, shirt=b.shirt, pants=b.pants;
    const legA=side?-8: -11,legB=side?8:11;
    seg(c,legA,20,legA+(side?3:-2),84,11,shade(pants,-5));seg(c,legB,20,legB+(side?3:2),84,11,shade(pants,6));
    ell(c,legA+(side?3:-2),90,11,5,'#322821');ell(c,legB+(side?3:2),90,11,5,'#322821');
    seg(c,-22,-54,-35,-2,11,shade(shirt,-10));seg(c,22,-54,35,-2,11,shade(shirt,8));
    c.fillStyle=b.skin;c.strokeStyle='rgba(20,14,11,.35)';c.lineWidth=1.2;c.beginPath();c.moveTo(-20,-64);c.quadraticCurveTo(-19,-78,0,-80);c.quadraticCurveTo(19,-78,20,-64);c.lineTo(16,18);c.quadraticCurveTo(0,24,-16,18);c.closePath();c.fill();c.stroke();
    c.fillStyle=shirt;c.beginPath();c.moveTo(-19,-63);c.quadraticCurveTo(-18,-75,0,-77);c.quadraticCurveTo(18,-75,19,-63);c.lineTo(15,11);c.quadraticCurveTo(0,17,-15,11);c.closePath();c.fill();
    seg(c,-24,-55,-37,7,10,shade(shirt,9));seg(c,24,-55,37,7,10,shade(shirt,-9));ell(c,-38,8,5,6,b.skin);ell(c,38,8,5,6,b.skin);
    equipment(c,v,dir);rr(c,-8,-86,16,16,4,shade(b.skin,-4));head(c,b,dir);held(c,v,dir);
  }
  function back(c,b,v){
    if(v.equipment?.cloak)cape(c,b,'up');
    seg(c,-11,20,-13,84,11,shade(b.pants,-10));seg(c,11,20,13,84,11,shade(b.pants,-3));ell(c,-13,90,11,5,'#322821');ell(c,13,90,11,5,'#322821');
    seg(c,-22,-54,-35,-2,11,shade(b.shirt,-14));seg(c,22,-54,35,-2,11,shade(b.shirt,-8));rr(c,-20,-78,40,96,12,b.shirt,'rgba(20,14,11,.3)');equipment(c,v,'up');rr(c,-8,-86,16,16,4,shade(b.skin,-4));head(c,b,'up');held(c,v,'up');
  }
  U.CharacterRenderer={
    draw(c,visual,scale=.28){const b=visual.colors,dir=visual.direction,t=performance.now()/150;c.save();c.scale(scale,scale);c.translate(0,visual.moving?Math.abs(Math.sin(t))*3:0);if(visual.equipment?.cloak&&dir!=='up')cape(c,b,dir);if(dir==='up')back(c,b,visual);else front(c,b,dir,visual);c.restore()}
  };
})(window.Ultra=window.Ultra||{});
