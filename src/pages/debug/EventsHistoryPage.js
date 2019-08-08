import * as React from 'react';
import queryString from 'query-string';
import { get, split } from 'lodash';
import { deepClone } from '../../helpers/util';
import EventsHistoryDashlet, { EventsHistory } from '../../components/EventsHistory';

import './testStyle.scss';

const getNodeRef = url => get(queryString.parse(url), 'recordRef', {});
const getDocumentId = nodeRef => get(split(nodeRef, 'workspace://SpacesStore/'), '1');

export default class EventsHistoryPage extends React.Component {
  render() {
    const {
      location: { search = '' }
    } = this.props;
    const nodeRef = getNodeRef(search);
    const taskConfigUrl = {
      id: getDocumentId(nodeRef),
      document: nodeRef,
      title: undefined,
      config: {
        height: '500px'
      }
    };
    const configs = [taskConfigUrl];

    const urls = [
      'workspace://SpacesStore/f3a03c6c-cb8a-41a5-9d06-52571d5f421c',
      'workspace://SpacesStore/b7df6e91-d366-4c99-a938-e96cf80dbbbe'
    ];

    const fill = ref => {
      const template = deepClone(taskConfigUrl);
      const nodeRef = ref;
      const id = getDocumentId(nodeRef);

      template.document = nodeRef;
      template.title = '';
      template.id = id;

      return template;
    };

    urls.forEach(ref => {
      configs.push(fill(ref));
    });

    const col2 = configs.splice(Math.ceil(configs.length / 2));

    return (
      <div>
        <h3>Demo Action History</h3>
        <div className={'ecos-debug-container'}>
          <div className={'ecos-debug-col ecos-debug-col_small'}>
            <h5>Widget Card</h5>
            {configs.map((item, index) => (
              <EventsHistoryDashlet id={item.id} record={item.document} config={item.config} title={item.title} key={item.id + index} />
            ))}
          </div>
          <div className={'ecos-debug-col'}>
            <h5>Widget Grid</h5>
            {col2.map((item, index) => (
              <EventsHistoryDashlet id={item.id} record={item.document} config={item.config} title={item.title} key={item.id + index} />
            ))}
          </div>
          <div className={'ecos-debug-col'}>
            <h5>Solo</h5>
            {col2.map((item, index) => (
              <EventsHistory record={item.document} {...item.config} key={item.id + index} stateId={'tasks' + index} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}
