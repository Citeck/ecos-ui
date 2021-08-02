import React from 'react';
import PropTypes from 'prop-types';
import { t } from '../../../helpers/export/util';

UnavailableView.propTypes = {};
//todo
function UnavailableView(props) {
  return (
    <div className="alert alert-secondary" role="alert">
      {t('journal.page.unavailable-view')}
    </div>
  );
}

export default UnavailableView;
