import cn from 'classnames';
import isNumber from 'lodash/isNumber';
import React from 'react';

import { t } from '@/helpers/util';
import './PageLoader.scss';

type Props = {
  size?: number | string;
  duration?: number;
  className?: string;
};

const PageLoader: React.FC<Props> = ({ size = 128, duration = 1.6, className }) => {
  const style: React.CSSProperties = {
    width: isNumber(size) ? `${size}px` : size,
    height: isNumber(size) ? `${size}px` : size,
    ...(duration ? ({ ['--duration' as any]: `${duration}s` } as React.CSSProperties) : {})
  };

  return (
    <div className="citeck-page-loader__container">
      <div className={cn('citeck-page-loader', className)} style={style} role="status" aria-live="polite" aria-label="Загрузка">
        <svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <g className="spinner">
            <path
              d="M15.0811 0C22.6565 0.000173921 28.9258 5.5563 29.998 12.7949H26.8574C26.178 12.7949 25.5256 12.526 25.0439 12.0469L17.5312 4.57422C16.085 3.13574 13.748 3.13573 12.3018 4.57422L4.40039 12.4336C2.94331 13.883 2.94344 16.241 4.40039 17.6904L12.3018 25.5498C13.748 26.9883 16.085 26.9883 17.5312 25.5498L25.0439 18.0771C25.5256 17.598 26.178 17.3291 26.8574 17.3291H29.9795C28.8544 24.5071 22.6132 29.9998 15.0811 30C6.75221 30 0 23.2843 0 15C0 6.71573 6.75221 0 15.0811 0Z"
              fill="currentColor"
            />
          </g>

          <rect
            width="6.87646"
            height="6.87646"
            rx="0.861861"
            transform="matrix(0.709001 0.705207 -0.709001 0.705207 15.0547 10.0009)"
            fill="currentColor"
          />
        </svg>
      </div>
      <h4>{t('page-tabs.loading')}...</h4>
    </div>
  );
};

export default PageLoader;
