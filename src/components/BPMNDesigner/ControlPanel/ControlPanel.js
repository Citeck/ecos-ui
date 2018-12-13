import React from 'react';
import Search from './Search';
import SortFilter from './SortFilter';
import ViewSwitcher from './ViewSwitcher';

const ControlPanel = () => {
  return (
    <div style={{ marginBottom: 10, marginTop: 40 }}>
      <Search />
      <ViewSwitcher />
      <SortFilter />
    </div>
  );
};

export default ControlPanel;
