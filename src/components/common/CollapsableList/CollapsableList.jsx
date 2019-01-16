import React, { Component } from 'react';
import classNames from 'classnames';
import PanelBar from '../PanelBar/PanelBar';
import List from '../List/List';

import './CollapsableList.scss';

export default class CollapsableList extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('collapsable-list', props.className);

    return (
      <div {...props} className={cssClasses}>
        <PanelBar
          header={props.children}
          css={{
            headerClassName: 'panel-bar__header_full panel-bar__header_narrow ',
            headerLabelClassName: 'panel-bar__header-label_narrow',
            contentClassName: 'collapsable-list_panel-bar-header'
          }}
        >
          <List list={props.list} className={'list-group_no-border'} />
        </PanelBar>
      </div>
    );
  }
}
