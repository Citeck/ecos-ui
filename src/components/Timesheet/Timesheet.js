import React, { Component } from 'react';
import classNames from 'classnames';
import Tabs from './Tabs';
import { t, deepClone } from '../../helpers/util';
import './style.scss';

class Timesheet extends Component {
  state = {
    sheetTabs: [
      {
        name: 'Мой табель',
        isActive: true,
        isAvailable: true
      },
      {
        name: 'Табели подчиненных',
        isActive: false,
        isAvailable: false
      }
    ],
    dateTabs: [
      {
        name: 'Месяц',
        isActive: true,
        isAvailable: true
      },
      {
        name: 'Год',
        isActive: false,
        isAvailable: false
      }
    ]
  };

  handleChangeActiveSheetTab = tabIndex => {
    const sheetTabs = deepClone(this.state.sheetTabs);

    sheetTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ sheetTabs });
  };

  handleChangeActiveDateTab = tabIndex => {
    const dateTabs = deepClone(this.state.dateTabs);

    dateTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ dateTabs });
  };

  render() {
    const { sheetTabs, dateTabs } = this.state;

    return (
      <div className="ecos-timesheet">
        <div className="ecos-timesheet__title">{t('Табели учёта времени')}</div>

        <div className="ecos-timesheet__type">
          <Tabs tabs={sheetTabs} onClick={this.handleChangeActiveSheetTab} />
        </div>

        <div className="ecos-timesheet__header">
          <div className="ecos-timesheet__date-settings">
            <Tabs
              tabs={dateTabs}
              isSmall
              onClick={this.handleChangeActiveDateTab}
              classNameItem="ecos-timesheet__date-settings-tabs-item"
            />
          </div>
        </div>
      </div>
    );
  }
}

export default Timesheet;
