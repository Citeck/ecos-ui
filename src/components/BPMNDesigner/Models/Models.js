import React from 'react';
import { connect } from 'react-redux';
import { Row } from 'reactstrap';
import moment from 'moment';

import { PROXY_URI, URL_PAGECONTEXT } from '../../../constants/alfresco';
import { savePagePosition } from '../../../actions/bpmn';
import { EDITOR_PAGE_CONTEXT, LOCAL_STORAGE_KEY_REFERER_PAGE_PATHNAME, ViewTypes } from '../../../constants/bpmn';
import { selectModelsByCategoryId } from '../../../selectors/bpmn';
import CreateModelCard from '../CreateModelCard';
import ModelCard from '../ModelCard';
import ModelList from '../ModelList';

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
          window.location.href = e.currentTarget.href;
        }
      })
    );
  },
  onEditLinkClick: e => {
    e.preventDefault();

    dispatch(
      savePagePosition({
        callback: () => {
          localStorage.setItem(LOCAL_STORAGE_KEY_REFERER_PAGE_PATHNAME, window.location.pathname);
          window.location.href = e.currentTarget.href;
        }
      })
    );
  }
});

const Models = ({ viewType, items, categoryId, searchText, onViewLinkClick, onEditLinkClick }) => {
  const ModelComponent = viewType === ViewTypes.LIST ? ModelList : ModelCard;

  const models = [];
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const dt = moment(item.created).calendar();
      const recordId = item.id.replace('workspace://SpacesStore/', '');
      const editLink = `${EDITOR_PAGE_CONTEXT}#/editor/${recordId}`;
      const viewLink = `${URL_PAGECONTEXT}card-details?nodeRef=${item.id}`;
      let image = null;
      if (item.hasThumbnail) {
        // prettier-ignore
        image = `${PROXY_URI}/citeck/ecos/image/thumbnail?nodeRef=${item.id}&property=ecosbpm:thumbnail&cached=true&modified=${item.modified}`;
      }

      models.push(
        <ModelComponent
          canWrite={item.canWrite}
          key={item.id}
          viewLink={viewLink}
          editLink={editLink}
          onViewLinkClick={onViewLinkClick}
          onEditLinkClick={onEditLinkClick}
          label={item.label}
          author={item.creator}
          datetime={dt}
          image={image}
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
