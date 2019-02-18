import React, { Component } from 'react';
import classNames from 'classnames';
import BootstrapTable from 'react-bootstrap-table-next';
import Icon from '../../icons/Icon/Icon';
//import DataSourceStore from '../dataSource/DataSourceStore';

import './TreeGrid.scss';

class ExpanderFormatter extends Component {
  _onClick = () => {
    this.props.onClick(this.props.rowIndex);
  };

  render() {
    return <i className={classNames('tree-grid__expander', this.props.expand ? 'icon-down' : 'icon-right')} onClick={this._onClick} />;
  }
}

class HeaderFormatter extends Component {
  render() {
    return (
      <div className={'tree-grid__th'}>
        <span>{this.props.column.text}</span>
        <Icon className={'tree-grid__filter icon-filter'} />
      </div>
    );
  }
}

export default class TreeGrid extends Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: []
    };

    this.index = 1;
    this.level = props.level || 0;
    this.columns = props.columns || [
      {
        dataField: 'date',
        text: 'Дата создания',
        headerFormatter: (column, colIndex) => {
          return <HeaderFormatter column={column} colIndex={colIndex} />;
        }
      },
      {
        dataField: 'title',
        text: 'Заголовок',
        headerFormatter: (column, colIndex) => {
          return <HeaderFormatter column={column} colIndex={colIndex} />;
        }
      },
      {
        dataField: 'status',
        text: 'Статус',
        headerFormatter: (column, colIndex) => {
          return <HeaderFormatter column={column} colIndex={colIndex} />;
        }
      },
      {
        dataField: 'ure',
        text: 'Юридическое лицо',
        headerFormatter: (column, colIndex) => {
          return <HeaderFormatter column={column} colIndex={colIndex} />;
        }
      }
    ];
    this._columns = props._columns || Array.from(this.columns);
    this.expanderStates = [];
  }

  expand = rowIndex => {
    const expandedIndex = rowIndex + 1;
    let expanded = this.state.expanded;
    let newExpanded;

    if (expanded.includes(expandedIndex)) {
      this.expanderStates[rowIndex] = false;
      newExpanded = expanded.filter(x => x !== expandedIndex);
    } else {
      this.expanderStates[rowIndex] = true;
      newExpanded = [...expanded, expandedIndex];
    }

    this.setState(() => ({
      expanded: newExpanded
    }));
  };

  addFakeColumns(columns) {
    let that = this;
    let fakeColumns = Array.from(columns);

    fakeColumns.unshift({
      isDummyField: true,
      dataField: '__' + this.index++,
      text: '',
      classes: 'tree-grid__expander-td',
      formatter: (cell, row, rowIndex) => {
        return <ExpanderFormatter onClick={that.expand} rowIndex={rowIndex} expand={that.expanderStates[rowIndex]} />;
      }
    });

    for (let i = 0; i < this.level; i++) {
      fakeColumns.unshift({
        dataField: '_' + this.index++,
        text: '',
        classes: 'tree-grid__empty-td'
      });
    }

    return fakeColumns;
  }

  getExpandRow() {
    let products = this.props.data.slice(0, 3);
    let expanded = this.state.expanded;
    let level = this.level + 1;
    let _columns = this._columns;

    return {
      renderer: () => {
        return (
          <div className={'tree-grid__child-wrapper'}>
            <TreeGrid classes="tree-grid__child tree-grid__child_hide-header" _columns={_columns} data={products} level={level} />
          </div>
        );
      },
      expandByColumnOnly: true,
      expanded: expanded
    };
  }

  // componentDidMount() {
  //   let url = 'http://localhost:3000/share/proxy/alfresco/citeck/ecos/records';
  //   let ajax = eval('(' + '{body: {query: {\'query\': \'{"nodeRef": "${nodeRef}", "events":"node.created,node.updated,assoc.updated,task.complete,user.action,status.changed,esign.signed,approval.cancelled,role.changed"}\', \'sourceId\': \'history\', \'language\': \'document\' } } }' + ')');
  //
  //   const dataSource = new DataSourceStore['GqlDataSource']({
  //     url: url,
  //     ajax: ajax,
  //     columns: []
  //   });
  //
  //   dataSource.load().then(function (data) {
  //     console.log(data);
  //   }).catch(function(){
  //   });
  // }

  render() {
    let props = this.props;
    let expandRow = this.getExpandRow();
    let columns = this.addFakeColumns(this._columns);

    return <BootstrapTable keyField="id" bordered={false} classes={'tree-grid'} columns={columns} expandRow={expandRow} {...props} />;
  }
}
