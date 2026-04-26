// --- TEXT MAP EDITOR ---
(function() {
    const ns = window.App?.textMap;
    if (!ns) return;

    window.App.pages.textMapEditor = {
        config: { ...ns.DEFAULT_CONFIG },

        render: function() {
            return ns.renderPage();
        },

        mount: function() {
            return ns.mountEditor.call(this);
        }
    };
})();
