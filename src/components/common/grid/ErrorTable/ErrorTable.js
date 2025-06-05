import React from 'react';

import { InfoText } from '../../index';

export default class ErrorTable extends React.Component {
  state = { error: null };

  componentDidCatch(error, errorInfo) {
    this.setState({ error });
  }

  render() {
    const { children } = this.props;
    const { error } = this.state;

    if (error) {
      return <InfoText text={error.message} type="warn" />;
    }

    return children;
  }
}
