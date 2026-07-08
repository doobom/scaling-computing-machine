import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Zap,
  ChevronLeft,
  Plus,
  Minus,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';

import { Button } from '@client/src/components/ui/button';
import { Skeleton, SkeletonDetail } from '@client/src/components/ui/skeleton';
import { Badge } from '@client/src/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@client/src/components/ui/carousel';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { useCart } from '@client/src/hooks/useCart';
import { useMemberProfile } from '@client/src/hooks/useMemberProfile';
import { addToCart } from '@client/src/api/order';
import { getStoreProductDetail } from '@client/src/api/product';
import type { Product, ProductImage } from '@client/src/api/product';
import ProductDetailTabs from './ProductDetailTabs';

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const { profile: memberProfile, discountRate } = useMemberProfile();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch product
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getStoreProductDetail(id);
        if (!cancelled) {
          setProduct(data);
          // init first spec value for each spec group
          if (data.spec && data.spec.length > 0) {
            const init: Record<string, string> = {};
            data.spec.forEach((s) => {
              if (s.values && s.values.length > 0) init[s.name] = s.values[0];
            });
            setSelectedSpecs(init);
          }
        }
      } catch (err) {
        logger.error(`fetch product detail failed: ${JSON.stringify(err)}`);
        if (!cancelled) setError(t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  // Carousel sync
  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    carouselApi.on('select', onSelect);
    onSelect();
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  const images = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return [...product.images].sort((a, b) => a.sort - b.sort);
    }
    if ((product as any).mainImageUrl) {
      return [{ imageUrl: (product as any).mainImageUrl, isMain: true, sort: 0 } as ProductImage];
    }
    if (product.mainImage) {
      return [{ imageUrl: product.mainImage, isMain: true, sort: 0 } as ProductImage];
    }
    return [];
  }, [product]);

  const stockStatus = useMemo(() => {
    if (!product) return { status: 'loading', text: '', className: '' };
    if (product.stock <= 0) {
      return {
        status: 'out',
        text: lang === 'zh' ? '暫時缺貨' : 'Out of stock',
        className: 'text-destructive bg-destructive/10',
        icon: XCircle,
      };
    }
    if (product.stock <= (product.stockWarningThreshold ?? 10)) {
      return {
        status: 'low',
        text: lang === 'zh' ? `庫存緊張 (剩 ${product.stock} 件)` : `Low stock (${product.stock} left)`,
        className: 'text-warning bg-warning/10',
        icon: AlertTriangle,
      };
    }
    return {
      status: 'in',
      text: lang === 'zh' ? '有貨，可立即發貨' : 'In stock, ships now',
      className: 'text-success bg-success/10',
      icon: CheckCircle2,
    };
  }, [product, lang]);

  const hasDiscount = product ? product.originalPrice > product.salePrice : false;
  const discountPercent =
    product && hasDiscount
      ? Math.round((1 - product.salePrice / product.originalPrice) * 100)
      : 0;

  const primaryTag = useMemo(() => {
    if (!product?.tags) return null;
    const tags = product.tags ?? [];
    if (tags.includes('new')) return 'new';
    if (tags.includes('hot')) return 'hot';
    if (tags.includes('discount') || hasDiscount) return 'discount';
    return null;
  }, [product, hasDiscount]);

  const tagConfig: Record<string, { label: string; className: string }> = {
    new: {
      label: t('product.newArrival'),
      className: 'bg-accent text-accent-foreground',
    },
    hot: {
      label: t('product.hotSale'),
      className: 'bg-price text-white',
    },
    discount: {
      label: `-${discountPercent}%`,
      className: 'bg-price text-white',
    },
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (product && next > product.stock) return product.stock;
      return next;
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product.id, selectedSpecs, quantity);
      addItem({
        id: product.id,
        nameZh: product.titleZh,
        nameEn: product.titleEn,
        price: product.salePrice,
        quantity,
        image: (product as any).mainImageUrl ?? product.mainImage ?? '',
      });
      logger.info(`added to cart: ${product.id} x${quantity}`);
    } catch (err) {
      logger.error('add to cart failed', err);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    handleAddToCart();
    navigate('/cart');
  };

  const handleThumbClick = (index: number) => {
    carouselApi?.scrollTo(index);
  };

  const toggleFavorite = () => {
    setIsFavorite((prev) => !prev);
  };

  const specList = product?.spec ?? [];

  if (loading) {
    return <SkeletonDetail />;
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-destructive mb-4">{error ?? t('common.error')}</p>
        <Button asChild variant="outline">
          <Link to="/products">
            <ChevronLeft className="w-4 h-4" />
            {lang === 'zh' ? '返回商品列表' : 'Back to products'}
          </Link>
        </Button>
      </div>
    );
  }

  const StockIcon = stockStatus.icon ?? Package;
  const displayTitle = lang === 'zh' ? product.titleZh : product.titleEn;
  const displayDesc = lang === 'zh' ? product.descZh : product.descEn;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
        <Link to="/" className="hover:text-primary transition-colors">
          {t('nav.home')}
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary transition-colors">
          {t('nav.products')}
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">
          {displayTitle}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="relative bg-card rounded-lg border border-border overflow-hidden">
            {primaryTag && (
              <span
                className={`absolute top-4 left-4 z-10 px-3 py-1 text-xs font-semibold rounded-full ${tagConfig[primaryTag].className}`}
              >
                {tagConfig[primaryTag].label}
              </span>
            )}
            <button
              type="button"
              onClick={toggleFavorite}
              className={`absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isFavorite
                  ? 'bg-price text-white'
                  : 'bg-white/90 text-foreground hover:bg-white'
              }`}
              aria-label={lang === 'zh' ? '收藏' : 'Favorite'}
            >
              <Heart
                className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`}
              />
            </button>
            {images.length > 0 ? (
              <Carousel
                opts={{ loop: true }}
                setApi={setCarouselApi}
                className="w-full"
              >
                <CarouselContent className="-ml-0">
                  {images.map((img, idx) => (
                    <CarouselItem key={idx} className="pl-0">
                      <div className="aspect-square bg-muted/30">
                        <img
                          src={img.imageUrl}
                          alt={`${displayTitle} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : (
              <div className="aspect-square bg-muted/30 flex items-center justify-center text-muted-foreground">
                <Package className="w-16 h-16 opacity-30" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleThumbClick(idx)}
                  className={`shrink-0 w-16 h-16 rounded-md border-2 overflow-hidden transition-all ${
                    currentSlide === idx
                      ? 'border-primary'
                      : 'border-transparent hover:border-border'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-foreground leading-tight mb-2">
            {displayTitle}
          </h1>

          {/* Price */}
          <div className="mb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-price font-mono">
                HK${product.salePrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-muted-foreground line-through font-mono">
                    HK${product.originalPrice.toFixed(2)}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    -{discountPercent}%
                  </Badge>
                </>
              )}
            </div>
            {/* 会员价 */}
            {memberProfile && discountRate < 1 ? (
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-accent text-accent-foreground text-xs border-0">
                  {lang === 'zh' ? '會員價' : 'Member Price'}
                </Badge>
                <span className="text-price font-bold font-mono text-lg">
                  HK${(product.salePrice * discountRate).toFixed(2)}
                </span>
                <span className="text-xs text-accent font-medium">
                  {lang === 'zh'
                    ? `會員省 ${(product.salePrice * (1 - discountRate)).toFixed(2)}`
                    : `Save ${(product.salePrice * (1 - discountRate)).toFixed(2)}`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs border-accent text-accent">
                  {lang === 'zh' ? '升級會員享優惠' : 'Join member for discount'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {lang === 'zh'
                    ? '登記成為會員享專屬折扣'
                    : 'Sign up for exclusive discounts'}
                </span>
              </div>
            )}
          </div>

          {/* Stock status */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium w-fit mb-6 ${stockStatus.className}`}
          >
            <StockIcon className="w-4 h-4" />
            {stockStatus.text}
          </div>

          {/* Specs */}
          {specList.length > 0 && (
            <div className="space-y-4 mb-6">
              {specList.map((s) => {
                const specName = s.name;
                const values = s.values;
                return (
                  <div key={specName}>
                    <p className="text-sm font-medium text-foreground mb-2">
                      {specName}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {values.map((val) => {
                        const isSelected = selectedSpecs[specName] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setSelectedSpecs((prev) => ({
                                ...prev,
                                [specName]: val,
                              }))
                            }
                            className={`px-3 py-1.5 text-sm rounded-md border transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 text-primary font-medium'
                                : 'border-border hover:border-primary/50 text-foreground'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium text-foreground w-16">
              {lang === 'zh' ? '數量' : 'Quantity'}
            </span>
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-sm font-medium">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                disabled={!!product && quantity >= product.stock}
                className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <span className="text-sm text-muted-foreground">
              {lang === 'zh'
                ? `庫存 ${product.stock} 件`
                : `${product.stock} in stock`}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Button
              variant="default"
              size="lg"
              className="flex-1 gap-2"
              onClick={handleAddToCart}
              disabled={stockStatus.status === 'out'}
            >
              <ShoppingCart className="w-4 h-4" />
              {t('product.addToCart')}
            </Button>
            <Button
              size="lg"
              className="flex-1 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground border border-accent"
              onClick={handleBuyNow}
              disabled={stockStatus.status === 'out'}
            >
              <Zap className="w-4 h-4" />
              {lang === 'zh' ? '立即購買' : 'Buy Now'}
            </Button>
          </div>

          {/* Info highlights */}
          <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              {lang === 'zh' ? '正品保證' : 'Authenticity guaranteed'}
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              {lang === 'zh' ? '香港直郵' : 'Ships from HK'}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              {lang === 'zh' ? '7天退換' : '7-day return'}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              {lang === 'zh' ? '滿$299免運' : 'Free ship over $299'}
            </div>
          </div>
        </div>
      </div>

      <ProductDetailTabs
        lang={lang}
        displayDesc={displayDesc}
        displayTitle={displayTitle}
        images={images}
        specList={specList}
      />
    </div>
  );
};

export default ProductDetailPage;
