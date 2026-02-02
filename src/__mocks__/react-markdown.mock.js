import React from 'react';

const Markdown = ({ children }) => {
  return React.createElement('div', { 'data-testid': 'markdown' }, children);
};

export default Markdown;
