// src/components/ui/time-picker.tsx
"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  minuteStep?: number;
}

export function TimePicker({
  value = "",
  onChange,
  className,
  disabled = false,
  minuteStep = 15
}: TimePickerProps) {
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);

  // Generate hours and minutes options
  const hoursOptions = Array.from({ length: 24 }, (_, i) => i);
  const minutesOptions = Array.from(
    { length: 60 / minuteStep },
    (_, i) => i * minuteStep
  );

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [hoursStr, minutesStr] = value.split(":");
      const parsedHours = parseInt(hoursStr, 10);
      const parsedMinutes = parseInt(minutesStr, 10);
      
      if (!isNaN(parsedHours)) {
        setHours(parsedHours);
      }
      
      if (!isNaN(parsedMinutes)) {
        // Find closest minute step
        const closestMinute = minutesOptions.reduce((prev, curr) => {
          return Math.abs(curr - parsedMinutes) < Math.abs(prev - parsedMinutes) ? curr : prev;
        });
        setMinutes(closestMinute);
      }
    }
  }, [value, minutesOptions]);

  // Update value when hours or minutes change
  const handleHoursChange = (value: string) => {
    const newHours = parseInt(value, 10);
    setHours(newHours);
    emitChange(newHours, minutes);
  };

  const handleMinutesChange = (value: string) => {
    const newMinutes = parseInt(value, 10);
    setMinutes(newMinutes);
    emitChange(hours, newMinutes);
  };

  // Emit change event
  const emitChange = (h: number, m: number) => {
    if (onChange) {
      const formatted = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      onChange(formatted);
    }
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Select
        value={hours.toString()}
        onValueChange={handleHoursChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Hora" />
        </SelectTrigger>
        <SelectContent>
          {hoursOptions.map((hour) => (
            <SelectItem key={hour} value={hour.toString()}>
              {hour.toString().padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <span className="text-center">:</span>
      
      <Select
        value={minutes.toString()}
        onValueChange={handleMinutesChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent>
          {minutesOptions.map((minute) => (
            <SelectItem key={minute} value={minute.toString()}>
              {minute.toString().padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}