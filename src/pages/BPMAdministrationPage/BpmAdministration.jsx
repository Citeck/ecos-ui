import React from 'react';
import classNames from 'classnames';

import ProcessesTable from './ProcessesTable';

import './style.scss';

const BpmAdministration = ({ hidden }) => {
  return (
    <div className={classNames({ 'd-none': hidden })}>
      <ProcessesTable />
    </div>
  );
};

export default BpmAdministration;
