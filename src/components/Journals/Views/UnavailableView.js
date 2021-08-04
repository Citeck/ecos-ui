import React from 'react';
import { t } from '../../../helpers/export/util';

function UnavailableView(props) {
  return (
    <div className="alert alert-secondary" role="alert">
      {t('journal.page.unavailable-view')}
    </div>
  );
}

export default UnavailableView;
