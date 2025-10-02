import GanttDataTransformer, { RecordsActivity, RecordsDependency } from './GanttDataTransformer';

import Records from '@/components/Records/Records';
import { recordsQueryFetch, recordsMutateFetch } from '@/components/Records/recordsApi';

const GANTT_SOURCES = {
  GANTT_SETTINGS: 'emodel/gantt-settings',
  GANTT_DATA: 'emodel/gantt-data',
  GANTT_ACTIVITY: 'emodel/gantt-activity',
  GANTT_DEPENDENCY: 'emodel/gantt-dependency'
};

const GANTT_ATTRIBUTES = {
  GANTT_SETTINGS: {
    DATA_TYPE: 'dataType',
    DATA_SOURCE_ID: 'dataSourceId',
    MANUAL_DATA_SOURCE_ID: 'manualDataSourceId',
    LINKED_WITH_TYPE: 'linkedWithType',
    LINKED_WITH_REF: 'linkedWithRef',
    DATA: 'data'
  },
  GANTT_DATA: {
    TITLE: 'title',
    DESCRIPTION: 'description',
    START: 'start',
    END: 'end',
    DURATION: 'duration',
    PROGRESS: 'progress',
    PARENT: 'parent'
  },
  GANTT_ACTIVITY: {
    id: 'id',
    title: 'activity:title?str',
    description: 'activity:description:?str',
    type: 'activity:type?str',
    start: 'activity:start',
    end: 'activity:end',
    duration: 'activity:duration?num',
    progress: 'activity:progress?num',
    parent: 'activity:parent?id'
  },
  GANTT_DEPENDENCY: {
    SOURCE: 'source',
    DESTINATION: 'destination'
  }
};

class GanttDataLoader {
  /**
   * Load gantt settings by record reference
   * @param recordRef - Reference to the gantt-settings record
   */
  async loadGanttSettings(recordRef: string) {
    const record = Records.get(recordRef);

    return await record.load({
      id: 'id',
      dataType: 'dataType?str',
      dataSourceId: 'dataSourceId?str',
      manualDataSourceId: 'manualDataSourceId?str',
      linkedWithType: 'linkedWithType?str',
      linkedWithRef: 'linkedWithRef?str',
      data: 'data?id'
    });
  }

  /**
   * Load gantt data (tasks and links) for STANDALONE type
   * @param dataRecordRef - Reference to the gantt-data record
   */
  async loadGanttData(dataRecordRef: string) {
    const activitiesQuery = {
      sourceId: GANTT_SOURCES.GANTT_ACTIVITY,
      query: {
        parent: {
          assoc: 'timeline:activities',
          record: dataRecordRef
        }
      }
    };

    const activitiesResponse = await recordsQueryFetch({
      query: activitiesQuery,
      attributes: GANTT_ATTRIBUTES.GANTT_ACTIVITY
    });

    const dependenciesQuery = {
      sourceId: GANTT_SOURCES.GANTT_DEPENDENCY,
      query: {
        parent: {
          assoc: 'timeline:dependencies',
          record: dataRecordRef
        }
      }
    };

    const dependenciesResponse = await recordsQueryFetch({
      query: dependenciesQuery,
      attributes: ['id', 'source?id', 'target?id', 'type?str']
    });

    const tasks = GanttDataTransformer.transformActivitiesToTasks(activitiesResponse.records as RecordsActivity[]);
    const links = GanttDataTransformer.transformDependenciesToLinks(dependenciesResponse.records as RecordsDependency[]);

    return {
      tasks,
      links
    };
  }

  /**
   * Load gantt data for LINKED type from data source
   * @param dataSourceId - Data source ID
   * @param manualDataSourceId - Manual data source ID
   * @param linkedWithType - Type of linked record
   * @param linkedWithRef - Reference to linked record
   * @param currentRef - Current record reference
   * @param workspace - Current workspace
   */
  async loadLinkedGanttData(
    dataSourceId: string,
    manualDataSourceId: string,
    linkedWithType: string,
    linkedWithRef: string,
    currentRef: string,
    workspace: string
  ) {
    const sourceId = manualDataSourceId || dataSourceId;

    if (!sourceId) {
      throw new Error('Either dataSourceId or manualDataSourceId must be provided for LINKED type');
    }

    const query = {
      sourceId,
      query: {
        linkedWithType,
        linkedWithRef,
        currentRef,
        workspace
      }
    };

    const response = await recordsQueryFetch({
      query,
      attributes: GANTT_ATTRIBUTES.GANTT_ACTIVITY
    });

    const tasks = GanttDataTransformer.transformActivitiesToTasks(response.records as RecordsActivity[]);
    const links: any[] = []; // For linked data, dependencies would need to be handled separately

    return {
      tasks,
      links
    };
  }

  /**
   * Create a new gantt activity
   * @param parentRef - Reference to the gantt-data record
   * @param activityData - Activity data to create
   */
  async createActivity(parentRef: string, activityData: any) {
    const activityRecord = Records.get(`${GANTT_SOURCES.GANTT_ACTIVITY}@`);
    const attrs = GanttDataTransformer.transformTaskToActivity(activityData);

    activityRecord.att('activity:title', attrs.title);
    activityRecord.att('activity:description', attrs.description);
    activityRecord.att('activity:type', attrs.type);
    activityRecord.att('activity:start', attrs.startDate);
    activityRecord.att('activity:end', attrs.endDate);

    if (attrs.duration !== undefined) {
      activityRecord.att('activity:duration', attrs.duration);
    }

    if (attrs.progress !== undefined) {
      activityRecord.att('activity:progress', attrs.progress);
    }

    if (attrs.description !== undefined) {
      activityRecord.att('activity:description', attrs.description);
    }

    if (attrs.parent !== undefined) {
      activityRecord.att('activity:parent', attrs.parent || null);
    }

    return await activityRecord.save();
  }

  /**
   * Update an existing gantt activity
   * @param activityRef - Reference to the activity record
   * @param activityData - Activity data to update
   */
  async updateActivity(activityRef: string, activityData: any) {
    const activityRecord = Records.getRecordToEdit(activityRef);
    const attrs = GanttDataTransformer.transformTaskToActivity(activityData);

    activityRecord.att('activity:title', attrs.title);
    activityRecord.att('activity:description', attrs.description);
    activityRecord.att('activity:type', attrs.type);
    activityRecord.att('activity:start', attrs.start);
    activityRecord.att('activity:end', attrs.end);

    if (attrs.duration !== undefined) {
      activityRecord.att('activity:duration', attrs.duration);
    }

    if (attrs.progress !== undefined) {
      activityRecord.att('activity:progress', attrs.progress);
    }

    if (attrs.description !== undefined) {
      activityRecord.att('description', attrs.description);
    }

    if (attrs.parent !== undefined) {
      activityRecord.att('activity:parent', attrs.parent || null);
    }

    return await activityRecord.save();
  }

  /**
   * Delete a gantt activity
   * @param activityRef - Reference to the activity record
   */
  async deleteActivity(activityRef: string) {
    return await Records.remove([activityRef]);
  }

  /**
   * Create a new gantt dependency
   * @param parentRef - Reference to the gantt-data record
   * @param dependencyData - Dependency data to create
   */
  async createDependency(parentRef: string, dependencyData: any) {
    const dependencyRecord = Records.get(`${GANTT_SOURCES.GANTT_DEPENDENCY}@`);

    const dependencyAttributes = GanttDataTransformer.transformLinkToDependency(dependencyData);
    dependencyRecord.att('source', dependencyAttributes.source);
    dependencyRecord.att('target', dependencyAttributes.target);
    dependencyRecord.att('type', dependencyAttributes.type || 'e2e');

    const mutateBody = {
      records: [
        {
          id: dependencyRecord.id,
          attributes: dependencyRecord.toJson().attributes
        }
      ],
      transactions: [
        {
          record: dependencyRecord.id,
          operations: [
            {
              op: 'addToContainer',
              parent: parentRef,
              assoc: 'timeline:dependencies'
            }
          ]
        }
      ]
    };

    return await recordsMutateFetch(mutateBody);
  }

  /**
   * Update an existing gantt dependency
   * @param dependencyRef - Reference to the dependency record
   * @param dependencyData - Dependency data to update
   */
  async updateDependency(dependencyRef: string, dependencyData: any) {
    const dependencyRecord = Records.getRecordToEdit(dependencyRef);

    const dependencyAttributes = GanttDataTransformer.transformLinkToDependency(dependencyData);
    dependencyRecord.att('source', dependencyAttributes.source);
    dependencyRecord.att('target', dependencyAttributes.target);

    if (dependencyAttributes.type !== undefined) {
      dependencyRecord.att('type', dependencyAttributes.type);
    }

    return await dependencyRecord.save();
  }

  /**
   * Delete a gantt dependency
   * @param dependencyRef - Reference to the dependency record
   */
  async deleteDependency(dependencyRef: string) {
    return await Records.remove([dependencyRef]);
  }

  /**
   * Create initial gantt data for STANDALONE type
   */
  async createInitialGanttData() {
    const dataRecord = Records.get(`${GANTT_SOURCES.GANTT_DATA}@`);
    return await dataRecord.save();
  }
}

export default new GanttDataLoader();
