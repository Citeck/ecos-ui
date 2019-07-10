import * as React from 'react';
import queryString from 'query-string';
import '../testStyle.scss';
import { deepClone } from '../../../helpers/util';
import DocStatusDashlet from '../../../components/DocStatus';

const getSomeRef = url => queryString.parse(url).recordRef;
const getDocumentId = ref => ref.split('workspace://SpacesStore/')[1];

export default class DocStatusPage extends React.Component {
  render() {
    const {
      location: { search = '' }
    } = this.props;
    const ref = getSomeRef(search);
    const taskConfigUrl = {
      id: getDocumentId(ref),
      document: ref,
      title: undefined,
      // title: 'Свойства #' + ref,
      config: {}
    };
    const configs = [taskConfigUrl];

    const params = ['?recordRef=workspace://SpacesStore/ee3a3405-1cd6-430d-8f4f-c614e020dc17'];

    const fillTask = item => {
      const template = deepClone(taskConfigUrl);
      const ref = getSomeRef(item);
      const id = getDocumentId(ref);

      template.document = ref;
      template.title = 'Свойства #' + id;
      template.id = id;
      template.config.sourceId = id;

      return template;
    };

    params.forEach(item => {
      configs.push(fillTask(item));
    });

    const col2 = configs.splice(Math.ceil(configs.length / 2));

    return (
      <div>
        <h3>Demo Status</h3>
        <div className={'ecos-debug-container'}>
          <div className={'ecos-debug-col ecos-debug-col_small'}>
            <h5>Widget</h5>
            {configs.map((item, index) => (
              <DocStatusDashlet id={item.id} record={item.document} config={item.config} title={item.title} key={item.id + index} />
            ))}
          </div>
          {/*<div className={'ecos-debug-col'}>
            <h5>Solo</h5>
            {col2.map((item, index) => (
              <DocStatus record={item.document} {...item.config} key={item.id + index} stateId={'Status' + index} />
            ))}
          </div>*/}
        </div>
      </div>
    );
  }
}
