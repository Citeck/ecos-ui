import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import classNames from 'classnames';
import Columns from '../../common/templates/Columns/Columns';
import { Caption, Select, Field } from '../../common/form';
import { Btn } from '../../common/btns';

import {
  getDashletEditorData,
  setJournalsListItem,
  setJournalsItem,
  setSettingItem,
  saveDashlet,
  setDashletEditorVisible,
  setDashletConfig
} from '../../../actions/journals';

import './JournalsDashletEditor.scss';

const mapStateToProps = state => ({
  journalsList: state.journals.journalsList,
  journals: state.journals.journals,
  settings: state.journals.settings,
  config: state.journals.config,
  initConfig: state.journals.initConfig
});

const mapDispatchToProps = dispatch => ({
  setDashletEditorVisible: visible => dispatch(setDashletEditorVisible(visible)),
  getDashletEditorData: config => dispatch(getDashletEditorData(config)),
  setJournalsListItem: item => dispatch(setJournalsListItem(item)),
  setJournalsItem: item => dispatch(setJournalsItem(item)),
  setSettingItem: item => dispatch(setSettingItem(item)),
  setDashletConfig: config => dispatch(setDashletConfig(config)),
  saveDashlet: (config, id) => dispatch(saveDashlet({ config: config, id: id }))
});

class JournalsDashletEditor extends Component {
  cancel = () => {
    if (this.props.config) {
      this.props.setDashletEditorVisible(false);
    }
  };

  save = () => {
    const props = this.props;
    props.saveDashlet(props.config, props.id);
  };

  clear = () => {
    this.props.setDashletConfig(this.props.initConfig);
  };

  setSelectValue = (source, field, value) => {
    return source.filter(option => option[field] === value);
  };

  componentDidMount() {
    this.props.getDashletEditorData(this.props.config);
  }

  componentDidUpdate(prevProps) {
    const prevConfig = prevProps.config || {};
    const config = this.props.config || {};

    if (prevConfig.journalsListId !== config.journalsListId || prevConfig.journalId !== config.journalId) {
      this.props.getDashletEditorData(config);
    }
  }

  render() {
    const props = this.props;
    const config = props.config || {};
    const cssClasses = classNames('journal-dashlet-editor', props.className);

    return (
      <div className={cssClasses}>
        <div className={'journal-dashlet-editor__body'}>
          <Caption middle className={'journal-dashlet-editor__caption'}>
            Редактирование дашлета
          </Caption>
          <Field label={'Список журналов'}>
            <Select
              placeholder={'Выберите список журналов'}
              options={props.journalsList}
              getOptionLabel={option => option.title}
              getOptionValue={option => option.id}
              onChange={props.setJournalsListItem}
              value={this.setSelectValue(props.journalsList, 'id', config.journalsListId)}
            />
          </Field>

          <Field label={'Журнал'}>
            <Select
              placeholder={'Выберите журнал'}
              options={props.journals}
              getOptionLabel={option => option.title}
              getOptionValue={option => option.nodeRef}
              onChange={props.setJournalsItem}
              value={this.setSelectValue(props.journals, 'nodeRef', config.journalId)}
            />
          </Field>

          <Field label={'Настройки'}>
            <Select placeholder={'По умолчанию'} options={props.setting} onChange={props.setSettingItem} />
          </Field>
        </div>

        <Columns
          className={'journal-dashlet-editor__actions'}
          cols={[
            <Btn onClick={this.clear}>Сбросить настройки</Btn>,

            <Fragment>
              <Btn className={'btn_x-step_10'} onClick={this.cancel}>
                Отмена
              </Btn>
              <Btn className={'btn_blue btn_hover_light-blue'} onClick={this.save}>
                Сохранить
              </Btn>
            </Fragment>
          ]}
          cfgs={[{}, { className: 'columns_right' }]}
        />
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsDashletEditor);
