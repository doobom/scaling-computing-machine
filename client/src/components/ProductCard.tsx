import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useLanguage } from '@client/src/hooks/useLanguage';

export type ProductTag = 'new' | 'hot' | 'discount' | 'none';

export interface ProductCardProps {
  id: string;
  nameZh: string;
  nameEn: string;
  image: string;
  originalPrice?: number;
  price: number;
  tag?: ProductTag;
  discountPercent?: number;
}

const ProductCard = ({
  id,
  nameZh,
  nameEn,
  image,
  originalPrice,
  price,
  tag = 'none',
  discountPercent,
}: ProductCardProps) => {
  const { lang, t } = useLanguage();

  const tagConfig: Record<Exclude<ProductTag, 'none'>, { label: string; className: string }> = {
    new: {
      label: t('product.newArrival'),
      className: 'bg-accent text-accent-foreground',
    },
    hot: {
      label: t('product.hotSale'),
      className: 'bg-price text-price-foreground',
    },
    discount: {
      label: discountPercent ? `-${discountPercent}%` : t('product.discount'),
      className: 'bg-price text-price-foreground',
    },
  };

  const displayName = lang === 'zh' ? nameZh : nameEn;

  return (
    <Link
      to={`/products/${id}`}
      className="group bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <img
          src={image}
          alt={displayName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {tag !== 'none' && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full ${tagConfig[tag].className}`}
          >
            {tagConfig[tag].label}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
          }}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-white"
          aria-label={t('product.addToCart')}
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug min-h-[2.5rem] mb-2">
          {displayName}
        </h3>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-bold text-price font-mono">
            HK${price.toFixed(2)}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs text-muted-foreground line-through font-mono">
              HK${originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
