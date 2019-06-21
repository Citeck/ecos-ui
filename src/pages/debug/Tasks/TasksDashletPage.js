import * as React from 'react';
import TasksDashlet from '../../../components/Tasks/TasksDashlet';

export default class TasksDashletPage extends React.Component {
  render() {
    const data = {
      id: 'dashlet@tasks@123456789',
      config: {
        id: 'dashlet@tasks@123456789',
        height: '500px'
      }
    };

    return <TasksDashlet id={data.id} config={data.config} />;
  }
}
