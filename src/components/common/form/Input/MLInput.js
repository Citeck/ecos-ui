import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Input from './Input';
import { defaultLanguages } from '../../../../constants/lang';

class MLInput extends Component {
  static propTypes = {
    languages: PropTypes.array,
    lang: PropTypes.string
  };

  static defaultProps = {
    languages: defaultLanguages
  };

  render() {
    return (
      <div>
        <Input {...this.props} />
      </div>
    );
  }
}

export default MLInput;
