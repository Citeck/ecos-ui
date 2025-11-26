import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister, $wrapNodeInElement } from '@lexical/utils';
import {
  $getRoot,
  $isRootOrShadowRoot,
  $createParagraphNode,
  COMMAND_PRIORITY_EDITOR,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  LexicalEditor
} from 'lexical';
import React, { useCallback, useState, useEffect } from 'react';
import { connect } from 'react-redux';

import { EcosModal } from '../../../common';
import DropZone from '../../../widgets/Documents/parts/DropZone';
import { FileNode } from '../../nodes/FileNode';
import { $createFileNode } from '../../nodes/FileNode/utils';

import { OPEN_UPLOAD_MODAL, UPLOAD_FILE_COMMAND } from './constants';

import { uploadFilesInComment } from '@/actions/comments';
import { SourcesId } from '@/constants';
import { getRecordRef } from '@/helpers/urls';
import { selectStateByRecordRef } from '@/selectors/comments';
import { UploadDocsRefServiceInstance } from '@/services/uploadDocsRefsStore';

type FileRecord = {
  data: {
    entityRef: string;
  };
  fileRecordId: string;
  name: string;
  size: number;
};

export type UploadFilesInCommentProps = {
  files: File[];
  type: string;
  uploadCallback: (fileRecords: FileRecord[]) => void;
  callback?: (fileRecords: FileRecord[]) => void;
};

const FilePlugin = ({
  isUploadingFile,
  uploadFilesInComment,
  UploadDocsService
}: {
  isUploadingFile: boolean;
  uploadFilesInComment: (data: UploadFilesInCommentProps) => void;
  UploadDocsService?: UploadDocsRefServiceInstance;
}) => {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState<LexicalEditor>(editor);
  const [isLoadingUploadingModal, setIsLoadingUploadingModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);

  useEffect(() => {
    if (!activeEditor.hasNodes([FileNode])) {
      throw new Error('FilePlugin: FileNode not registered on editor');
    }

    return mergeRegister(
      activeEditor.registerCommand(
        OPEN_UPLOAD_MODAL,
        () => {
          setIsModalOpen(true);
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      activeEditor.registerCommand(
        UPLOAD_FILE_COMMAND,
        (files: Array<{ size: number; name: string; fileRecordId: string }>) => {
          if (!Array.isArray(files) || !files.length) {
            return false;
          }

          const nodes = files.map(file =>
            $createFileNode({
              size: file.size,
              name: file.name,
              fileRecordId: file.fileRecordId
            })
          );

          const selection = $getRoot().selectEnd();
          selection.insertNodes(nodes);

          if ($isRootOrShadowRoot(nodes[0].getParentOrThrow())) {
            $wrapNodeInElement(nodes[0], $createParagraphNode).selectEnd();
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [activeEditor]);

  const hideModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleUploadedFiles = () => {
    setIsLoadingUploadingModal(true);
  };

  const handleSelectUploadFiles = (files: File[], callback: (fileRecords: any) => void) => {
    uploadFilesInComment({
      files,
      type: `${SourcesId.TYPE}@attachment`,
      callback,
      uploadCallback: fileRecords => {
        if (fileRecords && fileRecords.length > 0 && UploadDocsService) {
          UploadDocsService.addUploadedEntityRefs(fileRecords.map(record => record.data.entityRef));
        }
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

const mapStateToProps = (state: any) => ({
  ...selectStateByRecordRef(state, getRecordRef())
});

const mapDispatchToProps = (dispatch: any) => {
  const baseParams = {
    record: getRecordRef(),
    key: getRecordRef()
  };

  return {
    uploadFilesInComment: (data: UploadFilesInCommentProps) => dispatch(uploadFilesInComment({ ...baseParams, ...data }))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(FilePlugin);
