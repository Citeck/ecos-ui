import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';
import { Scrollbars } from 'react-custom-scrollbars';

import {
  createDocument,
  deleteDocument,
  editDocument,
  getDocument,
  getDocumentParams,
  initConstructor,
  recreateDocument,
  setError
} from '../../../actions/docConstructor';
import { isSmallMode, t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import DAction from '../../../services/DashletActionService';
import { Icon, Loader } from '../../common';
import { SelectJournal } from '../../common/form';
import { Btn, IcoBtn } from '../../common/btns';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';
import Settings from './Settings';

import './style.scss';
import UserLocalSettingsService from '../../../services/userLocalSettings';

const DocumentTypes = {
  CONTRACT: 'contract',
  ATTORNEY: 'attorney'
};

const Labels = {
  TITLE: 'doc-constructor-widget.title',
  DESC_TITLE: 'doc-constructor-widget.description.title',
  DESC_TEXT: 'doc-constructor-widget.description.text',
  LABEL_JOURNAL: 'doc-constructor-widget.template.label',
  BTN_EDIT: 'doc-constructor-widget.button.edit',
  BTN_DELETE: 'doc-constructor-widget.button.delete',
  BTN_SYNC: 'doc-constructor-widget.button.sync'
};

class DocConstructorDashlet extends BaseWidget {
  static propTypes = {
    className: PropTypes.string,
    record: PropTypes.string
  };

  static defaultProps = {
    classNameDashlet: ''
  };

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      delayedUpdate: false,
      isSmallMode: false,
      isOpenSettings: false
    };
  }

  get disabledAction() {
    const { docOneDocumentId, docOneUrl } = this.props;

    return !docOneDocumentId || !docOneUrl;
  }

  get disabledCreate() {
    const { documentType, docOneUrl } = this.props;

    return documentType !== DocumentTypes.CONTRACT || !docOneUrl;
  }

  get actionConfig() {
    const actions = {
      [DAction.Actions.RELOAD]: {
        onClick: () => {
          this.props.initConstructor();
        }
      }
    };

    this.props.isAdmin &&
      (actions[DAction.Actions.SETTINGS] = {
        onClick: this.onToggleSettings
      });

    return actions;
  }

  componentDidMount() {
    this.watcher = this.instanceRecord.watch('_modified', this.reload);
    this.props.initConstructor();
  }

  componentDidUpdate(prevProps, prevState) {
    const { isLoading, getDocumentParams, config } = this.props;
    const { delayedUpdate, runUpdate } = this.state;

    if (!prevState.runUpdate && runUpdate && !delayedUpdate) {
      isLoading ? this.setState({ delayedUpdate: true }) : getDocumentParams();
    }

    if (!isLoading && delayedUpdate) {
      this.setState({ delayedUpdate: false }, getDocumentParams);
    }

    if (JSON.stringify(config) !== JSON.stringify(prevProps.config)) {
      this.props.initConstructor();
    }
  }

  componentWillUnmount() {
    this.instanceRecord.unwatch(this.watcher);
  }

  onToggleSettings = () => {
    this.setState(({ isOpenSettings }) => ({ isOpenSettings: !isOpenSettings }));
  };

  onSaveSettings = _config => {
    const config = { ...this.props.config, ..._config };

    this.props.onSave && this.props.onSave(this.props.id, { config });
    this.onToggleSettings();
  };

  onChangeTemplate = template => {
    const { docOneDocumentId } = this.props;
    if (template) {
      if (docOneDocumentId) {
        this.props.recreateDocument(template);
      } else {
        this.props.createDocument(template);
      }
    }
  };

  onClickEdit = () => {
    this.props.editDocument();
  };

  onClickDelete = () => {
    this.props.deleteDocument();
  };

  onClickSync = () => {
    this.props.getDocument();
  };

  onResize = width => {
    if (width > 0) {
      this.setState({ isSmallMode: isSmallMode(width) });
    }
  };

  onToggleContent = (isCollapsed = false) => {
    UserLocalSettingsService.setDashletProperty(this.state.lsId, { isCollapsed });
  };

  render() {
    const { title, classNameDashlet, isLoading, error, contractTemplate, config } = this.props;
    const { isSmallMode, isOpenSettings } = this.state;

    return (
      <Dashlet
        className={classNames('ecos-doc-constructor__dashlet', classNameDashlet)}
        bodyClassName="ecos-doc-constructor__dashlet-body"
        title={t(title || Labels.TITLE)}
        needGoTo={false}
        actionConfig={this.actionConfig}
        onToggleCollapse={this.onToggleContent}
        onResize={this.onResize}
        isCollapsed={this.isCollapsed}
        setRef={this.setDashletRef}
      >
        <Scrollbars {...this.scrollbarProps}>
          <div hidden={isOpenSettings}>
            {isLoading && <Loader blur className="ecos-doc-constructor__loader" />}
            <div className="ecos-doc-constructor__description">
              <div className="ecos-doc-constructor__description-title">{t(Labels.DESC_TITLE)}</div>
              <div className="ecos-doc-constructor__description-text">{t(Labels.DESC_TEXT)}</div>
            </div>
            <div className="ecos-doc-constructor__label field-required">{t(Labels.LABEL_JOURNAL)}</div>
            <SelectJournal
              className="ecos-doc-constructor__journal"
              journalId={config.journalTemplatesId}
              onChange={this.onChangeTemplate}
              defaultValue={contractTemplate}
              isSelectedValueAsText
              hideDeleteRowButton={!!contractTemplate}
              hideEditRowButton
              disabled={this.disabledCreate}
            />
            {error && (
              <div className="ecos-doc-constructor__error">
                <Icon className="icon-alert" />
                {error}
              </div>
            )}
            <div className={classNames('ecos-doc-constructor__buttons', { 'ecos-doc-constructor__buttons_small': isSmallMode })}>
              <div className="ecos-doc-constructor__buttons-left">
                <Btn className="ecos-btn_tight" onClick={this.onClickEdit} disabled={this.disabledAction}>
                  {t(Labels.BTN_EDIT)}
                </Btn>
                <Btn className="ecos-btn_tight" onClick={this.onClickDelete} disabled={this.disabledAction}>
                  {t(Labels.BTN_DELETE)}
                </Btn>
              </div>
              <div className="ecos-doc-constructor__buttons-right">
                <IcoBtn
                  icon="icon-reload"
                  className="ecos-btn_tight ecos-btn_blue"
                  onClick={this.onClickSync}
                  disabled={this.disabledAction}
                >
                  {t(Labels.BTN_SYNC)}
                </IcoBtn>
              </div>
            </div>
          </div>
          {isOpenSettings && <Settings config={config} onSave={this.onSaveSettings} onCancel={this.onToggleSettings} />}
        </Scrollbars>
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, context) => {
  const { record, tabId } = context;
  const stateId = getStateId({ tabId, id: record });
  const data = get(state, ['docConstructor', stateId]) || {};

  return {
    isAdmin: state.user.isAdmin,
    isMobile: state.view.isMobile,
    isLoading: data.isLoading,
    error: data.error,
    docOneUrl: data.docOneUrl,
    docOneDocumentId: data.docOneDocumentId,
    documentType: data.documentType,
    contractTemplate: data.contractTemplate,
    isAvailable: data.isAvailable
  };
};

const mapDispatchToProps = (dispatch, context) => {
  const { record, tabId, config } = context;
  const stateId = getStateId({ tabId, id: record });

  return {
    initConstructor: () => dispatch(initConstructor({ stateId, record, config })),
    getDocumentParams: () => dispatch(getDocumentParams({ stateId, record })),
    createDocument: templateRef => dispatch(createDocument({ stateId, record, templateRef })),
    deleteDocument: () => dispatch(deleteDocument({ stateId, record })),
    editDocument: () => dispatch(editDocument({ stateId, record })),
    getDocument: () => dispatch(getDocument({ stateId, record })),
    recreateDocument: templateRef => dispatch(recreateDocument({ stateId, record, templateRef })),
    setError: error => dispatch(setError({ stateId, record, error }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocConstructorDashlet);
