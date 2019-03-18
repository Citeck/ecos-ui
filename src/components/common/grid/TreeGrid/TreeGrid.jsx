import React, { Component } from 'react';
import classNames from 'classnames';
import { Grid } from '../';
import ExpanderFormatter from '../formatters/ExpanderFormatter/ExpanderFormatter';

import './TreeGrid.scss';

function triggerEvent(name, data) {
  const callback = this.props[name];

  if (typeof callback === 'function') {
    callback.call(this, data);
  }
}

export default class TreeGrid extends Component {
  constructor(props) {
    super(props);

    this.state = { expanded: [] };

    this.fakeColumnIndex = 1;
    this.level = props.level || 0;

    this._columns = props._columns || Array.from(props.columns);
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
      dataField: '__' + this.fakeColumnIndex++,
      text: '',
      classes: 'tree-grid__expander-td',
      formatExtraData: {
        formatter: ExpanderFormatter,
        onClick: that.expand,
        expanderStates: that.expanderStates
      }
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

  onExpand = e => {
    triggerEvent.call(this, 'onExpand', e);
  };

  getExpandRow(children) {
    let level = this.level + 1;
    let columns = this._columns;

    return {
      renderer: row => {
        let data = [];
        const rowsChildren = row.children || [];
        const first = rowsChildren[0] || {};

        if (first.children) {
          data = rowsChildren;
        }

        // console.log(level);
        // console.log(row);

        return (
          <div className={'tree-grid__child-wrapper'}>
            <TreeGrid
              classes="tree-grid__child tree-grid__child_hide-header"
              _columns={columns}
              data={data}
              level={level}
              children={children}
            />
          </div>
        );
      },
      onExpand: this.onExpand,
      expanded: this.getExpanded(children, level)
      // expandByColumnOnly: true,
    };
  }

  getExpanded = (children, level) => {
    children = children || [];
    let expanded = [];

    (children || []).forEach(child => {
      const path = child.path || [];
      const rowIdx = child.path[level - 1];

      if (rowIdx !== undefined) {
        expanded.push(rowIdx);
      }
    });

    console.log(expanded);

    return expanded;
  };

  render() {
    const props = this.props;
    const expandRow = this.getExpandRow(props.children);
    const columns = this.addFakeColumns(this._columns);
    const classes = classNames('tree-grid', props.classes);

    return <Grid {...props} classes={classes} columns={columns} expandRow={expandRow} />;
  }
}
