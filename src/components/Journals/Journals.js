import React, { Component } from 'react';
import { Container } from 'reactstrap';
import connect from 'react-redux/es/connect/connect';

import JournalsDashletGrid from './JournalsDashletGrid';
import JournalsDashletPagination from './JournalsDashletPagination';
import JournalsGrouping from './JournalsGrouping';
import JournalsColumnsSetup from './JournalsColumnsSetup';
import JournalsMenu from './JournalsMenu';
import Search from '../common/Search/Search';

import { getDashletConfig } from '../../actions/journals';
import { IcoBtn, TwoIcoBtn } from '../common/btns';
import { Caption, Dropdown, Well } from '../common/form';

import './Journals.scss';

const mapStateToProps = state => ({
  journalConfig: state.journals.journalConfig
});

const mapDispatchToProps = dispatch => ({
  getDashletConfig: id => dispatch(getDashletConfig(id))
});

class Journals extends Component {
  constructor(props) {
    super(props);
    this.state = { menuOpen: false, settingsVisible: false };
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

  render() {
    const { menuOpen, settingsVisible } = this.state;
    const {
      journalConfig: {
        meta: { title = '' }
      }
    } = this.props;

    return (
      <Container style={{ width: 932, height: 1000 }}>
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
                <JournalsColumnsSetup />
                <JournalsGrouping />
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
