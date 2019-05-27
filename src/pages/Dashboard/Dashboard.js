import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { MENU_POSITION } from '../../constants/dashboard';
import Layout from '../../components/Layout';

class Dashboard extends Component {
  state = {
    menu: {
      type: 'TOP',
      links: [
        {
          title: 'Журнал',
          position: 0,
          link: '/share/page/journals'
        },
        {
          title: 'Журнал дашборд и ещё много-много текста в этой ссылке',
          position: 1,
          link: '/share/page/journalsDashboard'
        },
        {
          title: 'Настройка дашборда',
          position: 2,
          link: '/dashboard/settings'
        },
        {
          title: 'Настройка дашборда',
          position: 3,
          link: '/dashboard/settings'
        },
        {
          title: 'Настройка дашборда',
          position: 4,
          link: '/dashboard/settings'
        }
      ]
    },
    columns: [
      {
        width: '20%',
        widgets: []
      }
    ]
  };

  render() {
    const { menu, columns } = this.state;

    return (
      <div>
        Dashboard
        <Layout columns={columns} menu={menu} />
      </div>
    );
  }
}

export default Dashboard;
