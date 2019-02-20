import createRegistry from './registry';

const record = createRegistry<'Hoto' | 'Kafu' | 'Tedeza' | 'Uzimatsu' | 'Kirima'>()
  // .init()
  // .publish()
  // .registerActorName()
  .registerCharactorName('Hoto', 'Cocoa')
  .registerCharactorName('Kafu', 'Chino')
  .freezeCharactorName()
  .registerActorName('Hoto', 'Sakura Ayane')
  .publish();

console.log(record.keyList);
console.log(record.charactorMap.Hoto);
console.log(record.charactorMap.Kafu);
console.log(record.actorMap.Hoto);
// console.log(record.actorMap.Kafu); /* Property 'Kafu' does not exist on type '{ Hoto: string; }'. */
