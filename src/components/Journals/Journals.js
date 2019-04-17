import React, { Component, Fragment } from 'react';
import { Container } from 'reactstrap';
import connect from 'react-redux/es/connect/connect';

import JournalsDashletGrid from './JournalsDashletGrid';
import JournalsDashletPagination from './JournalsDashletPagination';
import JournalsGrouping from './JournalsGrouping';
import JournalsFilters from './JournalsFilters';
import JournalsColumnsSetup from './JournalsColumnsSetup';
import JournalsMenu from './JournalsMenu';
import Search from '../common/Search/Search';
import Columns from '../common/templates/Columns/Columns';

import { getDashletConfig, reloadGrid, saveJournalSettings } from '../../actions/journals';
import { IcoBtn, TwoIcoBtn } from '../common/btns';
import { Caption, Dropdown, Well } from '../common/form';
import { Btn } from '../common/btns';
import { t } from '../../helpers/util';

import './Journals.scss';

const mapStateToProps = state => ({
  journalConfig: state.journals.journalConfig
});

const mapDispatchToProps = dispatch => ({
  getDashletConfig: id => dispatch(getDashletConfig(id)),
  saveJournalSettings: settings => dispatch(saveJournalSettings(settings)),
  reloadGrid: options => dispatch(reloadGrid(options))
});

class Journals extends Component {
  constructor(props) {
    super(props);
    this.state = { menuOpen: false, settingsVisible: true };
    this.settings = null;
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

  reload = () => {
    this.props.saveJournalSettings({
      id: 'contract-agreements',
      journalId: 'contract-agreements',
      title: 'ысфывафы',
      sortBy: [
        {
          attribute: 'cm:created',
          ascending: false
        },
        {
          attribute: 'cm:title',
          ascending: true
        }
      ],
      groupBy: ['contracts:contractor'],
      columns: [
        {
          attr: 'cm:created'
        },
        {
          attr: 'cm:title'
        },
        {
          attr: 'contracts:contractor'
        }
      ],
      predicate: null,
      maxItems: 10,
      permissions: {
        Write: true,
        Delete: true
      }
    });
  };

  getSettings = settings => {
    this.settings = settings;
  };

  apply = () => {
    console.log(this.settings);

    let settings = {};

    if (this.settings) {
      const { columns, sortBy } = this.settings;

      columns && (settings.columns = columns);
      sortBy && (settings.sortBy = sortBy);

      this.props.reloadGrid({ ...settings });
    }
  };

  render() {
    const { menuOpen, settingsVisible } = this.state;
    const {
      journalConfig: {
        meta: { title = '' }
      }
    } = this.props;

    return (
      <Container style={{ height: 1200 /*max-height: 1200px*/ }}>
        <div className={'ecos-journal'}>
          <div className={`ecos-journal__body ${menuOpen ? 'ecos-journal__body_with-menu' : ''}`}>
            <div className={'ecos-journal__visibility-menu-btn'}>
              {menuOpen ? null : (
                <IcoBtn
                  onClick={this.toggleMenu}
                  icon={'icon-arrow-left'}
                  className={'ecos-btn_light-blue ecos-btn_hover_dark-blue ecos-btn_narrow-t_standart ecos-btn_r_biggest'}
                >
                  {'Показать меню'}
                </IcoBtn>
              )}
            </div>

            <div className={'ecos-journal__caption'}>
              <Caption large>{title}</Caption>
            </div>

            <div className={'ecos-journal__tools'}>
              <Well className={'ecos-well_full ecos-journal__tools-well'}>
                <IcoBtn icon={'icon-plus'} className={'ecos-btn_blue ecos-btn_tight ecos-journal__tools-well_step'}>
                  {'Создать'}
                </IcoBtn>

                <Search />

                <Dropdown
                  className={'ecos-journal_right'}
                  source={[{ id: 0, title: 'Экспорт' }]}
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
                onClick={this.reload}
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
                <JournalsFilters onChange={this.getSettings} />
                <JournalsColumnsSetup onChange={this.getSettings} />
                <JournalsGrouping onChange={this.getSettings} />

                <Columns
                  className={'ecos-journal__settings-footer'}
                  cols={[
                    <Btn onClick={this.clear}>{t('journals.action.apply-template')}</Btn>,

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

          <JournalsMenu open={menuOpen} onClose={this.toggleMenu} />
        </div>
      </Container>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journals);
