import { Agendamento, Bloqueio, AvailabilityOverride } from '../types/firebase';
import { format, isSameDay, startOfDay } from 'date-fns';

export interface TimeSlot {
  time: string; // HH:mm
  available: boolean;
}

export function generateTimeSlots(
  date: Date,
  businessHours: any,
  overrides: AvailabilityOverride[],
  agendamentos: Agendamento[],
  bloqueios: Bloqueio[],
  serviceDurationMinutes: number,
  serviceId: string,
  intervalMinutes: number = 30
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Use date-fns for consistent date string generation (local time)
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayOfWeek = date.getDay().toString();

  // 1. Determine working hours for the day
  let workingSlots: any[] = [];
  let isWorkingDay = false;

  const override = overrides.find(o => o.date === dateStr);
  
  if (override) {
    isWorkingDay = override.isOpen;
    if (isWorkingDay && override.slots && override.slots.length > 0) {
      workingSlots = override.slots;
    } else if (isWorkingDay) {
      // If marked open but no slots, fallback to standard hours for that day
      const standardDay = businessHours?.[dayOfWeek];
      if (standardDay && standardDay.isOpen && standardDay.slots) {
        workingSlots = standardDay.slots;
      }
    }
  } else if (businessHours && businessHours[dayOfWeek]) {
    isWorkingDay = businessHours[dayOfWeek].isOpen;
    if (isWorkingDay && businessHours[dayOfWeek].slots) {
      workingSlots = businessHours[dayOfWeek].slots;
    }
  }

  if (!isWorkingDay || workingSlots.length === 0) {
    return []; // No slots available if not a working day
  }

  // Helper to convert HH:mm to minutes since midnight
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // Helper to convert minutes to HH:mm
  const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // 2. Generate all possible slots based on interval
  workingSlots.forEach(ws => {
    // Check if service is allowed in this slot
    if (ws.serviceIds && ws.serviceIds.length > 0 && !ws.serviceIds.includes(serviceId)) {
      return;
    }

    const startMins = timeToMinutes(ws.start);
    const endMins = timeToMinutes(ws.end);

    for (let currentMins = startMins; currentMins + serviceDurationMinutes <= endMins; currentMins += intervalMinutes) {
      slots.push({
        time: minutesToTime(currentMins),
        available: true
      });
    }
  });

  // 3. Filter out slots that overlap with appointments or blocks
  const checkOverlap = (slotStartMins: number, slotEndMins: number) => {
    // Convert slot times to absolute timestamps for more accurate comparison
    const slotStartTime = new Date(date);
    slotStartTime.setHours(Math.floor(slotStartMins / 60), slotStartMins % 60, 0, 0);
    const slotEndTime = new Date(date);
    slotEndTime.setHours(Math.floor(slotEndMins / 60), slotEndMins % 60, 0, 0);

    const slotStartTs = slotStartTime.getTime();
    const slotEndTs = slotEndTime.getTime();

    // Check agendamentos
    for (const ag of agendamentos) {
      // Ignore cancelled appointments
      if (ag.status === 'cancelled') continue;

      // Overlap condition: (StartA < EndB) and (EndA > StartB)
      if (slotStartTs < ag.endTime && slotEndTs > ag.startTime) {
        return true; // Overlaps
      }
    }

    // Check bloqueios
    for (const bl of bloqueios) {
      if (slotStartTs < bl.endTime && slotEndTs > bl.startTime) {
        return true; // Overlaps
      }
    }

    // Check if slot is in the past (if today)
    const now = new Date();
    // Add a 30-minute buffer for same-day bookings
    const bufferMs = 30 * 60 * 1000;
    if (slotStartTs <= now.getTime() + bufferMs) {
      return true; // Too soon or in the past
    }

    return false; // No overlap
  };

  // Apply overlap check
  slots.forEach(slot => {
    const slotStartMins = timeToMinutes(slot.time);
    const slotEndMins = slotStartMins + serviceDurationMinutes;
    if (checkOverlap(slotStartMins, slotEndMins)) {
      slot.available = false;
    }
  });

  return slots;
}
