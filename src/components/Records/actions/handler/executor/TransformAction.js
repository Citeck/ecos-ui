import ecosFetch from '../../../../../helpers/ecosFetch';
import ActionsExecutor from '../ActionsExecutor';

export default class TransformAction extends ActionsExecutor {
  static ACTION_ID = 'transform';

  async execForRecord(record, action, context) {
    const config = action.config || {};
    const input = config.input || {
      type: 'entity-content',
      config: { entityRef: record.id }
    };
    const transformations = config.transformations || [];
    const output = config.output || {
      type: 'temp-file',
      config: {}
    };

    return ecosFetch('/gateway/transformations/api/tfm/transform', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input,
        transformations,
        output
      })
    })
      .then(r => {
        if (r.ok) {
          return r.json();
        }
        throw new Error(r.statusText);
      })
      .then(json => {
        if (!config.output) {
          const a = document.createElement('a');
          a.setAttribute('href', '/gateway/emodel/api/ecos/webapp/content?ref=' + json.result);
          document.body.appendChild(a); // required for firefox
          a.click();
          a.remove();
          return false;
        }
        return json;
      });
  }

  getDefaultActionModel() {
    return {
      name: 'record-action.name.download',
      icon: 'icon-download'
    };
  }
}
