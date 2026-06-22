/* eslint-disable header/header */
import * as React from 'react';
import { useEffect, useState } from 'react';

const useIsShownDelayed = (delayMs = 400): boolean => {
  const [isShown, setIsShown] = useState(false);
  useEffect(() => {
    let isMounted = true;
    setTimeout(() => {
      if (isMounted) setIsShown(true);
    }, delayMs);
    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return isShown;
};

export default function ImageSpinner(): JSX.Element | null {
  const isShown = useIsShownDelayed();

  if (!isShown) return null;

  return (
    <svg className="image-spinner" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="rgba(0 0 0 / .6)" />
      <circle className="circle" cx="12" cy="12" r="9" fill="none" strokeWidth="3" />
    </svg>
  );
}
