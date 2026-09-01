import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { connect } from 'react-redux';

import { t } from '@/helpers/util';
import { FORM_MODE_EDIT } from '@/components/forms/EcosForm';
import EcosForm from '@/components/forms/EcosForm/EcosForm';
import { InfoText, Loader } from '@/components/common';
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
    isSmallMode: true
  };

  _ecosForm = React.createRef();
  _hiddenEcosForm = React.createRef();

  state = {
    loaded: false,
    isLoading: true,
    isReloading: false,
    isReadySubmit: true,
    initData: {},
    contentHeight: 0
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.formId !== this.props.formId || !isEqual(prevProps.formMode, this.props.formMode)) {
      this.setState({ loaded: false });
    }
  }

  get form() {
    // The formio instance, or null when the form is not built yet. Used to be `|| {}`, which is
    // truthy and made every "is the form ready" check pass on an empty widget.
    return get(this._ecosForm, 'current.form') || null;
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

    this._isReloading = false;
    this.setState({ initData, isLoading: false, isReloading: false, loaded: true });
  }, 350);

  onToggleLoader = (isLoading = !this.state.isLoading) => {
    if (this._isReloading) {
      return;
    }

    this.setState({ isLoading });
  };

  handleInlineEditSave = () => {
    const { onInlineEditSave } = this.props;

    // No `isReloading` here: it dims the whole widget behind `<Loader blur/>` and its only reset
    // is `onReady`, which fires after a full rebuild. An inline save patches the form in place
    // (COREDEV-429) — the edited field's own edit→view switch is the feedback, and blurring every
    // other field for it is exactly the flash the soft path removes.
    if (isFunction(onInlineEditSave)) {
      onInlineEditSave();
    }
  };

  onShowBuilder = () => {
    const onShowFormBuilder = get(this._hiddenEcosForm, 'current.onShowFormBuilder');

    if (isFunction(onShowFormBuilder)) {
      onShowFormBuilder(() => {
        this.onUpdateForm(false);
        this.setState({ isReadySubmit: false }, () => this.setState({ isReadySubmit: true }));
      });
    }
  };

  onFormChanged = (submission, form) => {
    const { onFormIsChanged, componentsCount, changeComponentsCount, isDraft } = this.props;

    const changedType = get(submission, 'changed.component.type');
    const allComponents = form.getAllComponents();

    if (isFunction(onFormIsChanged)) {
      const editedComponent = allComponents.filter(c => {
        const { persistent } = c.component;

        return c.valueChangedByUser && persistent && persistent !== 'client-only';
      });

      const length = allComponents.length;

      const isChanged = editedComponent.length || changedType === 'button' || (componentsCount >= 0 && componentsCount !== length);

      if (!isDraft) {
        // dirty=false validates only touched components; strict validation
        // happens at submit time. Using dirty=true here caused stale empty
        // pristine fields to fail validation and disable Save on re-edit.
        onFormIsChanged(isChanged, form.checkValidity(submission.data, false));
      } else {
        onFormIsChanged(isChanged);
      }

      if (componentsCount !== length) {
        changeComponentsCount(length);
      }
    }
  };

  onUpdateForm = withSaveData => {
    const form = get(this._ecosForm, 'current');

    if (!form) {
      return;
    }

    this._isReloading = true;
    this.setState({ isReloading: true });

    if (typeof form.onReload === 'function') {
      form.onReload.call(form, withSaveData);
    }
  };

  /**
   * Background update of the form already on screen.
   *
   * Unlike {@link onUpdateForm} it sets neither `isReloading` nor `loaded`, so neither the loader
   * nor the skeleton appears: the form keeps its DOM and only the changed values are patched.
   *
   * @returns {Promise<{changed: boolean, rebuilt: boolean}>}
   */
  softUpdateForm = () => {
    const form = get(this._ecosForm, 'current');

    if (!form || !isFunction(form.softReload)) {
      return Promise.resolve({ changed: false, rebuilt: false });
    }

    return form.softReload();
  };

  setHeight = contentHeight => {
    this.setState({ contentHeight });
  };

  getTitle = title => {
    this.props.getTitle && this.props.getTitle(title);
  };

  renderSkeleton() {
    const { formMode } = this.props;
    const isEdit = formMode === FORM_MODE_EDIT;

    if (isEdit) {
      return (
        <div className="ecos-properties__skeleton ecos-properties__skeleton_edit">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="ecos-properties__skeleton-field">
              <div className="ecos-properties__skeleton-label ecos-properties__shimmer" style={{ width: `${25 + ((i * 13) % 20)}%` }} />
              <div className="ecos-properties__skeleton-input ecos-properties__shimmer" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="ecos-properties__skeleton">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="ecos-properties__skeleton-row">
            <div className="ecos-properties__skeleton-label ecos-properties__shimmer" />
            <div className="ecos-properties__skeleton-value ecos-properties__shimmer" style={{ width: `${55 + ((i * 17) % 30)}%` }} />
          </div>
        ))}
      </div>
    );
  }

  renderForm() {
    const { record, isSmallMode, formId, formMode, isDraft, isMobile, onUpdate } = this.props;
    const { isReadySubmit, loaded, isLoading, isReloading, reloadHeight } = this.state;
    const isShow = isReadySubmit;
    // The skeleton stands in for a form whose size is not known yet — before the first load.
    // Once the form is on screen, any busy state dims it in place instead: swapping living
    // content for a skeleton is the flash COREDEV-429 removes.
    const isFirstLoading = !loaded;
    const isBusy = loaded && isLoading;

    return (
      <>
        {isFirstLoading && !isReloading && this.renderSkeleton()}
        {(isReloading || isBusy) && <Loader blur />}
        <EcosForm
          ref={this._ecosForm}
          record={record}
          formId={formId}
          options={{
            readOnly: formMode !== FORM_MODE_EDIT,
            viewAsHtml: true,
            fullWidthColumns: isSmallMode,
            viewAsHtmlConfig: {
              hidePanels: isMobile
            },
            formMode,
            saveDraft: isDraft,
            onInlineEditSave: this.handleInlineEditSave
          }}
          onFormSubmitDone={onUpdate}
          onFormChanged={this.onFormChanged}
          onReady={this.onReady}
          onToggleLoader={this.onToggleLoader}
          className={classNames('ecos-properties__formio', {
            'ecos-properties__formio_mobile': isMobile,
            'd-none': !isShow || (isFirstLoading && !isReloading)
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
    const { loaded, isReloading } = this.state;

    return (
      <Scrollbars
        className={classNames('ecos-properties__scroll', className)}
        renderTrackVertical={props => <div {...props} className="ecos-properties__scroll_v" />}
        hideTracksWhenNotNeeded
        {...scrollProps}
      >
        {/* A loaded form keeps its natural height even while busy — only the first load, whose
            size is unknown, gets the placeholder minHeight. */}
        <div ref={forwardedRef} style={{ position: 'relative', minHeight: loaded || isReloading ? undefined : minHeight || '50px' }}>
          {this.renderForm()}
        </div>
      </Scrollbars>
    );
  }
}

const mapStateToProps = state => {
  return { isMobile: state.view.isMobile };
};

export default connect(mapStateToProps, null, null, {
  forwardRef: true
})(Properties);
