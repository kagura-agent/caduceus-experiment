const { Pipeline } = require('./src/pipeline.js');

const p = new Pipeline();
const result = p.run([10, 25, 40, 55], 0, 60, [1, 2, 3, 4]);

console.log('=== Stage 1: normalized ===');
console.log(result.normalized);

console.log('\n=== Stage 2: weighted ===');
console.log(result.weighted);
console.log('Full precision:');
result.weighted.forEach((v, i) => console.log(`  [${i}]: ${v.toPrecision(17)}`));

console.log('\n=== Stage 3: aggregated ===');
result.aggregated.forEach(a => {
  console.log(`  [${a.index}]: value=${a.value}, mean=${a.runningMean}, var=${a.runningVariance}, std=${a.runningStdDev}`);
});

console.log('\n=== Stage 4: summary ===');
console.log(result.summary);

console.log('\n=== Key comparisons ===');
const lastEntry = result.aggregated[result.aggregated.length - 1];
console.log(`lastRunningMean: ${lastEntry.runningMean}`);
console.log(`finalMean: ${result.summary.mean}`);
console.log(`Equal? ${lastEntry.runningMean === result.summary.mean}`);

// Detailed weighted calculations
console.log('\n=== Detailed weighted calc ===');
const totalWeight = 1 + 2 + 3 + 4;
console.log(`totalWeight: ${totalWeight}`);
const normalized = result.normalized;
normalized.forEach((v, i) => {
  const w = [1,2,3,4][i];
  console.log(`  normalized[${i}]=${v} * (${w}/${totalWeight}) = ${v * (w/totalWeight)}`);
});

// Verify aggregate step by step
console.log('\n=== Aggregate step by step ===');
const weighted = result.weighted;
let sum = 0, sumSq = 0;
for (let i = 0; i < weighted.length; i++) {
  sum += weighted[i];
  sumSq += weighted[i] * weighted[i];
  const n = i + 1;
  const mean = sum / n;
  const variance = n > 1 ? (sumSq - (sum * sum) / n) / (n - 1) : 0;
  console.log(`  i=${i}: value=${weighted[i]}, sum=${sum}, sumSq=${sumSq}`);
  console.log(`         mean_raw=${mean}, round=${Math.round(mean*100)/100}`);
  console.log(`         var_raw=${variance}, round=${Math.round(variance*100)/100}`);
  console.log(`         std_raw=${Math.sqrt(variance)}, round=${Math.round(Math.sqrt(variance)*100)/100}`);
}
