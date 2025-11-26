import isArray from 'lodash/isArray';

type RefsType = string[];

export default class UploadDocsRefService {
  private _refs: RefsType = [];

  public setUploadedEntityRefs(refs: RefsType) {
    this._refs = isArray(refs) ? refs.slice() : [];
  }

  public getUploadedEntityRefs() {
    return this._refs.slice();
  }

  public addUploadedEntityRefs(refs: RefsType) {
    if (isArray(refs)) {
      this._refs = this._refs.concat(refs);
    }
  }

  public clearUploadedEntityRefs() {
    this._refs = [];
  }

  public getUploadDocsRefsOfAttrs = (attrs: { [key: string]: any }): RefsType => {
    const docsRefsSubmission: RefsType = [];
    const submissionDataValues = Object.values(attrs).join(' ');

    this.getUploadedEntityRefs().forEach(docRef => {
      if (submissionDataValues.includes(docRef) || (docRef.includes('@') && submissionDataValues.includes(docRef.split('@')[1]))) {
        docsRefsSubmission.push(docRef);
      }
    });

    return docsRefsSubmission;
  };
}

type UploadDocsRefServiceCtor = typeof UploadDocsRefService;
export type UploadDocsRefServiceInstance = InstanceType<UploadDocsRefServiceCtor>;
