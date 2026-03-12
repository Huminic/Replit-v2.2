import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface TourStep {
  target: string;
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

interface ProductTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;

function getTooltipPosition(rect: TargetRect, placement: TourStep['placement'], tooltipWidth: number, tooltipHeight: number) {
  const gap = 12;
  let top = 0;
  let left = 0;

  switch (placement) {
    case 'bottom':
      top = rect.top + rect.height + PADDING + gap;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case 'top':
      top = rect.top - PADDING - gap - tooltipHeight;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left + rect.width + PADDING + gap;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - PADDING - gap - tooltipWidth;
      break;
  }

  left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
  top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

  return { top, left };
}

export function ProductTour({ steps, onComplete, onSkip }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [animating, setAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 320, height: 200 });

  const step = steps[currentStep];

  const updateTargetRect = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.target);
    if (el) {
      const r = el.getBoundingClientRect();
      setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    setAnimating(true);
    updateTargetRect();
    const timer = setTimeout(() => setAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [currentStep, updateTargetRect]);

  useEffect(() => {
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [updateTargetRect]);

  useEffect(() => {
    if (tooltipRef.current) {
      const r = tooltipRef.current.getBoundingClientRect();
      setTooltipSize({ width: r.width, height: r.height });
    }
  }, [currentStep, targetRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  if (!step) return null;

  const holeStyle = targetRect
    ? {
        top: targetRect.top - PADDING,
        left: targetRect.left - PADDING,
        width: targetRect.width + PADDING * 2,
        height: targetRect.height + PADDING * 2,
      }
    : null;

  const tooltipPos = targetRect
    ? getTooltipPosition(targetRect, step.placement, tooltipSize.width, tooltipSize.height)
    : { top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 160 };

  return createPortal(
    <div className="fixed inset-0 z-[9999]" data-testid="product-tour-overlay">
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {holeStyle && (
              <rect
                x={holeStyle.left}
                y={holeStyle.top}
                width={holeStyle.width}
                height={holeStyle.height}
                rx="6"
                fill="black"
                style={{ transition: animating ? 'all 0.3s ease-in-out' : undefined }}
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      <div
        className="absolute inset-0"
        onClick={onSkip}
        style={{ pointerEvents: 'auto' }}
      />

      {holeStyle && (
        <div
          className="absolute rounded-md"
          style={{
            top: holeStyle.top,
            left: holeStyle.left,
            width: holeStyle.width,
            height: holeStyle.height,
            pointerEvents: 'none',
            boxShadow: '0 0 0 2px hsl(var(--primary))',
            transition: animating ? 'all 0.3s ease-in-out' : undefined,
          }}
        />
      )}

      <Card
        ref={tooltipRef}
        className="absolute p-4 w-80 shadow-lg"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          pointerEvents: 'auto',
          transition: animating ? 'all 0.3s ease-in-out' : undefined,
          zIndex: 10000,
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="tour-tooltip"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm" data-testid="tour-step-title">{step.title}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={onSkip}
            data-testid="button-tour-close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4" data-testid="tour-step-description">
          {step.description}
        </p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground" data-testid="tour-step-counter">
            {currentStep + 1} of {steps.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              data-testid="button-tour-skip"
            >
              Skip
            </Button>
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                data-testid="button-tour-prev"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              data-testid="button-tour-next"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                'Finish'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>,
    document.body
  );
}
