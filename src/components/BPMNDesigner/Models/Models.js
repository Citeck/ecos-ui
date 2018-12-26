import React from 'react';
import { connect } from 'react-redux';
import { Row } from 'reactstrap';
import { VIEW_TYPE_LIST } from '../../../constants/bpmn';
import ModelCard from '../ModelCard';
import ModelList from '../ModelList';

const mapStateToProps = (state, props) => ({
  viewType: state.bpmn.viewType,
  items: state.bpmn.models.filter(item => item.categoryId === props.categoryId) // TODO use reselect
});

const Models = ({ viewType, items }) => {
  const ModelComponent = viewType === VIEW_TYPE_LIST ? ModelList : ModelCard;

  const models = [];
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemId = item.id || i;
      models.push(<ModelComponent key={itemId} label={item.label} author={item.author} datetime={item.datetime} image={item.image} />);
    }
  }

  return <Row noGutters>{models}</Row>;
};

export default connect(mapStateToProps)(Models);
