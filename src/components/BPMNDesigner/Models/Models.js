import React from 'react';
import { connect } from 'react-redux';
import { Row } from 'reactstrap';
import { ViewTypeList } from '../../../constants/bpmn';
import ModelCard from '../ModelCard';
import ModelList from '../ModelList';

const mapStateToProps = state => ({
  viewType: state.bpmn.viewType
});

const Models = ({ viewType }) => {
  const ModelComponent = viewType === ViewTypeList ? ModelList : ModelCard;

  return (
    <Row noGutters>
      <ModelComponent />
      <ModelComponent />
      <ModelComponent />
      <ModelComponent />
    </Row>
  );
};

export default connect(mapStateToProps)(Models);
