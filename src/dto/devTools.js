export default class DevToolsConverter {
  static fetchAlfrescoModulesList(source = {}) {
    const modules = source.modules || [];
    return modules.map(module => {
      let buildDate = '';
      const groups = module.version.match(/\d+.\d+.\d+.(\d\d).(\d{1,2}).(\d{1,2}).(\d{1,2}).(\d{1,2})/);
      if (groups) {
        buildDate = `20${groups[1]}-${groups[2]}-${groups[3]}T${groups[4]}:${groups[5]}:00Z`;
      }
      return {
        label: module.id,
        version: module.version,
        buildDate
      };
    });
  }

  static fetchSystemModulesList(source = {}) {
    const modules = Array.isArray(source.records) ? source.records : [];
    return modules.map(module => {
      return {
        label: module.label,
        version: module.version,
        buildDate: module.buildDate
      };
    });
  }
}
