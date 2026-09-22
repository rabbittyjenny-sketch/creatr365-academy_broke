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

interface DownloadConsentDialogProps {
  open: boolean;
  resourceTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Shown once per resource before the first download. The checked state +
// timestamp of the click that opened this dialog is what gets written to
// resource_download_logs (consented, downloaded_at) — that row is the
// evidence referenced if a refund/exchange dispute comes up later.
export const DownloadConsentDialog: React.FC<DownloadConsentDialogProps> = ({
  open,
  resourceTitle,
  onConfirm,
  onCancel,
}) => {
  const [checked, setChecked] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ยืนยันการดาวน์โหลดเอกสาร</DialogTitle>
          <DialogDescription className="text-left pt-2 space-y-2">
            <span className="block">
              ท่านกำลังจะดาวน์โหลด <span className="font-medium text-foreground">{resourceTitle}</span>
            </span>
            <span className="block">
              เอกสารนี้เป็นส่วนหนึ่งของเนื้อหาคอร์สที่ท่านลงทะเบียนไว้แล้ว เมื่อกดยืนยันและดาวน์โหลด
              ระบบจะถือว่าท่านได้รับเนื้อหาส่วนนี้ของคอร์สครบถ้วน และจะไม่สามารถขอคืนเงินหรือขอเปลี่ยนคอร์สเรียนสำหรับการซื้อครั้งนี้ได้อีก
            </span>
          </DialogDescription>
        </DialogHeader>

        <label className="flex items-start gap-2.5 text-sm py-2 cursor-pointer select-none">
          <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5" />
          <span>ฉันได้อ่านและเข้าใจเงื่อนไขข้างต้น และยินยอมให้ดำเนินการดาวน์โหลดเอกสารนี้</span>
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button disabled={!checked} onClick={onConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
