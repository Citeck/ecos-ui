import React, { Component } from 'react';
import moment from 'moment';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

import Timesheet, { Tabs, DateSlider } from '../../components/Timesheet';
import { deepClone, t } from '../../helpers/util';

import './style.scss';

class TimesheetPage extends Component {
  state = {
    eventTypes: [
      {
        title: 'Работа в дневное время',
        name: 'daytime-work',
        color: '#00C308',
        canEdit: true
      },
      {
        title: 'Работа в ночное время',
        name: 'night-work',
        color: '#4133DF',
        canEdit: true
      },
      {
        title: 'Работа в выходные и праздничные дни (отгул + оплата)',
        name: 'weekends-holidays-work-holiday-and-compensation',
        color: '#33DFD5',
        canEdit: true
      },
      {
        title: 'Работа в выходные и праздничные дни (двойная оплата)',
        name: 'weekends-holidays-work-doubled-compensation',
        color: '#3382df',
        canEdit: true
      },
      {
        title: 'Сверхурочная работа',
        name: 'overtime-work',
        color: '#DF8633',
        canEdit: true
      },
      {
        title: 'Ежегодный основной оплачиваемый отпуск',
        name: 'annual-basic-paid-leave',
        color: '#DF3386',
        canEdit: false
      },
      {
        title: 'Отпуск без сохранения заработной платы',
        name: 'basic-unpaid-leave',
        color: '#ff41e3',
        canEdit: false
      },
      {
        title: 'Отпуск 1 из 5',
        name: 'one-of-five',
        color: '#d51842',
        canEdit: false
      },
      {
        title: 'Отпуск за работу в условиях крайнего севера',
        name: 'north-paid-leave',
        color: '#e89972',
        canEdit: false
      },
      {
        title: 'Дополнительный отпуск за работу во вредных условиях труда',
        name: 'harmful-paid-leave',
        color: '#c0ac70',
        canEdit: false
      },
      {
        title: 'Отпуск за ненормированный рабочий день',
        name: 'irregular-paid-leave',
        color: '#ff9953',
        canEdit: false
      },
      {
        title: 'Командировка',
        name: 'business-trip',
        color: '#ff3ecb',
        canEdit: false
      },
      {
        title: 'Отсутствие',
        name: 'absence',
        color: '#af9fff',
        canEdit: true
      },
      {
        title: 'Отгул',
        name: 'compensatory-leave',
        color: '#29bd8d',
        canEdit: true
      }
    ],
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
    ],
    currentDate: new Date()
  };

  get daysOfMonth() {
    const { currentDate } = this.state;

    return Array.from({ length: moment(currentDate).daysInMonth() }, (x, i) =>
      moment(currentDate)
        .startOf('month')
        .add(i, 'days')
    ).map(day => day.format('dd, D'));
  }

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

      console.warn(tab);
    });

    this.setState({ dateTabs });
  };

  handleChangeCurrentDate = currentDate => {
    this.setState({ currentDate });
  };

  renderMyTimesheet = () => {
    const { eventTypes } = this.state;

    return <Timesheet eventTypes={eventTypes} daysOfMonth={this.daysOfMonth} />;
  };

  render() {
    const { sheetTabs, dateTabs, currentDate } = this.state;

    return (
      <Router>
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
              <DateSlider onChange={this.handleChangeCurrentDate} date={currentDate} />
            </div>

            <div className="ecos-timesheet__status">Статус</div>
          </div>

          <Route path="/v2/timesheet" exact component={this.renderMyTimesheet} />
        </div>
      </Router>
    );
  }
}

export default TimesheetPage;
