let Registry;

class RecordActionExecutorsRegistry {
  registry = {};

  get(type) {
    return this.registry[type];
  }

  addExecutor(key, executor) {
    this.registry[key] = executor;
  }

  addExecutors(executors) {
    for (let key in executors) {
      if (executors.hasOwnProperty(key)) {
        this.addExecutor(key, executors[key]);
      }
    }
  }

  getSupportedTypes() {
    return Object.keys(this.registry);
  }
}

window.Citeck = window.Citeck || {};
Registry = window.Citeck.RecordActionExecutorsRegistry || new RecordActionExecutorsRegistry();
window.Citeck.RecordActionExecutorsRegistry = Registry;

export default Registry;
