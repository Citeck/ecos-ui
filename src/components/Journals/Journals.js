import React, { Component, Fragment } from 'react';
import { Container } from 'reactstrap';
import connect from 'react-redux/es/connect/connect';

import JournalsDashletGrid from './JournalsDashletGrid';
import JournalsDashletPagination from './JournalsDashletPagination';
import JournalsGrouping from './JournalsGrouping';
import JournalsFilters from './JournalsFilters';
import JournalsColumnsSetup from './JournalsColumnsSetup';
import JournalsMenu from './JournalsMenu';
import JournalSetting from './JournalSetting';
import Search from '../common/Search/Search';
import Columns from '../common/templates/Columns/Columns';
import EcosModal from '../../../src/components/common/EcosModal';

import { getDashletConfig, reloadGrid, saveJournalSetting } from '../../actions/journals';
import { IcoBtn, TwoIcoBtn } from '../common/btns';
import { Caption, Dropdown, Well, Input } from '../common/form';
import { Btn } from '../common/btns';
import { t } from '../../helpers/util';

import './Journals.scss';

const mapStateToProps = state => ({
  journalConfig: state.journals.journalConfig
});

const mapDispatchToProps = dispatch => ({
  getDashletConfig: id => dispatch(getDashletConfig(id)),
  saveJournalSetting: (id, settings) => dispatch(saveJournalSetting({ id, settings })),
  reloadGrid: options => dispatch(reloadGrid(options))
});

class Journals extends Component {
  constructor(props) {
    super(props);

    this.state = {
      menuOpen: false,
      settingsVisible: true,
      dialogOpen: false
    };

    this.journalSetting = new JournalSetting();
    this.settingName = '';
  }

  componentDidMount() {
    this.props.getDashletConfig(this.props.id);
  }

  showSettings = () => {
    this.setState({ settingsVisible: !this.state.settingsVisible });
  };

  toggleMenu = () => {
    this.setState({ menuOpen: !this.state.menuOpen });
  };

  save = () => {
    this.setState({ dialogOpen: true });
  };

  closeDialog = () => {
    this.setState({ dialogOpen: false });
    this.clearSettingName();
  };

  onApplyDialog = () => {
    this.props.saveJournalSetting(this.props.journalConfig.id, this.journalSetting.getSetting(this.settingName));
  };

  clearSettingName = () => {
    this.settingName = '';
  };

  onChangeSettingName = e => {
    this.settingName = e.target.value;
  };

  onChangeFilters = predicate => {
    this.journalSetting.setPredicate(predicate);
  };

  onChangeColumnsSetup = columnsSetup => {
    this.journalSetting.setColumnsSetup(columnsSetup);
  };

  onChangeGrouping = grouping => {
    this.journalSetting.setGrouping(grouping);
  };

  apply = () => {
    const setting = this.journalSetting.getSetting();
    const { columns, groupBy, sortBy, predicate } = setting;

    this.props.reloadGrid({ columns, groupBy, sortBy, predicates: predicate ? [predicate] : [] });
  };

  cancel = () => {};

  render() {
    const { menuOpen, settingsVisible } = this.state;
    const {
      journalConfig: {
        meta: { title = '' }
      }
    } = this.props;

    return (
      <Container>
        <div className={'ecos-journal'}>
          <div className={`ecos-journal__body ${menuOpen ? 'ecos-journal__body_with-menu' : ''}`}>
            <div className={'ecos-journal__visibility-menu-btn'}>
              {menuOpen ? null : (
                <IcoBtn
                  onClick={this.toggleMenu}
                  icon={'icon-arrow-left'}
                  className={'ecos-btn_light-blue ecos-btn_hover_dark-blue ecos-btn_narrow-t_standart ecos-btn_r_biggest'}
                >
                  {t('journals.action.show-menu')}
                </IcoBtn>
              )}
            </div>

            <div className={'ecos-journal__caption'}>
              <Caption large>{title}</Caption>
            </div>

            <div className={'ecos-journal__tools'}>
              <Well className={'ecos-well_full ecos-journal__tools-well'}>
                <IcoBtn icon={'icon-plus'} className={'ecos-btn_blue ecos-btn_tight ecos-journal__tools-well_step'}>
                  {t('button.send')}
                </IcoBtn>

                <Search />

                <Dropdown
                  className={'ecos-journal_right'}
                  source={[{ id: 0, title: t('button.export') }]}
                  value={0}
                  valueField={'id'}
                  titleField={'title'}
                >
                  <IcoBtn invert={'true'} icon={'icon-down'} className={'ecos-btn_drop-down ecos-btn_r_6'} />
                </Dropdown>
              </Well>
            </div>

            <div className={'ecos-journal__settings-bar'}>
              <TwoIcoBtn
                icons={['icon-settings', 'icon-down']}
                className={'ecos-btn_white ecos-btn_hover_t-blue ecos-btn_settings-down ecos-btn_x-step_15'}
                onClick={this.showSettings}
              />

              <IcoBtn
                icon={'icon-reload'}
                className={
                  'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue ecos-btn_x-step_15'
                }
              />

              <div className={'ecos-journal__settings-bar_right '}>
                <JournalsDashletPagination />

                <IcoBtn
                  icon={'icon-list'}
                  className={
                    'ecos-btn_i ecos-btn_blue2 ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue ecos-btn_x-step_15'
                  }
                />

                <IcoBtn
                  icon={'icon-columns'}
                  className={
                    'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue ecos-btn_x-step_15'
                  }
                />

                <IcoBtn
                  icon={'icon-pie'}
                  className={'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue'}
                />
              </div>
            </div>

            {settingsVisible ? (
              <Well className={'ecos-journal__settings'}>
                <JournalsFilters onChange={this.onChangeFilters} />
                <JournalsColumnsSetup onChange={this.onChangeColumnsSetup} />
                <JournalsGrouping onChange={this.onChangeGrouping} />

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
              </Well>
            ) : null}

            <Well className={'ecos-journal__grid'}>
              <JournalsDashletGrid className={'ecos-grid_no-top-border'} />
            </Well>

            <div className={'ecos-journal__footer'}>
              <JournalsDashletPagination />
            </div>
          </div>

          <div className={'ecos-journal__menu'}>
            <JournalsMenu open={menuOpen} onClose={this.toggleMenu} />
          </div>
        </div>

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
      </Container>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journals);
