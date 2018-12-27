import React from 'react';
import { connect } from 'react-redux';
import { Col } from 'reactstrap';
import { Button } from 'reactstrap';
// import { t } from '../../../helpers/util';
import { showModelCreationForm } from '../../../actions/modelCreationForm';
import './CreateModelCard.scss';

const mapDispatchToProps = (dispatch, props) => ({
  showModelCreationForm: () => dispatch(showModelCreationForm(props.categoryId))
});

const CreateModelCard = ({ showModelCreationForm }) => {
  // TODO use t()
  return (
    <Col xl={3} lg={4} md={4} sm={6}>
      <div className="process-model-card">
        <Button color="secondary" size="lg" onClick={showModelCreationForm} className="process-model-card__button">
          Создать
        </Button>
      </div>
    </Col>
  );
};

export default connect(
  null,
  mapDispatchToProps
)(CreateModelCard);
