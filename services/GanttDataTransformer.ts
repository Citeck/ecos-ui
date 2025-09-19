export interface RecordsActivity {
  id: string;
  attributes: {
    title?: string;
    description?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    duration?: number;
    progress?: number;
    parent?: string;
  };
}

export interface RecordsDependency {
  id: string;
  attributes: {
    source?: string;
    target?: string;
    type?: string;
  };
}

export interface GanttTask {
  id: string;
  text: string;
  start: Date;
  end: Date;
  duration?: number;
  progress?: number;
  parent?: string;
  type?: string;
  description?: string;
}

export interface GanttLink {
  id: string;
  source: string;
  target: string;
  type?: string;
}

class GanttDataTransformer {
  /**
   * Transform Records API activity to wx-react-gantt task
   * @param record - Records API activity object
   * @returns wx-react-gantt task object
   */
  transformActivityToTask(record: RecordsActivity): GanttTask {
    const { id, attributes } = record;
    const { title, description, type, startDate, endDate, duration, progress, parent } = attributes;

    return {
      id,
      text: title || 'Untitled Task',
      start: startDate ? new Date(startDate) : new Date(),
      end: endDate ? new Date(endDate) : new Date(),
      duration,
      progress,
      parent,
      type,
      description
    };
  }

  /**
   * Transform Records API dependency to wx-react-gantt link
   * @param record - Records API dependency object
   * @returns wx-react-gantt link object
   */
  transformDependencyToLink(record: RecordsDependency): GanttLink {
    const { id, attributes } = record;
    const { source, target, type } = attributes;

    return {
      id,
      source: source || '',
      target: target || '',
      type
    };
  }

  /**
   * Transform wx-react-gantt task to Records API activity format
   * @param task - wx-react-gantt task object
   * @returns Records API activity attributes
   */
  transformTaskToActivity(task: GanttTask): any {
    return {
      title: task.text,
      description: task.description,
      type: task.type,
      startDate: task.start.toISOString(),
      endDate: task.end.toISOString(),
      duration: task.duration,
      progress: task.progress,
      parent: task.parent
    };
  }

  /**
   * Transform wx-react-gantt link to Records API dependency format
   * @param link - wx-react-gantt link object
   * @returns Records API dependency attributes
   */
  transformLinkToDependency(link: GanttLink): any {
    return {
      source: link.source,
      target: link.target,
      type: link.type
    };
  }

  /**
   * Transform array of Records API activities to wx-react-gantt tasks
   * @param records - Array of Records API activity objects
   * @returns Array of wx-react-gantt task objects
   */
  transformActivitiesToTasks(records: RecordsActivity[]): GanttTask[] {
    return records.map(record => this.transformActivityToTask(record));
  }

  /**
   * Transform array of Records API dependencies to wx-react-gantt links
   * @param records - Array of Records API dependency objects
   * @returns Array of wx-react-gantt link objects
   */
  transformDependenciesToLinks(records: RecordsDependency[]): GanttLink[] {
    return records.map(record => this.transformDependencyToLink(record));
  }
}

export default new GanttDataTransformer();
