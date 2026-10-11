import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  icon: ReactNode;
  tone: string;
}

interface CarouselProps {
  slides: CarouselSlide[];
  testId?: string;
}

export function Carousel({ slides, testId = 'carousel' }: CarouselProps) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  function prev() {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }

  function next() {
    setIndex((i) => (i + 1) % slides.length);
  }

  return (
    <div
      data-testid={testId}
      className="card relative overflow-hidden p-5"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      }}
    >
      <div
        data-testid={`${testId}-slide-${slide.id}`}
        className="flex items-start gap-4"
        role="group"
        aria-roledescription="slide"
        aria-label={`Slide ${index + 1} of ${slides.length}`}
      >
        <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl', slide.tone)}>
          {slide.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{slide.subtitle}</p>
          <h3 className="mt-0.5 text-lg font-semibold">{slide.title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{slide.body}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1.5" role="tablist" aria-label="Slides">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}: ${s.title}`}
              data-testid={`${testId}-dot-${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                'h-2 rounded-full transition-all',
                i === index ? 'w-6 bg-brand-600' : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700',
              )}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous slide"
            data-testid={`${testId}-prev`}
            onClick={prev}
            className="btn-secondary px-2 py-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            data-testid={`${testId}-next`}
            onClick={next}
            className="btn-secondary px-2 py-1.5"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <span className="absolute end-4 top-4 text-xs text-slate-400" data-testid={`${testId}-position`}>
        {index + 1} / {slides.length}
      </span>
    </div>
  );
}