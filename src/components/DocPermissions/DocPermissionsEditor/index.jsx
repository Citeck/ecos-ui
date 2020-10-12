import React from 'react';

import DocPermissionsEditorPropTypes from './DocPermissionsEditorPropTypes';
import DocPermissionsEditorRoot from './DocPermissionsEditor';
import { DocPermissionsEditorContextProvider } from './DocPermissionsEditorContext';

import './styles.scss';

const DocPermissionsEditor = props => {
  return (
    <DocPermissionsEditorContextProvider controlProps={props}>
      <DocPermissionsEditorRoot />
    </DocPermissionsEditorContextProvider>
  );
};

DocPermissionsEditor.propTypes = DocPermissionsEditorPropTypes;

export default DocPermissionsEditor;
