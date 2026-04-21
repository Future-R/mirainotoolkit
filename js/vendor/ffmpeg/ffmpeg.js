(function (global) {
    'use strict';

    const MessageType = {
        LOAD: 'LOAD',
        EXEC: 'EXEC',
        WRITE_FILE: 'WRITE_FILE',
        READ_FILE: 'READ_FILE',
        DELETE_FILE: 'DELETE_FILE',
        RENAME: 'RENAME',
        CREATE_DIR: 'CREATE_DIR',
        LIST_DIR: 'LIST_DIR',
        DELETE_DIR: 'DELETE_DIR',
        ERROR: 'ERROR',
        DOWNLOAD: 'DOWNLOAD',
        PROGRESS: 'PROGRESS',
        LOG: 'LOG',
        MOUNT: 'MOUNT',
        UNMOUNT: 'UNMOUNT'
    };

    let messageCounter = 0;
    const nextMessageId = () => messageCounter++;
    const NOT_LOADED_ERROR = new Error('ffmpeg is not loaded, call `await ffmpeg.load()` first');
    const TERMINATED_ERROR = new Error('called FFmpeg.terminate()');

    const resolveBaseURL = () => {
        let sourceURL = '';

        if (typeof document !== 'undefined') {
            if (document.currentScript && document.currentScript.src) {
                sourceURL = document.currentScript.src;
            }

            if (!sourceURL) {
                const scripts = document.getElementsByTagName('script');
                if (scripts.length) {
                    sourceURL = scripts[scripts.length - 1].src;
                }
            }
        }

        if (!sourceURL && typeof global.location !== 'undefined') {
            sourceURL = global.location.href;
        }

        if (!sourceURL) {
            throw new Error('Automatic publicPath is not supported in this browser');
        }

        return sourceURL
            .replace(/#.*$/, '')
            .replace(/\?.*$/, '')
            .replace(/\/[^/]+$/, '/');
    };

    const BASE_URL = resolveBaseURL();

    const createBlobWorker = (scriptURL) => {
        const wrapperSource = `importScripts(${JSON.stringify(scriptURL)});`;
        const wrapperBlobURL = URL.createObjectURL(
            new Blob([wrapperSource], { type: 'text/javascript' })
        );
        const worker = new Worker(wrapperBlobURL);
        worker.__ffmpegWrapperBlobURL = wrapperBlobURL;
        return worker;
    };

    class FFmpeg {
        #worker = null;
        #resolves = {};
        #rejects = {};
        #logListeners = [];
        #progressListeners = [];

        loaded = false;

        #handleMessage = ({ data }) => {
            const { id, type, data: payload } = data || {};

            switch (type) {
                case MessageType.LOAD:
                    this.loaded = true;
                    if (this.#resolves[id]) this.#resolves[id](payload);
                    break;
                case MessageType.MOUNT:
                case MessageType.UNMOUNT:
                case MessageType.EXEC:
                case MessageType.WRITE_FILE:
                case MessageType.READ_FILE:
                case MessageType.DELETE_FILE:
                case MessageType.RENAME:
                case MessageType.CREATE_DIR:
                case MessageType.LIST_DIR:
                case MessageType.DELETE_DIR:
                    if (this.#resolves[id]) this.#resolves[id](payload);
                    break;
                case MessageType.LOG:
                    this.#logListeners.forEach((listener) => listener(payload));
                    break;
                case MessageType.PROGRESS:
                    this.#progressListeners.forEach((listener) => listener(payload));
                    break;
                case MessageType.ERROR:
                    if (this.#rejects[id]) {
                        this.#rejects[id](payload instanceof Error ? payload : new Error(String(payload)));
                    }
                    break;
                default:
                    break;
            }

            if (id !== undefined) {
                delete this.#resolves[id];
                delete this.#rejects[id];
            }
        };

        #handleWorkerError = (event) => {
            const error = new Error(event && event.message ? event.message : 'ffmpeg worker failed');
            const pendingIds = Object.keys(this.#rejects);

            pendingIds.forEach((id) => {
                this.#rejects[id](error);
                delete this.#rejects[id];
                delete this.#resolves[id];
            });
        };

        #postMessage = ({ type, data }, transfer = [], signal) => {
            if (!this.#worker) {
                return Promise.reject(NOT_LOADED_ERROR);
            }

            return new Promise((resolve, reject) => {
                const id = nextMessageId();
                this.#resolves[id] = resolve;
                this.#rejects[id] = reject;

                this.#worker.postMessage({ id, type, data }, transfer);

                if (signal) {
                    signal.addEventListener('abort', () => {
                        reject(new DOMException(`Message # ${id} was aborted`, 'AbortError'));
                        delete this.#rejects[id];
                        delete this.#resolves[id];
                    }, { once: true });
                }
            });
        };

        on(event, listener) {
            if (event === 'log') {
                this.#logListeners.push(listener);
            } else if (event === 'progress') {
                this.#progressListeners.push(listener);
            }
        }

        off(event, listener) {
            if (event === 'log') {
                this.#logListeners = this.#logListeners.filter((item) => item !== listener);
            } else if (event === 'progress') {
                this.#progressListeners = this.#progressListeners.filter((item) => item !== listener);
            }
        }

        load = ({ classWorkerURL, ...config } = {}, { signal } = {}) => {
            if (!this.#worker) {
                if (classWorkerURL) {
                    this.#worker = new Worker(classWorkerURL, { type: 'module' });
                } else {
                    const outerWorkerURL = new URL('814.ffmpeg.js', BASE_URL).toString();
                    this.#worker = createBlobWorker(outerWorkerURL);
                }

                this.#worker.onmessage = this.#handleMessage;
                this.#worker.onerror = this.#handleWorkerError;
            }

            return this.#postMessage({ type: MessageType.LOAD, data: config }, [], signal);
        };

        exec = (args, timeout = -1, { signal } = {}) =>
            this.#postMessage({ type: MessageType.EXEC, data: { args, timeout } }, [], signal);

        writeFile = (path, data, { signal } = {}) => {
            const transfer = [];
            if (data instanceof Uint8Array) {
                transfer.push(data.buffer);
            }
            return this.#postMessage({ type: MessageType.WRITE_FILE, data: { path, data } }, transfer, signal);
        };

        readFile = (path, encoding = 'binary', { signal } = {}) =>
            this.#postMessage({ type: MessageType.READ_FILE, data: { path, encoding } }, [], signal);

        deleteFile = (path, { signal } = {}) =>
            this.#postMessage({ type: MessageType.DELETE_FILE, data: { path } }, [], signal);

        rename = (oldPath, newPath, { signal } = {}) =>
            this.#postMessage({ type: MessageType.RENAME, data: { oldPath, newPath } }, [], signal);

        createDir = (path, { signal } = {}) =>
            this.#postMessage({ type: MessageType.CREATE_DIR, data: { path } }, [], signal);

        listDir = (path, { signal } = {}) =>
            this.#postMessage({ type: MessageType.LIST_DIR, data: { path } }, [], signal);

        deleteDir = (path, { signal } = {}) =>
            this.#postMessage({ type: MessageType.DELETE_DIR, data: { path } }, [], signal);

        mount = (fsType, options, mountPoint) =>
            this.#postMessage({ type: MessageType.MOUNT, data: { fsType, options, mountPoint } }, []);

        unmount = (mountPoint) =>
            this.#postMessage({ type: MessageType.UNMOUNT, data: { mountPoint } }, []);

        terminate = () => {
            const pendingIds = Object.keys(this.#rejects);

            pendingIds.forEach((id) => {
                this.#rejects[id](TERMINATED_ERROR);
                delete this.#rejects[id];
                delete this.#resolves[id];
            });

            if (this.#worker) {
                const wrapperBlobURL = this.#worker.__ffmpegWrapperBlobURL;
                this.#worker.terminate();
                if (wrapperBlobURL) {
                    URL.revokeObjectURL(wrapperBlobURL);
                }
                this.#worker = null;
            }

            this.loaded = false;
        };
    }

    global.FFmpegWASM = { FFmpeg };
})(typeof self !== 'undefined' ? self : globalThis);
