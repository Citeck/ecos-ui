import React from 'react';

import Icon from '../icons/Icon';

import './Tags.scss';

const Tags = ({ tags = [], onTagsChange, onAddTag, className = '', exception = [], disabled = false }) => {
  const handleRemoveTag = tagToRemove => {
    const filtered = tags.filter(tag => tag.name !== tagToRemove.name);
    onTagsChange && onTagsChange(filtered);
  };

  return (
    <div className={`ecos-tags ${className}`}>
      <div className="ecos-tags-body">
        {tags.map((tag, index, originTags) => (
          <div key={index} className="ecos-tag">
            <span title={tag.name} className="ecos-tag__name">
              {tag.name}
            </span>
            {!disabled && <Icon className="icon_small icon-small-close ecos-tag-remove" onClick={() => handleRemoveTag(tag)} />}
          </div>
        ))}

        {!disabled && onAddTag && (
          <div className="ecos-add" onClick={() => onAddTag()}>
            <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="#D0D0D0">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20ZM10 5C10.5523 5 11 5.44772 11 6V9H14C14.5523 9 15 9.44772 15 10C15 10.5523 14.5523 11 14 11H11V14C11 14.5523 10.5523 15 10 15C9.44772 15 9 14.5523 9 14V11H6C5.44772 11 5 10.5523 5 10C5 9.44772 5.44772 9 6 9H9V6C9 5.44772 9.44772 5 10 5Z"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tags;
