import DOMPurify from 'dompurify';
import React, { useState, useEffect } from 'react';

interface SafeSvgLoaderProps {
  externalUrl: string;
  className?: string;
  style?: React.CSSProperties;
}

const SafeSvgLoader: React.FC<SafeSvgLoaderProps> = ({ externalUrl, className, ...props }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [contentType, setContentType] = useState<string>('');

  useEffect(() => {
    const fetchSvg = async () => {
      try {
        const response = await fetch(externalUrl);

        if (!response.ok) {
          return console.error(`HTTP error! status: ${response.status}`);
        }

        setContentType(response?.headers?.get('content-type') || '');
        const svgText = await response.text();

        const cleanSvg = DOMPurify.sanitize(svgText, {
          USE_PROFILES: { svg: true, svgFilters: true }
        });

        setSvgContent(cleanSvg);
      } catch (error) {
        console.error('Error loading SVG:', error);
      }
    };

    fetchSvg();
  }, [externalUrl]);

  if (contentType === '') {
    return <></>;
  }

  if (contentType === 'image/svg+xml') {
    return <div {...props} className={className} dangerouslySetInnerHTML={{ __html: svgContent }} />;
  }

  return <img {...props} className={className} src={externalUrl} />;
};

export default SafeSvgLoader;
