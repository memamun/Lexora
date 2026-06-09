import { describe, it, expect } from 'vitest';
import { getConfusionCluster } from './wordData';

describe('getConfusionCluster', () => {
  it('returns the correct cluster for a word that exists in the cluster', () => {
    const cluster = getConfusionCluster('AFFLUENT');
    expect(cluster).toEqual(['AFFLUENT', 'MUNIFICENT', 'PROFUSE', 'COPIOUS']);
  });

  it('returns the correct cluster ignoring case', () => {
    const cluster = getConfusionCluster('affluent');
    expect(cluster).toEqual(['AFFLUENT', 'MUNIFICENT', 'PROFUSE', 'COPIOUS']);
  });

  it('returns an empty array if the word does not exist in any cluster', () => {
    const cluster = getConfusionCluster('NONEXISTENT_WORD');
    expect(cluster).toEqual([]);
  });

  it('works with other words in the same cluster', () => {
    const cluster1 = getConfusionCluster('COPIOUS');
    expect(cluster1).toEqual(['AFFLUENT', 'MUNIFICENT', 'PROFUSE', 'COPIOUS']);

    const cluster2 = getConfusionCluster('indigent');
    expect(cluster2).toEqual(['INDIGENT', 'IMPECUNIOUS', 'MEAGER', 'SCARCE', 'DEARTH', 'SPARSE']);
  });
});
