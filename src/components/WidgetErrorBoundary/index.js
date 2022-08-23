import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

import { t } from '../../helpers/util';
import { PanelBar } from '../common';

import '../ErrorBoundary/style.scss';

export class WidgetErrorBoundary extends ErrorBoundary {
  render() {
    const { title, className, message, children } = this.props;
    const { error, errorInfo } = this.state;

    if (errorInfo) {
      return (
        <div className={`ecos-error-boundary ${className} ecos-error-boundary__widget`}>
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
