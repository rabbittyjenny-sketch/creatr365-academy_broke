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
  onConfirm: () => void;
  onCancel: () => void;
}

// Toolbox files are given away free, but under a personal-use license — a
// separate warning from DownloadConsentDialog (which is about course
// materials and refund forfeiture). Shown once per asset per user; the
// checked state of the click that opens this dialog is what gets written to
// toolbox_downloads.consented — same evidentiary purpose as
// resource_download_logs.consented, for if a license dispute comes up later.
export const ToolboxDownloadConsentDialog: React.FC<ToolboxDownloadConsentDialogProps> = ({
  open,
  assetTitle,
  onConfirm,
  onCancel,
}) => {
  const [checked, setChecked] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>เงื่อนไขการใช้งานไฟล์ฟรี</DialogTitle>
          <DialogDescription className="text-left pt-2 space-y-2">
            <span className="block">
              ท่านกำลังจะดาวน์โหลด <span className="font-medium text-foreground">{assetTitle}</span> จาก Toolbox
            </span>
            <span className="block">
              ไฟล์นี้แจกฟรีเพื่อให้นำไปใช้งานส่วนตัวหรือใช้งานภายในธุรกิจของท่านเท่านั้น
              <strong className="text-foreground"> ห้ามนำไปขาย ห้ามนำไปแจกจ่ายต่อ และห้ามนำไปใช้เพื่อวัตถุประสงค์เชิงพาณิชย์ในนามของผู้อื่น</strong>
              {' '}(เช่น ขายต่อเป็นเทมเพลตของตนเอง หรือแนบไปกับสินค้า/บริการที่เรียกเก็บเงิน) โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษรจาก Creatr365 ก่อน
            </span>
          </DialogDescription>
        </DialogHeader>

        <label className="flex items-start gap-2.5 text-sm py-2 cursor-pointer select-none">
          <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5" />
          <span>ฉันได้อ่านและยอมรับเงื่อนไขการใช้งานไฟล์ฟรีข้างต้นแล้ว</span>
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button disabled={!checked} onClick={onConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
