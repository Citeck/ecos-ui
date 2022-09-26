import React from 'react';

import Structure from './components/Structure';
import Widgets from './components/Widgets';

import './style.scss';

class Orgstructure extends React.Component {
  render() {
    return (
      <div className="orgstructure-page__grid__container">
        <div className="orgstructure-page__grid__main">
          <Structure />
        </div>
        <Widgets />
      </div>
    );
  }
}

export default Orgstructure;
