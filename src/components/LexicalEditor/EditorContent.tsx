import classNames from 'classnames';
import React, { useRef, JSX } from 'react';
import { connect } from 'react-redux';

import { Editor, LexicalEditorProps } from '../Lexical';
import useSyncWithInputHtml from '../Lexical/hooks/useSyncWithInputHtml';
import { UploadFilesInCommentProps } from '../Lexical/plugins/FilePlugin';

import { uploadFilesInComment } from '@/actions/comments';
import { DocumentsApi } from '@/api/documents';
import { SourcesId } from '@/constants';
import { getRecordRef } from '@/helpers/urls';

type EditorContentProps = {
  uploadFilesInComment: (data: UploadFilesInCommentProps) => void;
} & Omit<LexicalEditorProps, 'onUpload'>;

function EditorContent({
  onEditorReady,
  htmlString,
  onChange,
  hideToolbar,
  readonly = false,
  className,
  uploadFilesInComment,
}: EditorContentProps): JSX.Element {
  useSyncWithInputHtml(htmlString);

  const docApi = new DocumentsApi();
  const editorWrapperRef = useRef<HTMLDivElement | null>(null);

  const onImageUpload = (img: File, altText: string) => {
    return new Promise<string>((resolve, reject) => {
      uploadFilesInComment({
        files: [img],
        type: `${SourcesId.TYPE}@attachment`,
        callback: undefined,
        uploadCallback: (fileRecords) => {
          if (fileRecords?.length) {
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
        },
      });
    });
  };

  return (
    <div ref={editorWrapperRef} className={classNames('citeck-lexical-editor', { editable: !readonly })}>
      <div className="editor-shell">
        <Editor
          className={className}
          readonly={readonly}
          onChange={onChange}
          hideToolbar={hideToolbar}
          onEditorReady={onEditorReady}
          onUpload={onImageUpload}
        />
      </div>
    </div>
  );
}

const mapDispatchToProps = (dispatch: any) => {
  const baseParams = {
    record: getRecordRef(),
    key: getRecordRef(),
  };

  return {
    uploadFilesInComment: (data: UploadFilesInCommentProps) => dispatch(uploadFilesInComment({ ...baseParams, ...data })),
  };
};

export default connect(null, mapDispatchToProps)(EditorContent);
