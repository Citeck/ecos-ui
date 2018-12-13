import React from 'react';
import { Row } from 'reactstrap';
import ModelCard from '../ModelCard';

class ModelList extends React.Component {
  render() {
    return (
      <Row noGutters>
        <ModelCard />
        <ModelCard />
        <ModelCard />
        <ModelCard />
      </Row>
    );
  }
}

export default ModelList;
