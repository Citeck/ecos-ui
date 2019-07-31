import React, { Component } from 'react';
import Timesheet from '../../components/Timesheet';
import './style.scss';

class TimesheetPage extends Component {
  state = {
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
        title: 'Работа в выходные и праздничные дни (отгул + оплата)',
        name: 'weekends-holidays-work-holiday-and-compensation',
        color: '#33DFD5'
      },
      {
        title: 'Работа в выходные и праздничные дни (двойная оплата)',
        name: 'weekends-holidays-work-doubled-compensation',
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
        title: 'Отпуск без сохранения заработной платы',
        name: 'basic-unpaid-leave',
        color: '#DF3386'
      },
      {
        title: 'Отпуск 1 из 5',
        name: 'one-of-five',
        color: '#DF3386'
      },
      {
        title: 'Отпуск за работу в условиях крайнего севера',
        name: 'north-paid-leave',
        color: '#DF3386'
      },
      {
        title: 'Дополнительный отпуск за работу во вредных условиях труда',
        name: 'harmful-paid-leave',
        color: '#DF3386'
      },
      {
        title: 'Отпуск за ненормированный рабочий день',
        name: 'irregular-paid-leave',
        color: '#DF3386'
      },
      {
        title: 'Командировка',
        name: 'business-trip',
        color: '#FFB4D8'
      },
      {
        title: 'Отсутствие',
        name: 'absence',
        color: '#FFB4D8'
      },
      {
        title: 'Отгул',
        name: 'compensatory-leave',
        color: '#FFB4D8'
      }

    ]
  };

  render() {
    const { eventTypes } = this.state;

    return (
      <div>
        <Timesheet eventTypes={eventTypes} />
      </div>
    );
  }
}

export default TimesheetPage;
