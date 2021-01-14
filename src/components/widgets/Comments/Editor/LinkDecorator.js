import React from 'react';

import { BUTTONS_TYPE } from './helpers';

function findLinkEntities(contentBlock, callback, contentState) {
  return contentBlock.findEntityRanges(character => {
    const entityKey = character.getEntity();

    return entityKey !== null && contentState.getEntity(entityKey).getType() === BUTTONS_TYPE.LINK;
  }, callback);
}

const Link = props => {
  const { url, title } = props.contentState.getEntity(props.entityKey).getData();

  return (
    <a href={url} className="ecos-comments__editor-decorator-link" title={title}>
      {props.children}
    </a>
  );
};

export default {
  strategy: findLinkEntities,
  component: Link
};
