import { useState } from 'react';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
import {
  Plus,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
} from 'lucide-react';
import { useLanguage } from '@client/src/hooks/useLanguage';
import type { ProductImage } from '@client/src/api/product';

interface ImageManagerProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

const ImageManager = ({ images, onChange }: ImageManagerProps) => {
  const { lang } = useLanguage();
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleAddImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    const newImg: ProductImage = {
      imageUrl: url,
      sort: images.length,
      isMain: images.length === 0,
    };
    onChange([...images, newImg]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const hasMain = newImages.some((img) => img.isMain);
    if (!hasMain && newImages.length > 0) {
      newImages[0].isMain = true;
    }
    newImages.forEach((img, i) => {
      img.sort = i;
    });
    onChange(newImages);
  };

  const handleSetMainImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isMain: i === index,
    }));
    onChange(newImages);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newImages.length) return;
    [newImages[index], newImages[target]] = [newImages[target], newImages[index]];
    newImages.forEach((img, i) => {
      img.sort = i;
    });
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newImageUrl}
          onChange={(e) => setNewImageUrl(e.target.value)}
          placeholder={lang === 'zh' ? '輸入圖片URL...' : 'Enter image URL...'}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddImage();
            }
          }}
        />
        <Button type="button" onClick={handleAddImage}>
          <Plus className="w-4 h-4 mr-1" />
          {lang === 'zh' ? '添加' : 'Add'}
        </Button>
      </div>

      <div className="space-y-2">
        {images.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {lang === 'zh' ? '暫無圖片，請添加商品圖片' : 'No images yet'}
            </p>
          </div>
        )}
        {images.map((img, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 p-3 border rounded-lg ${
              img.isMain ? 'border-accent/50 bg-accent/5' : 'border-border'
            }`}
          >
            <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
              <img
                src={img.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{img.imageUrl}</p>
              <div className="flex items-center gap-2 mt-1">
                {img.isMain && (
                  <Badge
                    variant="default"
                    className="bg-accent text-accent-foreground"
                  >
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    {lang === 'zh' ? '主圖' : 'Main'}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {lang === 'zh' ? '排序' : 'Sort'}: {img.sort}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => moveImage(index, 'up')}
                disabled={index === 0}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => moveImage(index, 'down')}
                disabled={index === images.length - 1}
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
              {!img.isMain && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSetMainImage(index)}
                >
                  <Star className="w-4 h-4 mr-1" />
                  {lang === 'zh' ? '設主圖' : 'Main'}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveImage(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageManager;
