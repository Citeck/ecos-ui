import React from 'react';
import get from 'lodash/get';

import DefaultGqlFormatter from './DefaultGqlFormatter';
import LocaleServiceApi from '../../../../../services/LocaleServiceApi';

export default class LocaleFormatter extends DefaultGqlFormatter {
  state = { value: '' };

  componentDidMount() {
    this.getLocalization();
  }

  getLocalization = () => {
    const { params, cell } = this.props;
    const prefix = get(params, 'prefix', '');
    const postfix = get(params, 'postfix', '');
    const value = this.value(cell);

    LocaleServiceApi.getServerMessage({ prefix, value, postfix })
      .then(value => {
        this.setState({ value });
      })
      .catch(e => {
        console.error(e);
      });
  };

  render() {
    const { value } = this.state;

    return <this.PopperWrapper text={value} />;
  }
}
