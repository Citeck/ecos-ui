import React from 'react';
import { connect } from 'react-redux';
import { Col } from 'reactstrap';
import Button from '../../common/form/Button';
import { t } from '../../../helpers/util';
import { showModelCreationForm } from '../../../actions/bpmn';
import './CreateModelCard.scss';

const mapDispatchToProps = (dispatch, props) => ({
  showModelCreationForm: () => dispatch(showModelCreationForm(props.categoryId))
});

const CreateModelCard = ({ showModelCreationForm }) => {
  return (
    <Col xl={3} lg={4} md={4} sm={6}>
      <div className="process-model-card">
        <Button onClick={showModelCreationForm} className="process-model-card__button">
          {t('bpmn-designer.create-model-card.label')}
        </Button>
      </div>
    </Col>
  );
};

export default connect(
  null,
  mapDispatchToProps
)(CreateModelCard);
