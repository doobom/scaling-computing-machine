import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Baby,
  Sparkles,
  UtensilsCrossed,
  Home as HomeIcon,
  Shirt,
  ChevronRight,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import HeroCarousel from '@client/src/components/HeroCarousel';
import ProductCard from '@client/src/components/ProductCard';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { getBanners, type Banner } from '@client/src/api/marketing';
import {
  getCategoryTree,
  searchProducts,
  type Category,
  type Product,
} from '@client/src/api/product';

const categoryIcons = [Baby, Sparkles, UtensilsCrossed, HomeIcon, Shirt];

const Home = () => {
  const { lang, t } = useLanguage();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [hotSales, setHotSales] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [bannerRes, catRes, recRes, hotRes, newRes] = await Promise.all([
          getBanners().catch((err: unknown) => {
            logger.error(`load banners failed: ${String(err)}`);
            return [];
          }),
          getCategoryTree().catch((err: unknown) => {
             logger.error(`load categories failed: ${String(err)}`);
             return [];
           }),
          searchProducts({ page: 1, pageSize: 10, sort: 'sales' }).catch(
            (err: unknown) => {
              logger.error(`load recommended failed: ${String(err)}`);
              return { items: [] };
            },
          ),
          searchProducts({ page: 1, pageSize: 10, sort: 'sales' }).catch(
            (err: unknown) => {
              logger.error(`load hot sales failed: ${String(err)}`);
              return { items: [] };
            },
          ),
          searchProducts({ page: 1, pageSize: 10, sort: 'newest' }).catch(
            (err: unknown) => {
              logger.error(`load new arrivals failed: ${String(err)}`);
              return { items: [] };
            },
          ),
        ]);
        setBanners(bannerRes);
        setCategories((Array.isArray(catRes) ? catRes : (catRes as any)?.items ?? []).slice(0, 6));
        setRecommended(recRes.items);
        setHotSales(hotRes.items);
        setNewArrivals(newRes.items);
      } catch (err) {
        logger.error(`home load data error: ${String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const heroSlides = banners.map((b) => ({
    id: b.id,
    image: b.imageUrl,
    titleZh: b.titleZh ?? '',
    titleEn: b.titleEn ?? '',
    descZh: b.subtitleZh ?? '',
    descEn: b.subtitleEn ?? '',
    link: b.jumpUrl,
  }));

  const scrollRow = (key: string, direction: 'left' | 'right') => {
    const el = scrollRefs.current[key];
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const sectionTitle = (zh: string, en: string) =>
    lang === 'zh' ? zh : en;

  const renderProductRow = (
    key: string,
    titleZh: string,
    titleEn: string,
    products: Product[],
    tag: 'new' | 'hot' | 'discount' | 'none',
  ) => (
    <section className="mb-8 md:mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-foreground">
          {sectionTitle(titleZh, titleEn)}
        </h2>
        <Link
          to="/products"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          {t('common.more')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="relative group">
        <button
          type="button"
          onClick={() => scrollRow(key, 'left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-white"
          aria-label="Scroll left"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        <div
          ref={(el) => {
            scrollRefs.current[key] = el;
          }}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 -mx-2 px-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] snap-start"
            >
              <ProductCard
                id={product.id}
                nameZh={product.titleZh}
                nameEn={product.titleEn}
                 image={(product as any).mainImageUrl ?? product.mainImage ?? product.images?.[0]?.imageUrl ?? ''}
                price={product.salePrice}
                originalPrice={product.originalPrice}
                tag={tag}
                discountPercent={
                  product.originalPrice > product.salePrice
                    ? Math.round(
                        ((product.originalPrice - product.salePrice) /
                          product.originalPrice) *
                          100,
                      )
                    : undefined
                }
              />
            </div>
          ))}
          {products.length === 0 && !loading && (
            <div className="w-full py-8 text-center text-muted-foreground text-sm">
              {t('common.loading')}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => scrollRow(key, 'right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-white"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );

  if (loading && banners.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="w-full aspect-[16/7] rounded-lg bg-muted/50" />
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted/50" />
            ))}
          </div>
          <div className="h-8 w-40 rounded bg-muted/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Hero Carousel */}
      <section className="mb-8 md:mb-10">
        <HeroCarousel slides={heroSlides} />
      </section>

      {/* Category Quick Entry */}
      <section className="mb-8 md:mb-10 bg-card rounded-lg border border-border p-4 md:p-6">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 md:gap-4">
          {categories.map((cat, index) => {
            const IconComp = categoryIcons[index % categoryIcons.length];
            const displayName = lang === 'zh' ? cat.nameZh : cat.nameEn;
            return (
              <Link
                key={cat.id}
                to={`/products?categoryId=${cat.id}`}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                  <IconComp className="w-6 h-6" />
                </div>
                <span className="text-xs md:text-sm text-foreground text-center line-clamp-1">
                  {displayName}
                </span>
              </Link>
            );
          })}
          {categories.length === 0 &&
            Array.from({ length: 6 }).map((_, i) => {
              const IconComp = categoryIcons[i % categoryIcons.length];
              const catKeys = ['baby', 'cosmetics', 'food', 'home', 'apparel'];
              const label = t(
                `categories.${catKeys[i % catKeys.length]}` as any,
              );
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className="text-xs md:text-sm text-foreground text-center">
                    {label}
                  </span>
                </div>
              );
            })}
        </div>
      </section>

      {/* Recommended Products */}
      {renderProductRow(
        'recommended',
        '推薦商品',
        'Recommended',
        recommended,
        'none',
      )}

      {/* Hot Sales */}
      {renderProductRow(
        'hot',
        '熱銷榜單',
        'Best Sellers',
        hotSales,
        'hot',
      )}

      {/* New Arrivals */}
      {renderProductRow(
        'new',
        '新品上架',
        'New Arrivals',
        newArrivals,
        'new',
      )}
    </div>
  );
};

export default Home;
