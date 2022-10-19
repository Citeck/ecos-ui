import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Scrollbars } from 'react-custom-scrollbars';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';

import { t } from '../../../helpers/util';
import EcosForm from '../../EcosForm/EcosForm';
import { FORM_MODE_EDIT } from '../../EcosForm';
import { InfoText, Loader } from '../../common';
import { ComponentKeys } from '../Components';

import './style.scss';

class Properties extends React.Component {
  static propTypes = {
    record: PropTypes.string.isRequired,
    stateId: PropTypes.string.isRequired,
    formMode: PropTypes.string.isRequired,
    formId: PropTypes.string,
    className: PropTypes.string,
    isSmallMode: PropTypes.bool,
    minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    forwardedRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    onInlineEditSave: PropTypes.func,
    onFormIsChanged: PropTypes.func.isRequired,
    scrollProps: PropTypes.object,
    isDraft: PropTypes.bool
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
    initData: {},
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
    const formData = get(this._ecosForm, 'current._form.data');
    const initData = cloneDeep(formData);

    this.setState({
      initData,
      loaded: true
    });
  }, 350);

  onToggleLoader = (isLoading = !this.state.isLoading) => {
    this.setState({ isLoading });
  };

  onShowBuilder = () => {
    const onShowFormBuilder = get(this._hiddenEcosForm, 'current.onShowFormBuilder');

    if (isFunction(onShowFormBuilder)) {
      onShowFormBuilder(() => {
        this.setState({ isReadySubmit: false }, () => this.setState({ isReadySubmit: true }));
      });
    }
  };

  onFormChanged = (submission, form) => {
    const { onFormIsChanged } = this.props;
    const { initData } = this.state;

    if (isFunction(onFormIsChanged)) {
      const isChanged = !isEqual(initData, submission.data);

      onFormIsChanged(isChanged, form.isValid(submission));
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
    const { record, isSmallMode, formId, formMode, isDraft, isMobile, onUpdate, onInlineEditSave } = this.props;
    const { isReadySubmit, loaded, isLoading } = this.state;
    const isShow = isReadySubmit;
    const isLoaded = loaded && !isLoading;

    return (
      <>
        {!isLoaded && <Loader className="ecos-properties__loader" blur />}
        <EcosForm
          ref={this._ecosForm}
          record={record}
          formId={formId}
          options={{
            readOnly: formMode !== FORM_MODE_EDIT,
            viewAsHtml: true,
            fullWidthColumns: isSmallMode,
            viewAsHtmlConfig: {
              hidePanels: isSmallMode
            },
            formMode,
            saveDraft: isDraft,
            onInlineEditSave
          }}
          onFormSubmitDone={onUpdate}
          onFormChanged={this.onFormChanged}
          onReady={this.onReady}
          onToggleLoader={this.onToggleLoader}
          className={classNames('ecos-properties__formio', {
            'ecos-properties__formio_small': isSmallMode,
            'ecos-properties__formio_mobile': isMobile,
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
          options={{ formMode }}
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
        hideTracksWhenNotNeeded
        {...scrollProps}
      >
        <div ref={forwardedRef} style={{ minHeight: minHeight || '50px' }}>
          {this.renderForm()}
        </div>
      </Scrollbars>
    );
  }
}

const mapStateToProps = state => {
  return { isMobile: state.view.isMobile };
};

export default connect(
  mapStateToProps,
  null,
  null,
  {
    withRef: true
  }
)(Properties);
