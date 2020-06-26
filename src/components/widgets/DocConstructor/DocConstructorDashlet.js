import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { t } from '../../../helpers/util';
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
    templates: null
  };

  componentDidMount() {}

  onChangeTemplates = templates => {
    this.setState({ templates });
  };

  render() {
    const { title, classNameDashlet, isLoading } = this.props;

    return (
      <Dashlet
        className={classNames('ecos-doc-constructor__dashlet', classNameDashlet)}
        bodyClassName="ecos-doc-constructor__dashlet-body"
        title={t(title || Labels.TITLE)}
        needGoTo={false}
        noActions
      >
        {isLoading && <Loader />}
        <div className="ecos-doc-constructor__description">
          <div className="ecos-doc-constructor__description-title">{t(Labels.DESC_TITLE)}</div>
          <div className="ecos-doc-constructor__description-text">{t(Labels.DESC_TEXT)}</div>
        </div>
        <div className="ecos-doc-constructor__label field-required">{t(Labels.LABEL_JOURNAL)}</div>
        <SelectJournal
          className="ecos-doc-constructor__journal"
          journalId={'ui-actions'}
          isSelectedValueAsText
          onChange={this.onChangeTemplates}
        />
        <div className="ecos-doc-constructor__buttons">
          <Btn className="ecos-btn_tight">{t(Labels.BTN_EDIT)}</Btn>
          <Btn className="ecos-btn_tight">{t(Labels.BTN_DELETE)}</Btn>
          <div className="ecos-btn_tight ecos-doc-constructor__space" />
          <IcoBtn icon="icon-reload" className="ecos-btn_blue">
            {t(Labels.BTN_SYNC)}
          </IcoBtn>
        </div>
      </Dashlet>
    );
  }
}

const mapStateToProps = (state, context) => {
  const { record, tabId } = context;
  const stateId = getStateId({ tabId, id: record });
  const data = get(state, ['docOne', stateId]) || {};

  return {
    isLoading: data.isLoading,
    isMobile: state.view.isMobile
  };
};

const mapDispatchToProps = (dispatch, context) => {
  const { record, tabId } = context;
  const stateId = getStateId({ tabId, id: record });

  return {};
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DocConstructorDashlet);
