'use client';

import { useState, useEffect } from 'react';

interface FormattedDateProps {
  date: string | number | Date;
  className?: string;
}

export default function FormattedDate({ date, className }: FormattedDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className}>...</span>;
  }

  try {
    return (
      <span className={className}>
        {new Date(date).toLocaleDateString()}
      </span>
    );
  } catch (e) {
    return <span className={className}>Invalid Date</span>;
  }
}
