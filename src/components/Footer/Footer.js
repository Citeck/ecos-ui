import React from 'react';
import SurfRegion from '../SurfRegion';

const ShareFooter = function({ theme }) {
  return (
    <div id="alf-ft">
      <SurfRegion
        className="sticky-footer"
        args={{
          regionId: 'footer',
          scope: 'global',
          pageid: 'card-details',
          theme: theme,
          cacheAge: 600
        }}
      />
    </div>
  );
};

export default ShareFooter;
