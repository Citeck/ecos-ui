import React from 'react';
import PropTypes from 'prop-types';

import { t } from '../../../../helpers/util';
import PanelBar from '../../PanelBar/PanelBar';

import './style.scss';

export default class ErrorCell extends React.Component {
  static propTypes = {
    text: PropTypes.string
  };

  static defaultProps = {
    text: t('load-data-error')
  };

  state = { error: null, errorInfo: null };

  componentDidCatch(error, errorInfo) {
    console.warn(error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    const { text, data, children } = this.props;
    const { errorInfo } = this.state;

    if (errorInfo) {
      return (
        <PanelBar
          header={text || t('process-data-error')}
          open={false}
          css={{
            headerClassName: 'grid-error-cell__header',
            headerLabelClassName: 'grid-error-cell__label',
            contentClassName: 'grid-error-cell__details'
          }}
        >
          {JSON.stringify(data)}
        </PanelBar>
      );
    }

    return children;
  }
}
