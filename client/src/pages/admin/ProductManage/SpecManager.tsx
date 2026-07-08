import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { Plus, Trash2, X, Tag } from 'lucide-react';
import { useLanguage } from '@client/src/hooks/useLanguage';
import type { ProductSpec } from '@client/src/api/product';

interface SpecManagerProps {
  specs: ProductSpec[];
  onChange: (specs: ProductSpec[]) => void;
}

const SpecManager = ({ specs, onChange }: SpecManagerProps) => {
  const { lang } = useLanguage();

  const handleAddSpec = () => {
    const newSpec: ProductSpec = { name: '', values: [''] };
    onChange([...specs, newSpec]);
  };

  const handleRemoveSpec = (index: number) => {
    onChange(specs.filter((_, i) => i !== index));
  };

  const handleSpecNameChange = (index: number, name: string) => {
    const newSpec = [...specs];
    newSpec[index] = { ...newSpec[index], name };
    onChange(newSpec);
  };

  const handleSpecValueChange = (
    specIndex: number,
    valueIndex: number,
    value: string,
  ) => {
    const newSpec = [...specs];
    const values = [...newSpec[specIndex].values];
    values[valueIndex] = value;
    newSpec[specIndex] = { ...newSpec[specIndex], values };
    onChange(newSpec);
  };

  const handleAddSpecValue = (specIndex: number) => {
    const newSpec = [...specs];
    newSpec[specIndex] = {
      ...newSpec[specIndex],
      values: [...newSpec[specIndex].values, ''],
    };
    onChange(newSpec);
  };

  const handleRemoveSpecValue = (specIndex: number, valueIndex: number) => {
    const newSpec = [...specs];
    const values = newSpec[specIndex].values.filter((_, i) => i !== valueIndex);
    if (values.length === 0) return;
    newSpec[specIndex] = { ...newSpec[specIndex], values };
    onChange(newSpec);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">
          {lang === 'zh' ? '規格列表' : 'Specifications'}
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={handleAddSpec}>
          <Plus className="w-4 h-4 mr-1" />
          {lang === 'zh' ? '添加規格' : 'Add Spec'}
        </Button>
      </div>

      {specs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {lang === 'zh' ? '暫無規格，可按需添加' : 'No specs yet'}
          </p>
        </div>
      )}

      {specs.map((spec, specIndex) => (
        <div
          key={specIndex}
          className="p-4 border border-border rounded-lg space-y-3"
        >
          <div className="flex items-center gap-2">
            <Label className="w-20 shrink-0">
              {lang === 'zh' ? '規格名' : 'Spec Name'}
            </Label>
            <Input
              value={spec.name}
              onChange={(e) => handleSpecNameChange(specIndex, e.target.value)}
              placeholder={lang === 'zh' ? '如：顏色、尺寸' : 'e.g. Color, Size'}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveSpec(specIndex)}
              className="text-destructive hover:text-destructive shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2 pl-24">
            {spec.values.map((val, valIndex) => (
              <div key={valIndex} className="flex items-center gap-2">
                <Input
                  value={val}
                  onChange={(e) =>
                    handleSpecValueChange(specIndex, valIndex, e.target.value)
                  }
                  placeholder={lang === 'zh' ? '規格值' : 'Value'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveSpecValue(specIndex, valIndex)}
                  disabled={spec.values.length <= 1}
                  className="text-destructive hover:text-destructive shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddSpecValue(specIndex)}
            >
              <Plus className="w-4 h-4 mr-1" />
              {lang === 'zh' ? '添加規格值' : 'Add Value'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SpecManager;
