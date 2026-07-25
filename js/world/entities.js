export class Enemy{
  constructor(x,y,type='bandit'){this.x=x;this.y=y;this.radius=13;this.type=type;this.hp=type==='troll'?85:45;this.maxHp=this.hp;this.speed=type==='troll'?55:80;this.damage=type==='troll'?15:8;this.color=type==='troll'?'#5b7f4e':'#8a3c35';this.dead=false;this.attackCd=0;this.loot=false}
  update(dt,player,world){if(this.dead)return;this.attackCd=Math.max(0,this.attackCd-dt);const d=Math.hypot(player.x-this.x,player.y-this.y);if(d<260&&!player.dead){if(d>28){this.x+=(player.x-this.x)/d*this.speed*dt;this.y+=(player.y-this.y)/d*this.speed*dt;world.clamp(this)}else if(this.attackCd===0){player.hp=Math.max(0,player.hp-this.damage);this.attackCd=1.2;if(player.hp<=0)player.dead=true}}}
}
export const makeEnemies=()=>[
  new Enemy(1050,420),new Enemy(1110,500),new Enemy(1270,610),new Enemy(1460,530),new Enemy(1390,880,'troll'),new Enemy(1250,990,'troll')
];
