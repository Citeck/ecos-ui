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
