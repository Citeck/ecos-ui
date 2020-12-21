import React from 'react';
import PropTypes from 'prop-types';

import { InfoText } from '../index';

export class ErrorCell extends React.Component {
  static propTypes = {
    text: PropTypes.string
  };

  static defaultProps = {
    text: "Data hasn't loaded"
  };

  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

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
          <InfoText noIndents text={text} type="error" className="ecos-info-text-cell_error" />
          <InfoText noIndents text={JSON.stringify(data)} type="info" className="ecos-info-text-cell_error" />
        </div>
      );
    }

    return children;
  }
}
