export const ITEMS={
  iron_sword:{id:'iron_sword',name:'Espada de hierro',icon:'🗡️',type:'weapon',slot:'weapon',stack:false,power:8,skill:'Espada',insured:false,description:'Espada equilibrada de una mano.'},
  oak_shield:{id:'oak_shield',name:'Escudo reforzado',icon:'🛡️',type:'armor',slot:'shield',stack:false,armor:5,skill:'Bloquear',insured:false,description:'Escudo de madera reforzado con hierro.'},
  leather_chest:{id:'leather_chest',name:'Pechera de cuero',icon:'🥋',type:'armor',slot:'chest',stack:false,armor:3,insured:false,description:'Armadura ligera de cuero.'},
  bandage:{id:'bandage',name:'Vendas',icon:'🩹',type:'consumable',stack:true,maxStack:999,description:'Detiene sangrado y recupera vida.'},
  health_potion:{id:'health_potion',name:'Poción de vida',icon:'🧪',type:'consumable',stack:true,maxStack:99,description:'Recupera vida de inmediato.'},
  iron_ore:{id:'iron_ore',name:'Mena de hierro',icon:'🪨',type:'resource',stack:true,maxStack:9999,description:'Debe fundirse para obtener lingotes.'},
  iron_ingot:{id:'iron_ingot',name:'Lingote de hierro',icon:'▰',type:'resource',stack:true,maxStack:9999,description:'Metal común para herrería.'},
  copper_ore:{id:'copper_ore',name:'Mena de cobre',icon:'🟫',type:'resource',stack:true,maxStack:9999,description:'Mena que requiere experiencia para extraer con constancia.'},
  copper_ingot:{id:'copper_ingot',name:'Lingote de cobre',icon:'▰',type:'resource',stack:true,maxStack:9999,description:'Metal trabajado de nivel medio.'},
  troll_hide:{id:'troll_hide',name:'Piel de troll',icon:'🟩',type:'resource',stack:true,maxStack:9999,description:'Piel gruesa de criatura monstruosa.'},
  troll_leather:{id:'troll_leather',name:'Cuero de troll',icon:'🟢',type:'resource',stack:true,maxStack:9999,description:'Material resistente para sastrería avanzada.'},
  gold:{id:'gold',name:'Oro',icon:'🪙',type:'currency',stack:true,maxStack:999999,description:'El oro transportado cae en el cadáver.'},
  skill_contract_110:{id:'skill_contract_110',name:'Contrato mágico 110',icon:'📜',type:'contract',stack:false,description:'Eleva el límite de una habilidad a 110.'}
};
export const createItem=(id,qty=1,extra={})=>({uid:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,id,qty,...extra});
