import React from 'react';
import { connect } from 'react-redux';
import { Row } from 'reactstrap';
import moment from 'moment';
import { URL_PAGECONTEXT } from '../../../constants/alfresco';
import { VIEW_TYPE_LIST, VIEW_TYPE_CARDS, EDITOR_PAGE_CONTEXT } from '../../../constants/bpmn';
import { selectModelsByCategoryId } from '../../../selectors/bpmn';
import CreateModelCard from '../CreateModelCard';
import ModelCard from '../ModelCard';
import ModelList from '../ModelList';

const mapStateToProps = (state, props) => ({
  viewType: state.bpmn.viewType,
  searchText: state.bpmn.searchText,
  items: selectModelsByCategoryId(state, props)
});

const Models = ({ viewType, items, categoryId, searchText }) => {
  const ModelComponent = viewType === VIEW_TYPE_LIST ? ModelList : ModelCard;

  const models = [];
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const dt = moment(item.created).calendar();
      const recordId = item.id.replace('workspace://SpacesStore/', '');
      const editLink = `${EDITOR_PAGE_CONTEXT}#/editor/${recordId}`;
      const viewLink = `${URL_PAGECONTEXT}card-details?nodeRef=${item.id}`;

      models.push(
        <ModelComponent
          key={item.id}
          viewLink={viewLink}
          editLink={editLink}
          label={item.label}
          author={item.creator}
          datetime={dt}
          image={item.image}
        />
      );
    }
  }

  let createModelComponent = null;
  if (viewType === VIEW_TYPE_CARDS && !items.length && !searchText) {
    createModelComponent = <CreateModelCard categoryId={categoryId} />;
  }

  return (
    <Row noGutters>
      {models}
      {createModelComponent}
    </Row>
  );
};

export default connect(mapStateToProps)(Models);
