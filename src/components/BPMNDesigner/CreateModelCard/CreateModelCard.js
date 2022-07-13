import React from 'react';
import { connect } from 'react-redux';
import { Col } from 'reactstrap';
import { Btn } from '../../common/btns';
import { t } from '../../../helpers/util';
import './CreateModelCard.scss';
import { createModel } from '../../../actions/bpmn';

const mapDispatchToProps = (dispatch, props) => ({
  showModelCreationForm: () => {
    dispatch(createModel({ categoryId: props.categoryId }));
  }
});

const CreateModelCard = ({ showModelCreationForm }) => {
  return (
    <Col xl={3} lg={4} md={4} sm={6}>
      <div className="process-model-card">
        <Btn onClick={showModelCreationForm} className="process-model-card__button">
          {t('bpmn-designer.create-model-card.label')}
        </Btn>
      </div>
    </Col>
  );
};

export default connect(
  null,
  mapDispatchToProps
)(CreateModelCard);
