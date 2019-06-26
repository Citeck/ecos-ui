import * as React from 'react';
import TasksDashlet from '../../../components/Tasks/TasksDashlet';
import '../testStyle.scss';

export default class TasksDashletPage extends React.Component {
  render() {
    const data = [
      {
        id: 'wftask1',
        config: {
          id: 'wftask1',
          height: '300px'
        }
      },
      {
        id: 'wftask',
        config: {
          id: 'wftask',
          height: '700px'
        }
      }
    ];

    return (
      <div className={'ecos-debug-container'}>
        <TasksDashlet id={data[0].id} config={data[0].config} classNameDashlet={'ecos-debug-col'} />
        <TasksDashlet id={data[1].id} config={data[1].config} classNameDashlet={'ecos-debug-col'} />
      </div>
    );
  }
}
