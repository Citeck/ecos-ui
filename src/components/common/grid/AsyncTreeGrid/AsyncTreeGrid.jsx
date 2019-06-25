import React, { Component, Fragment } from 'react';
import { TreeGrid } from '../';

export default class AsyncTreeGrid extends Component {
  constructor(props) {
    super(props);
    this.state = { data: [], columns: [] };
  }

  componentDidMount() {
    const { columns, criteria, api } = this.props;
    api({ columns, criteria }).then(({ data, columns }) => this.setState({ data: data, columns: columns }));
  }

  render() {
    const { columns = [], data } = this.state;

    return (
      <Fragment>
        {columns.length ? (
          <TreeGrid
            classes="tree-grid__child tree-grid__child_hide-header"
            columns={columns}
            data={data}
            level={this.props.level}
            noExpander
          />
        ) : null}
      </Fragment>
    );
  }
}
