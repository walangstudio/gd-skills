const [,, a, b] = process.argv;
function parse(v) { return (v || '0').split('.').map(Number); }
const v1 = parse(a), v2 = parse(b);
const len = Math.max(v1.length, v2.length);
for (let i = 0; i < len; i++) {
  const x = v1[i] || 0, y = v2[i] || 0;
  if (x > y) { console.log('greater'); process.exit(0); }
  if (x < y) { console.log('less'); process.exit(0); }
}
console.log('equal');
