import { SourcesId } from '@citeck/constants';
import classNames from 'classnames';
import React, { useRef, JSX } from 'react';
import { connect } from 'react-redux';

import { Editor, LexicalEditorProps } from '@/components/editors/Lexical';
import useSyncWithInputHtml from '@/components/editors/Lexical/hooks/useSyncWithInputHtml';
import { FileRecord, UploadFilesInCommentProps } from '@/components/editors/Lexical/plugins/FilePlugin';

import { uploadFilesInComment } from '@/actions/comments';
import { DocumentsApi } from '@/api/documents';
import { getRecordRef } from '@/helpers/urls';
import { isNodeRef, t } from '@/helpers/util';
import { NotificationManager } from '@/services/notifications';

type EditorContentProps = {
  uploadFilesInComment: (data: UploadFilesInCommentProps) => void;
} & Omit<LexicalEditorProps, 'onUpload' | 'onFilesUpload'>;

function EditorContent({
  htmlString,
  readonly = false,
  uploadFilesInComment,
  withoutTimeout,
  attribute,
  recordRef,
  ...props
}: EditorContentProps): JSX.Element {
  const { UploadDocsService } = props;
  useSyncWithInputHtml(htmlString, { timeoutMs: withoutTimeout ? 0 : 800 });

  const docApi = new DocumentsApi();
  const editorWrapperRef = useRef<HTMLDivElement | null>(null);

  const onFilesUpload = (files: File[]): Promise<FileRecord[] | undefined> => {
    if (isNodeRef(recordRef || getRecordRef())) {
      NotificationManager.error(t('editor.upload-file-alfresco-error'));
      return Promise.resolve([]);
    }

    return new Promise(resolve => {
      uploadFilesInComment({
        files,
        type: `${SourcesId.TYPE}@attachment`,
        uploadCallback: fileRecords => {
          if (fileRecords?.length && UploadDocsService) {
            UploadDocsService.addUploadedEntityRefs(fileRecords.map(record => record.data.entityRef));
          }

          resolve(fileRecords);
        }
      });
    });
  };

  const onImageUpload = (img: File, altText: string) => {
    return new Promise<string>((resolve, reject) => {
      uploadFilesInComment({
        files: [img],
        type: `${SourcesId.TYPE}@attachment`,
        callback: undefined,
        uploadCallback: fileRecords => {
          if (fileRecords?.length) {
            if (UploadDocsService) {
              UploadDocsService.addUploadedEntityRefs(fileRecords.map(record => record.data.entityRef));
            }

            docApi
              .getImageUrl(fileRecords[0].data.entityRef)
              .then((url: string) => {
                if (url) {
                  resolve(url);
                } else {
                  reject(new Error('Incorrect url received from the request'));
                }
              })
              .catch(() => {
                reject(new Error(`Error when getting the link to the image`));
              });
          } else {
            reject(new Error('Failed to load image'));
          }
        }
      });
    });
  };

  return (
    <div ref={editorWrapperRef} className={classNames('citeck-lexical-editor', { editable: !readonly })}>
      <div className="editor-shell">
        <Editor
          {...props}
          readonly={readonly}
          onUpload={onImageUpload}
          onFilesUpload={UploadDocsService ? onFilesUpload : undefined}
          attribute={attribute}
          recordRef={recordRef}
        />
      </div>
    </div>
  );
}

const mapDispatchToProps = (dispatch: any) => {
  const baseParams = {
    record: getRecordRef(),
    key: getRecordRef()
  };

  return {
    uploadFilesInComment: (data: UploadFilesInCommentProps) => dispatch(uploadFilesInComment({ ...baseParams, ...data }))
  };
};

export default connect(null, mapDispatchToProps)(EditorContent);
