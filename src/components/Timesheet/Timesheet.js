import React, { Component } from 'react';
import classNames from 'classnames';
import moment from 'moment';
import { Scrollbars } from 'react-custom-scrollbars';

import Tabs from './Tabs';
import DateSlider from './DateSlider';
import { Input } from '../common/form';
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
    currentDate: new Date(),
    typeFilter: '',
    eventTypes: [
      {
        title: 'Работа в дневное время',
        name: 'daytime-work',
        color: '#00C308'
      },
      {
        title: 'Работа в ночное время',
        name: 'night-work',
        color: '#4133DF'
      },
      {
        title: 'Работа в выходные и праздничные дни',
        name: 'weekends-holidays-work',
        color: '#33DFD5'
      },
      {
        title: 'Сверхурочная работа',
        name: 'overtime-work',
        color: '#DF8633'
      },
      {
        title: 'Ежегодный основной оплачиваемый отпуск',
        name: 'annual-basic-paid-leave',
        color: '#DF3386'
      },
      {
        title: 'Командировка',
        name: 'business-trip',
        color: '#FFB4D8'
      }
    ]
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
    });

    this.setState({ dateTabs });
  };

  handleChangeCurrentDate = currentDate => {
    this.setState({ currentDate });
  };

  handleFilterTypes = event => {
    this.filterTypes(event.target.value);
    console.warn(event.target.value);
  };

  handleClearFilterTypes = () => {
    this.filterTypes('');
  };

  filterTypes(typeFilter = '') {
    this.setState({ typeFilter });
  }

  renderFilter() {
    const { typeFilter } = this.state;

    return (
      <div className="ecos-timesheet__table-search">
        <Input
          className="ecos-timesheet__table-search-input"
          placeholder={t('Найти событие')}
          value={typeFilter}
          onChange={this.handleFilterTypes}
        />

        {typeFilter && <div className="ecos-timesheet__table-search-clear" onClick={this.handleClearFilterTypes} />}
      </div>
    );
  }

  renderCalendar() {
    const { currentDate } = this.state;
    const days = [];
    const dayInMonth = moment(currentDate).daysInMonth();

    for (let i = 0; i < dayInMonth; i++) {
      days.push(this.renderDay({ key: i, title: this.daysOfMonth[i] }));
    }

    return (
      <Scrollbars autoHeight autoHeightMin={40} autoHeightMax={'100%'} renderThumbVertical={props => <div {...props} hidden />}>
        <div className="ecos-timesheet__table-calendar">
          {this.daysOfMonth.map(day => (
            <div className="ecos-timesheet__table-calendar-column" key={day}>
              <div className="ecos-timesheet__table-calendar-cell ecos-timesheet__table-calendar-cell_big">
                <div className="ecos-timesheet__table-calendar-cell-content">{day}</div>
              </div>
              <div className="ecos-timesheet__table-calendar-cell ecos-timesheet__table-calendar-cell_hours ecos-timesheet__table-calendar-cell_big">
                <div className="ecos-timesheet__table-calendar-cell-content">10</div>
              </div>
            </div>
          ))}
          {/*{days}*/}
        </div>
      </Scrollbars>
    );
  }

  renderDay = day => {
    return (
      <div key={day.key} className="ecos-timesheet__table-calendar-item">
        <div className="ecos-timesheet__table-calendar-day">{day.title}</div>
      </div>
    );
  };

  render() {
    const { sheetTabs, dateTabs, currentDate } = this.state;

    console.warn(this.daysOfMonth);

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
            <DateSlider onChange={this.handleChangeCurrentDate} date={currentDate} />
          </div>

          <div className="ecos-timesheet__status">Статус</div>
        </div>

        <div className="ecos-timesheet__table">
          <div className="ecos-timesheet__table-left-column">{this.renderFilter()}</div>
          <div className="ecos-timesheet__table-right-column">{this.renderCalendar()}</div>
        </div>
      </div>
    );
  }
}

export default Timesheet;
