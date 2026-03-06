class ESMRequire {
  constructor() {
    this.loadedModules = new Map();
    this._loadingScripts = new Map();
    this._pendingScripts = 0;
    this._savedDefine = undefined;
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

  // Suppress AMD (RequireJS) while loading UMD scripts so they export to window
  _suppressAmd() {
    if (this._pendingScripts === 0 && typeof window.define === 'function' && window.define.amd) {
      this._savedDefine = window.define;
      window.define = undefined;
    }
    this._pendingScripts++;
  }

  _restoreAmd() {
    this._pendingScripts--;
    if (this._pendingScripts === 0 && this._savedDefine !== undefined) {
      window.define = this._savedDefine;
      this._savedDefine = undefined;
    }
  }

  loadScript(src) {
    if (this.loadedModules.has(src)) {
      return Promise.resolve(this.loadedModules.get(src));
    }

    if (this._loadingScripts.has(src)) {
      return this._loadingScripts.get(src);
    }

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;

      this._suppressAmd();

      script.onload = () => {
        this._restoreAmd();
        this._loadingScripts.delete(src);
        const module = window[this.getGlobalModuleName(src)];
        if (!module) {
          return reject(new Error(`ESMRequire: Module not found in window: ${src}`));
        }

        this.loadedModules.set(src, module);
        resolve(module);
      };

      script.onerror = () => {
        this._restoreAmd();
        this._loadingScripts.delete(src);
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.body.appendChild(script);
    });

    this._loadingScripts.set(src, promise);
    return promise;
  }

  require(scripts, callback, onError) {
    Promise.all(scripts.map(src => this.loadModule(src)))
      .then(modules => callback && callback(...modules))
      .catch(error => {
        console.error('ESMRequire error:', error);
        onError && onError(error);
      });
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
