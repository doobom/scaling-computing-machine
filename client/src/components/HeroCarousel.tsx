import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { logger } from '@lark-apaas/client-toolkit/logger';

export interface HeroSlide {
  id: string;
  image: string;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  link?: string;
}

export interface HeroCarouselProps {
  slides: HeroSlide[];
  autoplayInterval?: number;
}

const HeroCarousel = ({ slides, autoplayInterval = 5000 }: HeroCarouselProps) => {
  const { lang } = useLanguage();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || slides.length <= 1) return;

    const timer = setInterval(() => {
      try {
        emblaApi.scrollNext();
      } catch (err) {
        logger.error(`carousel autoplay error: ${String(err)}`);
      }
    }, autoplayInterval);

    return () => clearInterval(timer);
  }, [emblaApi, autoplayInterval, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-lg">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide) => {
            const title = lang === 'zh' ? slide.titleZh : slide.titleEn;
            const desc = lang === 'zh' ? slide.descZh : slide.descEn;
            return (
              <div key={slide.id} className="relative flex-[0_0_100%] min-w-0">
                <div className="relative w-full aspect-[16/7] md:aspect-[21/9] bg-muted/30">
                  <img
                    src={slide.image}
                    alt={title}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-6 md:px-16 lg:px-24">
                    <h2 className="text-white text-xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4 text-on-image max-w-2xl">
                      {title}
                    </h2>
                    <p className="text-white/85 text-sm md:text-base max-w-xl text-on-image line-clamp-2">
                      {desc}
                    </p>
                    {slide.link && (
                      <button
                        type="button"
                        className="mt-4 md:mt-6 w-fit px-5 py-2 bg-accent text-white text-sm font-medium rounded-full hover:bg-accent/90 transition-colors"
                      >
                        {lang === 'zh' ? '立即選購' : 'Shop Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/80 hover:bg-white text-foreground flex items-center justify-center shadow-sm transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/80 hover:bg-white text-foreground flex items-center justify-center shadow-sm transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => scrollTo(index)}
                className={`transition-all duration-200 rounded-full ${
                  index === selectedIndex
                    ? 'w-6 h-2 bg-white'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroCarousel;
