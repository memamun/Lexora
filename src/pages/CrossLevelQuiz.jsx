import React from 'react';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { useNavigate } from 'react-router-dom';
import LevelQuiz from '@/components/level/LevelQuiz';
import PageHeader from '@/components/layout/PageHeader';
import LexoraLogo from '@/components/ui/LexoraLogo';

export default function CrossLevelQuiz() {
  const navigate = useNavigate();
  const { getCrossLevelWeakWords, loading } = useStudyEngine();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LexoraLogo className="w-12 h-16 filter drop-shadow-[0_0_10px_rgba(99,102,241,0.2)]" isLoading={true} />
      </div>
    );
  }

  const words = getCrossLevelWeakWords;

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">No Weak Words Found</h2>
        <p className="text-sm text-muted-foreground max-w-xs">Study more words to build your weak word bank.</p>
        <button onClick={() => navigate(-1)} className="text-xs font-bold text-primary hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Mixed Weak Word Quiz"
        subtitle={`Reviewing ${words.length} of your lowest accuracy terms`}
        onBack={() => navigate(-1)}
      />
      <LevelQuiz
        words={words}
        levelNumber={0}
        hideLevelUnlock
        onComplete={() => navigate('/word-mistakes')}
      />
    </div>
  );
}
