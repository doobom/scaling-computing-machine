import { useState, useEffect } from 'react';
import { Heart, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '@client/src/components/ui/empty';
import ProductCard from '@client/src/components/ProductCard';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { getFavorites, removeFavorite } from '@client/src/api/member';
import type { FavoriteItem } from '@client/src/api/member';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';

interface FavoriteListProps {
  onClose?: () => void;
}

const FavoriteList = ({ onClose }: FavoriteListProps) => {
  const { lang } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const res = await getFavorites({ page: 1, pageSize: 20 });
      setFavorites(res.items);
    } catch (err) {
      logger.error('Failed to load favorites', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemove = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await removeFavorite(productId);
      setFavorites((prev) => prev.filter((f) => f.productId !== productId));
      toast.success(lang === 'zh' ? '已取消收藏' : 'Removed from favorites');
    } catch (err) {
      logger.error('Failed to remove favorite', err);
      toast.error(lang === 'zh' ? '取消失敗' : 'Failed to remove');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Heart className="w-6 h-6" />
          </EmptyMedia>
          <EmptyContent>
            <EmptyTitle>{lang === 'zh' ? '尚無收藏' : 'No Favorites Yet'}</EmptyTitle>
            <EmptyDescription>
              {lang === 'zh'
                ? '快去發掘心水好物吧！'
                : 'Start exploring and save your favorite items!'}
            </EmptyDescription>
          </EmptyContent>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {favorites.map((fav) => {
        const p = fav.product;
        if (!p) return null;
        return (
          <div key={fav.id} className="relative group">
            <ProductCard
              id={p.id}
              nameZh={p.titleZh}
              nameEn={p.titleEn}
              image={p.imageUrl || ''}
              price={Number(p.salePrice)}
              originalPrice={Number(p.originalPrice)}
            />
            <button
              type="button"
              onClick={(e) => handleRemove(fav.productId, e)}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
              aria-label={lang === 'zh' ? '取消收藏' : 'Remove favorite'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default FavoriteList;
