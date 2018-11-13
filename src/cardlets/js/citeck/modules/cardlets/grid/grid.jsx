import React from 'react';
import NodeCardlet from '../node-cardlet';
import Grid from '../../grid/grid';
import dataSourceStore from '../../grid/dataSource/dataSourceStore';

export default class GridCardlet extends NodeCardlet {
  static fetchData(ownProps, onSuccess, onFailure) {
    require(['citeck/components/dynamic-tree/cell-formatters'], function() {
      let controlProps = ownProps.controlProps;
      let htmlId = 'card-details-cardlet_' + ownProps.id + '_grid';
      let dataSourceName = controlProps.dataSourceName.trim();
      let url = eval('(' + controlProps.url + ')');
      let ajax = eval('(' + controlProps.ajax + ')');
      let columns = eval('(' + controlProps.columns + ')');

      const dataSource = new dataSourceStore[dataSourceName]({
        url: url,
        ajax: ajax,
        columns: columns
      });

      dataSource.load().then(function(data) {
        let headerId = controlProps.header;

        onSuccess({
          data: data.records,
          columns: dataSource.getColumns(),
          htmlId: htmlId,
          header: Alfresco.util.message(headerId),
          hideTwister: controlProps.hideTwister,
          twisterKey: controlProps.twisterKey
        });
      });
    });
  }

  componentDidMount() {
    let props = this.props.data;
    let htmlId = props.htmlId;
    let hideTwister = props.hideTwister;

    if (!hideTwister) {
      let twisterKey = props.twisterKey || 'dc';
      Alfresco.util.createTwister(`${htmlId}-heading`, twisterKey);
    }
  }

  render() {
    const props = this.props.data;
    const htmlId = props.htmlId;
    const header = props.header;
    const data = props.data;
    const columns = props.columns;

    return (
      <div id={`${htmlId}-panel`} className="document-children document-details-panel">
        <h2 id={`${htmlId}-heading`} className="thin dark">
          {header}
          <span id={`${htmlId}-heading-actions`} className="alfresco-twister-actions" style={{ position: 'relative', float: 'right' }} />
        </h2>

        <div className="panel-body">
          <Grid keyField="id" data={data} columns={columns} />
        </div>
      </div>
    );
  }
}
