export class TasksTestData {
  static getTasks = () => {
    return {
      hasMore: false,
      totalCount: 135,
      records: [
        {
          assignee: 'admin',
          id: 'wftask@activeiti$1153692',
          lastcomment: null,
          sender: 'admin',
          started: null,
          taskType: null,
          title: 'Согласование'
        }
      ]
    };
  };

  static getSaveTaskResult = id => {
    return {
      assignee: 'admin',
      id: id
    };
  };
}
