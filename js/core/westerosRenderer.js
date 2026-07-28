(function (U) {
  'use strict';

  /*
   * Renderer humano V7.17.
   * Formas, rig y jerarquías proceden de Westeros V5, corregido según index(37).
   * El renderer anterior se conserva como respaldo para bestias.
   */
  const legacyRenderer = U.CharacterRenderer;
  let ctx = null;
  const state = {
    tab: 'humans',
    dir: 'down',
    action: 'idle',
    main: 'none',
    off: 'none',
    hair: 'short',
    showClothes: true,
    clothes: { head: false, neck: false, shirt: true, arms: true, gloves: false, pants: true, boots: false },
    showCape: false,
    showTunic: false,
    equip: { helmet: false, neck: false, torso: false, arms: false, gloves: false, legs: false, boots: false },
    weaponColor: '#c2c9ce',
    shieldColor: '#756a5e',
    paused: false,
  };

const RIG={
  headTop:-146, headBot:-106, headCy:-126,
  neckTop:-104, neckBot:-92,
  shoulderY:-90, shoulderX:27,
  chestY:-56, waistY:-14, hipY:28, hipX:13,
  elbowY:-30, handY:16,
  kneeY:72, footY:116
};

/* ══════════════════════════════════════════════════════════════════
   2 · MODELO DE EQUIPAMIENTO (slots + reglas)
   ══════════════════════════════════════════════════════════════════ */
const MAIN={
  none:      {name:'Sin arma',        hands:0, kind:'empty'},
  sword:     {name:'Espada',          hands:1, kind:'blade',  reach:118, arc:'slash'},
  dagger:    {name:'Daga',            hands:1, kind:'blade',  reach:38,  arc:'stab'},
  mace:      {name:'Maza',            hands:1, kind:'blunt',  reach:100, arc:'slash'},
  axe:       {name:'Hacha',           hands:1, kind:'blade',  reach:104, arc:'slash'},
  spear:     {name:'Lanza',           hands:1, kind:'polearm',reach:148, arc:'stab'},
  greatSword:{name:'Mandoble',        hands:2, kind:'blade',  reach:150, arc:'slash'},
  greatMace: {name:'Gran maza',       hands:2, kind:'blunt',  reach:142, arc:'slash'},
  greatAxe:  {name:'Gran hacha',      hands:2, kind:'blade',  reach:146, arc:'slash'},
  greatSpear:{name:'Pica',            hands:2, kind:'polearm',reach:196, arc:'stab'},
  bow:       {name:'Arco',            hands:2, kind:'ranged', reach:0,   arc:'shoot'},
  staff:     {name:'Báculo',          hands:2, kind:'focus',  reach:132, arc:'cast', tag:'staff'}
};
const OFF={
  none:      {name:'Vacía',           kind:'empty'},
  shield:    {name:'Escudo',          kind:'shield'},
  spellbook: {name:'Spellbook',       kind:'focus', tag:'spellbook'},
  dagger:    {name:'Daga (dual)',     kind:'blade'},
  axe:       {name:'Hacha (dual)',    kind:'blade'},
  sword:     {name:'Espada (dual)',   kind:'blade'},
  mace:      {name:'Maza (dual)',     kind:'blunt'}
};
const isTwoHanded = id => (MAIN[id]?.hands||0)===2;

/* Regla única de compatibilidad. Devuelve null si es válido, o el motivo. */
function combineError(main,off){
  if(off==='none') {
    if(main==='none') return null;
    return null;
  }
  if(off==='spellbook'){
    if(main==='none'||main==='staff') return null;
    return 'El spellbook solo se lleva solo o con báculo.';
  }
  if(main==='staff') return 'El báculo solo se combina con spellbook.';
  if(isTwoHanded(main)) return `${MAIN[main].name} ocupa las dos manos.`;
  if(main==='none' && off!=='shield') return 'Un arma secundaria necesita arma principal.';
  return null;
}
/* Auto-corrección: al cambiar un slot, ajusta el otro si quedó inválido. */
function normalizeLoadout(changed){
  const e=combineError(state.main,state.off);
  if(!e) return null;
  if(changed==='main'){
    state.off = (state.main==='staff') ? 'spellbook'
              : isTwoHanded(state.main) ? 'none'
              : (state.main==='none' ? 'none' : 'none');
    if(state.main==='none') state.off='none';
  }else{
    if(state.off==='spellbook') state.main = (state.main==='staff')?'staff':'none';
    else if(isTwoHanded(state.main)||state.main==='staff') state.main='sword';
    else if(state.main==='none') state.main='sword';
  }
  return e;
}
const hasShield   = ()=> state.off==='shield';
const hasSpellbook= ()=> state.off==='spellbook';
const isDualWield = ()=> ['dagger','axe','sword','mace'].includes(state.off);
const usesTwoHandGrip = ()=> isTwoHanded(state.main) && state.main!=='bow';

/* ══════════════════════════════════════════════════════════════════
   3 · SISTEMA DE ANIMACIÓN — clips con curvas propias
   ══════════════════════════════════════════════════════════════════ */
const CLIPS={
  idle: {dur:2.60, loop:true},
  walk: {dur:0.92, loop:true},
  melee:{dur:0.78, loop:true},
  cast: {dur:1.55, loop:true},
  hurt: {dur:0.70, loop:true},
  death:{dur:1.70, loop:false}
};
/* Canales de pose. Todo lo que dibuja lee de aquí, nunca de time directo. */
const P={
  bob:0, breath:0, torsoTwist:0, torsoLean:0,
  headTilt:0, headY:0,
  legPhase:0, armPhase:0,
  swing:0, thrust:0, guard:0,
  castCharge:0, castBurst:0,
  recoil:0, flash:0,
  fall:0, alpha:1, sink:0,
  capeLift:0, capeSway:0
};
let clipT=0, clipDone=false;
const eOutCubic=t=>1-Math.pow(1-t,3);
const eInCubic =t=>t*t*t;
const eOutBack =t=>{const c=2.2;return 1+ (c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)};
const eOutElastic=t=>t===0?0:t===1?1:Math.pow(2,-9*t)*Math.sin((t*10-0.75)*(2*Math.PI/3))+1;
const eInOut=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const seg01=(t,a,b)=>Math.max(0,Math.min(1,(t-a)/(b-a)));

function resetPose(){for(const k in P)P[k]=0;P.alpha=1;}

function updateAnim(dt){
  if(state.paused)dt=0;
  const act=state.tab==='humans'?state.action:state.beastAction;
  const clip=CLIPS[act]||CLIPS.idle;
  clipT+=dt;
  if(clipT>=clip.dur){ if(clip.loop) clipT%=clip.dur; else {clipT=clip.dur; clipDone=true;} }
  const t=clipT/clip.dur;            // 0..1 normalizado
  resetPose();

  if(act==='idle'){
    /* Respiración en dos tiempos + micro balanceo + peso alternado */
    P.breath   = Math.sin(t*Math.PI*2);
    P.bob      = Math.sin(t*Math.PI*2)*1.8 + Math.sin(t*Math.PI*4)*0.5;
    P.torsoTwist = Math.sin(t*Math.PI*2)*0.022;
    P.torsoLean  = Math.sin(t*Math.PI*2+0.7)*0.015;
    P.headTilt = Math.sin(t*Math.PI*2+1.1)*0.035;
    P.headY    = Math.sin(t*Math.PI*2)*1.1;
    P.armPhase = Math.sin(t*Math.PI*2)*0.9;
    P.legPhase = 0;
    P.guard    = 0.12+Math.sin(t*Math.PI*2)*0.05;
    P.capeSway = Math.sin(t*Math.PI*2+0.4)*2.2;
    P.capeLift = 0.05;
  }

  else if(act==='walk'){
    /* Ciclo de marcha: contacto → paso → contacto → paso */
    const ph=t*Math.PI*2;
    P.legPhase = Math.sin(ph);
    P.armPhase = -Math.sin(ph)*1.15;              // brazos contrarios
    P.bob      = Math.abs(Math.sin(ph))*7.5 - 3;  // sube en el paso
    P.torsoTwist = Math.sin(ph)*0.075;            // rotación de hombros
    P.torsoLean  = 0.045;                         // inclinación al avanzar
    P.headTilt = -Math.sin(ph)*0.03;
    P.headY    = Math.abs(Math.sin(ph))*2.2;
    P.breath   = Math.sin(ph*0.5);
    P.guard    = 0.18;
    P.capeSway = Math.sin(ph-0.6)*7;
    P.capeLift = 0.35+Math.abs(Math.sin(ph))*0.18;
  }

  else if(act==='melee'){
    /* 3 fases: carga (0–.30) · impacto (.30–.46) · recuperación (.46–1) */
    if(t<0.30){
      const k=eOutCubic(seg01(t,0,0.30));
      P.swing      = -0.55*k;                     // retrocede el arma
      P.torsoTwist = -0.16*k;
      P.torsoLean  = -0.05*k;
      P.armPhase   = -1.5*k;
      P.bob        = -2*k;
      P.guard      = 0.10;
    }else if(t<0.46){
      const k=eInCubic(seg01(t,0.30,0.46));
      P.swing      = -0.55+2.05*k;                // latigazo
      P.torsoTwist = -0.16+0.42*k;
      P.torsoLean   = -0.05+0.16*k;
      P.armPhase   = -1.5+4.2*k;
      P.thrust     = k;
      P.bob        = -2+7*k;
      P.headTilt   = 0.10*k;
      P.guard      = 0.10;
    }else{
      const k=eOutElastic(seg01(t,0.46,1));
      P.swing      = 1.50-1.42*k;
      P.torsoTwist = 0.26-0.26*k;
      P.torsoLean   = 0.11-0.11*k;
      P.armPhase   = 2.7-2.7*k;
      P.thrust     = 1-k;
      P.bob        = 5-5*k;
      P.headTilt   = 0.10-0.10*k;
      P.guard      = 0.10+0.08*k;
    }
    P.breath   = Math.sin(t*Math.PI*2);
    P.capeSway = P.swing*9;
    P.capeLift = 0.30+Math.abs(P.swing)*0.25;
  }

  else if(act==='cast'){
    /* Acumulación (0–.62) · descarga (.62–.78) · asentar (.78–1) */
    if(t<0.62){
      const k=eOutCubic(seg01(t,0,0.62));
      P.castCharge = k;
      P.armPhase   = 2.6*k;
      P.torsoLean   = -0.06*k;
      P.bob        = -3*k + Math.sin(t*Math.PI*14)*0.9*k;   // vibración
      P.headTilt   = -0.08*k;
      P.headY      = -2.5*k;
      P.capeLift   = 0.25+0.45*k;
    }else if(t<0.78){
      const k=seg01(t,0.62,0.78);
      P.castCharge = 1-k*0.65;
      P.castBurst  = Math.sin(k*Math.PI);
      P.armPhase   = 2.6+1.5*eInCubic(k);
      P.torsoLean   = -0.06+0.18*k;
      P.bob        = -3+9*k;
      P.headTilt   = -0.08+0.16*k;
      P.capeLift   = 0.70+0.5*Math.sin(k*Math.PI);
    }else{
      const k=eOutCubic(seg01(t,0.78,1));
      P.castCharge = 0.35*(1-k);
      P.castBurst  = 0;
      P.armPhase   = 4.1-4.1*k;
      P.torsoLean   = 0.12-0.12*k;
      P.bob        = 6-6*k;
      P.headTilt   = 0.08-0.08*k;
      P.capeLift   = 0.70-0.65*k;
    }
    P.breath   = Math.sin(t*Math.PI*2);
    P.capeSway = Math.sin(t*Math.PI*6)*3.5;
  }

  else if(act==='hurt'){
    /* Impulso brusco + decaimiento oscilante */
    const k=Math.pow(1-t,2.1);
    P.recoil     = Math.sin(t*Math.PI*7)*k;
    P.flash      = Math.pow(1-Math.min(1,t*4),2);
    P.torsoLean   = -0.30*k;
    P.torsoTwist = -0.18*k;
    P.headTilt   = -0.34*k;
    P.headY      = 3.5*k;
    P.bob        = -5*k;
    P.armPhase   = -2.2*k;
    P.legPhase   = 0.5*k;
    P.guard      = 0.05;
    P.capeSway   = -12*k;
    P.capeLift   = 0.45*k;
  }

  else if(act==='death'){
    /* Impacto → tambaleo → derrumbe → asentamiento */
    if(t<0.18){                                   // impacto
      const k=eOutCubic(seg01(t,0,0.18));
      P.recoil=Math.sin(k*Math.PI*3)*(1-k);
      P.flash=Math.pow(1-k,2);
      P.torsoLean=-0.34*k; P.headTilt=-0.42*k; P.bob=-6*k; P.armPhase=-2.6*k;
    }else if(t<0.42){                             // tambaleo, rodillas ceden
      const k=eInOut(seg01(t,0.18,0.42));
      P.torsoLean=-0.34+0.62*k;
      P.headTilt=-0.42+0.30*k;
      P.bob=-6+16*k;
      P.sink=10*k;
      P.legPhase=Math.sin(k*Math.PI*2)*0.8;
      P.armPhase=-2.6+1.2*k;
    }else if(t<0.80){                             // caída
      const k=eInCubic(seg01(t,0.42,0.80));
      P.fall=k;
      P.torsoLean=0.28+0.30*k;
      P.headTilt=-0.12-0.55*k;
      P.sink=10+38*k;
      P.armPhase=-1.4-2.4*k;
      P.legPhase=0.8-1.6*k;
      P.alpha=1;
    }else{                                        // asentamiento + desvanecer
      const k=eOutCubic(seg01(t,0.80,1));
      P.fall=1+0.06*Math.sin(k*Math.PI*2)*(1-k);
      P.torsoLean=0.58;
      P.headTilt=-0.67;
      P.sink=48+4*k;
      P.armPhase=-3.8;
      P.legPhase=-0.8;
      P.alpha=1-0.45*k;
    }
    P.capeSway=P.fall*16;
    P.capeLift=P.fall*0.6;
  }
}

/* ══════════════════════════════════════════════════════════════════
   4 · UTILIDADES DE DIBUJO
   ══════════════════════════════════════════════════════════════════ */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function shade(hex,amt){if(!hex||hex[0]!=='#')return hex;const n=parseInt(hex.slice(1),16);return`rgb(${clamp((n>>16&255)+amt,0,255)},${clamp((n>>8&255)+amt,0,255)},${clamp((n&255)+amt,0,255)})`}
function ell(x,y,rx,ry,c,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore()}
function seg(x1,y1,x2,y2,w,c,cap='round'){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap=cap;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function rr(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.2;ctx.stroke()}}
function poly(pts,fill,stroke,lw=1.3){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}}

/* ══════════════════════════════════════════════════════════════════
   5 · ARTE DE ARMAS — origen local (0,0) = CENTRO DE LA EMPUÑADURA
   Así el arma queda siempre anclada al centro de la mano.
   ══════════════════════════════════════════════════════════════════ */
const ART={
  sword(){ seg(0,10,0,-118,7.5,shade(state.weaponColor,-2)); ctx.strokeStyle=shade(state.weaponColor,-22);ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(0,-106);ctx.stroke();
    poly([[0,-130],[-4,-114],[4,-114]],shade(state.weaponColor,25));
    seg(-16,-11,16,-11,7.5,'#93794a'); seg(-14,-13,14,-13,3,'#c0a566');
    seg(0,-8,0,9,6,'#48301a','butt'); ctx.strokeStyle='#331f10';ctx.lineWidth=1.8;
    for(let g=-6;g<9;g+=4){ctx.beginPath();ctx.moveTo(-3.2,g);ctx.lineTo(3.2,g);ctx.stroke()}
    ell(0,12,5.6,5,'#8b7040'); ell(0,12,2.6,2.3,'#c2a45e'); },
  greatSword(){ seg(0,14,0,-150,9,shade(state.weaponColor,-2)); ctx.strokeStyle=shade(state.weaponColor,-22);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(0,-136);ctx.stroke();
    poly([[0,-166],[-5,-146],[5,-146]],shade(state.weaponColor,25));
    seg(-22,-15,22,-15,8.5,'#93794a'); seg(-19,-18,19,-18,3.2,'#c0a566');
    seg(0,-12,0,13,6.5,'#48301a','butt');
    ell(0,17,6.2,5.6,'#8b7040'); ell(0,17,2.8,2.5,'#c2a45e'); },
  dagger(){ seg(0,7,0,-32,5,shade(state.weaponColor,3)); poly([[0,-42],[-3.4,-30],[3.4,-30]],shade(state.weaponColor,25));
    seg(-8,-6,8,-6,5,'#93794a'); seg(0,-4,0,7,4.4,'#48301a','butt'); ell(0,9,4,3.6,'#8b7040'); },
  mace(){ seg(0,12,0,-86,7,'#4c331c'); ell(0,-98,13,16,'#6d757b');
    for(let i=0;i<6;i++){const a=i*Math.PI/3;seg(Math.cos(a)*8,-98+Math.sin(a)*10,Math.cos(a)*16,-98+Math.sin(a)*18,4,shade(state.weaponColor,-14))}
    ell(0,14,5,4.6,'#8b7040'); },
  greatMace(){ seg(0,16,0,-124,9,'#4c331c'); ell(0,-140,17,21,'#6d757b');
    for(let i=0;i<6;i++){const a=i*Math.PI/3;seg(Math.cos(a)*11,-140+Math.sin(a)*14,Math.cos(a)*21,-140+Math.sin(a)*24,5,shade(state.weaponColor,-14))}
    ell(0,18,5.8,5.2,'#8b7040'); },
  axe(){ seg(0,12,0,-92,7,'#4c331c');
    poly([[0,-84],[26,-96],[32,-122],[13,-114],[0,-126]],shade(state.weaponColor,-8),shade(state.weaponColor,-42),1.8);
    ell(0,14,5,4.6,'#8b7040'); },
  greatAxe(){ seg(0,16,0,-132,9,'#4c331c');
    poly([[0,-122],[36,-138],[42,-168],[17,-158],[0,-172]],shade(state.weaponColor,-8),shade(state.weaponColor,-42),2);
    poly([[0,-122],[-36,-138],[-42,-168],[-17,-158],[0,-172]],shade(state.weaponColor,-22),shade(state.weaponColor,-42),2);
    ell(0,18,5.8,5.2,'#8b7040'); },
  spear(){ seg(0,16,0,-128,6,'#7a5730'); poly([[0,-150],[9,-126],[0,-112],[-9,-126]],shade(state.weaponColor,7),shade(state.weaponColor,-38),1.6);
    ell(0,18,4.2,4,'#4c331c'); },
  greatSpear(){ seg(0,24,0,-168,8.5,'#6d4d2a'); seg(0,16,0,-158,3.6,'#9a7040');
    poly([[0,-200],[13,-166],[0,-146],[-13,-166]],shade(state.weaponColor,14),shade(state.weaponColor,-34),1.9);
    ell(0,27,5.4,5,'#4c331c'); },
  bow(){ ctx.strokeStyle='#7a5730';ctx.lineWidth=6;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(0,-58);ctx.quadraticCurveTo(23,-30,0,0);ctx.quadraticCurveTo(23,30,0,58);ctx.stroke();
    ctx.strokeStyle='#cfcabe';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-58);ctx.lineTo(0,58);ctx.stroke();
    rr(-5,-8,10,16,4,'#48301a'); },
  staff(){ seg(0,14,0,-124,8,'#6b4a2c');
    ctx.strokeStyle='#54381f';ctx.lineWidth=1.6;
    for(let g=-110;g<8;g+=22){ctx.beginPath();ctx.moveTo(-4,g);ctx.lineTo(4,g+4);ctx.stroke()}
    const glow=0.35+P.castCharge*0.65;
    ell(0,-140,13+P.castCharge*4,13+P.castCharge*4,`rgba(126,102,231,${glow})`);
    ell(0,-140,8,8,'#8f79ef'); ell(-3,-143,3.4,3,'rgba(255,255,255,.5)');
    ell(0,17,5,4.6,'#4c331c'); },
  spellbook(){ rr(-15,-20,30,40,5,'#4e2f28','#28150f');
    rr(-10,-14,9,28,2,'#cdbd9c','#5f4f36'); rr(1,-14,9,28,2,'#cdbd9c','#5f4f36');
    rr(-2.5,-18,5,36,2,'#6d4830');
    const g=0.25+P.castCharge*0.6;
    ell(0,0,10+P.castCharge*8,10+P.castCharge*8,`rgba(140,180,255,${g*0.5})`); },
  shield(){ const rx=22,ry=29;
    ell(0,0,rx,ry,shade(state.shieldColor,-12)); ell(0,0,rx-4,ry-5,state.shieldColor);
    ctx.strokeStyle=shade(state.shieldColor,34);ctx.lineWidth=3.4;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=shade(state.shieldColor,-28);ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(0,-ry+4);ctx.lineTo(0,ry-4);ctx.stroke();
    ell(0,0,6,6,shade(state.shieldColor,12)); ell(-1.5,-1.5,2.4,2.4,shade(state.shieldColor,42)); }
};
/* Ancla universal: dibuja el arma con su empuñadura en (hx,hy). */
function drawWeaponAt(id,hx,hy,angle){
  if(!id||id==='none'||!ART[id])return;
  ctx.save(); ctx.translate(hx,hy); ctx.rotate(angle); ART[id](); ctx.restore();
}

/* ══════════════════════════════════════════════════════════════════
   6 · ÁNGULOS DE ARMA POR DIRECCIÓN Y CLIP
   ══════════════════════════════════════════════════════════════════ */
function weaponAngle(dir,id){
  const m=MAIN[id]||OFF[id]||{}; const stab=m.arc==='stab';
  const base = dir==='down' ? (stab?0.10:0.30)
             : dir==='up'   ? (stab?2.24:2.36)
             : (stab?0.92:1.06);
  const sw = P.swing*(stab?0.55:1.05) + P.thrust*(stab?0.30:0.18);
  return dir==='up' ? base - sw : base + sw;
}

/* ══════════════════════════════════════════════════════════════════
   7 · PARTES DEL CUERPO
   ══════════════════════════════════════════════════════════════════ */
const eqOn=p=>!!state.equip[p], clothOn=p=>state.showClothes&&!!state.clothes[p];

function torsoPath(){poly([[-9,RIG.neckBot],[-24,-84],[-31,RIG.shoulderY+16],[-29,RIG.chestY],[-23,RIG.waistY],[-20,8],[-22,RIG.hipY],[22,RIG.hipY],[20,8],[23,RIG.waistY],[29,RIG.chestY],[31,RIG.shoulderY+16],[24,-84],[9,RIG.neckBot]])}
function sidePath(){poly([[-9,RIG.neckBot],[-13,-82],[-15,RIG.chestY],[-12,RIG.waistY],[-10,8],[-13,RIG.hipY],[15,RIG.hipY],[16,8],[17,RIG.waistY],[18,RIG.chestY],[16,-82],[9,RIG.neckBot]])}

function drawBody(base,side=false){
  const path=side?sidePath:torsoPath, br=P.breath*1.1;
  ctx.save(); ctx.translate(0,-br*0.4);
  ctx.fillStyle=base.skin;ctx.strokeStyle='rgba(20,14,11,.42)';ctx.lineWidth=1.3;
  path(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,.16)';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(0,-84);ctx.lineTo(0,RIG.chestY+6);ctx.stroke();
  if(clothOn('shirt')){
    ctx.save(); path(); ctx.clip();
    ctx.fillStyle=base.shirt; ctx.fillRect(-36,RIG.neckBot-6,72,160);
    ctx.strokeStyle='rgba(0,0,0,.14)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-21,-80);ctx.lineTo(-18,20);ctx.stroke();
    ctx.beginPath();ctx.moveTo(21,-80);ctx.lineTo(18,20);ctx.stroke();
    ctx.restore();
    ctx.strokeStyle='rgba(20,14,11,.3)';ctx.lineWidth=1.2;path();ctx.stroke();
  }
  if(clothOn('pants'))rr(side?-12:-21,RIG.hipY-4,side?28:42,18,5,base.underwear,'rgba(20,14,11,.35)');
  ctx.restore();
}
function drawNeck(base){
  poly([[-8,RIG.neckTop],[8,RIG.neckTop],[9,RIG.neckBot],[-9,RIG.neckBot]],shade(base.skin,-8),'rgba(0,0,0,.3)');
  ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-4,RIG.neckTop+2);ctx.lineTo(-7,RIG.neckBot);ctx.stroke();
  ctx.beginPath();ctx.moveTo(4,RIG.neckTop+2);ctx.lineTo(7,RIG.neckBot);ctx.stroke();
  if(eqOn('neck')){
    poly([[-13,RIG.neckBot+2],[-11,RIG.neckTop+1],[11,RIG.neckTop+1],[13,RIG.neckBot+2],[9,RIG.neckBot+5],[-9,RIG.neckBot+5]],shade(base.armor,-10),'rgba(20,14,11,.45)',1.4);
    ctx.fillStyle=shade(base.armor,20);
    [[-8,RIG.neckBot],[8,RIG.neckBot]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill()});
  }else if(clothOn('neck')){
    poly([[-12,RIG.neckBot+4],[-10,RIG.neckTop+3],[10,RIG.neckTop+3],[12,RIG.neckBot+4],[0,RIG.neckBot+1]],shade(base.shirt,-8),'rgba(0,0,0,.25)');
  }
}
function drawTorsoArmor(base){
  if(!eqOn('torso'))return;
  const c=base.armor,o='rgba(25,18,14,.45)',hi=shade(c,20),dk=shade(c,-20);
  poly([[-10,RIG.neckBot-2],[-26,-84],[-32,RIG.shoulderY+16],[-30,RIG.chestY],[-24,RIG.waistY],[-21,6],[21,6],[24,RIG.waistY],[30,RIG.chestY],[32,RIG.shoulderY+16],[26,-84],[10,RIG.neckBot-2]],c,o,1.6);
  ctx.strokeStyle=hi;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(0,-84);ctx.lineTo(0,4);ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(2.5,-84);ctx.lineTo(2.5,4);ctx.stroke();
  ctx.strokeStyle=dk;ctx.lineWidth=1.4;
  [-62,-44,-26].forEach(y=>{ctx.beginPath();ctx.moveTo(-28,y);ctx.lineTo(28,y);ctx.stroke()});
  for(let i=0;i<3;i++)rr(-22+i*1.5,8+i*8,44-i*3,11,2,shade(c,-8-i*4),o);
  ctx.fillStyle=hi;
  [[-23,-64],[23,-64],[-25,-46],[25,-46],[-25,-28],[25,-28]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,1.9,0,Math.PI*2);ctx.fill()});
}
/* Hombrera PARENTADA: recibe el joint real del hombro */
function drawPauldron(sx,sy,side,base){
  if(!eqOn('torso'))return;
  const c=base.armor,o='rgba(25,18,14,.45)',s=side==='left'?-1:1;
  ctx.save();ctx.translate(sx,sy);
  for(let i=0;i<3;i++)poly([[-11*s,-6+i*7],[12*s,-9+i*7],[13*s,1+i*7],[-10*s,4+i*7]],shade(c,-i*9),o,1.3);
  ctx.fillStyle=shade(c,20);ctx.beginPath();ctx.arc(8*s,-4,2,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
/* ── CASCO unificado para las 4 poses ── */
function drawHelmet(dir,base){
  if(!eqOn('helmet'))return;
  const c=base.armor,o='rgba(20,14,11,.5)',hi=shade(c,22),dk=shade(c,-14);
  const top=RIG.headTop, cy=RIG.headCy;
  ctx.save();
  if(dir==='down'){
    poly([[-16,cy+2],[-16,top+2],[-9,top-7],[9,top-7],[16,top+2],[16,cy+2],[10,cy-3],[-10,cy-3]],c,o,1.5);
    ctx.strokeStyle=hi;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(0,top-6);ctx.lineTo(0,cy-2);ctx.stroke();
    ctx.strokeStyle=dk;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-16,cy-1);ctx.lineTo(16,cy-1);ctx.stroke();
    poly([[-16,cy-1],[-10,cy-1],[-9,cy+13],[-15,cy+10]],shade(c,-12),o,1.2);
    poly([[16,cy-1],[10,cy-1],[9,cy+13],[15,cy+10]],shade(c,-12),o,1.2);
    poly([[-2.6,cy-2],[2.6,cy-2],[2.1,cy+9],[-2.1,cy+9]],shade(c,-4),o,1.1);
  }else if(dir==='up'){
    poly([[-16,cy+6],[-16,top+2],[-9,top-7],[9,top-7],[16,top+2],[16,cy+6],[0,cy+10]],c,o,1.5);
    ctx.strokeStyle=hi;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(0,top-6);ctx.lineTo(0,cy+8);ctx.stroke();
    ctx.strokeStyle=dk;ctx.lineWidth=1.6;
    ctx.beginPath();ctx.moveTo(-15,cy-4);ctx.lineTo(15,cy-4);ctx.stroke();
    ctx.fillStyle=hi;[[-9,cy-8],[9,cy-8],[0,top+6]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,1.8,0,Math.PI*2);ctx.fill()});
  }else{
    poly([[-17,cy+2],[-16,top+1],[-6,top-8],[9,top-3],[15,cy-1],[9,cy-4],[-11,cy-4]],c,o,1.5);
    ctx.strokeStyle=hi;ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-6,top-6);ctx.lineTo(-13,cy-3);ctx.stroke();
    poly([[-16,cy-2],[-9,cy-2],[-8,cy+12],[-15,cy+9]],shade(c,-12),o,1.2);
    poly([[9,cy-3],[14,cy-1],[13,cy+7],[8,cy+6]],shade(c,-6),o,1.1);
    ctx.strokeStyle=dk;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-16,cy-1);ctx.lineTo(14,cy-2);ctx.stroke();
  }
  ctx.restore();
}
function frontHair(base){
  const c=base.hair,hi=shade(c,24),dk=shade(c,-18),top=RIG.headTop;
  if(state.hair==='bald'){ctx.fillStyle='rgba(255,255,255,.04)';ctx.beginPath();ctx.ellipse(-3,top+9,5,3,-.3,0,Math.PI*2);ctx.fill();return}
  if(state.hair==='mohawk'){poly([[-4,top+5],[-2,top-16],[2,top-16],[4,top+5]],c,dk,1.2);return}
  poly([[-14,top+12],[-14,top],[0,top-6],[14,top],[14,top+12],[9,top+7],[0,top+11],[-9,top+7]],c,dk,1.2);
  ctx.strokeStyle=hi;ctx.lineWidth=1.1;
  ctx.beginPath();ctx.moveTo(-7,top+1);ctx.lineTo(-5,top+9);ctx.stroke();
  ctx.beginPath();ctx.moveTo(6,top+1);ctx.lineTo(4,top+9);ctx.stroke();
  if(state.hair==='bun'){ctx.fillStyle=c;ctx.strokeStyle=dk;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,top-8,7,0,Math.PI*2);ctx.fill();ctx.stroke()}
}
/* Pelo trasero corto/moño/coleta: va bajo el casco */
function backHair(base){
  const c=base.hair,dk=shade(c,-18),top=RIG.headTop;
  if(state.hair==='bald'||state.hair==='mohawk'||state.hair==='long')return;
  if(state.hair==='short')rr(-14,top,28,16,4,c,dk);
  else if(state.hair==='ponytail'){rr(-14,top,28,15,4,c,dk);seg(0,top+14,0,-80,7,c);ell(0,-72,6,10,c)}
  else if(state.hair==='bun'){rr(-14,top,28,15,4,c,dk);ell(0,top-8,7,7,c)}
}
/* Melena larga: ÚNICA pieza que se dibuja POR ENCIMA de la capa */
function longHair(base,dir){
  if(state.hair!=='long')return;
  const c=base.hair,dk=shade(c,-18),top=RIG.headTop,fl=P.capeSway*0.35;
  if(dir==='right'||dir==='left'){
    ctx.save(); if(dir==='left')ctx.scale(-1,1);
    poly([[-15,top+4],[-17,-74+fl*.4],[-9,-64],[-2,-70],[-4,top+10]],c,dk,1.2);
    ctx.restore(); return;
  }
  poly([[-15,top+2],[-18-fl*.3,-70+fl*.5],[-9,-60],[0,-66],[9,-60],[18+fl*.3,-70+fl*.5],[15,top+2]],c,dk,1.2);
  ctx.strokeStyle=shade(c,20);ctx.lineWidth=1.1;
  ctx.beginPath();ctx.moveTo(-8,top+6);ctx.lineTo(-11,-66);ctx.stroke();
  ctx.beginPath();ctx.moveTo(8,top+6);ctx.lineTo(11,-66);ctx.stroke();
}
function drawHead(dir,base){
  const cy=RIG.headCy,top=RIG.headTop,bot=RIG.headBot;
  ctx.save(); ctx.translate(0,P.headY); ctx.rotate(P.headTilt*(dir==='left'?-1:1));
  if(dir==='up'){
    poly([[-12,top+4],[12,top+4],[14,cy-2],[12,cy+8],[6,bot],[-6,bot],[-12,cy+8],[-14,cy-2]],base.skin,'rgba(0,0,0,.32)');
    backHair(base);
  }else if(dir==='down'){
    poly([[-12,top+4],[12,top+4],[14,cy-2],[12,cy+8],[6,bot],[-6,bot],[-12,cy+8],[-14,cy-2]],base.skin,'rgba(0,0,0,.32)');
    ctx.fillStyle='rgba(0,0,0,.10)';
    poly([[-13,cy],[-8,cy+3],[-11,cy+8]],'rgba(0,0,0,.10)');
    poly([[13,cy],[8,cy+3],[11,cy+8]],'rgba(0,0,0,.10)');
    rr(-11,cy-6,8,6,2,'rgba(0,0,0,.13)');rr(3,cy-6,8,6,2,'rgba(0,0,0,.13)');
    const blink = state.action==='death'?1:(Math.sin(clipT*3.1)>0.985?1:0);
    if(blink){seg(-8,cy-3,-4,cy-3,1.6,'#15100d');seg(4,cy-3,8,cy-3,1.6,'#15100d')}
    else{ell(-6,cy-3,1.9,1.8,'#15100d');ell(6,cy-3,1.9,1.8,'#15100d');
      ctx.fillStyle='rgba(255,255,255,.28)';ctx.beginPath();ctx.arc(-6.4,cy-3.6,.7,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(5.6,cy-3.6,.7,0,Math.PI*2);ctx.fill()}
    ctx.strokeStyle=shade(base.hair,14);ctx.lineWidth=2.2;ctx.lineCap='round';
    const brow=P.recoil*2+ (state.action==='melee'?P.thrust*1.6:0);
    ctx.beginPath();ctx.moveTo(-10,cy-7+brow);ctx.lineTo(-3,cy-8);ctx.stroke();
    ctx.beginPath();ctx.moveTo(10,cy-7+brow);ctx.lineTo(3,cy-8);ctx.stroke();
    ctx.strokeStyle='rgba(0,0,0,.24)';ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(-1,cy-4);ctx.lineTo(-1.5,cy+4);ctx.stroke();
    ctx.strokeStyle='rgba(0,0,0,.34)';ctx.lineWidth=1.3;
    ctx.beginPath();ctx.moveTo(-2.5,cy+5);ctx.lineTo(2.5,cy+5);ctx.stroke();
    const open=Math.max(P.thrust*2.6,P.recoil>0?Math.abs(P.recoil)*3:0,state.action==='death'?2:0);
    ctx.strokeStyle='rgba(0,0,0,.42)';ctx.lineWidth=1.4;
    if(open>0.6){ell(0,cy+11,3.4,1+open,'rgba(20,8,6,.75)')}
    else{ctx.beginPath();ctx.moveTo(-3.5,cy+11);ctx.lineTo(3.5,cy+11);ctx.stroke()}
    if(base.gender==='male'){
      poly([[-11,cy+6],[11,cy+6],[8,bot-1],[-8,bot-1]],shade(base.hair,8)+'70');
      rr(-5,cy+7,10,2.5,1,shade(base.hair,8)+'88');
      ctx.strokeStyle='rgba(130,80,60,.38)';ctx.lineWidth=1.1;
      ctx.beginPath();ctx.moveTo(11,cy-4);ctx.lineTo(13,cy+4);ctx.stroke();
    }
    frontHair(base);
  }else{
    ctx.save(); if(dir==='left')ctx.scale(-1,1);
    poly([[-11,top+4],[10,top+5],[13,cy-2],[12,cy+6],[5,bot],[-8,bot-2],[-12,cy+4],[-13,cy-4]],base.skin,'rgba(0,0,0,.32)');
    ell(7,cy-3,1.8,1.8,'#15100d');
    ctx.strokeStyle=shade(base.hair,14);ctx.lineWidth=2;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(3,cy-8);ctx.lineTo(10,cy-7);ctx.stroke();
    ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(11,cy+2);ctx.lineTo(13,cy+4);ctx.stroke();
    const open=Math.max(P.thrust*2.4,Math.abs(P.recoil)*3,state.action==='death'?2:0);
    if(open>0.6)ell(9,cy+10,2.6,1+open,'rgba(20,8,6,.75)');
    else{ctx.beginPath();ctx.moveTo(7,cy+11);ctx.lineTo(12,cy+10);ctx.stroke()}
    if(base.gender==='male')poly([[-9,cy+5],[12,cy+6],[6,bot],[-8,bot-2]],shade(base.hair,8)+'70');
    const c=base.hair,dk=shade(c,-18);
    if(state.hair!=='bald'){
      if(state.hair==='mohawk')poly([[-3,top+2],[1,top-18],[5,top+2]],c,dk,1.2);
      else{
        poly([[-14,top+14],[-13,top-1],[0,top-7],[11,top+1],[9,top+9],[-2,top+6],[-8,top+13]],c,dk,1.2);
        if(state.hair==='ponytail'){seg(-13,top+12,-19,-74,6,c);ell(-20,-66,6,9,c)}
        if(state.hair==='bun')ell(-9,top-4,7,7,c);
      }
    }
    ctx.restore();
  }
  drawHelmet(dir,base);
  ctx.restore();
}

/* ── EXTREMIDADES ── */
function armColors(base,front){
  return{limb:eqOn('arms')?shade(base.armor,front?-4:-16):(clothOn('arms')?shade(base.shirt,front?8:-12):shade(base.skin,front?6:-6)),
         hand:eqOn('gloves')?shade(base.armor,-18):(clothOn('gloves')?shade(base.shirt,-18):shade(base.skin,front?10:-12))};
}
function drawArm(shoulder,elbow,hand,front,base){
  const c=armColors(base,front);
  seg(shoulder.x,shoulder.y,elbow.x,elbow.y,11,c.limb);
  seg(elbow.x,elbow.y,hand.x,hand.y,9.5,c.hand);
  if(eqOn('arms')){
    ctx.save();ctx.lineCap='butt';
    ctx.strokeStyle=front?shade(base.armor,-4):shade(base.armor,-16);ctx.lineWidth=12;
    ctx.beginPath();ctx.moveTo(shoulder.x,shoulder.y+3);ctx.lineTo(elbow.x,elbow.y-4);ctx.stroke();
    ctx.strokeStyle=shade(base.armor,-10);ctx.lineWidth=9;
    ctx.beginPath();ctx.moveTo(elbow.x,elbow.y+4);ctx.lineTo(hand.x,hand.y-4);ctx.stroke();
    ctx.restore();
    ctx.fillStyle=shade(base.armor,-2);ctx.strokeStyle='rgba(20,14,11,.45)';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.arc(elbow.x,elbow.y,6.5,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  ell(hand.x,hand.y,5.2,5.2,c.hand);
  return{x:hand.x,y:hand.y};
}
/* Devuelve el joint de la mano; el arma se ancla exactamente ahí. */
function armPose(side,dir,weaponArm){
  const s=side==='left'?-1:1;
  const up=dir==='up';
  const sw=(weaponArm? P.armPhase : -P.armPhase*0.55)*s*(up?-1:1);
  const two=usesTwoHandGrip()&&weaponArm;
  const cast=P.castCharge*(weaponArm?1:0.55);
  const sh={x:s*RIG.shoulderX,y:RIG.shoulderY+8};
  const el={x:s*(RIG.shoulderX+7)+sw*2.6*s,y:RIG.elbowY+sw*3.0-cast*22};
  const hd={x:s*(RIG.shoulderX+12)+sw*4.4*s-(two?s*10:0),y:RIG.handY+sw*5.0-cast*46-(two?8:0)};
  return{sh,el,hd};
}
function drawLeg(xF,front,base,dir){
  const ph=P.legPhase*(front?1:-1)*8.5;
  const skin=front?shade(base.skin,6):shade(base.skin,-8);
  const cl=front?shade(base.pants,10):shade(base.pants,-12);
  const col=eqOn('legs')?(front?shade(base.armor,-2):shade(base.armor,-16)):(clothOn('pants')?cl:skin);
  const hip={x:xF,y:RIG.hipY+P.sink*0.25};
  const knee={x:xF+(front?2:-2)+ph*.26,y:RIG.kneeY+ph*.55+P.sink*0.5};
  const foot={x:xF+(front?6:-6)+ph*.72,y:RIG.footY-Math.abs(ph)*.30+P.sink*0.2};
  seg(hip.x,hip.y,knee.x,knee.y,13,col);
  seg(knee.x,knee.y,foot.x,foot.y,10,col);
  if(eqOn('legs')){
    ctx.save();ctx.lineCap='butt';
    ctx.strokeStyle=shade(base.armor,-8);ctx.lineWidth=11;
    ctx.beginPath();ctx.moveTo(hip.x,hip.y+2);ctx.lineTo(knee.x,knee.y-6);ctx.stroke();
    ctx.strokeStyle=shade(base.armor,-16);ctx.lineWidth=9;
    ctx.beginPath();ctx.moveTo(knee.x,knee.y+6);ctx.lineTo(foot.x,foot.y-4);ctx.stroke();
    ctx.restore();
    ctx.fillStyle=shade(base.armor,-4);ctx.strokeStyle='rgba(25,18,14,.45)';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.arc(knee.x,knee.y,8,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  if(eqOn('boots')){ctx.save();ctx.strokeStyle=shade(base.armor,-24);ctx.lineWidth=10;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(foot.x-(foot.x-knee.x)*.3,foot.y-14);ctx.lineTo(foot.x,foot.y);ctx.stroke();ctx.restore()}
  ell(foot.x,foot.y+7,11.5,5,eqOn('boots')?shade(base.armor,-24):'#2e241d');
}
function drawTunic(base,dir){
  if(!state.showTunic)return;
  const c=base.tunic,dk=shade(c,-26),hi=shade(c,18);
  const sw=P.capeSway*0.5+P.legPhase*2.5;
  poly([[-25,-84],[-31,RIG.shoulderY+18],[-28,RIG.waistY],[-26,10],[-30,72+sw],[-13,100+sw*1.2],[-4,74+sw],[0,70],[4,74+sw],[13,100+sw*1.2],[30,72+sw],[26,10],[28,RIG.waistY],[31,RIG.shoulderY+18],[25,-84],[8,RIG.neckBot],[0,-76],[-8,RIG.neckBot]],c,dk,1.4);
  ctx.strokeStyle=dk;ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(-8,RIG.neckBot);ctx.lineTo(0,-76);ctx.lineTo(8,RIG.neckBot);ctx.stroke();
  ctx.fillStyle=shade(c,-38);ctx.fillRect(-27,RIG.waistY+8,54,9);
  ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=1;ctx.strokeRect(-27,RIG.waistY+8,54,9);
  rr(-7,RIG.waistY+6,14,13,2,'#8a6820','#5f4712');
  ctx.fillStyle='#d9b856';ctx.beginPath();ctx.arc(0,RIG.waistY+12.5,3,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=hi;ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(-29,66+sw);ctx.lineTo(-13,94+sw);ctx.stroke();
  ctx.beginPath();ctx.moveTo(29,66+sw);ctx.lineTo(13,94+sw);ctx.stroke();
}
function drawCape(base,dir){
  if(!state.showCape)return;
  const up=dir==='up';
  const col=up?shade(base.cape,10):base.cape, dk=shade(base.cape,-30);
  const sway=P.capeSway, lift=P.capeLift;
  const top=RIG.shoulderY+2, hem=(up?98:122)-lift*16;
  ctx.save();
  ctx.fillStyle=col;ctx.strokeStyle=dk;ctx.lineWidth=1.6;
  ctx.beginPath();
  ctx.moveTo(-26,top);ctx.lineTo(-36-lift*4,top+16);
  ctx.quadraticCurveTo(-40-lift*10,20+sway,-32-lift*8,hem-50+sway);
  ctx.quadraticCurveTo(-26,hem-18,-16+sway*.3,hem+sway*1.3);
  ctx.quadraticCurveTo(0,hem-10,16+sway*.3,hem+sway*1.3);
  ctx.quadraticCurveTo(26,hem-18,32+lift*8,hem-50+sway);
  ctx.quadraticCurveTo(40+lift*10,20+sway,36+lift*4,top+16);
  ctx.lineTo(26,top);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,.22)';ctx.lineWidth=1.2;
  [-16,0,16].forEach(x=>{ctx.beginPath();ctx.moveTo(x*0.7,top+18);ctx.quadraticCurveTo(x,hem-56,x*1.5+sway*.4,hem-12+sway);ctx.stroke()});
  if(up){ctx.strokeStyle='rgba(0,0,0,.28)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,top+6);ctx.lineTo(0,hem-14);ctx.stroke()}
  ctx.restore();
}
function drawCapeCollar(base,dir){
  if(!state.showCape)return;
  const col=base.cape,dk=shade(col,-30),y=RIG.shoulderY+2;
  poly([[-26,y+2],[-11,y-6],[11,y-6],[26,y+2],[22,y+9],[0,y+3],[-22,y+9]],shade(col,26),dk,1.3);
  if(dir==='up'){ctx.strokeStyle=dk;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-20,y+4);ctx.lineTo(20,y+4);ctx.stroke();return}
  ctx.fillStyle='#c9a84c';ctx.strokeStyle='#7a5a18';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(0,y+6,4.5,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#f0d878';ctx.beginPath();ctx.arc(-1,y+5,1.8,0,Math.PI*2);ctx.fill();
}

/* ── EFECTOS ── */
function fxSlash(x,y,rot){
  if(P.thrust<=0.02)return;
  const a=P.thrust;
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);
  ctx.strokeStyle=`rgba(255,238,190,${.45*a})`;ctx.lineWidth=7;
  ctx.beginPath();ctx.arc(0,0,66,-1.55,-0.02);ctx.stroke();
  ctx.strokeStyle=`rgba(255,255,225,${.3*a})`;ctx.lineWidth=2.4;
  ctx.beginPath();ctx.arc(0,0,74,-1.7,-0.1);ctx.stroke();
  ctx.restore();
}
function fxMagic(x,y){
  const c=P.castCharge,b=P.castBurst;
  if(c<=0.01&&b<=0.01)return;
  for(let i=0;i<10;i++){
    const a=(i/10)*Math.PI*2+clipT*3.2, r=(16+c*14)*(1-b*0.4)+b*46;
    ell(x+Math.cos(a)*r,y+Math.sin(a)*r,3.2+c*2+b*2,3.2+c*2+b*2,`rgba(140,185,255,${.30+c*.4})`);
  }
  ell(x,y,10+c*18+b*40,10+c*18+b*40,`rgba(120,170,255,${.12+c*.2+b*.28})`);
  if(b>0.01){ctx.strokeStyle=`rgba(200,225,255,${b*.6})`;ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(x,y,30+b*58,0,Math.PI*2);ctx.stroke()}
}
function fxHurt(){
  if(P.flash<=0.01)return;
  ctx.save();ctx.globalCompositeOperation='lighter';
  ctx.fillStyle=`rgba(210,60,50,${P.flash*.42})`;
  ctx.fillRect(-60,RIG.headTop-20,120,300);
  ctx.restore();
  for(let i=0;i<6;i++){
    const a=-0.6-i*0.42, d=(1-P.flash)*40+10;
    ell(Math.cos(a)*d, RIG.chestY+Math.sin(a)*d, 3.4*P.flash+1, 3.4*P.flash+1, `rgba(168,40,36,${P.flash*.8})`);
  }
}

/* ══════════════════════════════════════════════════════════════════
   8 · COMPOSICIÓN POR DIRECCIÓN
   Jerarquías recuperadas de index(37):
   · Abajo: capa y pelo trasero quedan detrás del cuerpo.
   · Arriba: la capa cruza por delante del cuerpo y las extremidades.
   · Laterales: capa y melena forman la silueta posterior.
   El cuello/broche de la capa se separa del paño para poder quedar al frente.
   ══════════════════════════════════════════════════════════════════ */
function offHandItem(){ return state.off==='none'?null:state.off }
function mainHandItem(){ return state.main==='none'?null:state.main }

function composeDown(base){
  /* Fondo: la capa y todo el cabello posterior quedan detrás del cuerpo. */
  drawCape(base,'down');
  backHair(base);
  longHair(base,'down');
  drawLeg(-11,false,base,'down'); drawLeg(11,true,base,'down');
  const L=armPose('left','down',false);
  drawArm(L.sh,L.el,L.hd,false,base); drawPauldron(L.sh.x,L.sh.y-4,'left',base);
  drawBody(base); drawNeck(base); drawTorsoArmor(base); drawTunic(base,'down');
  /* El broche pertenece al frente aunque el paño de la capa quede atrás. */
  drawCapeCollar(base,'down');
  /* mano secundaria */
  if(hasShield())      drawWeaponAt('shield',L.hd.x,L.hd.y,0);
  else if(hasSpellbook())drawWeaponAt('spellbook',L.hd.x,L.hd.y,0.12);
  else if(isDualWield())drawWeaponAt(state.off,L.hd.x,L.hd.y,-0.34-P.swing*0.5);
  /* mano principal */
  const R=armPose('right','down',true);
  drawArm(R.sh,R.el,R.hd,true,base); drawPauldron(R.sh.x,R.sh.y-4,'right',base);
  const m=mainHandItem();
  if(m){
    const ang=m==='bow'?Math.PI/2:weaponAngle('down',m);
    drawWeaponAt(m,R.hd.x,R.hd.y,ang);
    if(MAIN[m].arc==='slash'||MAIN[m].arc==='stab')fxSlash(R.hd.x+24,R.hd.y-56,-0.56);
    if(m==='staff')fxMagic(R.hd.x+Math.sin(ang)*118, R.hd.y-Math.cos(ang)*118);
  }
  if(hasSpellbook()&&!m) fxMagic(L.hd.x,L.hd.y-6);
  drawHead('down',base);
}
function composeUp(base){
  /* En la vista posterior, escudo y brazo secundario parten al fondo. */
  const L=armPose('left','up',false);
  if(hasShield())drawWeaponAt('shield',L.hd.x,L.hd.y,0);
  drawArm(L.sh,L.el,L.hd,false,base); drawPauldron(L.sh.x,L.sh.y-4,'left',base);
  drawLeg(-11,false,base,'up'); drawLeg(11,true,base,'up');
  drawBody(base); drawNeck(base); drawTorsoArmor(base); drawTunic(base,'up');
  if(hasSpellbook())drawWeaponAt('spellbook',L.hd.x,L.hd.y,-0.12);
  else if(isDualWield())drawWeaponAt(state.off,L.hd.x,L.hd.y,3.5+P.swing*0.4);
  const R=armPose('right','up',true);
  drawArm(R.sh,R.el,R.hd,true,base); drawPauldron(R.sh.x,R.sh.y-4,'right',base);
  const m=mainHandItem();
  if(m){
    const ang=m==='bow'?Math.PI/2:weaponAngle('up',m);
    drawWeaponAt(m,R.hd.x,R.hd.y,ang);
    if(MAIN[m].arc==='slash'||MAIN[m].arc==='stab')fxSlash(R.hd.x+24,R.hd.y-48,2.34);
    if(m==='staff')fxMagic(R.hd.x+Math.sin(ang)*118, R.hd.y-Math.cos(ang)*118);
  }
  /* Hacia arriba, la capa sí cruza por delante del cuerpo y las armas. */
  drawCape(base,'up'); drawCapeCollar(base,'up');
  longHair(base,'up');
  drawHead('up',base);
}
function composeSide(base,dir){
  const flip=dir==='left';
  ctx.save(); if(flip)ctx.scale(-1,1);
  /* La silueta posterior se establece antes que cuerpo y extremidades. */
  drawCape(base,dir);
  longHair(base,'right');
  /* Escudo al fondo en ambos perfiles. */
  if(hasShield())drawWeaponAt('shield',16,-14,0);
  /* brazo trasero */
  const rearLimb=eqOn('arms')?shade(base.armor,-16):(clothOn('arms')?shade(base.shirt,-12):shade(base.skin,-8));
  const rearHand=eqOn('gloves')?shade(base.armor,-18):(clothOn('gloves')?shade(base.shirt,-18):shade(base.skin,-12));
  const rs=P.armPhase*-1;
  seg(2,RIG.shoulderY+8,15,RIG.elbowY+rs*2.2,10,rearLimb);
  seg(15,RIG.elbowY+rs*2.2,22,RIG.handY+rs*3.4,9,rearHand);
  ell(22,RIG.handY+rs*3.4,5.2,5.2,rearHand);
  if(isDualWield())drawWeaponAt(state.off,22,RIG.handY+rs*3.4,-0.86-P.swing*0.4);
  /* pierna trasera */
  drawLeg(4,false,base,dir);
  drawBody(base,true);
  drawPauldron(2,RIG.shoulderY+4,'right',base);
  /* pierna delantera */
  drawLeg(-6,true,base,dir);
  drawNeck(base);
  drawTorsoArmor(base); drawTunic(base,dir);
  drawCapeCollar(base,dir);
  /* brazo delantero + arma */
  const fLimb=eqOn('arms')?shade(base.armor,-4):(clothOn('arms')?shade(base.shirt,8):shade(base.skin,6));
  const fs=P.armPhase, cast=P.castCharge;
  const el={x:-3+fs*3.2,y:RIG.elbowY+fs*2.4-cast*20};
  const hd={x:14+fs*6.4,y:RIG.handY+fs*4.2-cast*44};
  const frontHand=eqOn('gloves')?shade(base.armor,-18):(clothOn('gloves')?shade(base.shirt,-18):shade(base.skin,10));
  seg(-3,RIG.shoulderY+8,el.x,el.y,10,fLimb);
  seg(el.x,el.y,hd.x,hd.y,9,frontHand);
  ell(hd.x,hd.y,5.2,5.2,frontHand);
  if(hasSpellbook())drawWeaponAt('spellbook',hd.x,hd.y,0.1);
  const m=mainHandItem();
  if(m){
    const ang=m==='bow'?Math.PI/2:weaponAngle('side',m);
    drawWeaponAt(m,hd.x,hd.y,ang);
    if(MAIN[m].arc==='slash'||MAIN[m].arc==='stab')fxSlash(hd.x+20,hd.y-40,0.9);
    if(m==='staff')fxMagic(hd.x+Math.sin(ang)*118, hd.y-Math.cos(ang)*118);
  }
  if(hasSpellbook()&&!m)fxMagic(hd.x,hd.y);
  ctx.restore();
  drawHead(dir,base);
}

function drawHuman(base){
  ctx.save();
  ctx.globalAlpha=P.alpha;
  ctx.translate(0,-P.bob+P.sink);
  ctx.rotate(P.fall*(Math.PI/2)*0.92 + P.torsoLean*0.35 + P.recoil*0.05);
  ctx.translate(P.recoil*3,0);
  ctx.scale(0.92,0.92);
  ctx.save();
  ctx.rotate(P.torsoTwist*0.5);
  if(state.dir==='down')composeDown(base);
  else if(state.dir==='up')composeUp(base);
  else composeSide(base,state.dir);
  ctx.restore();
  fxHurt();
  ctx.restore();
  ctx.globalAlpha=1;
}

  function parseHands(v) {
    if (v.main || v.off) {
      return { main: v.main || 'none', off: v.off || 'none' };
    }
    const weapon = v.weapon || 'none';
    const composite = {
      swordShield: ['sword', 'shield'],
      daggerShield: ['dagger', 'shield'],
      maceShield: ['mace', 'shield'],
      spearShield: ['spear', 'shield'],
      spellbookStaff: ['staff', 'spellbook'],
      shieldOnly: ['none', 'shield'],
      spellbook: ['none', 'spellbook'],
    };
    if (composite[weapon]) return { main: composite[weapon][0], off: composite[weapon][1] };
    return { main: weapon, off: v.shield ? 'shield' : 'none' };
  }

  function applyVisual(v) {
    const hands = parseHands(v);
    state.tab = 'humans';
    state.dir = v.dir || 'down';
    state.main = MAIN[hands.main] ? hands.main : 'none';
    state.off = OFF[hands.off] ? hands.off : 'none';
    state.hair = v.hair || 'short';
    state.weaponColor = v.weaponColor || '#c2c9ce';
    state.shieldColor = v.shieldColor || '#756a5e';
    state.showClothes = v.showClothes !== false;
    state.clothes = {
      head: !!v.clothes?.head,
      neck: !!v.clothes?.neck,
      shirt: v.clothes?.shirt !== false,
      arms: v.clothes?.arms !== false,
      gloves: !!v.clothes?.gloves,
      pants: v.clothes?.pants !== false,
      boots: !!v.clothes?.boots,
    };
    state.showCape = !!v.cape;
    state.showTunic = !!v.tunic;
    state.equip = {
      helmet: !!v.equip?.helmet,
      neck: !!v.equip?.neck,
      torso: !!v.equip?.torso,
      arms: !!v.equip?.arms,
      gloves: !!v.equip?.gloves,
      legs: !!v.equip?.legs,
      boots: !!v.equip?.boots,
    };

    let action = v.action || 'idle';
    if (v.dying) action = 'death';
    else if ((v.hit || 0) > 0.001) action = 'hurt';
    state.action = CLIPS[action] ? action : 'idle';

    const clip = CLIPS[state.action];
    if (state.action === 'melee') clipT = clamp(v.attackProgress || 0, 0, 1) * clip.dur;
    else if (state.action === 'cast') clipT = clamp(v.castProgress || 0, 0, 1) * clip.dur;
    else if (state.action === 'hurt') clipT = (1 - clamp(v.hit || 0, 0, 1)) * clip.dur;
    else if (state.action === 'death') clipT = clamp(v.death || 0, 0, 1) * clip.dur;
    else {
      const actorTime = Number.isFinite(v.time) ? Math.max(0, v.time) : performance.now() / 1000;
      clipT = actorTime % clip.dur;
    }
    clipDone = false;
    updateAnim(0);
  }

  U.CharacterRenderer = {
    draw(c, visual, scale = 0.32) {
      if (visual?.beast) {
        legacyRenderer.draw(c, visual, scale);
        return;
      }
      ctx = c;
      applyVisual(visual || {});
      const base = {
        gender: 'male',
        skin: '#bb8d72',
        underwear: '#39414a',
        shirt: '#677386',
        pants: '#566479',
        tunic: '#7d586a',
        armor: '#8d98a1',
        cape: '#56303c',
        hair: '#3b2a24',
        ...(visual?.base || {}),
      };
      c.save();
      c.scale(scale, scale);
      // Conserva el punto de apoyo del renderer anterior: los pies deben
      // terminar sobre la sombra del mundo, no debajo de ella.
      c.translate(0, -22);
      drawHuman(base);
      c.restore();
    },
  };
})((window.Ultra = window.Ultra || {}));
