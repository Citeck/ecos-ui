import React from 'react';
import classNames from 'classnames';
import { commonTabsDefaultProps, commonTabsPropTypes } from './utils';

import './Tabs.scss';

class EditTabs extends React.Component {
  static propTypes = commonTabsPropTypes;

  static defaultProps = commonTabsDefaultProps;

  render() {
    const { items, className, hasHover } = this.props;
    const tabsClassNames = classNames('ecos-tabs', className);
    console.log(items);
    return <div>{JSON.stringify(items)}</div>;
  }
}

export default EditTabs;
