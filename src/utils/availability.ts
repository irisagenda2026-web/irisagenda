import { Agendamento, Bloqueio, AvailabilityOverride } from '../types/firebase';

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
  // Format date as YYYY-MM-DD in local time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const dayOfWeek = date.getDay().toString();

  // 1. Determine working hours for the day
  let workingSlots: any[] = [];
  let isWorkingDay = false;

  const override = overrides.find(o => o.date === dateStr);
  
  if (override) {
    isWorkingDay = override.isWorkingDay;
    if (isWorkingDay && override.slots) {
      workingSlots = override.slots;
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
    // Check agendamentos
    for (const ag of agendamentos) {
      const agStart = new Date(ag.startTime);
      const agEnd = new Date(ag.endTime);
      
      // Only check same day
      if (agStart.getDate() === date.getDate() && agStart.getMonth() === date.getMonth() && agStart.getFullYear() === date.getFullYear()) {
        const agStartMins = agStart.getHours() * 60 + agStart.getMinutes();
        const agEndMins = agEnd.getHours() * 60 + agEnd.getMinutes();

        // Overlap condition: (StartA < EndB) and (EndA > StartB)
        if (slotStartMins < agEndMins && slotEndMins > agStartMins) {
          return true; // Overlaps
        }
      }
    }

    // Check bloqueios
    for (const bl of bloqueios) {
      const blStart = new Date(bl.startTime);
      const blEnd = new Date(bl.endTime);
      
      // Only check same day
      if (blStart.getDate() === date.getDate() && blStart.getMonth() === date.getMonth() && blStart.getFullYear() === date.getFullYear()) {
        const blStartMins = blStart.getHours() * 60 + blStart.getMinutes();
        const blEndMins = blEnd.getHours() * 60 + blEnd.getMinutes();

        if (slotStartMins < blEndMins && slotEndMins > blStartMins) {
          return true; // Overlaps
        }
      }
    }

    // Check if slot is in the past (if today)
    const now = new Date();
    if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      const nowMins = now.getHours() * 60 + now.getMinutes();
      if (slotStartMins <= nowMins) {
        return true; // Overlaps with the past
      }
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
