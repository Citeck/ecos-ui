import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import './style.scss';

function Highlighter({ originText, highlightedText }) {
  const [__html, setHtml] = useState(originText || '');

  useEffect(
    () => {
      let result = originText.replaceAll(highlightedText, `<span class="ecos-highlighter">${highlightedText}</span>`);

      if (result === originText) {
        const searchText = highlightedText.charAt(0).toUpperCase() + highlightedText.slice(1);

        result = originText.replaceAll(searchText, `<span class="ecos-highlighter">${searchText}</span>`);
      }

      setHtml(result);
    },
    [originText, highlightedText]
  );

  if (!__html) {
    return originText;
  }

  return <span dangerouslySetInnerHTML={{ __html }} />;
}

Highlighter.propTypes = {
  originText: PropTypes.string,
  highlightedText: PropTypes.string
};
Highlighter.defaultProps = {};

export default Highlighter;
