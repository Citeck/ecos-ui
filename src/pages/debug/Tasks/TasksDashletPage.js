import * as React from 'react';
import TasksDashlet from '../../../components/Tasks/TasksDashlet';
import '../testStyle.scss';

export default class TasksDashletPage extends React.Component {
  render() {
    const data = {
      id: 'dashlet@tasks@123456789',
      config: {
        id: 'dashlet@tasks@123456789',
        height: '700px'
      }
    };

    return (
      <div className={'ecos-debug-container'}>
        <TasksDashlet id={data.id} config={data.config} classNameDashlet={'ecos-debug-col'} />
        <TasksDashlet id={data.id} config={data.config} classNameDashlet={'ecos-debug-col'} />
      </div>
    );
  }
}
