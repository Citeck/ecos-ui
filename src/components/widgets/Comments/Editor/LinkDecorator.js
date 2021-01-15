import React from 'react';

import { BUTTONS_TYPE } from '../../../../helpers/draft';

function findLinkEntities(contentBlock, callback, contentState) {
  return contentBlock.findEntityRanges(character => {
    const entityKey = character.getEntity();

    return entityKey !== null && contentState.getEntity(entityKey).getType() === BUTTONS_TYPE.LINK;
  }, callback);
}

const Link = props => {
  const { title } = props.contentState.getEntity(props.entityKey).getData();

  return (
    <span className="ecos-comments__editor-decorator-link" title={title}>
      {props.children}
    </span>
  );
};

export default {
  strategy: findLinkEntities,
  component: Link
};
