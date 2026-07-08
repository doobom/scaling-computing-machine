import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Label } from '@client/src/components/ui/label';
import { Plus } from 'lucide-react';
import { useLanguage } from '@client/src/hooks/useLanguage';
import { createAddress } from '@client/src/api/order';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { Address } from '@shared/api.interface';

export interface AddressDialogProps {
  onAddressCreated: (addr: Address) => void;
}

const AddressDialog = ({ onAddressCreated }: AddressDialogProps) => {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    receiverName: '',
    receiverPhone: '',
    region: '',
    detailAddress: '',
    isDefault: false,
  });

  const handleAddAddress = async () => {
    try {
      const addr = await createAddress(newAddress);
      onAddressCreated(addr);
      setOpen(false);
      setNewAddress({
        receiverName: '',
        receiverPhone: '',
        region: '',
        detailAddress: '',
        isDefault: false,
      });
    } catch (err) {
      logger.error('add address error', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4" />
          {lang === 'zh' ? '新增收貨地址' : 'Add New Address'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {lang === 'zh' ? '新增地址' : 'Add Address'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>{lang === 'zh' ? '收件人' : 'Receiver Name'}</Label>
            <Input
              value={newAddress.receiverName}
              onChange={(e) =>
                setNewAddress({ ...newAddress, receiverName: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label>{lang === 'zh' ? '聯絡電話' : 'Phone'}</Label>
            <Input
              value={newAddress.receiverPhone}
              onChange={(e) =>
                setNewAddress({ ...newAddress, receiverPhone: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label>{lang === 'zh' ? '地區' : 'Region'}</Label>
            <Input
              value={newAddress.region}
              onChange={(e) =>
                setNewAddress({ ...newAddress, region: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label>{lang === 'zh' ? '詳細地址' : 'Detail Address'}</Label>
            <Textarea
              value={newAddress.detailAddress}
              onChange={(e) =>
                setNewAddress({ ...newAddress, detailAddress: e.target.value })
              }
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{lang === 'zh' ? '取消' : 'Cancel'}</Button>
          </DialogClose>
          <Button onClick={handleAddAddress}>
            {lang === 'zh' ? '確認新增' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddressDialog;
