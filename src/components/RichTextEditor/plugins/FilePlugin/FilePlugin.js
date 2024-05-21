import React, { useCallback, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import {
  $insertNodes,
  $isRootOrShadowRoot,
  $createParagraphNode,
  COMMAND_PRIORITY_EDITOR,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister, $wrapNodeInElement } from '@lexical/utils';

import { selectStateByRecordRef } from '../../../../selectors/comments';
import { getRecordRef } from '../../../../helpers/urls';
import DropZone from '../../../widgets/Documents/parts/DropZone';
import { EcosModal } from '../../../common';
import { OPEN_UPLOAD_MODAL, UPLOAD_FILE_COMMAND } from './constants';
import { uploadFilesInComment } from '../../../../actions/comments';
import { SourcesId } from '../../../../constants';
import { $createFileNode } from '../../nodes/FileNode/utils';
import { FileNode } from '../../nodes/FileNode';

const FilePlugin = ({ isUploadingFile, uploadFilesInComment }) => {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);

  const [isLoadingUploadingModal, setIsLoadingUploadingModal] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(
    () => {
      return editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          setActiveEditor(newEditor);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      );
    },
    [editor]
  );

  useEffect(
    () => {
      if (!activeEditor.hasNodes([FileNode])) {
        throw new Error('FilePlugin: FileNode not registered on editor');
      }

      return mergeRegister(
        activeEditor.registerCommand(
          OPEN_UPLOAD_MODAL,
          () => {
            setIsModalOpen(true);
          },
          COMMAND_PRIORITY_EDITOR
        ),
        activeEditor.registerCommand(
          UPLOAD_FILE_COMMAND,
          files => {
            if (!Array.isArray(files) || !files.length) {
              return;
            }

            const nodes = files.map(file =>
              $createFileNode({
                size: file.size,
                name: file.name,
                fileRecordId: file.fileRecordId
              })
            );

            $insertNodes(nodes);
            if ($isRootOrShadowRoot(nodes[0].getParentOrThrow())) {
              $wrapNodeInElement(nodes[0], $createParagraphNode).selectEnd();
            }
            return true;
          },
          COMMAND_PRIORITY_EDITOR
        )
      );
    },
    [activeEditor]
  );

  const hideModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleUploadedFiles = () => {
    setIsLoadingUploadingModal(true);
  };

  const handleSelectUploadFiles = (files, callback) => {
    uploadFilesInComment({
      files,
      type: `${SourcesId.TYPE}@attachment`,
      callback,
      uploadCallback: fileRecords => {
        hideModal();
        setIsLoadingUploadingModal(false);
        activeEditor.dispatchCommand(UPLOAD_FILE_COMMAND, fileRecords);
      }
    });
  };

  return (
    <>
      <div id="file-node-wrapper" className="file-node-wrapper" />
      <EcosModal isOpen={isModalOpen} hideModal={hideModal} isLoading={isLoadingUploadingModal}>
        <DropZone isLoading={isUploadingFile} onSelect={handleSelectUploadFiles} onUploaded={handleUploadedFiles} />
      </EcosModal>
    </>
  );
};

const mapStateToProps = state => ({
  ...selectStateByRecordRef(state, getRecordRef())
});

const mapDispatchToProps = dispatch => {
  const baseParams = {
    record: getRecordRef(),
    key: getRecordRef()
  };

  return {
    uploadFilesInComment: data => dispatch(uploadFilesInComment({ ...baseParams, ...data }))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FilePlugin);
