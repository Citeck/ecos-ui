import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

function Highlight({ originText, highlightedText }) {
  const [__html, setHtml] = useState(originText);

  useEffect(() => {
    // const regExp = new RegExp(originText, )
    setHtml(originText.replaceAll(highlightedText, `<span class="ecos-highlight">${highlightedText}</span>`));
  }, [originText, highlightedText]);

  return <span dangerouslySetInnerHTML={{ __html }} />;
}

Highlight.propTypes = {
  originText: PropTypes.string,
  highlightedText: PropTypes.string
};
Highlight.defaultProps = {};

export default Highlight;
