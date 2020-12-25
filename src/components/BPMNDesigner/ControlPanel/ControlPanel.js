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

const ControlPanel = ({ showModelCreationForm, showImportModelForm, totalModels, isReady }) => {
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
    <div className="mb-3 ecos-bpmn-designer-control-panel">
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
  isReady: state.bpmn.isReady
});

const mapDispatchToProps = dispatch => ({
  showModelCreationForm: () => dispatch(showModelCreationForm()),
  showImportModelForm: () => dispatch(showImportModelForm())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ControlPanel);
