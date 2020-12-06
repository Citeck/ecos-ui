import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import get from 'lodash/get';
import debounce from 'lodash/debounce';

import { t } from '../../../helpers/util';
import EcosForm from '../../EcosForm/EcosForm';
import { FORM_MODE_EDIT } from '../../EcosForm/constants';
import { InfoText, Loader } from '../../common/index';
import { ComponentKeys } from '../Components';

import './style.scss';

class Properties extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    formId: PropTypes.string,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    onInlineEditSave: PropTypes.func,
    scrollProps: PropTypes.object
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
    contentHeight: 0
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.formId !== this.props.formId) {
      this.setState({ loaded: false });
    }
  }

  onSubmitForm = () => {
    const onReload = get(this._ecosForm, 'current.onReload');

    if (typeof onReload === 'function') {
      onReload();
    }

    this.setState({ isReadySubmit: false }, () => this.setState({ isReadySubmit: true }));
  };

  onReady = debounce(() => {
    console.warn('onReady in Properties');
    this.setState({ loaded: true });
  }, 350);

  onToggleLoader = (isLoading = !this.state.isLoading) => {
    this.setState({ isLoading });
  };

  onShowBuilder = () => {
    const onShowFormBuilder = get(this._hiddenEcosForm, 'current.onShowFormBuilder');

    if (typeof onShowFormBuilder === 'function') {
      onShowFormBuilder(() => {
        this.setState({ isReadySubmit: false }, () => this.setState({ isReadySubmit: true }));
      });
    }
  };

  onUpdateForm = withSaveData => {
    const form = get(this._ecosForm, 'current');

    if (!form) {
      return;
    }

    if (typeof form.onReload === 'function') {
      form.onReload.call(form, withSaveData);
    }

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
    const { isReadySubmit, loaded, isLoading } = this.state;
    const isShow = isReadySubmit;
    const isLoaded = loaded && !isLoading;

    return (
      <>
        {!isLoaded && <Loader className="ecos-properties__loader" blur />}
        <EcosForm
          testField="qwerty"
          ref={this._ecosForm}
          record={record}
          formId={formId}
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
            'd-none': !isShow || !isLoaded
          })}
          getTitle={this.getTitle}
          initiator={{
            type: 'widget',
            name: ComponentKeys.PROPERTIES
          }}
        />
        {/* Cause: https://citeck.atlassian.net/browse/ECOSCOM-2654 */}
        <EcosForm
          ref={this._hiddenEcosForm}
          record={record}
          formId={formId}
          options={{ formMode: FORM_MODE_EDIT }}
          onSubmit={this.onSubmitForm}
          onFormSubmitDone={onUpdate}
          className="d-none"
          initiator={{
            type: 'widget',
            name: ComponentKeys.PROPERTIES
          }}
        />
        {!isShow && <InfoText text={t('properties-widget.no-form.text')} />}
      </>
    );
  }

  render() {
    const { forwardedRef, className, scrollProps, minHeight } = this.props;

    return (
      <Scrollbars
        className={classNames('ecos-properties__scroll', className)}
        renderTrackVertical={props => <div {...props} className="ecos-properties__scroll_v" />}
        {...scrollProps}
      >
        <div ref={forwardedRef} style={{ minHeight: minHeight || '50px' }}>
          {this.renderForm()}
        </div>
      </Scrollbars>
    );
  }
}

export default Properties;
