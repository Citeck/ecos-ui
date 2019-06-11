import React from 'react';
import NodeCardlet from '../node-cardlet';
import RemoteCardlet from '../remote/remote';
import EcosForm from '../../../components/EcosForm/export';
// import Records from '../../../components/Records';
import { t } from '../../../helpers/util';

export default class NodeViewFormCardlet extends NodeCardlet {
  static fetchData(ownProps, onSuccess, onFailure) {
    const checkUrl = `${window.Alfresco.constants.PROXY_URI}citeck/invariants/view-check?nodeRef=${ownProps.nodeRef}&viewId=&mode=view`;

    window.Alfresco.util.Ajax.jsonGet({
      url: checkUrl,
      successCallback: {
        fn: function(response) {
          const resp = response.json;
          if (!resp.eformExists) {
            RemoteCardlet.fetchData(ownProps, onSuccess, onFailure);
          }

          onSuccess({
            htmlId: `card-details-cardlet_${ownProps.id}`,
            eformExists: true,
            nodeRef: ownProps.nodeRef,
            hideTwister: ownProps.controlProps.hideTwister,
            header: t(ownProps.controlProps.header || 'cardlets.node-view.twister-header')
          });
        }
      },
      failureCallback: {
        fn: function(response) {
          RemoteCardlet.fetchData(ownProps, onSuccess, onFailure);
        }
      }
    });
  }

  componentDidMount() {
    const data = this.props.data;
    const { htmlId, hideTwister } = data;

    if (!hideTwister) {
      const twisterKey = data.twisterKey || 'dc';
      window.Alfresco.util.createTwister(`${htmlId}-heading`, twisterKey);
    }
  }

  openEditForm = () => {
    const { nodeRef } = this.props.data;
    window.Citeck.forms.eform(nodeRef, {
      class: 'ecos-modal_width-lg',
      reactstrapProps: { backdrop: 'static' },
      isBigHeader: true,
      params: {
        onSubmit: r => {
          console.log('onSubmit', r);
          // Records.forgetRecord(r.id);
          this.forceUpdate();
        }
      }
    });
  };

  render() {
    const { eformExists, nodeRef, htmlId, header } = this.props.data;
    if (eformExists) {
      return (
        <div id={`${htmlId}-panel`} className="document-children document-details-panel">
          <h2 id={`${htmlId}-heading`} className="thin dark">
            {header}
            <span id={`${htmlId}-heading-actions`} className="alfresco-twister-actions" style={{ position: 'relative', float: 'right' }}>
              <p onClick={this.openEditForm}>edit</p>
            </span>
          </h2>

          <div className="panel-body">
            <EcosForm
              record={nodeRef}
              options={{
                readOnly: true,
                viewAsHtml: true,

                viewAsHtmlConfig: {
                  fullWidthColumns: true,
                  hidePanels: true,
                  alwaysWrap: true
                }
              }}
            />
          </div>
        </div>
      );
    }

    return <RemoteCardlet {...this.props} />;
  }
}
