import React from 'react';
import NodeCardlet from '../node-cardlet';
import RemoteCardlet from '../remote/remote';
import EcosForm from '../../../components/EcosForm/export';
import { t } from '../../../helpers/util';
import { FORM_MODE_EDIT } from '../../../components/EcosForm';
import Records from '../../../components/Records';

export default class NodeViewFormCardlet extends NodeCardlet {
  state = {
    isReady: true
  };

  static fetchData(ownProps, onSuccess, onFailure) {
    const openEcosFormIfExists = () => {
      const checkUrl = `${window.Alfresco.constants.PROXY_URI}citeck/invariants/view-check?nodeRef=${ownProps.nodeRef}&viewId=&mode=view`;
      window.Alfresco.util.Ajax.jsonGet({
        url: checkUrl,
        successCallback: {
          fn: function(response) {
            const resp = response.json;
            if (!resp.eformExists) {
              return RemoteCardlet.fetchData(ownProps, onSuccess, onFailure);
            }

            onSuccess({
              htmlId: `card-details-cardlet_${ownProps.id}`,
              eformExists: true,
              nodeRef: ownProps.nodeRef,
              column: ownProps.column,
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
    };

    Records.get('ecos-config@ecos-forms-card-enable')
      .load('.bool')
      .then(isEnabled => {
        if (!isEnabled) {
          return RemoteCardlet.fetchData(ownProps, onSuccess, onFailure);
        }

        openEcosFormIfExists();
      })
      .catch(() => {
        return RemoteCardlet.fetchData(ownProps, onSuccess, onFailure);
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

  openEditForm = e => {
    e.preventDefault();

    const { nodeRef } = this.props.data;
    window.Citeck.forms.eform(nodeRef, {
      class: 'ecos-modal_width-lg',
      reactstrapProps: { backdrop: 'static' },
      isBigHeader: true,
      params: {
        onSubmit: r => {
          // hack: EcosForm component force update
          this.setState(
            {
              isReady: false
            },
            () => {
              this.setState({ isReady: true });
            }
          );
        }
      }
    });
  };

  render() {
    const { eformExists, nodeRef, htmlId, header, column } = this.props.data;
    const { isReady } = this.state;

    if (eformExists) {
      return (
        <div id={`${htmlId}-panel`} className="document-children document-details-panel">
          <h2 id={`${htmlId}-heading`} className="thin dark">
            {header}
            <span className="alfresco-twister-actions">
              <a
                href={`/share/page/node-edit?nodeRef=${nodeRef}`}
                className={'icon icon-edit'}
                onClick={this.openEditForm}
                style={{ fontSize: '16px' }}
              />
            </span>
          </h2>

          <div className="panel-body">
            {isReady ? (
              <EcosForm
                record={nodeRef}
                options={{
                  readOnly: true,
                  viewAsHtml: true,
                  viewAsHtmlConfig: {
                    fullWidthColumns: column === 'right'
                  },
                  formMode: FORM_MODE_EDIT
                }}
              />
            ) : null}
          </div>
        </div>
      );
    }

    return <RemoteCardlet {...this.props} />;
  }
}
