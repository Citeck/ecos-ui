import React from 'react';

import { t } from '../../../../helpers/util';

import './style.scss';

const Placeholder = () => {
  return <div className="ecos-rt-editor-placeholder">{t('editor.placeholder')}</div>;
};

export default Placeholder;
