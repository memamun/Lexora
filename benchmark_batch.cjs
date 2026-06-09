const { performance } = require('perf_hooks');

// Simulates network latency
const simulateNetworkLatency = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const WRONG_WORDS_COUNT = 20;

async function runBaseline() {
  const start = performance.now();

  // Baseline: Promise.all with individual updates
  // In a real environment, each update is a separate Firebase request.
  // We simulate a 50ms network request per item. Promise.all runs them concurrently,
  // but there is still per-request overhead and connection limits which we'll simulate
  // with a small artificial delay of 5ms per operation for serialization/networking stack.
  const promises = Array.from({ length: WRONG_WORDS_COUNT }).map(async () => {
    // simulate serialization + network setup
    await simulateNetworkLatency(5);
    // simulate network trip
    await simulateNetworkLatency(50);
  });
  await Promise.all(promises);

  return performance.now() - start;
}

async function runOptimized() {
  const start = performance.now();

  // Optimized: batchCommit
  // A single request to Firebase handles all operations.
  // Serialization overhead is done once, and network trip is done once.
  await simulateNetworkLatency(5); // one serialization
  await simulateNetworkLatency(50); // one network trip

  return performance.now() - start;
}

async function runBenchmark() {
  console.log("Running baseline...");
  const baseline = await runBaseline();
  console.log(`Baseline: ${baseline.toFixed(2)}ms`);

  console.log("Running optimized...");
  const optimized = await runOptimized();
  console.log(`Optimized: ${optimized.toFixed(2)}ms`);

  const improvement = ((baseline - optimized) / baseline) * 100;
  console.log(`Improvement: ${improvement.toFixed(2)}%`);
}

runBenchmark();
