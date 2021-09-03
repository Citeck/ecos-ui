import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import uuid from 'uuidv4';

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
    inlineToolsOffsets: { height: 0, top: 0, rowId: null }
  };

  #wrapperRef = React.createRef();
  #toolsRef = React.createRef();
  #tableRef = React.createRef();

  #scrollPosition = {};

  componentDidMount() {
    const wrapper = this.#wrapperRef.current;

    if (wrapper) {
      wrapper.addEventListener('mouseleave', this.handleResetInlineTools);
    }
  }

  componentWillUnmount() {
    const wrapper = this.#wrapperRef.current;

    if (wrapper) {
      wrapper.removeEventListener('mouseleave', this.handleResetInlineTools);
    }
  }

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
          height: offsets.height,
          top: offsets.top,
          rowId: offsets.row.id || null
        }
      }));
    }
  };

  handleResetInlineTools = () => {
    this.handleSetInlineToolsOffsets({ height: 0, top: 0, row: {} });
  };

  handleScrollingTable = event => {
    this.#scrollPosition = event;

    if (this.#toolsRef.current) {
      this.#toolsRef.current.style.left = `${event.scrollLeft}px`;
    }
  };

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
    const { inlineToolsOffsets } = this.state;
    const buttons = actions.map(this.renderButton);

    return (
      <InlineToolsDisconnected
        forwardedRef={this.#toolsRef}
        tools={buttons}
        {...inlineToolsOffsets}
        left={this.#scrollPosition.scrollLeft}
      />
    );
  };

  render() {
    const { title, columns, associations } = this.props;
    const { key } = this.state;

    return (
      <div key={`document-list-${key}`} ref={this.#wrapperRef} className="ecos-doc-associations__group">
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
          onScrolling={this.handleScrollingTable}
          scrollPosition={this.#scrollPosition}
        />
      </div>
    );
  }
}

export default AssociationGrid;
