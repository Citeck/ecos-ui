import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import uuid from 'uuidv4';

import { t } from '../../../helpers/export/util';
import { Icon } from '../../common';
import { Grid } from '../../common/grid';
import InlineToolsDisconnected from '../../common/grid/InlineTools/InlineToolsDisconnected';

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
    scrollPosition: {}
  };

  #toolsRef = React.createRef();
  #tableRef = React.createRef();

  handleScrollStart = () => this.setState({ scrollPosition: {} });

  handleScrollingTable = event => {
    if (this.#toolsRef.current) {
      this.#toolsRef.current.style.left = `${event.scrollLeft}px`;
    }
  };

  handleScrollStop = scrollPosition => this.setState({ scrollPosition });

  renderButton = (button, rowId) => {
    const { associations } = this.props;
    const row = associations.find(row => row.id === rowId);
    const { name = uuid(), onClick = () => null, className = '' } = button;

    return <Icon key={name} onClick={() => onClick(row)} className={classNames(className, 'ecos-doc-associations__icon')} />;
  };

  renderInlineTools = settings => {
    const { actions } = this.props;
    const { row } = settings || {};
    const { id: rowId } = row || {};
    const { scrollPosition } = this.state;
    const buttons = actions.map(action => this.renderButton(action, rowId));

    return <InlineToolsDisconnected forwardedRef={this.#toolsRef} tools={buttons} rowId={rowId} left={scrollPosition.scrollLeft} />;
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
