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
import isEmpty from 'lodash/isEmpty';

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
  _cachedFormComponents = [];

  state = {
    loaded: false,
    isLoading: false,
    isReadySubmit: true,
    initData: {},
    contentHeight: 0
  };

  componentDidMount() {
    window.addEventListener('scroll', this.onScrollWindow, true);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.formId !== this.props.formId) {
      this.setState({ loaded: false });
      this._cachedFormComponents = [];
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScrollWindow, true);
  }

  get form() {
    return get(this._ecosForm, 'current.form') || {};
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
      const submissionData = cloneDeep(submission.data);
      const clonedInitData = cloneDeep(initData);

      form.getAllComponents().forEach(c => {
        const { persistent, key } = c.component;

        if (persistent === 'client-only' || !persistent || ['ecosEdition'].includes(key)) {
          delete submissionData[key];
          delete clonedInitData[key];
        }
      });

      const isChanged = !isEqual(submissionData, clonedInitData);

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

  getComponents = (component, ignoreSelf = false) => {
    const components = [];

    if (!ignoreSelf) {
      components.push(component);
    }

    if (component.components) {
      components.push(...this.getInternalComponents(component));
    }

    if (component.rows) {
      components.push(...this.getInternalRows(component));
    }

    return components;
  };

  getInternalComponents = component => {
    const components = [];

    if (isEmpty(component.components)) {
      return components;
    }

    for (let i = 0; i < component.components.length; i++) {
      components.push(...this.getComponents(component.components[i]));
    }

    return components;
  };

  getInternalRows = component => {
    const components = [];

    if (!component.rows) {
      return components;
    }

    for (let i = 0; i < component.rows.length; i++) {
      Object.keys(component.rows[i]).forEach(key => {
        components.push(...this.getComponents(component.rows[i][key]));
      });
    }

    return components;
  };

  onScrollWindow = event => {
    if (event.target && event.target.classList.contains('choices__list')) {
      return;
    }

    this.onScrollStart();
  };

  onScrollStart = debounce(
    () => {
      const form = get(this, '_ecosForm.current.form');

      if (!form) {
        return;
      }

      if (isEmpty(this._cachedFormComponents)) {
        this._cachedFormComponents = this.getComponents(form, true);
      }

      this._cachedFormComponents.forEach(item => {
        item.callFunction('hideDropdown');
      });
    },
    500,
    { leading: true }
  );

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
        onScrollStart={this.onScrollStart}
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
