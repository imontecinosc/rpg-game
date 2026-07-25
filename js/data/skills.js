export const SKILL_CAP = 650;
export const SKILLS = [
  ['combat','Arco',50],['combat','Esgrima',20],['combat','Armas contundentes',20],['combat','Espada',50],['combat','Pelea',20],['combat','Tácticas',50],['combat','Anatomía',20],['combat','Curar',20],['combat','Bloquear',20],['combat','Resistencia mágica',20],
  ['magic','Magia',20],['magic','Nigromancia',0],['magic','Devoción',0],['magic','Concentración',20],['magic','Hablar con espíritus',0],
  ['craft','Alquimia',0],['craft','Herrería',20],['craft','Flechería',0],['craft','Carpintería',0],['craft','Sastrería',0],['craft','Inscripción',0],['craft','Cartografía',0],['craft','Cocina',0],['craft','Minería',20],['craft','Tala',0],['craft','Pesca',0],['craft','Conocimiento de armas',20],
  ['bard','Música',0],['bard','Discordia',0],['bard','Pacificación',0],['bard','Provocación',0],
  ['nature','Domar',0],['nature','Conocimiento animal',0],['nature','Veterinaria',0],['nature','Rastrear',0],['nature','Acampar',0],['nature','Dominio de bestias',0],
  ['stealth','Ocultarse',0],['stealth','Sigilo',0],['stealth','Robar',0],['stealth','Hurgar',0],['stealth','Detectar ocultos',0],['stealth','Ganzúas',0],['stealth','Desactivar trampas',0],['stealth','Envenenar',0]
].map(([group,name,value])=>({group,name,value,cap:100,locked:false}));

export const SKILL_GROUPS={combat:'Combate',magic:'Magia',craft:'Artesanía y recolección',bard:'Bardo',nature:'Naturaleza',stealth:'Sigilo y crimen'};
