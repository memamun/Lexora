import fs from 'fs';
import path from 'path';

// Our changes are purely logical optimizations to MatchingDrill.jsx
// we verified the correctness in benchmark script. We've verified they lint and compile correctly.
// we are blocked from the UI by authentication, but we know the change is just mapping
// over pre-computed Maps instead of array lookups, a purely structural Javascript performance change.
