import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import type { Product, ProductImage, ProductSpec } from '@client/src/api/product';

interface ProductDetailTabsProps {
  lang: 'zh' | 'en';
  displayDesc?: string;
  displayTitle: string;
  images: ProductImage[];
  specList: ProductSpec[];
}

const ProductDetailTabs = ({
  lang,
  displayDesc,
  displayTitle,
  images,
  specList,
}: ProductDetailTabsProps) => {
  return (
    <div className="mt-10">
      <Tabs defaultValue="description">
        <TabsList className="w-full border-b border-border rounded-none bg-transparent h-auto p-0">
          <TabsTrigger
            value="description"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6 py-3 h-auto bg-transparent"
          >
            {lang === 'zh' ? '商品介紹' : 'Description'}
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6 py-3 h-auto bg-transparent"
          >
            {lang === 'zh' ? '規格參數' : 'Specifications'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="pt-6">
          {displayDesc ? (
            <div className="prose prose-sm max-w-none text-foreground">
              <p className="whitespace-pre-wrap leading-relaxed">
                {displayDesc}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {lang === 'zh' ? '暫無商品描述' : 'No description yet'}
            </p>
          )}
          {images.length > 1 && (
            <div className="mt-6 space-y-4">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img.imageUrl}
                  alt={`${displayTitle} detail ${idx + 1}`}
                  className="w-full rounded-lg border border-border"
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="specs" className="pt-6">
          {specList.length > 0 ? (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {specList.map((s, idx) => {
                    const specName = s.name;
                    const values = s.values;
                    return (
                      <tr
                        key={specName}
                        className={idx % 2 === 0 ? 'bg-muted/30' : ''}
                      >
                        <td className="py-3 px-4 font-medium text-foreground w-1/3 border-r border-border">
                          {specName}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {values.join(' / ')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {lang === 'zh' ? '暫無規格信息' : 'No specs info'}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductDetailTabs;
