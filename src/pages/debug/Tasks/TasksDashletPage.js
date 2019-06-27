import * as React from 'react';
import TasksDashlet from '../../../components/Tasks/TasksDashlet';
import '../testStyle.scss';
import queryString from 'query-string';

export default class TasksDashletPage extends React.Component {
  get urlInfo() {
    const {
      location: { search = '' }
    } = this.props;
    const searchParam = queryString.parse(search);
    const { nodeRef } = searchParam;

    return {
      nodeRef
    };
  }

  render() {
    const taskList1 = {
        id: 'Task_List_1',
        config: {
          sourceId: 'Task_List_1',
          link: 'ya.ru'
        }
      },
      taskList2 = {
        id: 'Task_List_2',
        config: {
          sourceId: 'Task_List_2',
          height: '300px'
        },
        document: 'workspace://SpacesStore/f3193da4-e251-4b1e-aaeb-06a862fbd130'
      },
      taskList3 = {
        id: 'Task_List_3',
        config: {
          sourceId: 'Task_List_3',
          height: '500px'
        },
        document: 'workspace://SpacesStore/65e4b0b2-238b-49b9-ab16-3238bc3c8d0f'
      },
      taskList4 = {
        id: 'Task_List_4',
        config: {
          sourceId: 'Task_List_4',
          height: '400px'
        },
        document: 'workspace://SpacesStore/a331c982-693d-45fd-93c6-59ba22ca8deb'
      };

    return (
      <div className={'ecos-debug-container'}>
        <div className={'ecos-debug-col'}>
          <TasksDashlet id={taskList1.id} document={this.urlInfo.nodeRef} config={taskList1.config} />
          <TasksDashlet id={taskList2.id} document={taskList2.document} config={taskList2.config} title={taskList2.id} />
        </div>
        <div className={'ecos-debug-col'}>
          <TasksDashlet id={taskList3.id} document={taskList3.document} config={taskList3.config} title={taskList3.id} />
          <TasksDashlet id={taskList4.id} document={taskList4.document} config={taskList4.config} title={taskList4.id} />
        </div>
      </div>
    );
  }
}
