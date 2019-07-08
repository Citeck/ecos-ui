import * as React from 'react';
import PropTypes from 'prop-types';

class Barcode extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string
  };

  static defaultProps = {
    record: '',
    className: ''
  };

  render() {
    return <div>тест</div>;
  }
}

export default Barcode;
