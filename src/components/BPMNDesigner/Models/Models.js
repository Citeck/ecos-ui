import React from 'react';
import { connect } from 'react-redux';
import { Row } from 'reactstrap';
import moment from 'moment';
import { NotificationManager } from 'react-notifications';

import { savePagePosition, updateModels } from '../../../actions/bpmn';
import { EDITOR_PAGE_CONTEXT, LOCAL_STORAGE_KEY_REFERER_PAGE_PATHNAME, ViewTypes } from '../../../constants/bpmn';
import { selectModelsByCategoryId } from '../../../selectors/bpmn';
import CreateModelCard from '../CreateModelCard';
import ModelCard from '../ModelCard';
import ModelList from '../ModelList';
import PageService from '../../../services/PageService';
import recordActions from '../../../components/Records/actions/recordActions';

import EcosFormUtils from '../../../components/EcosForm/EcosFormUtils';

import RecordActions from '../../../components/Records/actions/recordActions';
import { t } from '../../../helpers/export/util';

const OPEN_BPMN_EDITOR_ACTION_REF = 'uiserv/action@open-bpmn-editor';

const Labels = {
  ACTION_OPEN_PROC_EDITOR_ERROR: 'proc-def-admin.action.open-proc-editor.error'
};

const mapStateToProps = (state, props) => ({
  viewType: state.bpmn.viewType,
  searchText: state.bpmn.searchText,
  items: selectModelsByCategoryId(state, props)
});

const mapDispatchToProps = dispatch => ({
  onViewLinkClick: e => {
    e.preventDefault();

    dispatch(
      savePagePosition({
        callback: () => {
          PageService.changeUrlLink(e.currentTarget.href, {
            openNewTab: true
          });
        }
      })
    );
  },
  onEditLinkClick: (e, modelId) => {
    e.preventDefault();

    if (modelId.indexOf('alfresco') === 0) {
      const itemNodeRef = modelId.replace('alfresco/@', '');
      const recordId = itemNodeRef.replace('workspace://SpacesStore/', '');
      const flowableEditLink = `${EDITOR_PAGE_CONTEXT}#/editor/${recordId}`;

      dispatch(
        savePagePosition({
          callback: () => {
            localStorage.setItem(LOCAL_STORAGE_KEY_REFERER_PAGE_PATHNAME, window.location.pathname);
            window.location.href = flowableEditLink;
          }
        })
      );
    } else {
      RecordActions.getActionsForRecord(modelId, [OPEN_BPMN_EDITOR_ACTION_REF]).then(actions => {
        if (!actions || !actions.length) {
          NotificationManager.error(t(Labels.ACTION_OPEN_PROC_EDITOR_ERROR), t('error'));
        } else {
          return RecordActions.execForRecord(modelId, actions[0]);
        }
      });
    }
  },
  onEditMetaClick: (e, modelId) => {
    e.preventDefault();
    EcosFormUtils.editRecord({
      recordRef: modelId,
      onSubmit: () => dispatch(updateModels())
    });
  },
  onDeleteModelClick: (e, modelId) => {
    e.preventDefault();
    recordActions
      .execForRecord(modelId, {
        type: 'delete'
      })
      .then(res => {
        if (res) {
          dispatch(updateModels());
        }
      });
  }
});

const Models = ({ viewType, items, categoryId, searchText, onViewLinkClick, onEditLinkClick, onDeleteModelClick, onEditMetaClick }) => {
  const ModelComponent = viewType === ViewTypes.LIST ? ModelList : ModelCard;

  const models = [];
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const dt = moment(item.created).calendar();
      const viewLink = `/v2/dashboard?recordRef=${item.id}`;

      models.push(
        <ModelComponent
          canWrite={item.canWrite}
          key={item.id}
          viewLink={viewLink}
          onViewLinkClick={onViewLinkClick}
          onEditLinkClick={e => onEditLinkClick(e, item.id)}
          onDeleteModelClick={e => onDeleteModelClick(e, item.id)}
          onEditMetaClick={e => onEditMetaClick(e, item.id)}
          label={item.label}
          author={item.creator}
          datetime={dt}
          image={item.previewUrl}
        />
      );
    }
  }

  let createModelComponent = null;
  if (viewType === ViewTypes.CARDS && !items.length && !searchText) {
    createModelComponent = <CreateModelCard categoryId={categoryId} />;
  }

  return (
    <Row noGutters>
      {models}
      {createModelComponent}
    </Row>
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Models);
