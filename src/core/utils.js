
export const clamp = (n, a, b)=>Math.max(a, Math.min(b, n));
export const rnd = (min, max)=>Math.random()*(max-min)+min;
export const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)];
export const formatMoney = (n)=> new Intl.NumberFormat('pt-BR').format(n);
