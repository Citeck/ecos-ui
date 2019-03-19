import React, { Component } from 'react';
import classNames from 'classnames';
import { Grid } from '../';
import ExpanderFormatter from '../formatters/ExpanderFormatter/ExpanderFormatter';

import './TreeGrid.scss';

export default class TreeGrid extends Component {
  constructor(props) {
    super(props);

    this.state = { expanded: [] };

    this.fakeColumnIndex = 1;
    this.level = props.level || 0;
    this.childColumns = undefined;
  }

  expand = rowIndex => {
    let expanded = this.state.expanded;
    let newExpanded;

    if (expanded.includes(rowIndex)) {
      newExpanded = expanded.filter(x => x !== rowIndex);
    } else {
      newExpanded = [...expanded, rowIndex];
    }

    this.setState({ expanded: newExpanded });
  };

  addFakeColumns(columns) {
    let fakeColumns = Array.from(columns);

    fakeColumns.unshift({
      isDummyField: true,
      dataField: '__' + this.fakeColumnIndex++,
      text: '',
      classes: 'tree-grid__expander-td',
      formatExtraData: this.props.noExpander ? undefined : { formatter: ExpanderFormatter, onClick: this.expand }
    });

    for (let i = 0; i < this.level; i++) {
      fakeColumns.unshift({
        dataField: '_' + this.fakeColumnIndex++,
        text: '',
        classes: 'tree-grid__empty-td'
      });
    }

    return fakeColumns;
  }

  lastLevelContent = (row, level) => {
    const lastLevelContent = this.props.lastLevelContent;
    return typeof lastLevelContent === 'function' ? lastLevelContent(row, level) : null;
  };

  getExpandRow() {
    let level = this.level + 1;
    let childColumns = this.childColumns;

    return {
      renderer: row => {
        let data = [];
        const rowsChildren = row.children || [];
        const first = rowsChildren[0] || {};

        if (first.children) {
          data = rowsChildren;
        }

        return (
          <div className={'tree-grid__child-wrapper'}>
            {data.length ? (
              <TreeGrid
                classes="tree-grid__child tree-grid__child_hide-header"
                data={data}
                level={level}
                childColumns={childColumns}
                lastLevelContent={this.lastLevelContent}
              />
            ) : (
              this.lastLevelContent(row, level)
            )}
          </div>
        );
      },
      expanded: this.state.expanded,
      expandByColumnOnly: true
    };
  }

  render() {
    const props = this.props;

    this.childColumns = props.childColumns || Array.from(props.columns);

    const expandRow = this.getExpandRow(props.children);
    const columns = this.addFakeColumns(this.childColumns);
    const classes = classNames('tree-grid', props.classes);

    return <Grid {...props} classes={classes} columns={columns} expandRow={expandRow} />;
  }
}
