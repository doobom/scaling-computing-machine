import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { Checkbox } from '@client/src/components/ui/checkbox';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Badge } from '@client/src/components/ui/badge';
import { EmptyState } from '@client/src/components/ui/EmptyState';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { getCart, updateCartItem, removeCartItem } from '@client/src/api/order';
import type { CartItem } from '@shared/api.interface';
import { logger } from '@lark-apaas/client-toolkit/logger';

const CartPage = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCart();
      setItems(data.items);
      if (data.items.length > 0 && selectedIds.size === 0) {
        setSelectedIds(new Set(data.items.map((i: CartItem) => i.id)));
      }
    } catch (err) {
      logger.error('load cart error', err);
    } finally {
      setLoading(false);
    }
  }, [selectedIds.size]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleQuantityChange = async (id: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      await updateCartItem(id, newQty);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, quantity: newQty, subtotal: item.price * newQty }
            : item,
        ),
      );
    } catch (err) {
      logger.error('update quantity error', err);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeCartItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      logger.error('remove item error', err);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const shippingFee = totalAmount >= 299 || totalAmount === 0 ? 0 : 30;
  const payAmount = totalAmount + shippingFee;

  const handleCheckout = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    navigate('/checkout', { state: { cartItemIds: ids } });
  };

  const specLabel = (spec: Record<string, string>) => {
    return Object.entries(spec)
      .map(([, v]) => v)
      .join(' / ');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse h-8 bg-muted rounded w-32 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          type="cart"
          actionPath="/products"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
      <h1 className="text-2xl font-semibold text-foreground mb-6">
        {lang === 'zh' ? '購物車' : 'Shopping Cart'}
      </h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3 border-b border-border">
              <Checkbox
                checked={selectedIds.size === items.length && items.length > 0}
                onCheckedChange={toggleSelectAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                {lang === 'zh' ? '全選' : 'Select All'} ({items.length})
              </label>
            </CardContent>
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggleSelect(item.id)}
                    className="mt-1"
                  />
                  <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0">
                    {item.productImageUrl ? (
                      <img
                        src={item.productImageUrl}
                        alt={lang === 'zh' ? item.productTitleZh : item.productTitleEn}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {lang === 'zh' ? item.productTitleZh : item.productTitleEn}
                    </h3>
                    {specLabel(item.spec) && (
                      <Badge variant="secondary" className="mt-1">
                        {specLabel(item.spec)}
                      </Badge>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-price font-semibold font-mono">
                        HK${item.price.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {lang === 'zh' ? '小計：' : 'Subtotal: '}
                        <span className="text-price font-semibold font-mono">
                          HK${item.subtotal.toFixed(2)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive h-7 px-2"
                        onClick={() => handleRemove(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h2 className="font-semibold text-lg mb-4">
                {lang === 'zh' ? '訂單摘要' : 'Order Summary'}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '已選商品' : 'Selected Items'}
                  </span>
                  <span>{totalQuantity} {lang === 'zh' ? '件' : 'pcs'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '商品總額' : 'Subtotal'}
                  </span>
                  <span className="font-mono">HK${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '運費' : 'Shipping'}
                  </span>
                  <span className="font-mono">
                    {shippingFee === 0
                      ? (lang === 'zh' ? '免運' : 'Free')
                      : `HK$${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                {totalAmount > 0 && totalAmount < 299 && (
                  <div className="text-xs text-accent">
                    {lang === 'zh'
                      ? `再買 HK$${(299 - totalAmount).toFixed(2)} 免運費`
                      : `Add HK$${(299 - totalAmount).toFixed(2)} more for free shipping`}
                  </div>
                )}
                <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
                  <span className="font-medium">
                    {lang === 'zh' ? '應付總額' : 'Total'}
                  </span>
                  <span className="text-price text-xl font-bold font-mono">
                    HK${payAmount.toFixed(2)}
                  </span>
                </div>
              </div>
              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handleCheckout}
                disabled={selectedIds.size === 0}
              >
                {lang === 'zh' ? '去結算' : 'Checkout'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
