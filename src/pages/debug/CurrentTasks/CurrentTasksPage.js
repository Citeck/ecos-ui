import * as React from 'react';
import queryString from 'query-string';
import { deepClone } from '../../../helpers/util';
import CurrentTasksDashlet, { CurrentTasks } from '../../../components/CurrentTasks';
import '../testStyle.scss';

const getNodeRef = url => queryString.parse(url).nodeRef;
const getDocumentId = nodeRef => nodeRef.split('workspace://SpacesStore/')[1];

export default class CurrentTasksPage extends React.Component {
  render() {
    const {
      location: { search = '' }
    } = this.props;
    const nodeRef = getNodeRef(search);
    const taskConfigUrl = {
      id: getDocumentId(nodeRef),
      document: nodeRef,
      title: undefined,
      // title: 'Текущие задачи #' + nodeRef,
      config: {
        height: '300px'
      }
    };
    const configs = [taskConfigUrl];
    const urls = ['?nodeRef=workspace://SpacesStore/5409bdbc-d3bf-4661-8e1d-58ef1fd8a1fa'];

    const fillTask = item => {
      const template = deepClone(taskConfigUrl);
      const nodeRef = getNodeRef(item);
      const id = getDocumentId(nodeRef);

      template.document = nodeRef;
      template.title = 'Текущие задачи #' + id;
      template.id = id;
      template.config.sourceId = id;

      return template;
    };

    urls.forEach(item => {
      configs.push(fillTask(item));
    });

    const col2 = configs.splice(Math.ceil(configs.length / 2));

    return (
      <div>
        <h3>Demo Current tasks ({configs.length})</h3>
        <div className={'ecos-debug-container'}>
          <div className={'ecos-debug-col'}>
            <h5>Widget</h5>
            {configs.map((item, index) => (
              <CurrentTasksDashlet id={item.id} record={item.document} config={item.config} title={item.title} key={item.id + index} />
            ))}
          </div>
          <div className={'ecos-debug-col'}>
            <h5>Solo</h5>
            {col2.map((item, index) => (
              <CurrentTasks
                stateId={'c-task-' + index}
                record={item.document}
                config={item.config}
                title={item.title}
                key={item.id + index}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
}
