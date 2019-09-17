import React, { Component } from 'react';
import moment from 'moment';
import 'moment-business-days';
import { withRouter } from 'react-router-dom';

import Timesheet, { Tabs, DateSlider } from '../../components/Timesheet';
import { changeUrlLink } from '../../components/PageTabs/PageTabs';
import { deepClone, t } from '../../helpers/util';
import { URL } from '../../constants';

import './style.scss';

class SubordinatesTimesheetPage extends Component {
  constructor(props) {
    super(props);

    const {
      history: { location }
    } = props;

    const eventTypes = [
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
    ];

    this.state = {
      eventTypes,
      subordinatesEvents: [
        {
          user: 'Пантелеева Мадина (212392064)',
          organization: 'ООО ДжиИ Рус',
          eventTypes: deepClone(eventTypes)
        },
        {
          user: 'Медведева Диана (212572436)',
          organization: 'ООО ДжиИ Рус',
          eventTypes: deepClone(eventTypes)
        },
        {
          user: 'Миронова Татьяна (212604506)',
          organization: 'ООО ДжиИ Рус',
          eventTypes: deepClone(eventTypes)
        },
        {
          user: 'Кулахметов Шамиль (212594037)',
          organization: 'ООО ДжиИ Хэлскеа',
          eventTypes: deepClone(eventTypes)
        },
        {
          user: 'Печкуров Григорий (212555619)',
          organization: 'ООО АЛЬСТОМ',
          eventTypes: deepClone(eventTypes)
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
      statusTabs: [
        {
          name: 'Не заполнены',
          isActive: true,
          isAvailable: true
        },
        {
          name: 'На согласовании менеджера',
          isActive: false,
          isAvailable: true
        },
        {
          name: 'Согласованы менеджером',
          isActive: false,
          isAvailable: true
        },
        {
          name: 'Отправлены в доработку',
          isActive: false,
          isAvailable: true
        },
        {
          name: 'Согласованные',
          isActive: false,
          isAvailable: true
        }
      ],
      currentDate: new Date(),
      daysOfMonth: this.getDaysOfMonth(new Date())
    };
  }

  getDaysOfMonth = currentDate =>
    Array.from({ length: moment(currentDate).daysInMonth() }, (x, i) =>
      moment(currentDate)
        .startOf('month')
        .add(i, 'days')
    ).map(day => ({
      number: day.format('D'),
      title: day.format('dd, D'),
      isBusinessDay: moment(day).isBusinessDay(),
      isCurrentDay: moment().isSame(moment(day), 'd')
    }));

  handleChangeActiveDateTab = tabIndex => {
    const dateTabs = deepClone(this.state.dateTabs);

    dateTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ dateTabs });
  };

  handleChangeCurrentDate = currentDate => {
    this.setState({ currentDate, daysOfMonth: this.getDaysOfMonth(currentDate) });
  };

  handleChangeStatusTab = tabIndex => {
    const statusTabs = deepClone(this.state.statusTabs);

    statusTabs.forEach((tab, index) => {
      tab.isActive = index === tabIndex;
    });

    this.setState({ statusTabs });
  };

  handleChangeTimesheet = subordinatesEvents => {
    this.setState({ subordinatesEvents });
  };

  renderSubordinateTimesheet = () => {
    const { subordinatesEvents, daysOfMonth } = this.state;

    return <Timesheet groupBy={'user'} eventTypes={subordinatesEvents} daysOfMonth={daysOfMonth} onChange={this.handleChangeTimesheet} />;
  };

  render() {
    const { sheetTabs, dateTabs, currentDate, statusTabs } = this.state;

    return (
      <div className="ecos-timesheet">
        <div className="ecos-timesheet__title">{t('Табели учёта времени для проверки')}</div>

        <div className="ecos-timesheet__header">
          <div className="ecos-timesheet__date-settings">
            {/*<Tabs*/}
            {/*tabs={dateTabs}*/}
            {/*isSmall*/}
            {/*onClick={this.handleChangeActiveDateTab}*/}
            {/*classNameItem="ecos-timesheet__date-settings-tabs-item"*/}
            {/*/>*/}
            <DateSlider onChange={this.handleChangeCurrentDate} date={currentDate} />
          </div>

          <div className="ecos-timesheet__status">
            <Tabs tabs={statusTabs} isSmall onClick={this.handleChangeStatusTab} classNameItem="ecos-timesheet__status-tabs-item" />
          </div>
        </div>

        {this.renderSubordinateTimesheet()}
      </div>
    );
  }
}

export default SubordinatesTimesheetPage;
