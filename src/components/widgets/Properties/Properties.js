import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
import EcosForm, { FORM_MODE_EDIT } from '../../EcosForm/index';
import { DefineHeight, InfoText, Loader } from '../../common/index';

import './style.scss';

class Properties extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    formId: PropTypes.string,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    maxHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    onInlineEditSave: PropTypes.func
  };

  static defaultProps = {
    record: '',
    className: '',
    isSmallMode: false
  };

  _ecosForm = React.createRef();
  _hiddenEcosForm = React.createRef();

  state = {
    loaded: false,
    isLoading: false,
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

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.formId !== this.props.formId) {
      this.setState({ loaded: false });
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

  onToggleLoader = (isLoading = !this.state.isLoading) => {
    this.setState({ isLoading });
  };

  onShowBuilder = () => {
    if (this._hiddenEcosForm.current) {
      this._hiddenEcosForm.current.onShowFormBuilder(() => {
        this.setState({ isReadySubmit: false }, () => this.setState({ isReadySubmit: true }));
      });
    }
  };

  onUpdateForm = () => {
    const onUpdate = get(this._ecosForm, 'current.onReload');

    if (typeof onUpdate !== 'function') {
      return;
    }

    onUpdate.call(this._ecosForm.current);
    this.setState({ loaded: false });
  };

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  getTitle = title => {
    this.props.getTitle && this.props.getTitle(title);
  };

  renderForm() {
    const { record, isSmallMode, onUpdate, formId, onInlineEditSave } = this.props;
    const { isReadySubmit, hideForm, loaded, isLoading } = this.state;
    const isShow = !hideForm && isReadySubmit;

    return (
      <>
        {(!loaded || isLoading) && <Loader className="ecos-properties__loader" blur />}
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
            formMode: FORM_MODE_EDIT,
            onInlineEditSave
          }}
          onFormSubmitDone={onUpdate}
          onReady={this.onReady}
          onToggleLoader={this.onToggleLoader}
          className={classNames('ecos-properties__formio', {
            'ecos-properties__formio_small': isSmallMode,
            'd-none': !isShow
          })}
          formId={formId}
          getTitle={this.getTitle}
        />
        {/* Cause: https://citeck.atlassian.net/browse/ECOSCOM-2654 */}

        <EcosForm
          ref={this._hiddenEcosForm}
          record={record}
          options={{ formMode: FORM_MODE_EDIT }}
          onSubmit={this.onSubmitForm}
          onFormSubmitDone={onUpdate}
          className="d-none"
        />
        {!isShow && <InfoText text={t('properties-widget.no-form.text')} />}
      </>
    );
  }

  render() {
    const { height, minHeight, forwardedRef, className } = this.props;
    const { loaded, contentHeight } = this.state;

    return (
      <Scrollbars
        style={{ height: contentHeight || '100%' }}
        className={classNames('ecos-properties__scroll', className)}
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
