import React from 'react';
import NodeCardlet from '../node-cardlet';

// import {utils as CiteckUtils} from 'js/citeck/modules/utils/citeck';
import { requireInOrder } from '../../../../../../helpers/citeck';

// import 'xstyle!citeck/components/dynamic-tree/dynamic-table.css';
// import 'xstyle!citeck/components/document-children/document-children.css';
// import 'xstyle!citeck/components/dynamic-tree/action-renderer.css';

const Alfresco = window.Alfresco;
const Citeck = window.Citeck;

export default class DocumentChildren extends NodeCardlet {
  static getFetchKey(ownProps) {
    return ownProps.nodeRef;
  }

  static fetchData(ownProps, onSuccess, onFailure) {
    let htmlId = 'card-details-cardlet_' + ownProps.id + '_document-children';

    // requireInOrder([
    //     'lib/grouped-datatable',
    //     'modules/documentlibrary/global-folder',
    //     'modules/documentlibrary/copy-move-to',
    //     'modules/documentlibrary/doclib-actions',
    //     'components/documentlibrary/actions'], function () {
    //
    //     require(['citeck/components/dynamic-tree/error-manager',
    //         'citeck/components/dynamic-tree/hierarchy-model',
    //         'citeck/components/dynamic-tree/cell-formatters',
    //         'citeck/components/dynamic-tree/dynamic-table',
    //         'citeck/components/dynamic-tree/action-renderer',
    //         'citeck/components/document-children/document-children',
    //         'citeck/components/document-children/button-panel',
    //         'citeck/components/document-children/button-commands',
    //         'citeck/components/orgstruct/form-dialogs'], function() {
    //
    //         onSuccess({
    //             controlProps: ownProps.controlProps,
    //             htmlId: htmlId,
    //             nodeRef: ownProps.nodeRef
    //         });
    //     });
    // });
  }

  componentDidMount() {
    let htmlId = this.props.data.htmlId;
    let controlProps = this.props.data.controlProps;
    let nodeRef = this.props.data.nodeRef;

    if (!controlProps.hideTwister) {
      let twisterKey = controlProps.twisterKey || 'dc';
      Alfresco.util.createTwister(`${htmlId}-heading`, twisterKey);
    }

    let options = {
      nodeRef,
      childrenUrl: eval('(' + controlProps.childrenUrl + ')'),
      columns: eval('(' + controlProps.columns + ')'),
      responseSchema: eval('(' + controlProps.responseSchema + ')')
    };

    if (controlProps.responseType) {
      options['responseType'] = eval('(' + controlProps.responseType + ')');
    }
    if (controlProps.hideEmpty) {
      options['hideEmpty'] = eval('(' + controlProps.hideEmpty + ')');
    }
    if (controlProps.groupBy) {
      options['groupBy'] = controlProps.groupBy;
    }
    if (controlProps.groupTitle) {
      options['groupTitle'] = controlProps.groupTitle;
    }
    if (controlProps.childrenFormat) {
      options['childrenFormat'] = controlProps.childrenFormat;
    }

    new Citeck.widget.DocumentChildren(htmlId).setOptions(options);

    if (controlProps.buttonsInHeader) {
      new Citeck.widget.ButtonPanel(`${htmlId}-heading-actions`).setOptions({
        args: controlProps
      });
    }
  }

  render() {
    let htmlId = this.props.data.htmlId;
    let headerId = this.props.data.controlProps.header;
    let header = Alfresco.messages.global[headerId] || headerId;

    return (
      <div id={`${htmlId}-panel`} className="document-children document-details-panel">
        <h2 id={`${htmlId}-heading`} className="thin dark">
          {header}
          <span id={`${htmlId}-heading-actions`} className="alfresco-twister-actions" style={{ position: 'relative', float: 'right' }} />
        </h2>
        <div className="panel-body">
          <div id={`${htmlId}`} className="document-view">
            <div id={`${htmlId}-view`} className="document-view" />
          </div>
        </div>
      </div>
    );
  }
}
