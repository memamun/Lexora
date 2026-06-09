import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookOpen, Volume2, Share2, Star, Target, Info, Clock, CheckCircle2, AlertTriangle, Zap, RotateCcw } from 'lucide-react';
import { ALL_WORDS, WORDS_BY_STR_LOWER, DIFFICULTY_MAP, getConfusionCluster } from '@/lib/wordData';
import { useStudyEngine } from '@/lib/useStudyEngine';
import { speak, cancelSpeech } from '@/utils/audio';
import PageHeader from '@/components/layout/PageHeader';

const getFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem('lexora-favorites') || '[]');
  } catch { return []; }
};

const toggleFavorite = (wordIndex) => {
  const favs = getFavorites();
  const next = favs.includes(wordIndex) ? favs.filter(i => i !== wordIndex) : [...favs, wordIndex];
  localStorage.setItem('lexora-favorites', JSON.stringify(next));
  return next;
};

export default function WordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getWordReview } = useStudyEngine();

  const word = useMemo(() => ALL_WORDS.find(w => w.index === parseInt(id)), [id]);
  const review = useMemo(() => getWordReview(word?.word), [word, getWordReview]);
  const relatedWords = useMemo(() => word?.word ? getConfusionCluster(word.word) : [], [word]);
  const exampleParts = useMemo(() => {
    if (!word?.example) return [];
    const escapedWord = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return word.example.split(new RegExp(`(${escapedWord})`, 'gi'));
  }, [word]);

  const [isFavorite, setIsFavorite] = useState(false);
  useEffect(() => {
    if (word) setIsFavorite(getFavorites().includes(word.index));
  }, [word]);

  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, []);

  const handleFavorite = () => {
    if (!word) return;
    const next = toggleFavorite(word.index);
    setIsFavorite(next.includes(word.index));
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: word?.word || 'Lexora Word', url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    }
  };

  if (!word) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Word Not Found</h2>
        <p className="text-muted-foreground mb-6">The word you're looking for doesn't exist in our dictionary.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const diff = DIFFICULTY_MAP[word.difficulty] || { bg: 'bg-muted', color: 'text-muted-foreground', border: 'border-border', label: 'Unknown' };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <PageHeader 
        backTo={-1} 
        action={
          <div className="flex gap-2">
            <button 
              onClick={handleFavorite}
              className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground hover:bg-card'}`}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-500' : ''}`} />
            </button>
            <button 
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-card transition-colors text-muted-foreground"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        }
      />

      {/* Hero Section */}
      <section className="space-y-4">
        <div className="flex items-baseline gap-4 flex-wrap">
          <h1 className={`font-serif font-bold text-premium text-primary tracking-tight uppercase leading-none
            ${word.word.length > 12 ? 'text-4xl sm:text-6xl' : 
              word.word.length > 8 ? 'text-5xl sm:text-7xl' : 
              'text-6xl sm:text-8xl'}`}
          >
            {word.word}
          </h1>
          <div className="flex flex-col gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${diff.bg} ${diff.color} border ${diff.border} inline-block`}>
              {diff.label}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="font-serif italic text-lg text-accent/80 font-semibold">{word.pos}</span>
          <div className="w-1 h-1 rounded-full bg-border" />
          <button 
            onClick={() => speak(word.word)}
            className="flex items-center gap-2 hover:text-primary transition-colors text-muted-foreground hover:text-primary duration-200"
          >
            <Volume2 className="w-5 h-5" />
            <span className="text-sm font-medium">Listen</span>
          </button>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Meaning Card */}
          <div className="p-6 rounded-3xl bg-card border border-border/50 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <BookOpen className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="text-label text-accent mb-2">Meaning & Context</h3>
              <div className="space-y-4">
                <p className="text-xl sm:text-2xl font-serif text-premium leading-relaxed text-foreground/90">
                  {word.explanation.replace(new RegExp(`^${word.word}\\s+means\\s+(to\\s+)?`, 'i'), '').charAt(0).toUpperCase() + word.explanation.replace(new RegExp(`^${word.word}\\s+means\\s+(to\\s+)?`, 'i'), '').slice(1)}
                </p>
                <div className="h-px w-8 bg-border/40" />
                <p className="text-3xl sm:text-4xl font-extrabold text-primary font-bengali leading-tight tracking-wide">
                  {word.bengali}
                </p>
              </div>
            </div>
          </div>

          {/* AI-Enriched Sections */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-success/5 border border-success/10 space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-success">Synonyms</h3>
              <div className="flex flex-wrap gap-2">
                {word.synonyms?.length > 0 ? (
                  word.synonyms.map((s, i) => {
                    const related = WORDS_BY_STR_LOWER[s.toLowerCase()];
                    if (related) {
                      return (
                        <Link key={i} to={`/word/${related.index}`}
                          className="px-2.5 py-1 rounded-lg bg-success/5 text-success text-xs font-serif font-semibold border border-success/15 hover:bg-success/10 hover:border-success/30 transition-all active:scale-95 duration-200"
                        >
                          {s}
                        </Link>
                      );
                    }
                    return (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-success/5 text-success/80 text-xs font-serif border border-success/10">
                        {s}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-muted-foreground italic">None found</span>
                )}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10 space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-destructive">Antonyms</h3>
              <div className="flex flex-wrap gap-2">
                {word.antonyms?.length > 0 ? (
                  word.antonyms.map((a, i) => {
                    const related = WORDS_BY_STR_LOWER[a.toLowerCase()];
                    if (related) {
                      return (
                        <Link key={i} to={`/word/${related.index}`}
                          className="px-2.5 py-1 rounded-lg bg-destructive/5 text-destructive text-xs font-serif font-semibold border border-destructive/15 hover:bg-destructive/10 hover:border-destructive/30 transition-all active:scale-95 duration-200"
                        >
                          {a}
                        </Link>
                      );
                    }
                    return (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-destructive/5 text-destructive/80 text-xs font-serif border border-destructive/10">
                        {a}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-muted-foreground italic">None found</span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-4">
            <h3 className="text-label text-accent">Example Sentence</h3>
            <p className="text-lg sm:text-xl text-foreground/80 font-serif italic leading-relaxed pl-4 border-l-2 border-primary/20">
              {word.example ? (
                <span>
                  "
                  {exampleParts.map((part, i) => 
                    part.toLowerCase() === word.word.toLowerCase() ? (
                      <span key={i} className="text-primary font-serif font-bold not-italic underline decoration-primary/40 underline-offset-4">{part}</span>
                    ) : (
                      part
                    )
                  )}
                  "
                </span>
              ) : (
                <span>Generating example for <span className="text-foreground font-serif font-bold underline decoration-primary/30">{word.word.toLowerCase()}</span>...</span>
              )}
            </p>
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">AI Context Engine</p>
          </div>
        </div>

        {/* Sidebar / Stats */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-card border border-border/50 space-y-5 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 opacity-5 rotate-12">
              <Target className="w-32 h-32 text-primary" />
            </div>
            <div className="relative z-10">
              <h3 className="text-label text-primary mb-4 font-serif font-bold tracking-wide">Word Status</h3>
              
              {/* Mastery Level Badge */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                  review?.mastery_level === 'mastered' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                  review?.mastery_level === 'reviewing' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                  review?.mastery_level === 'learning' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                  'bg-muted text-muted-foreground border-border/40'
                }`}>
                  {review?.mastery_level || 'New'}
                </div>
                {review?.confidence && (
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    review.confidence === 'instant' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    review.confidence === 'hesitated' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {review.confidence === 'instant' ? '✓ Instant' : 
                     review.confidence === 'hesitated' ? '~ Hesitated' : '✗ Forgot'}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reviews</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{review?.total_reviews || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Correct</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{review?.correct_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Streak</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{review?.streak || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Mistakes</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{review?.quiz_wrong_count || 0}</span>
                </div>
              </div>

              {/* Last Review */}
              {review?.last_review && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last reviewed {new Date(review.last_review).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {relatedWords.length > 0 && (
            <div className="p-5 rounded-2xl border border-border/50 space-y-4">
              <div className="flex items-center gap-2 text-label text-accent font-serif font-bold tracking-wide">
                <Info className="w-3.5 h-3.5" />
                <span>Confusion Lab</span>
              </div>
              <p className="text-xs text-muted-foreground font-serif">Commonly confused with these words:</p>
              <div className="flex flex-wrap gap-2">
                {relatedWords.filter(w => w !== word.word).map(w => (
                  <Link 
                    key={w} 
                    to={`/word/${WORDS_BY_STR_LOWER[w.toLowerCase()]?.index}`}
                    className="px-2.5 py-1.5 rounded-lg bg-secondary/40 border border-border/40 text-[10px] font-serif font-bold tracking-wider hover:border-primary/40 hover:bg-secondary/60 transition-all active:scale-95 duration-200"
                  >
                    {w}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
