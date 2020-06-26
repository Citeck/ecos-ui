import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { createDocument, deleteDocument, editDocument, getDocument, getSettings } from '../../../actions/docConstructor';
import { isSmallMode, t } from '../../../helpers/util';
import { getStateId } from '../../../helpers/redux';
import { Loader } from '../../common';
import { SelectJournal } from '../../common/form';
import { Btn, IcoBtn } from '../../common/btns';
import Dashlet from '../../Dashlet';
import BaseWidget from '../BaseWidget';

import './style.scss';

const Labels = {
  TITLE: 'doc-constructor-widget.title',
  DESC_TITLE: 'doc-constructor-widget.description.title',
  DESC_TEXT: 'doc-constructor-widget.description.text',
  LABEL_JOURNAL: 'doc-constructor-widget.template.label',
  BTN_EDIT: 'doc-constructor-widget.buttons.edit',
  BTN_DELETE: 'doc-constructor-widget.buttons.delete',
  BTN_SYNC: 'doc-constructor-widget.buttons.sync'
};

class DocConstructorDashlet extends BaseWidget {
  static propTypes = {
    className: PropTypes.string,
    record: PropTypes.string
  };

  static defaultProps = {
    classNameDashlet: ''
  };

  state = {
    template: null,
    isSmallMode: false
  };

  get disabledAction() {
    return !this.props.documentId;
  }

  componentDidMount() {
    this.props.getSettings();
  }

  onChangeTemplate = template => {
    this.setState({ template });
  };

  onClickEdit = () => {
    this.props.editDocument();
  };

  onClickDelete = () => {
    this.props.deleteDocument();
  };

  onClickSync = () => {
    this.props.createDocument();
  };

  onResize = width => {
    if (width > 0) {
      this.setState({ isSmallMode: isSmallMode(width) });
    }
  };

  render() {
    const { isSmallMode, template } = this.state;
    const { title, classNameDashlet, isLoading, isLoadingSync, documentId } = this.props;

    return (
      <Dashlet
        className={classNames('ecos-doc-constructor__dashlet', classNameDashlet)}
        bodyClassName="ecos-doc-constructor__dashlet-body"
        title={t(title || Labels.TITLE)}
        needGoTo={false}
        noActions
        onResize={this.onResize}
      >
        {!isLoading && <Loader blur />}
        <div className="ecos-doc-constructor__description">
          <div className="ecos-doc-constructor__description-title">{t(Labels.DESC_TITLE)}</div>
          <div className="ecos-doc-constructor__description-text">{t(Labels.DESC_TEXT)}</div>
        </div>
        <div className="ecos-doc-constructor__label field-required">{t(Labels.LABEL_JOURNAL)}</div>
        <SelectJournal
          className="ecos-doc-constructor__journal"
          journalId={'ui-actions'}
          isSelectedValueAsText
          onChange={this.onChangeTemplate}
          defaultValue={template}
        />
        <div className={classNames('ecos-doc-constructor__buttons', { 'ecos-doc-constructor__buttons_small': isSmallMode })}>
          <div className="ecos-doc-constructor__buttons-left">
            <Btn className="ecos-btn_tight" onClick={this.onClickEdit} disabled={this.disabledAction}>
              {t(Labels.BTN_EDIT)}
            </Btn>
            <Btn className="ecos-btn_disabled" onClick={this.onClickDelete} disabled={this.disabledAction}>
              {t(Labels.BTN_DELETE)}
            </Btn>
          </div>
          <div className="ecos-doc-constructor__buttons-right">
            <IcoBtn
              icon="icon-reload"
              className="ecos-btn_blue"
              onClick={this.onClickSync}
              loading={isLoadingSync}
              disabled={this.disabledAction}
            >
              {t(Labels.BTN_SYNC)}
            </IcoBtn>
          </div>
        </div>
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, context) => {
  const { record, tabId } = context;
  const stateId = getStateId({ tabId, id: record });
  const data = get(state, ['docConstructor', stateId]) || {};

  return {
    isMobile: state.view.isMobile,
    isLoading: data.isLoading,
    isLoadingSync: data.isLoadingSync,
    settings: data.settings,
    documentId: data.documentId,
    documentType: data.documentType
  };
};

const mapDispatchToProps = (dispatch, context) => {
  const { record, tabId } = context;
  const stateId = getStateId({ tabId, id: record });

  return {
    getSettings: () => dispatch(getSettings({ stateId, record })),
    createDocument: () => dispatch(createDocument({ stateId, record })),
    deleteDocument: () => dispatch(deleteDocument({ stateId, record })),
    editDocument: () => dispatch(editDocument({ stateId, record })),
    getDocument: () => dispatch(getDocument({ stateId, record }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocConstructorDashlet);
