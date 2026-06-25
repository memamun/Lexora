import { performance } from 'perf_hooks';

// Simulate ALL_WORDS
const ALL_WORDS = Array.from({ length: 3000 }, (_, i) => ({
    index: i,
    part: i < 1000 ? 'A' : (i < 2000 ? 'B' : 'C'),
    word: `word_${i}`
}));

function benchmarkPartData() {
  const reviews = Array.from({ length: 1000 }, (_, i) => ({
    word_index: Math.floor(Math.random() * ALL_WORDS.length),
    correct_count: Math.floor(Math.random() * 5),
    total_reviews: Math.floor(Math.random() * 10) + 1
  }));

  const parts = ['A', 'B', 'C'];

  const startOld = performance.now();
  for (let i = 0; i < 1000; i++) {
    parts.map(part => {
      const words = ALL_WORDS.filter(w => w.part === part);
      const wordIndices = new Set(words.map(w => w.index));
      const reviewed = (reviews || []).filter(r => wordIndices.has(r.word_index));

      const totalCorrect = reviewed.reduce((sum, r) => sum + (r.correct_count || 0), 0);
      const totalSetReviews = reviewed.reduce((sum, r) => sum + (r.total_reviews || 0), 0);

      const accuracy = totalSetReviews > 0
        ? Math.round((totalCorrect / totalSetReviews) * 100)
        : 0;

      return { part: `Set ${part}`, accuracy, studied: reviewed.length, total: words.length };
    });
  }
  const endOld = performance.now();

  const startNew = performance.now();
  for (let i = 0; i < 1000; i++) {
    const optimizedPartStats = {
      'A': { total: 0, studied: 0, totalCorrect: 0, totalSetReviews: 0 },
      'B': { total: 0, studied: 0, totalCorrect: 0, totalSetReviews: 0 },
      'C': { total: 0, studied: 0, totalCorrect: 0, totalSetReviews: 0 },
    };

    ALL_WORDS.forEach(w => {
       if (optimizedPartStats[w.part]) {
           optimizedPartStats[w.part].total++;
       }
    });

    (reviews || []).forEach(r => {
        const w = ALL_WORDS[r.word_index];
        if (w && optimizedPartStats[w.part]) {
            optimizedPartStats[w.part].studied++;
            optimizedPartStats[w.part].totalCorrect += (r.correct_count || 0);
            optimizedPartStats[w.part].totalSetReviews += (r.total_reviews || 0);
        }
    });

    parts.map(part => {
        const stats = optimizedPartStats[part];
        const accuracy = stats.totalSetReviews > 0
            ? Math.round((stats.totalCorrect / stats.totalSetReviews) * 100)
            : 0;
        return { part: `Set ${part}`, accuracy, studied: stats.studied, total: stats.total };
    });
  }
  const endNew = performance.now();

  console.log(`Analytics PartData Old way: ${(endOld - startOld).toFixed(2)}ms`);
  console.log(`Analytics PartData New way: ${(endNew - startNew).toFixed(2)}ms`);
  console.log(`Improvement: ${(((endOld - startOld) - (endNew - startNew)) / (endOld - startOld) * 100).toFixed(2)}%`);
}

benchmarkPartData();
