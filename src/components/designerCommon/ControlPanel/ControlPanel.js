import React from 'react';
import { Col, Row } from 'reactstrap';

import { t } from '../../../helpers/export/util';
import { Labels } from '../../../constants/bpmn';
import { Dropdown } from '../../common/form';

import '../style.scss';

const ControlPanel = ({ createModel, totalModels, isReady, createVariants, SearchComponent, ViewSwitcherComponent }) => {
  const handlerCreateVariant = variant => {
    createModel(variant);
  };

  return (
    <div className="mb-3 ecos-designer-control-panel">
      <Row noGutters>
        <Col lg={6} md={12}>
          <Dropdown
            hasEmpty
            isStatic
            source={createVariants}
            valueField="id"
            titleField="name"
            onChange={handlerCreateVariant}
            controlIcon="icon-small-plus"
            controlClassName="ecos-btn_settings-down ecos-btn_white ecos-btn_hover_blue2"
          />
          <SearchComponent />
        </Col>
        <Col lg={6} md={12}>
          <div className="ecos-designer-control-panel__side-right">
            {isReady && <div className="ecos-designer-control-panel__counter">{`${t(Labels.TOTAL)} ${totalModels}`}</div>}
            <ViewSwitcherComponent />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ControlPanel;
