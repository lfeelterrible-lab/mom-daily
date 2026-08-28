import { useEffect, useState } from 'react';

import { getLocalDate } from '@/lib/date';

/** Keeps date-based screens aligned with the device's local calendar after midnight. */
export const useLocalDate = () => {
  const [date, setDate] = useState(getLocalDate);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextDate = getLocalDate();
      setDate((currentDate) => (currentDate === nextDate ? currentDate : nextDate));
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

  return date;
};
