(function (U) {
  Object.assign(U.itemDefs, {
    dagger: {
      name: 'Daga de hierro', desc: 'Arma ligera de una mano para ataques rápidos.',
      material: 'Hierro', quality: 'Normal', rarity: 'Común', durability: 85,
      icon: '🗡️', type: 'weapon', slot: 'weapon', skill: 'Esgrima', damage: 11,
      visualModel: 'dagger', value: 105, insurable: true,
      scaling: { primary: 'dex', secondary: 'str', skillWeight: .70, attributeWeight: .30 },
    },
    greatMace: {
      name: 'Gran maza', desc: 'Maza pesada de dos manos.', material: 'Hierro',
      quality: 'Normal', rarity: 'Común', durability: 125, icon: '🔨', type: 'weapon',
      slot: 'weapon', skill: 'Armas contundentes', damage: 24, twoHand: true,
      visualModel: 'greatMace', value: 285, insurable: true,
      scaling: { primary: 'str', secondary: 'dex', skillWeight: .70, attributeWeight: .30 },
    },
    greatAxe: {
      name: 'Gran hacha', desc: 'Hacha de guerra de dos manos.', material: 'Hierro',
      quality: 'Normal', rarity: 'Poco común', durability: 120, icon: '🪓', type: 'weapon',
      slot: 'weapon', skill: 'Armas contundentes', damage: 25, twoHand: true,
      visualModel: 'greatAxe', value: 310, insurable: true,
      scaling: { primary: 'str', secondary: 'dex', skillWeight: .70, attributeWeight: .30 },
    },
    greatSpear: {
      name: 'Pica de hierro', desc: 'Arma de asta larga de dos manos.', material: 'Hierro',
      quality: 'Normal', rarity: 'Poco común', durability: 110, icon: '🔱', type: 'weapon',
      slot: 'weapon', skill: 'Esgrima', damage: 21, twoHand: true,
      visualModel: 'greatSpear', value: 275, insurable: true,
      scaling: { primary: 'dex', secondary: 'str', skillWeight: .70, attributeWeight: .30 },
    },
    staff: {
      name: 'Báculo de roble', desc: 'Foco de dos manos para canalizar poder mágico.',
      material: 'Madera', quality: 'Normal', rarity: 'Común', durability: 90,
      icon: '🪄', type: 'weapon', slot: 'weapon', skill: 'Magia', damage: 10,
      twoHand: true, allowSpellbook: true, visualModel: 'staff', value: 180,
      insurable: true, magicHitChance: 0.35, magicDamageFactor: 0.55,
      scaling: { primary: 'int', secondary: 'dex', skillWeight: .70, attributeWeight: .30 },
    },
    pickaxe: {
      name: 'Picota de minero', desc: 'Herramienta de dos manos necesaria para extraer minerales.',
      material: 'Hierro y cuero', quality: 'Normal', rarity: 'Común', durability: 120,
      icon: '⛏️', type: 'weapon', slot: 'weapon', skill: 'Armas contundentes', damage: 8,
      twoHand: true, visualModel: 'pickaxe', toolAction: 'mine', value: 95, insurable: true,
      scaling: { primary: 'str', secondary: null, skillWeight: .70, attributeWeight: .30 },
    },
    workAxe: {
      name: 'Hacha de tala', desc: 'Herramienta de dos manos necesaria para talar árboles.',
      material: 'Hierro y cuero', quality: 'Normal', rarity: 'Común', durability: 115,
      icon: '🪓', type: 'weapon', slot: 'weapon', skill: 'Armas contundentes', damage: 10,
      twoHand: true, visualModel: 'workAxe', toolAction: 'wood', value: 110, insurable: true,
      scaling: { primary: 'str', secondary: null, skillWeight: .70, attributeWeight: .30 },
    },
  });
})(window.Ultra = window.Ultra || {});
