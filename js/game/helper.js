

/**
 * Device screen info helper 
 */
const deviceInfo = (function () {
    const _w = window;
    const _s = window.screen;
    const _b = document.body;
    const _d = document.documentElement;

    return {
        screenWidth() {
            return Math.max(0, _w.innerWidth || _d.clientWidth || _b.clientWidth || 0);
        },
        screenHeight() {
            return Math.max(0, _w.innerHeight || _d.clientHeight || _b.clientHeight || 0);
        },
        screenRatio() {
            return this.screenWidth() / this.screenHeight();
        },
        screenCenterX() {
            return this.screenWidth() / 2;
        },
        screenCenterY() {
            return this.screenHeight() / 2;
        },
        mouseX(e) {
            return Math.max(0, e.pageX || e.clientX || 0);
        },
        mouseY(e) {
            return Math.max(0, e.pageY || e.clientY || 0);
        },
        mouseCenterX(e) {
            return this.mouseX(e) - this.screenCenterX();
        },
        mouseCenterY(e) {
            return this.mouseY(e) - this.screenCenterY();
        },
    };
})();

/**
 * Loader Helper
 */
const LoaderHelper = {
    _data: {},
    _loaded: 0,
    _cb: null,

    // get loaded resource by name  
    get(name) {
        return this._data[name] || null;
    },

    // complete handler 
    onReady(cb) {
        this._cb = cb;
    },

    // common error handler 
    onError(err) {
        console.error(err.message || err);
    },

    // when a resource is loaded 
    onData(name, data) {
        this._loaded += 1;
        this._data[name] = data;
        let total = Object.keys(this._data).length;
        let loaded = (total && this._loaded === total);
        let hascb = (typeof this._cb === 'function');
        if (loaded && hascb) this._cb(total);
    },

    // custom .obj file 
    loadGeometry(name, file) {
        if (!name || !file) return;
        this._data[name] = new THREE.Object3D();
        const path = this._base + '/' + file;
        const loader = new THREE.OBJLoader();
        loader.load(path, data => { this.onData(name, data) }, null, this.onError);
    },

    // load image file 
    loadTexture(name, file) {
        if (!name || !file) return;
        this._data[name] = new THREE.Texture();
        const path = this._base + '/' + file;
        const loader = new THREE.TextureLoader();
        loader.load(path, data => { this.onData(name, data) }, null, this.onError);
    },
};

/**
 * Helper for adding easing effect 
 */
const addEase = (pos, to, ease) => {
    pos.x += (to.x - pos.x) / ease;
    pos.y += (to.y - pos.y) / ease;
    pos.z += (to.z - pos.z) / ease;
};