class ESMRequire {
  constructor() {
    this.loadedModules = new Map();
  }

  async loadModule(src) {
    if (src.startsWith('/js/')) {
      return this.loadScript(src);
    }

    try {
      const module = await import(/* @vite-ignore */ src);
      this.loadedModules.set(src, module.default || module);
      return module.default || module;
    } catch (error) {
      console.error(`ESMRequire: Failed to load module ${src}`, error);
      throw error;
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      if (this.loadedModules.has(src)) {
        return resolve(this.loadedModules.get(src));
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;

      script.onload = () => {
        const module = window[this.getGlobalModuleName(src)];
        if (!module) {
          return reject(new Error(`ESMRequire: Module not found in window: ${src}`));
        }

        this.loadedModules.set(src, module);
        resolve(module);
      };

      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  }

  require(scripts, callback) {
    Promise.all(scripts.map(src => this.loadModule(src)))
      .then(modules => callback && callback(...modules))
      .catch(error => console.error('ESMRequire error:', error));
  }

  getGlobalModuleName(src) {
    if (src.includes('quill')) return 'Quill'; // as default
    if (src.includes('ckeditor')) return 'ClassicEditor';
    if (src.includes('ace')) return 'ace';
    if (src.includes('mermaid')) return 'mermaid';
    return null;
  }
}

export default new ESMRequire();
