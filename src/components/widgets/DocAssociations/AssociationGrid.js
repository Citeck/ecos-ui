import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import uuid from 'uuid/v4';

import { Icon } from '../../common';
import { Grid } from '../../common/grid';
import InlineToolsDisconnected from '../../common/grid/InlineTools/InlineToolsDisconnected';
import { t } from '../../../helpers/export/util';
import { objectCompare } from '../../../helpers/util';

class AssociationGrid extends Component {
  static propTypes = {
    title: PropTypes.string,
    columns: PropTypes.array,
    associations: PropTypes.array,
    actions: PropTypes.array
  };

  static defaultProps = {
    title: '',
    columns: [],
    associations: [],
    actions: []
  };

  state = {
    key: uuid(),
    scrollLeft: 0,
    inlineToolsOffsets: { rowId: null },
    scrollPosition: {}
  };

  #toolsRef = React.createRef();
  #tableRef = React.createRef();

  isNewOffsets = offsets => {
    const { inlineToolsOffsets } = this.state;

    if (!offsets || !inlineToolsOffsets) {
      return false;
    }

    return !objectCompare(offsets, inlineToolsOffsets);
  };

  handleSetInlineToolsOffsets = offsets => {
    if (this.isNewOffsets(offsets)) {
      this.setState(state => ({
        inlineToolsOffsets: {
          ...state.inlineToolsOffsets,
          rowId: offsets.row.id || null
        }
      }));
    }
  };

  handleResetInlineTools = () => {
    this.handleSetInlineToolsOffsets({ row: {} });
  };

  handleScrollStart = () => this.setState({ ...this.state, scrollPosition: {} });

  handleScrollingTable = event => {
    if (this.#toolsRef.current) {
      this.#toolsRef.current.style.left = `${event.scrollLeft}px`;
    }
  };

  handleScrollStop = scrollPosition => this.setState({ ...this.state, scrollPosition });

  handleClickAction = (callback, data) => {
    callback(data);
    this.handleResetInlineTools();
  };

  renderButton = button => {
    const { associations } = this.props;
    const { inlineToolsOffsets } = this.state;
    const row = associations.find(row => row.id === inlineToolsOffsets.rowId);
    const { name = uuid(), onClick = () => null, className = '' } = button;

    return (
      <Icon
        key={name}
        onClick={() => this.handleClickAction(onClick, row)}
        className={classNames(className, 'ecos-doc-associations__icon')}
      />
    );
  };

  renderInlineTools = () => {
    const { actions } = this.props;
    const { inlineToolsOffsets, scrollPosition } = this.state;
    const buttons = actions.map(this.renderButton);

    return (
      <InlineToolsDisconnected forwardedRef={this.#toolsRef} tools={buttons} {...inlineToolsOffsets} left={scrollPosition.scrollLeft} />
    );
  };

  render() {
    const { title, columns, associations } = this.props;
    const { key, scrollPosition } = this.state;

    return (
      <div key={`document-list-${key}`} className="ecos-doc-associations__group">
        <div className="ecos-doc-associations__headline">
          <div className="ecos-doc-associations__headline-text">{t(title)}</div>
        </div>

        <Grid
          className="ecos-doc-associations__table"
          scrollable
          fixedHeader
          autoHeight
          byContentHeight
          data={associations}
          sortable={false}
          forwardedRef={this.#tableRef}
          columns={columns}
          inlineTools={this.renderInlineTools}
          onChangeTrOptions={this.handleSetInlineToolsOffsets}
          onScrollStart={this.handleScrollStart}
          onScrolling={this.handleScrollingTable}
          onScrollStop={this.handleScrollStop}
          scrollPosition={scrollPosition}
        />
      </div>
    );
  }
}

export default AssociationGrid;
