import React, { Component } from 'react';
import { Container } from 'reactstrap';
import connect from 'react-redux/es/connect/connect';

import JournalsDashletGrid from './JournalsDashletGrid';
import JournalsDashletPagination from './JournalsDashletPagination';
import JournalsGrouping from './JournalsGrouping';
import JournalsFilters from './JournalsFilters';
import JournalsColumnsSetup from './JournalsColumnsSetup';
import JournalsSettingsFooter from './JournalsSettingsFooter';
import JournalsMenu from './JournalsMenu';
import Search from '../common/Search/Search';

import { getJournalsData, reloadGrid } from '../../actions/journals';
import { IcoBtn, TwoIcoBtn } from '../common/btns';
import { Caption, Well } from '../common/form';
import { URL_PAGECONTEXT } from '../../constants/alfresco';
import Export from '../Export/Export';

import { t } from '../../helpers/util';

import './Journals.scss';

const mapStateToProps = state => ({
  journalConfig: state.journals.journalConfig
});

const mapDispatchToProps = dispatch => ({
  getJournalsData: ({ journalsListId, journalId, journalSettingId }) =>
    dispatch(getJournalsData({ journalsListId, journalId, journalSettingId })),
  reloadGrid: options => dispatch(reloadGrid(options))
});

class Journals extends Component {
  constructor(props) {
    super(props);
    this.state = { menuOpen: false, settingsVisible: false };
  }

  componentDidMount() {
    const props = this.props;
    const { journalsListId = '', journalId = '', journalSettingId = '' } = props;
    props.getJournalsData({ journalsListId, journalId, journalSettingId });
  }

  refresh = () => {
    const props = this.props;
    const { journalsListId = '', journalId = '', journalSettingId = '' } = props;
    props.getJournalsData({ journalsListId, journalId, journalSettingId });
  };

  addRecord = () => {
    let {
      journalConfig: {
        meta: { createVariants = [{}] }
      }
    } = this.props;
    createVariants = createVariants[0];
    createVariants.canCreate &&
      window.open(`${URL_PAGECONTEXT}node-create?type=${createVariants.type}&destination=${createVariants.destination}&viewId=`, '_blank');
  };

  showSettings = () => {
    this.setState({ settingsVisible: !this.state.settingsVisible });
  };

  toggleMenu = () => {
    this.setState({ menuOpen: !this.state.menuOpen });
  };

  render() {
    const { menuOpen, settingsVisible } = this.state;
    const {
      journalConfig,
      journalConfig: {
        columns = [],
        meta: { title = '' }
      }
    } = this.props;

    if (!columns.length) {
      return null;
    }

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
                <IcoBtn
                  icon={'icon-plus'}
                  className={'ecos-btn_blue ecos-btn_tight ecos-journal__tools-well_step'}
                  onClick={this.addRecord}
                >
                  {t('button.send')}
                </IcoBtn>

                <Search />

                <Export config={journalConfig} className={'ecos-journal_right'}>
                  <IcoBtn icon={'icon-down'} className={'ecos-btn_drop-down ecos-btn_r_6'}>
                    {t('button.export')}
                  </IcoBtn>
                </Export>
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
                onClick={this.refresh}
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
                <JournalsFilters columns={columns} />
                <JournalsColumnsSetup columns={columns} />
                <JournalsGrouping />
                <JournalsSettingsFooter />
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
      </Container>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journals);
