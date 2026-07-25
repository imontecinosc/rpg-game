import {ITEMS,createItem} from '../data/items.js';
export class Inventory{
  constructor(capacity=60){this.capacity=capacity;this.items=[]}
  add(id,qty=1,extra={}){const def=ITEMS[id];if(!def)return false;if(def.stack){const stack=this.items.find(i=>i.id===id);if(stack){stack.qty+=qty;return true}}if(this.items.length>=this.capacity)return false;this.items.push(createItem(id,qty,extra));return true}
  count(id){return this.items.filter(i=>i.id===id).reduce((n,i)=>n+i.qty,0)}
  has(needs){return Object.entries(needs).every(([id,q])=>this.count(id)>=q)}
  remove(id,qty=1){let left=qty;for(let i=this.items.length-1;i>=0&&left>0;i--){const it=this.items[i];if(it.id!==id)continue;const take=Math.min(left,it.qty);it.qty-=take;left-=take;if(it.qty<=0)this.items.splice(i,1)}return left===0}
  consume(uid,qty=1){const i=this.items.findIndex(x=>x.uid===uid);if(i<0)return false;this.items[i].qty-=qty;if(this.items[i].qty<=0)this.items.splice(i,1);return true}
  byUid(uid){return this.items.find(i=>i.uid===uid)}
  sort(){this.items.sort((a,b)=>(ITEMS[a.id].type+ITEMS[a.id].name).localeCompare(ITEMS[b.id].type+ITEMS[b.id].name))}
}
