import PropTypes from 'prop-types';

import Record from '../../Records/Record';

export default {
  record: PropTypes.instanceOf(Record),
  onSave: PropTypes.func,
  onCancel: PropTypes.func
};
