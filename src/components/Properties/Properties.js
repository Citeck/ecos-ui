import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import { t } from '../../helpers/util';
import EcosForm, { FORM_MODE_EDIT } from '../EcosForm';
import { DefineHeight, InfoText, Loader } from '../common';

import './style.scss';

class Properties extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    isReady: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })])
  };

  static defaultProps = {
    record: '',
    className: '',
    isSmallMode: false,
    isReady: true
  };

  _ecosForm = React.createRef();
  _hiddenEcosForm = React.createRef();

  state = {
    loaded: false,
    isReadySubmit: true,
    hideForm: false,
    contentHeight: 0
  };

  // hack for EcosForm force update on isSmallMode changing
  componentWillReceiveProps(nextProps) {
    if (nextProps.isSmallMode !== this.props.isSmallMode) {
      this.setState({ hideForm: true }, () => {
        this.setState({ hideForm: false });
      });
    }
  }

  onSubmitForm = () => {
    if (this._ecosForm.current) {
      this._ecosForm.current.onReload();
    }

    this.setState({ isReadySubmit: false }, () => this.setState({ isReadySubmit: true }));
  };

  onReady = () => {
    this.setState({ loaded: true });
  };

  onShowBuilder = () => {
    if (this._hiddenEcosForm.current) {
      this._hiddenEcosForm.current.onShowFormBuilder(() => {
        this.setState({ isReadySubmit: false }, () => this.setState({ isReadySubmit: true }));
      });
    }
  };

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  renderLoader() {
    const { loaded } = this.state;
    if (!loaded) {
      return <Loader className="ecos-properties__loader" />;
    }

    return null;
  }

  renderForm() {
    const { record, isSmallMode, isReady, onUpdate } = this.props;
    const { isReadySubmit, hideForm } = this.state;

    const formClassNames = classNames('ecos-properties__formio', {
      'ecos-properties__formio_small': isSmallMode
    });

    return !hideForm && isReady && isReadySubmit ? (
      <>
        {this.renderLoader()}
        <EcosForm
          ref={this._ecosForm}
          record={record}
          options={{
            readOnly: true,
            viewAsHtml: true,
            fullWidthColumns: isSmallMode,
            viewAsHtmlConfig: {
              hidePanels: isSmallMode
            },
            formMode: FORM_MODE_EDIT
          }}
          onSubmit={this.onSubmitForm}
          onFormSubmitDone={onUpdate}
          onReady={this.onReady}
          className={formClassNames}
        />
        {/* Cause: https://citeck.atlassian.net/browse/ECOSCOM-2654 */}
        <EcosForm
          ref={this._hiddenEcosForm}
          record={record}
          options={{
            formMode: FORM_MODE_EDIT
          }}
          onSubmit={this.onSubmitForm}
          onFormSubmitDone={onUpdate}
          className="d-none"
        />
      </>
    ) : (
      <InfoText text={t('properties-widget.no-form.text')} />
    );
  }

  render() {
    const { height, minHeight, forwardedRef } = this.props;
    const { loaded, contentHeight } = this.state;

    return (
      <Scrollbars
        style={{ height: contentHeight || '100%' }}
        className="ecos-properties__scroll"
        renderTrackVertical={props => <div {...props} className="ecos-properties__scroll_v" />}
      >
        <DefineHeight fixHeight={height} minHeight={minHeight} isMin={!loaded} getOptimalHeight={this.setHeight}>
          <div ref={forwardedRef}>{this.renderForm()}</div>
        </DefineHeight>
      </Scrollbars>
    );
  }
}

export default Properties;
