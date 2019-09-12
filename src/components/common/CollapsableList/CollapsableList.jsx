import React, { Component, Fragment } from 'react';
import classNames from 'classnames';
import PanelBar from '../PanelBar/PanelBar';
import List from '../List/List';
import { Scrollbars } from 'react-custom-scrollbars';

import './CollapsableList.scss';

export default class CollapsableList extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('collapsable-list', props.className);

    const Scroll = ({ height, children }) =>
      height ? <Scrollbars style={{ height }}>{children}</Scrollbars> : <Fragment>{children}</Fragment>;

    return (
      <div className={cssClasses}>
        <PanelBar
          open={!props.close}
          header={props.children}
          css={{
            headerClassName: 'panel-bar__header_full panel-bar__header_narrow ',
            headerLabelClassName: 'panel-bar__header-label_narrow panel-bar__header-label_bold',
            contentClassName: 'collapsable-list_panel-bar-header'
          }}
        >
          <Scroll height={props.height}>
            <List list={props.list} selected={props.selected} className={classNames('list-group_no-border', props.classNameList)} />
          </Scroll>
        </PanelBar>
      </div>
    );
  }
}
