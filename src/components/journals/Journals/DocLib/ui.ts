import React from 'react';

import EcosIconRaw from '@/components/common/EcosIcon';

interface EcosIconProps {
  className?: string;
  data: { value: string };
  title?: string;
  id?: string;
  onClick?: (e: React.MouseEvent) => void;
}

// EcosIcon is a plain JS component: TS infers every destructured prop as required
export const EcosIcon = EcosIconRaw as unknown as React.ComponentType<EcosIconProps>;
