import React from 'react';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

const FormDialog = ({
  title,
  description,
  trigger,
  children,
  open,
  onOpenChange,
  onSave,
  saveText = 'حفظ',
  cancelText = 'إلغاء',
  isSubmitting = false,
  formId,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden"
        dir="rtl"
      >
        <div className="h-2 bg-secondary w-full" />
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-right text-2xl font-black text-primary tracking-tight">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-right font-medium text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="p-6 py-4">{children}</div>
        <DialogFooter className="p-6 pt-2 bg-gray-50 flex flex-row-reverse gap-3 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {cancelText}
          </Button>
          <Button
            type={formId ? 'submit' : 'button'}
            form={formId}
            onClick={onSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'جاري الحفظ...' : saveText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
