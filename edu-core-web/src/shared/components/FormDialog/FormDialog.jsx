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
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-right">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4">{children}</div>
        <DialogFooter className="gap-2 sm:gap-0">
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
