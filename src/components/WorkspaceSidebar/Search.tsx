import React, { Component } from 'react';

import { Search } from '@/components/common';
import './styles.scss';

interface SearchWorkspaceSidebarProps {
  onSearch: (text: string) => void;
}

export default class SearchWorkspaceSidebar extends Component<SearchWorkspaceSidebarProps> {
  render() {
    return <Search onSearch={this.props.onSearch} cleaner className="citeck-workspace-sidebar__search" />;
  }
}
