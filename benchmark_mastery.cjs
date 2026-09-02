const { performance } = require('perf_hooks');

const WORD_COUNT = 4000;
const masteryLevels = ['mastered', 'reviewing', 'learning', 'none'];

// Create a large dataset to benchmark
const reviews = Array.from({ length: 3000 }, (_, i) => ({
    mastery_level: masteryLevels[Math.floor(Math.random() * 3)]
}));

function original() {
    return [
        { name: 'Mastered', value: reviews?.filter(r => r.mastery_level === 'mastered').length || 0, color: '#22c55e' },
        { name: 'Reviewing', value: reviews?.filter(r => r.mastery_level === 'reviewing').length || 0, color: '#f59e0b' },
        { name: 'Learning', value: reviews?.filter(r => r.mastery_level === 'learning').length || 0, color: '#60a5fa' },
        { name: 'New', value: WORD_COUNT - (reviews?.length || 0), color: '#1e293b' },
    ].filter(d => d.value > 0);
}

function optimized() {
    const counts = (reviews || []).reduce((acc, r) => {
        if (r.mastery_level === 'mastered') acc.mastered++;
        else if (r.mastery_level === 'reviewing') acc.reviewing++;
        else if (r.mastery_level === 'learning') acc.learning++;
        return acc;
    }, { mastered: 0, reviewing: 0, learning: 0 });

    return [
        { name: 'Mastered', value: counts.mastered, color: '#22c55e' },
        { name: 'Reviewing', value: counts.reviewing, color: '#f59e0b' },
        { name: 'Learning', value: counts.learning, color: '#60a5fa' },
        { name: 'New', value: WORD_COUNT - (reviews?.length || 0), color: '#1e293b' },
    ].filter(d => d.value > 0);
}

const ITERATIONS = 10000;

let start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    original();
}
const originalTime = performance.now() - start;

start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    optimized();
}
const optimizedTime = performance.now() - start;

console.log(`Original: ${originalTime.toFixed(2)}ms`);
console.log(`Optimized: ${optimizedTime.toFixed(2)}ms`);
console.log(`Improvement: ${((originalTime - optimizedTime) / originalTime * 100).toFixed(2)}%`);
