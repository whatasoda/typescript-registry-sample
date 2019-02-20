import createCharactorRegistry from './registry';

const record = createCharactorRegistry<'Hoto' | 'Kafu' | 'Tedeza' | 'Uzimatsu' | 'Kirima'>()
  .register('Hoto', 'Cocoa')
  // .register('Tippy', 'Golden Flowery Orange Peco') /* Argument of type '"Tippy"' is not assignable to parameter of type '"Kafu" | "Tedeza" | "Uzimatsu" | "Kirima"'. */
  .register('Kafu', 'Chino')
  // .register('Kafu', 'Inori') /* Argument of type '"Kafu"' is not assignable to parameter of type '"Tedeza" | "Uzimatsu" | "Kirima"'. */
  .register('Tedeza', 'Rize')
  .register('Uzimatsu', 'Chiya')
  .register('Kirima', 'Sharo')
  // .register('Kafu', 'Inori') /* Argument of type '"Kafu"' is not assignable to parameter of type 'never'. */
  .publish();

console.log(record.keyList);
console.log(record.mapObject.Hoto);
console.log(record.mapObject.Kafu);
console.log(record.mapObject.Tedeza);
console.log(record.mapObject.Uzimatsu);
console.log(record.mapObject.Kirima);
// console.log(record.mapObject.Tippy); /* Property 'Tippy' does not exist on type '{ Hoto: string; Kafu: string; Tedeza: string; Uzimatsu: string; Kirima: string; }'. */
// console.log(record.mapObject.Tippy); // Property 'Tippy' does not exist on type '{ Hoto: string; } & { Kafu: string; } & { Tedeza: string; } & { Uzimatsu: string; } & { Kirima: string; }'.
