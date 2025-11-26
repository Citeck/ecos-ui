import PropTypes from 'prop-types';
import React from 'react';

import { t } from '../../../helpers/export/util';
import { Field, MLText } from '../../common/form';

const Labels = {
  GO_TO_BUTTON_NAME_FIELD: 'journals.action.go-to-button-name'
};

export default function GoToButton(props) {
  return (
    <Field label={t(Labels.GO_TO_BUTTON_NAME_FIELD)} isSmall={props.isSmall}>
      <MLText value={props.value} onChange={props.onChange} />
    </Field>
  );
}

GoToButton.propTypes = {
  value: PropTypes.object,
  isSmall: PropTypes.bool,
  onChange: PropTypes.func
};
