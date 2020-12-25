import React from 'react';
import { connect } from 'react-redux';
import { Col, Row } from 'reactstrap';

import { t } from '../../../helpers/export/util';
import { Labels } from '../../../constants/bpmn';
import { showImportModelForm, showModelCreationForm } from '../../../actions/bpmn';
import BPMNDesignerService from '../../../services/BPMNDesignerService';
import { Dropdown } from '../../common/form';
import Search from './Search';
import ViewSwitcher from './ViewSwitcher';

import '../style.scss';

const ControlPanel = ({ isMobile, showModelCreationForm, showImportModelForm, totalModels }) => {
  const createVariants = BPMNDesignerService.getCreateVariants();

  const handlerCreateVariant = variant => {
    if (variant.id === 'bpmn-designer-create-model') {
      showModelCreationForm();
    } else if (variant.id === 'bpmn-designer-import-model') {
      showImportModelForm();
    } else {
      console.warn('Unknown variant');
    }
  };

  return (
    <div className="mb-3 bpmn-designer-control-panel">
      <Row noGutters>
        <Col lg={6} md={12}>
          <Dropdown
            hasEmpty
            isStatic
            source={createVariants}
            valueField="id"
            titleField="title"
            onChange={handlerCreateVariant}
            controlIcon="icon-small-plus"
            controlClassName="ecos-btn_settings-down ecos-btn_white ecos-btn_hover_blue2"
          />
          <Search />
        </Col>
        <Col lg={6} md={12}>
          <div className="bpmn-designer-control-panel__side-right">
            <div className="bpmn-designer-control-panel__counter">{`${t(Labels.TOTAL)} ${totalModels}`}</div>
            {/*<SortFilter />*/}
            <ViewSwitcher />
          </div>
        </Col>
      </Row>
    </div>
  );
};

const mapStateToProps = state => ({
  isMobile: state.view.isMobile,
  totalModels: state.bpmn.models.length
});

const mapDispatchToProps = dispatch => ({
  showModelCreationForm: () => dispatch(showModelCreationForm()),
  showImportModelForm: () => dispatch(showImportModelForm())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ControlPanel);
