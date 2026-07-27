(function(U){
  U.$=s=>document.querySelector(s); U.$$=s=>[...document.querySelectorAll(s)];
  U.clamp=(v,a,b)=>Math.max(a,Math.min(b,v)); U.dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y); U.rnd=(a,b)=>a+Math.random()*(b-a); U.pick=a=>a[Math.floor(Math.random()*a.length)];
  U.state={battle:false,autoAttack:false,selectedSpell:'fireball',safeZone:true,contextAction:'use',time:0,day:.35,messages:[],corpses:[],projectiles:[],effects:[],houses:[{city:'Valdoria',owned:true,chests:2,shop:true}],bank:[],vendor:null,currentCorpse:null,selectedVendor:null,selectedBank:null,titles:[]};
  U.player={name:'Ignacio',str:50,dex:50,int:20,maxWeight:100,x:2,y:3,z:0,vx:0,vy:0,speed:5.4,hp:120,maxHp:120,mana:90,maxMana:90,stam:100,maxStam:100,dead:false,respawn:{x:1,y:1,name:'Centro de Valdoria'},target:null,attackCd:0,spellCd:0,healCd:0,bandaging:null,gold:350,inventory:[],equipment:{},skills:{},skillLocks:{},newbie:true,playTime:0,anim:0,attackAnim:0,hitAnim:0,deathAnim:0,facing:'down'};
  for(const cat in U.SKILLS)for(const s of U.SKILLS[cat]){U.player.skills[s]=50;U.player.skillLocks[s]='up'}
  U.camera={x:0,y:0}; U.input={keys:{},jx:0,jy:0}; U.npcs=[]; U.enemies=[];
  U.toast=function(msg){const n=document.createElement('div');n.className='toast';n.textContent=msg;U.$('#toasts').append(n);setTimeout(()=>n.remove(),2900)};
  U.raiseSkill=function(name,amt){
    if(U.player.skillLocks[name]!=='up')return;
    const old=U.player.skills[name]||0,next=Math.min(120,old+amt);if(next<=old)return;U.player.skills[name]=next;
    const oldInt=Math.floor(old),newInt=Math.floor(next);
    if(newInt>oldInt){
      U.skillNotice(name,newInt,true);
      const ix=(U.titleThresholds||[]).indexOf(newInt);
      if(ix>=0){const rank=(U.titleRanks[name]||[])[ix]||(['el Aprendiz','el Practicante','el Experto','el Veterano','el Maestro','el Gran Maestro','la Leyenda'][ix]);const title=`${rank} ${U.player.name}`;if(!U.state.titles.includes(title))U.state.titles.push(title);U.toast(`Nuevo título: ${title}`)}
    }else U.skillNotice(name,next,false);
  };
  U.skillNotice=function(name,value,major){const host=U.$('#level-notices');if(!host)return;const n=document.createElement('div');n.className='skill-notice '+(major?'major':'minor');n.innerHTML=major?`<b>${name} ${Math.floor(value)}</b><span>¡Nuevo nivel!</span>`:`<span>${name} +${value.toFixed(1)}</span>`;host.append(n);setTimeout(()=>n.remove(),major?2600:1300)};
})(window.Ultra=window.Ultra||{});
