import {ITEMS} from '../data/items.js';
export const EQUIPMENT_SLOTS=['head','neck','chest','arms','hands','pants','boots','ring1','ring2','cloak','robe','weapon','shield'];
export class Equipment{
  constructor(){this.slots=Object.fromEntries(EQUIPMENT_SLOTS.map(s=>[s,null]))}
  equip(item,inventory){const def=ITEMS[item.id];let slot=def.slot;if(slot==='ring')slot=this.slots.ring1?'ring2':'ring1';if(!slot||!(slot in this.slots))return false;const previous=this.slots[slot];this.slots[slot]=item;inventory.items=inventory.items.filter(i=>i.uid!==item.uid);if(previous)inventory.items.push(previous);return true}
  unequip(slot,inventory){const item=this.slots[slot];if(!item||inventory.items.length>=inventory.capacity)return false;inventory.items.push(item);this.slots[slot]=null;return true}
  armor(){return Object.values(this.slots).filter(Boolean).reduce((n,i)=>n+(ITEMS[i.id].armor||0),0)}
  weapon(){return this.slots.weapon?ITEMS[this.slots.weapon.id]:null}
}
