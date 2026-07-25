import {SKILLS,SKILL_CAP} from '../data/skills.js';
export class SkillBook{
  constructor(){this.skills=SKILLS.map(s=>({...s}))}
  get(name){return this.skills.find(s=>s.name===name)}
  total(){return this.skills.reduce((a,s)=>a+s.value,0)}
  gain(name,amount=.1){const s=this.get(name);if(!s||s.locked||s.value>=s.cap)return false;const room=SKILL_CAP-this.total();if(room<=0)return false;const before=s.value;s.value=Math.min(s.cap,s.value,SKILL_CAP-this.total()+s.value+amount);return s.value>before}
}
