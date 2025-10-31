import React from 'react';

import Checkbox from '../../form/Checkbox';

const Selector = ({ mode, ...rest }) => (
  <div className="ecos-grid__checkbox ecos-grid__checkbox_block">
    <Checkbox checked={rest.checked} disabled={rest.disabled} />
  </div>
);

export default Selector;
