import React, { useContext } from 'react';

import { Loader } from '../../common';

import { DocPermissionsEditorContext } from './DocPermissionsEditorContext';
import DocPermissionsGrid from './DocPermissionsGrid';
import ButtonsPanel from './ButtonsPanel';

const DocPermissionsEditor = () => {
  const context = useContext(DocPermissionsEditorContext);
  const { error, isReady } = context;

  if (error) {
    return <div className="doc-permissions-editor__error">{error}</div>;
  }

  if (!isReady) {
    return <Loader blur rounded style={{ position: 'relative' }} />;
  }

  return (
    <>
      <DocPermissionsGrid />
      <ButtonsPanel />
    </>
  );
};

export default DocPermissionsEditor;
