import React, { useRef } from 'react';

import './ResponsePanel.scss';
import { Loader } from '@/components/common';
import { t } from '@/helpers/util';

interface ResponsePanelProps {
  response: string;
  loading: boolean;
  onClear: () => void;
  location: string;
  width?: number;
  height?: number;
}

const ResponsePanel = ({ response, loading, onClear, location, width, height }: ResponsePanelProps): React.JSX.Element => {
  const panelRef = useRef(null);

  return (
    <div
      ref={panelRef}
      className={`response-panel response-panel-${location}`}
      style={location === 'bottom' ? { width: '100%', height: height || 300 } : { width: width || 400, height: '100%' }}
    >
      <div className="response-header">
        <span className="response-title">{t('developer-console.output.title')}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          className="response-clear"
          stroke="#cccccc"
          onClick={onClear}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
      </div>

      <div className="response-content">
        {loading ? (
          <div className="response-loading">
            <Loader type="points" height={200} width={40} />
          </div>
        ) : response ? (
          <pre className="response-output">{response}</pre>
        ) : (
          <div className="response-empty">
            <svg width="152" height="162" viewBox="0 0 152 162" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#filter0_dddd_1_89)">
                <g clipPath="url(#clip0_1_89)">
                  <path
                    d="M6.00005 34.9982H129V112.323C129 116.01 126.012 118.998 122.325 118.998H12.6751C8.98857 118.998 6.00005 116.01 6.00005 112.323V34.9982Z"
                    fill="white"
                  />
                  <path
                    d="M5.99966 23.7014C5.99966 19.4481 9.44772 16 13.7011 16L121.554 16C125.807 16 129.255 19.4481 129.255 23.7014V34.0374L5.99966 34.0374L5.99966 23.7014Z"
                    fill="var(--header-bg-color)"
                    opacity="0.4"
                  />
                  <circle cx="101.865" cy="25.929" r="2.73901" fill="white" />
                  <circle cx="110.082" cy="25.9289" r="2.73901" fill="white" />
                  <circle cx="118.299" cy="25.9289" r="2.73901" fill="white" />
                  <path
                    d="M27 48.4982L18 58.4982L27 68.4982"
                    stroke="#EEF0F8"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M42 48.4982L36 68.4982" stroke="#EEF0F8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                  <path
                    d="M51 48.4982L60 58.4982L51 68.4982"
                    stroke="#EEF0F8"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect width="24.5015" height="5" rx="2.4064" transform="matrix(-1 0 0 1 94.5015 44.9982)" fill="#EEF0F8" />
                  <rect width="20.3403" height="5" rx="2.4064" transform="matrix(-1 0 0 1 120 44.9982)" fill="#EEF0F8" />
                  <rect width="24.5015" height="5" rx="2.4064" transform="matrix(-1 0 0 1 94.5015 55.9982)" fill="#EEF0F8" />
                  <rect width="20.3403" height="5" rx="2.4064" transform="matrix(-1 0 0 1 120 55.9982)" fill="#EEF0F8" />
                  <rect width="50" height="5" rx="2.4064" transform="matrix(-1 0 0 1 120 66.9982)" fill="#EEF0F8" />
                  <rect width="24.5015" height="4.51343" rx="2.25672" transform="matrix(-1 0 0 1 42.5016 80.9982)" fill="#EEF0F8" />
                  <rect width="71.3403" height="4.51343" rx="2.25672" transform="matrix(-1 0 0 1 119 80.9982)" fill="#EEF0F8" />
                  <rect width="24.5015" height="4.51343" rx="2.25672" transform="matrix(-1 0 0 1 42.5016 91.5117)" fill="#EEF0F8" />
                  <rect width="33.091" height="4.51343" rx="2.25672" transform="matrix(-1 0 0 1 80.7508 91.5116)" fill="#EEF0F8" />
                  <rect width="33.091" height="4.51343" rx="2.25672" transform="matrix(-1 0 0 1 119 91.5116)" fill="#EEF0F8" />
                  <rect width="101" height="4.51343" rx="2.25672" transform="matrix(-1 0 0 1 119 102.025)" fill="#EEF0F8" />
                </g>
              </g>
              <defs>
                <filter
                  id="filter0_dddd_1_89"
                  x="0"
                  y="-0.00178528"
                  width="151.256"
                  height="161.713"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                  <feOffset dx="1" dy="2" />
                  <feGaussianBlur stdDeviation="2" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0.658824 0 0 0 0 0.670588 0 0 0 0 0.721569 0 0 0 0.1 0" />
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_89" />
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                  <feOffset dx="2" dy="8" />
                  <feGaussianBlur stdDeviation="4" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0.658824 0 0 0 0 0.670588 0 0 0 0 0.721569 0 0 0 0.09 0" />
                  <feBlend mode="normal" in2="effect1_dropShadow_1_89" result="effect2_dropShadow_1_89" />
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                  <feOffset dx="5" dy="-5" />
                  <feGaussianBlur stdDeviation="5.5" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0.658824 0 0 0 0 0.670588 0 0 0 0 0.721569 0 0 0 0.05 0" />
                  <feBlend mode="normal" in2="effect2_dropShadow_1_89" result="effect3_dropShadow_1_89" />
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                  <feOffset dx="9" dy="30" />
                  <feGaussianBlur stdDeviation="6.5" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0.658824 0 0 0 0 0.670588 0 0 0 0 0.721569 0 0 0 0.01 0" />
                  <feBlend mode="normal" in2="effect3_dropShadow_1_89" result="effect4_dropShadow_1_89" />
                  <feBlend mode="normal" in="SourceGraphic" in2="effect4_dropShadow_1_89" result="shape" />
                </filter>
                <clipPath id="clip0_1_89">
                  <rect x="6" y="15.9982" width="123.256" height="102.713" rx="8.21704" fill="white" />
                </clipPath>
              </defs>
            </svg>

            {t('developer-console.output.empty')}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsePanel;
