import React from 'react';
import { Col } from 'reactstrap';
import { Btn } from '../../common/btns';
import './CreateModelCard.scss';

const CreateModelCard = React.memo(({ showModelCreationForm, categoryId, label }) => {
  return (
    <Col xl={3} lg={4} md={4} sm={6}>
      <div className="process-model-card">
        <Btn onClick={() => showModelCreationForm(categoryId)} className="process-model-card__button">
          {label}
        </Btn>
      </div>
    </Col>
  );
});

CreateModelCard.displayName = 'CreateModelCard';

export default CreateModelCard;
