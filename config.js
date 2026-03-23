
(() => {
  const cloneConfig = (config) => {
    if (!config) return null;
    if (typeof structuredClone === "function") return structuredClone(config);
    return JSON.parse(JSON.stringify(config));
  };

  window.TOOLBOX_CONFIG = cloneConfig(window.DEFAULT_TOOLBOX_CONFIG) || {
    "name": "未来工具箱",
    "description": "各种小工具。",
    "tools": []
  };
})();
