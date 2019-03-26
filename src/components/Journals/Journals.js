import React, { Component, Fragment } from 'react';
import connect from 'react-redux/es/connect/connect';

import JournalsDashletGrid from './JournalsDashletGrid/JournalsDashletGrid';
import JournalsDashletPagination from './JournalsDashletPagination/JournalsDashletPagination';

import { getDashletConfig, setEditorMode, reloadGrid } from '../../actions/journals';

import { Container } from 'reactstrap';
import { IcoBtn, TwoIcoBtn } from '../common/btns';
import { Caption, Dropdown, Well } from '../common/form';
import Search from '../common/Search/Search';

import { t } from '../../helpers/util';

import './Journals.scss';

const mapStateToProps = state => ({});

const mapDispatchToProps = dispatch => ({
  getDashletConfig: id => dispatch(getDashletConfig(id)),
  setEditorMode: visible => dispatch(setEditorMode(visible)),
  reloadGrid: ({ journalId, pagination, columns, criteria }) => dispatch(reloadGrid({ journalId, pagination, columns, criteria }))
});

class Journals extends Component {
  constructor(props) {
    super(props);
    this.state = { menuOpen: true };
  }

  componentDidMount() {
    this.props.getDashletConfig(this.props.id);
  }

  render() {
    const { menuOpen } = this.state;
    return (
      <Container style={{ width: 932, height: 800 }}>
        <div className={'ecos-journal'}>
          <div className={`ecos-journal__body ${menuOpen ? 'ecos-journal__body_with-menu' : ''}`}>
            <div className={'ecos-journal__visibility-menu-btn'}>
              <IcoBtn icon={'icon-big-arrow'} className={'ecos-btn_light-blue ecos-btn_hover_dark-blue ecos-btn_narrow ecos-btn_r_biggest'}>
                {'Показать меню'}
              </IcoBtn>
            </div>

            <div className={'ecos-journal__caption'}>
              <Caption large>{t('journals.name')}</Caption>
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

            <div className={'ecos-journal__settings'}>
              <Dropdown source={[{ title: '', id: 0 }]} value={0} valueField={'id'} titleField={'title'} isButton={true}>
                <TwoIcoBtn
                  icons={['icon-settings', 'icon-down']}
                  className={'ecos-btn_white ecos-btn_hover_t-blue ecos-btn_settings-down ecos-btn_x-step_15'}
                />
              </Dropdown>

              <IcoBtn
                icon={'icon-reload'}
                className={
                  'ecos-btn_i ecos-btn_grey ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue ecos-btn_x-step_15'
                }
              />

              <div className={'ecos-journal__settings_right '}>
                <JournalsDashletPagination />

                <IcoBtn
                  icon={'icon-list'}
                  className={
                    'ecos-btn_i ecos-btn_blue2 ecos-btn_bgr-inherit ecos-btn_width_auto ecos-btn_hover_t-light-blue ecos-btn_x-step_15'
                  }
                />

                <IcoBtn
                  icon={'icon-tiles'}
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

            <Well className={'ecos-journal__grid'}>
              <JournalsDashletGrid className={'ecos-grid_no-top-border'} />
            </Well>

            <div className={'ecos-journal__footer'}>
              <JournalsDashletPagination />
            </div>
          </div>

          <div className={`ecos-journal__menu ${menuOpen ? 'ecos-journal__menu_open' : ''}`} />
        </div>
      </Container>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journals);
