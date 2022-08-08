import React from 'react';
import { connect } from 'react-redux';
import { Col, Row } from 'reactstrap';

import { t } from '../../../helpers/export/util';
import { Labels } from '../../../constants/bpmn';
import { Dropdown } from '../../common/form';
import Search from './Search';
import ViewSwitcher from './ViewSwitcher';
import { createModel } from '../../../actions/bpmn';

import '../style.scss';

const ControlPanel = ({ createModel, totalModels, isReady, createVariants }) => {
  const handlerCreateVariant = variant => {
    createModel(variant);
  };

  return (
    <div className="mb-3 ecos-bpmn-designer-control-panel">
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
          <Search />
        </Col>
        <Col lg={6} md={12}>
          <div className="ecos-bpmn-designer-control-panel__side-right">
            {isReady && <div className="ecos-bpmn-designer-control-panel__counter">{`${t(Labels.TOTAL)} ${totalModels}`}</div>}
            {/*<SortFilter />*/}
            <ViewSwitcher />
          </div>
        </Col>
      </Row>
    </div>
  );
};

const mapStateToProps = state => ({
  totalModels: state.bpmn.models.length,
  isReady: state.bpmn.isReady,
  createVariants: state.bpmn.createVariants
});

const mapDispatchToProps = dispatch => ({
  createModel: createVariant => dispatch(createModel({ createVariant }))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ControlPanel);
