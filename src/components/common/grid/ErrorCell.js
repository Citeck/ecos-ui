import React from 'react';
import PropTypes from 'prop-types';

import { t } from '../../../helpers/util';
import { InfoText } from '../index';

export class ErrorCell extends React.Component {
  static propTypes = {
    text: PropTypes.string
  };

  state = { error: null, errorInfo: null };

  componentDidCatch(error, errorInfo) {
    console.warn(error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    const { text, data, children } = this.props;
    const { errorInfo } = this.state;

    if (errorInfo) {
      return (
        <div>
          <InfoText noIndents text={text || t('load-data-error')} type="error" className="ecos-info-text-cell_error" />
          <InfoText noIndents text={JSON.stringify(data)} type="info" className="ecos-info-text-cell_error" />
        </div>
      );
    }

    return children;
  }
}
