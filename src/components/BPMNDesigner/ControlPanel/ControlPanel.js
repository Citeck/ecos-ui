import React from 'react';
import { Col, Row } from 'reactstrap';

import { BPMNDesignerService } from '../../../services/BPMNDesignerService';
import { Dropdown } from '../../common/form';
import Search from './Search';
import ViewSwitcher from './ViewSwitcher';

import '../style.scss';

const ControlPanel = ({ onClickCreateVariant }) => {
  const createVariants = BPMNDesignerService.getCreateVariants();

  return (
    <div className="mb-3 bpmn-designer-page__control-panel">
      <Row noGutters>
        <Col lg={6} md={12}>
          <Dropdown
            hasEmpty
            isStatic
            source={createVariants}
            valueField="id"
            titleField="title"
            onChange={onClickCreateVariant}
            controlIcon="icon-small-plus"
            controlClassName="ecos-btn_settings-down ecos-btn_white ecos-btn_hover_blue2"
          />
          <Search />
        </Col>
        <Col lg={6} md={12}>
          <div className="bpmn-designer-page__control-panel-right">
            {/*<SortFilter />*/}
            <ViewSwitcher />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ControlPanel;
