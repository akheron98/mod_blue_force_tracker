class GroupFilterControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl filter-group';
        this._container.id = 'filter-group';
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}

class AddMarkerButtonControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl filter-group';
        this._container.id = 'add-group';
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}

class AddMarkerControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl coordinates';
        this._container.id = 'coordinates';
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}