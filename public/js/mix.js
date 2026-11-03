// The mixing dish makes only a few colours: two paints in, one colour out.

export const RECIPES = [
  { a: 'red', b: 'yellow', hex: '#e8822a', name: 'Orange' },
  { a: 'yellow', b: 'blue', hex: '#5c9a46', name: 'Leaf green' },
  { a: 'red', b: 'blue', hex: '#7d4f9e', name: 'Purple' },
  { a: 'red', b: 'white', hex: '#f2a7b5', name: 'Pink' },
  { a: 'blue', b: 'white', hex: '#8cc4e8', name: 'Sky blue' },
  { a: 'ink', b: 'white', hex: '#9a958c', name: 'Grey' },
];

export const mixName = (hex) => RECIPES.find((r) => r.hex === hex)?.name || 'Mixed colour';
export const isMix = (hex) => RECIPES.some((r) => r.hex === hex);
