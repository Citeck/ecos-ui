import { RecordService } from './recordService';

const rootCategoryNodeRef = 'workspace://SpacesStore/ecos-bpm-category-root';

export class BpmnApi extends RecordService {
  fetchCategories = () => {
    return this.query({
      query: {
        query: '/cm:categoryRoot/cm:generalclassifiable/cm:Ecos_x0020_BPM_x0020_Category_x0020_root//*',
        language: 'xpath',
        sortBy: [{ attribute: 'ecosbpm:index', ascending: true }]
      },
      attributes: ['attr:parent?id', 'cm:title'] // TODO id
    });
  };

  createCategory = (title, parent = rootCategoryNodeRef) => {
    return this.mutate({
      record: {
        parent: parent,
        type: 'cm:category',
        attributes: {
          'cm:title': title
        }
      }
    });
  };
}
