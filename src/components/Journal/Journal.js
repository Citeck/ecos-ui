import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { Container } from 'reactstrap';

import ColumnsWithHeader from '../common/templates/ColumnsWithHeader/ColumnsWithHeader';
import Well from '../common/form/Well/Well';
import Caption from '../common/form/Caption/Caption';
import Button from '../common/buttons/Button/Button';
import IcoButton from '../common/buttons/IcoButton/IcoButton';
import DropdownButton from '../common/buttons/DropdownButton/DropdownButton';
import Search from '../common/Search/Search';
import Grid from '../common/Grid/Grid';
import Pagination from '../common/Pagination/Pagination';
import PanelBar from '../common/PanelBar/PanelBar';
import ToggleButton from '../common/buttons/ToggleButton/ToggleButton';
import CollapsableList from '../common/CollapsableList/CollapsableList';
import FilterList from '../FilterList/FilterList';
import ColumnsSetup from '../ColumnsSetup/ColumnsSetup';
import Grouping from '../Grouping/Grouping';

import './Journal.scss';

const mapStateToProps = state => ({ isReady: true });
const mapDispatchToProps = dispatch => ({});

class Journal extends Component {
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
      <div className={'journal'}>
        <Container>
          <ColumnsWithHeader
            cols={[
              <Fragment>
                <Well className={'journal__toolbar'}>
                  <IcoButton icon={'icon-plus'} className={'ico-button_blue journal__create-button'}>
                    Создать
                  </IcoButton>

                  <Search />

                  <DropdownButton className={'journal__export'} />
                </Well>

                <div className={'journal__grid-toolbar'}>
                  <ToggleButton onClick={this.showGridSettings} className={'journal__toggle-settings'} />

                  <IcoButton icon={'icon-reload'} />
                  <IcoButton icon={'icon-pie'} className={'journal__button-pie'} />
                  <IcoButton icon={'icon-list'} className={'journal__button-list'} />

                  <Pagination />
                </div>

                {!this.state.gridSettingsVisible && (
                  <Well className={'journal__grid-settings'}>
                    <PanelBar header={'ФИЛЬТРАЦИЯ'}>
                      <FilterList />
                    </PanelBar>

                    <PanelBar header={'НАСТРОЙКА КОЛОНОК'}>
                      <ColumnsSetup />
                    </PanelBar>

                    <PanelBar header={'ГРУППИРОВКА'}>
                      <Grouping />
                    </PanelBar>

                    <Button>Сохранить в шаблон</Button>
                    <Button>Сборсить</Button>
                    <Button>Применить</Button>
                  </Well>
                )}

                <Well className={'journal__grid'}>
                  <Grid />
                </Well>
              </Fragment>,

              <Fragment>
                <Well className={'journal__select'}>
                  <CollapsableList list={['Первичные документы', 'Договоры', 'Доп. соглашения', 'Счета']}>{'ЖУРНАЛЫ'}</CollapsableList>
                </Well>

                <Well className={'journal__presets'}>
                  <CollapsableList list={['По умолчанию', 'Мой шаблон 1', 'Мой шаблон 2']}>{'ШАБЛОНЫ НАСТРОЕК'}</CollapsableList>
                </Well>
              </Fragment>
            ]}
          >
            <Caption large>{'Журналы'}</Caption>
          </ColumnsWithHeader>
        </Container>
      </div>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Journal);
