import React from 'react';
import { connect } from 'react-redux';
import { Row } from 'reactstrap';
import { VIEW_TYPE_LIST, VIEW_TYPE_CARDS } from '../../../constants/bpmn';
import CreateModelCard from '../CreateModelCard';
import ModelCard from '../ModelCard';
import ModelList from '../ModelList';

const mapStateToProps = (state, props) => ({
  viewType: state.bpmn.viewType,
  items: state.bpmn.models.filter(item => item.categoryId === props.categoryId) // TODO use reselect
});

const Models = ({ viewType, items, categoryId }) => {
  const ModelComponent = viewType === VIEW_TYPE_LIST ? ModelList : ModelCard;

  const models = [];
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemId = item.id || i;
      models.push(<ModelComponent key={itemId} label={item.label} author={item.author} datetime={item.datetime} image={item.image} />);
    }
  }

  let createModelComponent = null;
  if (viewType === VIEW_TYPE_CARDS && !items.length) {
    createModelComponent = <CreateModelCard categoryId={categoryId} />;
  }

  return (
    <Row noGutters>
      {models}
      {createModelComponent}
    </Row>
  );
};

export default connect(mapStateToProps)(Models);
