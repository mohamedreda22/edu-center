import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { WeekDays } from '@/shared/constants/enums';

const AvailabilityPicker = ({ value = { days: [], slots: [] }, onChange }) => {
  const toggleDay = (day) => {
    const days = value.days.includes(day)
      ? value.days.filter((d) => d !== day)
      : [...value.days, day];
    onChange({ ...value, days });
  };

  const addSlot = () => {
    onChange({
      ...value,
      slots: [...value.slots, { start: '09:00', end: '10:00' }],
    });
  };

  const updateSlot = (index, field, val) => {
    const slots = [...value.slots];
    slots[index][field] = val;
    onChange({ ...value, slots });
  };

  const removeSlot = (index) => {
    const slots = value.slots.filter((_, i) => i !== index);
    onChange({ ...value, slots });
  };

  return (
    <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
      <div className="space-y-2">
        <Label>أيام العمل</Label>
        <div className="flex flex-wrap gap-2">
          {Object.values(WeekDays).map((day) => (
            <Button
              key={day}
              type="button"
              variant={value.days.includes(day) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleDay(day)}
              className="text-xs"
            >
              {day}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>الفترات الزمنية</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSlot}
            className="h-7 gap-1"
          >
            <Plus className="h-3 w-3" />
            إضافة فترة
          </Button>
        </div>

        {value.slots.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            لم يتم تحديد فترات زمنية بعد.
          </p>
        )}

        <div className="space-y-2">
          {value.slots.map((slot, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="time"
                value={slot.start}
                onChange={(e) => updateSlot(index, 'start', e.target.value)}
                className="h-8 text-xs"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="time"
                value={slot.end}
                onChange={(e) => updateSlot(index, 'end', e.target.value)}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSlot(index)}
                className="h-8 w-8 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPicker;
