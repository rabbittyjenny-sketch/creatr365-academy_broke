import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface ToolboxDownloadConsentDialogProps {
  open: boolean;
  assetTitle: string;
  /** Premium (bought) file — same license terms, wording says "purchased" instead of "free". */
  isPremium?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Toolbox files come under a personal-use license. Free files: license only.
// Premium (bought) files: license + the same "downloading counts as received,
// no refund" condition DownloadConsentDialog uses for course materials —
// a paid digital file follows the same refund logic as paid course files. Shown once per asset per user; the
// checked state of the click that opens this dialog is what gets written to
// toolbox_downloads.consented — same evidentiary purpose as
// resource_download_logs.consented, for if a license dispute comes up later.
export const ToolboxDownloadConsentDialog: React.FC<ToolboxDownloadConsentDialogProps> = ({
  open,
  assetTitle,
  isPremium = false,
  onConfirm,
  onCancel,
}) => {
  const [checked, setChecked] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isPremium ? 'เงื่อนไขการใช้งานไฟล์ Premium' : 'เงื่อนไขการใช้งานไฟล์ฟรี'}</DialogTitle>
          <DialogDescription className="text-left pt-2 space-y-2">
            <span className="block">
              ท่านกำลังจะดาวน์โหลด <span className="font-medium text-foreground">{assetTitle}</span> จาก Toolbox
            </span>
            <span className="block">
              {isPremium ? 'ไฟล์นี้ซื้อเพื่อ' : 'ไฟล์นี้แจกฟรีเพื่อ'}ให้นำไปใช้งานส่วนตัวหรือใช้งานภายในธุรกิจของท่านเท่านั้น
              <strong className="text-foreground"> ห้ามนำไปขาย ห้ามนำไปแจกจ่ายต่อ และห้ามนำไปใช้เพื่อวัตถุประสงค์เชิงพาณิชย์ในนามของผู้อื่น</strong>
              {' '}(เช่น ขายต่อเป็นเทมเพลตของตนเอง หรือแนบไปกับสินค้า/บริการที่เรียกเก็บเงิน) โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษรจาก Creatr365 ก่อน
            </span>
            {isPremium && (
              <span className="block">
                เมื่อกดยืนยันและดาวน์โหลด ระบบจะถือว่าท่านได้รับไฟล์ที่ซื้อครบถ้วนแล้ว และจะไม่สามารถขอคืนเงินสำหรับการซื้อครั้งนี้ได้อีก
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <label className="flex items-start gap-2.5 text-sm py-2 cursor-pointer select-none">
          <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5" />
          <span>ฉันได้อ่านและยอมรับเงื่อนไขการใช้งานไฟล์ข้างต้นแล้ว</span>
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button disabled={!checked} onClick={onConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
