import React from 'react';
import { connect } from 'react-redux';

import Structure from './components/Structure';
import Widgets from './components/Widgets';
import { setSelectedPerson } from '../../actions/orgstructure';
import { getSearchParams } from '../../helpers/urls';

import './style.scss';

class Orgstructure extends React.Component {
  componentDidMount() {
    const { onSelectPerson } = this.props;
    const { recordRef } = getSearchParams() || {};

    if (recordRef) {
      onSelectPerson(recordRef);
    }
  }

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

const mapDispatchToProps = dispatch => ({
  onSelectPerson: recordRef => dispatch(setSelectedPerson(recordRef))
});

export default connect(
  null,
  mapDispatchToProps
)(Orgstructure);
