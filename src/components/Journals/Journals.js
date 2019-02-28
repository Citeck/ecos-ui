import React, { Component, Fragment } from 'react';
import { Container } from 'reactstrap';
import { connect } from 'react-redux';

import ColumnsWithHeader from '../common/templates/ColumnsWithHeader/ColumnsWithHeader';
import Well from '../common/form/Well/Well';
import Caption from '../common/form/Caption/Caption';
import Btn from '../common/btns/Btn/Btn';
//import IcoButton from '../common/buttons/IcoButton/IcoButton';
//import DropdownButton from '../common/buttons/DropdownButton/DropdownButton';
import Search from '../common/Search/Search';
//import Grid from '../common/grid/Grid/Grid';
import Pagination from '../common/Pagination/Pagination';
import PanelBar from '../common/PanelBar/PanelBar';
//import ToggleBtn from '../common/btns/ToggleBtn/ToggleBtn';
import CollapsableList from '../common/CollapsableList/CollapsableList';
import FilterList from '../FilterList/FilterList';
import ColumnsSetup from '../ColumnsSetup/ColumnsSetup';
import Grouping from '../Grouping/Grouping';
import { t } from '../../helpers/util';

import './Journals.scss';

const mapStateToProps = state => ({ isReady: true });
const mapDispatchToProps = dispatch => ({});

class Journals extends Component {
  constructor(props) {
    super(props);

    this.state = {
      gridSettingsVisible: false
    };
  }

  showGridSettings = () => {
    this.setState({ gridSettingsVisible: !this.state.gridSettingsVisible });
  };

  render() {
    return (
      <Container>
        <div className={'journal'}>
          <ColumnsWithHeader
            cols={[
              <Fragment>
                <Well className={'journal__toolbar'}>
                  {/*<IcoButton icon={'icon-plus'} className={'ico-button_blue journal__create-button'}>*/}
                  {/*Создать*/}
                  {/*</IcoButton>*/}

                  <Search />

                  {/*<DropdownButton className={'journal__export'} />*/}
                </Well>

                <div className={'journal__grid-toolbar'}>
                  {/*<ToggleBtn onClick={this.showGridSettings} className={'journal__toggle-settings'} />*/}

                  {/*<IcoButton icon={'icon-reload'} />*/}
                  {/*<IcoButton icon={'icon-pie'} className={'journal__button-pie'} />*/}
                  {/*<IcoButton icon={'icon-list'} className={'journal__button-list'} />*/}

                  <Pagination />
                </div>

                {!this.state.gridSettingsVisible && (
                  <Well className={'journal__grid-settings'}>
                    <PanelBar header={t('journals.filter-list.header')}>
                      <FilterList />
                    </PanelBar>

                    <PanelBar header={t('journals.columns-setup.header')}>
                      <ColumnsSetup />
                    </PanelBar>

                    <PanelBar header={t('journals.grouping.header')}>
                      <Grouping />
                    </PanelBar>

                    <Btn>{t('journals.action.apply-template')}</Btn>
                    <Btn>{t('journals.action.reset')}</Btn>
                    <Btn>{t('journals.action.apply')}</Btn>
                  </Well>
                )}

                <Well className={'journal__grid'}>{/*<Grid />*/}</Well>
              </Fragment>,

              <Fragment>
                <Well className={'journal__select'}>
                  <CollapsableList list={['Первичные документы', 'Договоры', 'Доп. соглашения', 'Счета']}>
                    {t('journals.name')}
                  </CollapsableList>
                </Well>

                <Well className={'journal__presets'}>
                  <CollapsableList list={['По умолчанию', 'Мой шаблон 1', 'Мой шаблон 2']}>{'ШАБЛОНЫ НАСТРОЕК'}</CollapsableList>
                </Well>
              </Fragment>
            ]}
          >
            <Caption large>{t('journals.name')}</Caption>
          </ColumnsWithHeader>
        </div>
      </Container>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journals);
