import React from 'react';
import PropTypes from 'prop-types';

import { t } from '../../helpers/util';
import { PanelBar } from '../common';

import './style.scss';

export class ErrorBoundary extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    title: PropTypes.string,
    message: PropTypes.string
  };

  static defaultProps = {
    className: ''
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
    const { title, className, message, children } = this.props;
    const { error, errorInfo } = this.state;

    if (errorInfo) {
      return (
        <div className={'ecos-error-boundary ' + className}>
          {!!title && <div className="ecos-error-boundary__title">{title}</div>}
          {!!message && <div className="ecos-error-boundary__message">{message}</div>}
          <PanelBar header={t('page.error-loading.log')} className="ecos-error-boundary__panel-bar" open={false}>
            <div className="ecos-error-boundary__details">
              {!!error && <div className="ecos-error-boundary__details-msg">{error.toString()}</div>}
              <div className="ecos-error-boundary__details-stack">{errorInfo.componentStack}</div>
            </div>
          </PanelBar>
        </div>
      );
    }

    return children;
  }
}
