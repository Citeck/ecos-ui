import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';
import Columns from '../../common/templates/Columns/Columns';
import EcosModal from '../../../../src/components/common/EcosModal';
import { Btn } from '../../common/btns';
import { Input } from '../../common/form';
import { reloadGrid, saveJournalSetting } from '../../../actions/journals';
import { t } from '../../../helpers/util';

import './JournalsSettingsFooter.scss';

const mapStateToProps = state => ({
  predicate: state.journals.predicate,
  columnsSetup: state.journals.columnsSetup,
  grouping: state.journals.grouping,
  journalSetting: state.journals.journalSetting,
  journalConfig: state.journals.journalConfig
});

const mapDispatchToProps = dispatch => ({
  reloadGrid: options => dispatch(reloadGrid(options)),
  saveJournalSetting: (id, settings) => dispatch(saveJournalSetting({ id, settings }))
});

class JournalsSettingsFooter extends Component {
  constructor(props) {
    super(props);

    this.state = { dialogOpen: false };
    this.settingName = '';
  }

  save = () => {
    this.setState({ dialogOpen: true });
  };

  apply = () => {
    let setting = this.getSetting();
    const { columns, groupBy, sortBy, predicate } = setting;
    this.props.reloadGrid({ columns, groupBy, sortBy, predicates: predicate ? [predicate] : [] });
  };

  getSetting = () => {
    let { journalSetting, grouping, columnsSetup, predicate } = this.props;

    return {
      ...journalSetting,
      sortBy: columnsSetup.sortBy,
      groupBy: grouping.groupBy,
      columns: grouping.groupBy.length ? grouping.columns : columnsSetup.columns,
      predicate: predicate
    };
  };

  cancel = () => {};

  closeDialog = () => {
    this.setState({ dialogOpen: false });
    this.clearSettingName();
  };

  onApplyDialog = () => {
    this.props.saveJournalSetting(this.props.journalConfig.id, this.getSetting());
  };

  clearSettingName = () => {
    this.settingName = '';
  };

  onChangeSettingName = e => {
    this.settingName = e.target.value;
  };

  render() {
    return (
      <Fragment>
        <Columns
          className={'ecos-journal__settings-footer'}
          cols={[
            <Btn onClick={this.save}>{t('journals.action.apply-template')}</Btn>,

            <Fragment>
              <Btn className={'ecos-btn_x-step_10'} onClick={this.cancel}>
                {t('journals.action.reset')}
              </Btn>
              <Btn className={'ecos-btn_blue ecos-btn_hover_light-blue'} onClick={this.apply}>
                {t('journals.action.apply')}
              </Btn>
            </Fragment>
          ]}
          cfgs={[{}, { className: 'columns_right' }]}
        />

        <EcosModal
          title={t('journals.action.dialog-msg')}
          isOpen={this.state.dialogOpen}
          hideModal={this.closeDialog}
          className={'journal__dialog ecos-modal_width-sm'}
        >
          <div className={'journal__dialog-panel'}>
            <Input type="text" onChange={this.onChangeSettingName} />
          </div>

          <div className="journal__dialog-buttons">
            <Btn onClick={this.closeDialog}>{t('journals.action.cancel')}</Btn>
            <Btn onClick={this.onApplyDialog} className={'ecos-btn_blue'}>
              {t('journals.action.save')}
            </Btn>
          </div>
        </EcosModal>
      </Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JournalsSettingsFooter);
