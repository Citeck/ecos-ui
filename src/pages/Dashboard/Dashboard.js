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
        width: '40%',
        widgets: [
          {
            name: 'doc-preview',
            props: {
              id: 'doc-preview-1',
              config: {
                link:
                  '/share/proxy/alfresco/slingshot/node/content/workspace/SpacesStore/801da94d-c08a-472c-8cdd-0d50248adb0b/Договор%20№44.pdf',
                height: '500px',
                scale: 1
              }
            }
          }
        ]
      },
      {
        // width: '60%',
        widgets: [
          {
            name: 'doc-preview',
            props: {
              id: 'doc-preview-0',
              config: {
                link: '/share/proxy/alfresco/slingshot/node/content/workspace/SpacesStore/2557e4b7-725f-40f3-95da-6175a67d3b3f/sample.pdf',
                height: '200px',
                scale: 0.5
              }
            }
          },
          {
            name: 'journal'
          }
        ]
      }
      // {
      //   width: '40%',
      //   widgets: [
      //     {
      //       name: 'doc-preview',
      //       props: {
      //         id: 'doc-preview-1',
      //         config: {
      //           link:
      //             '/share/proxy/alfresco/slingshot/node/content/workspace/SpacesStore/801da94d-c08a-472c-8cdd-0d50248adb0b/Договор%20№44.pdf',
      //           height: '500px',
      //           scale: 1
      //         }
      //       }
      //     }
      //   ]
      // }
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
