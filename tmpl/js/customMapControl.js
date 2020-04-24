class GroupFilterControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl bft-filter-group';
        this._container.id = 'bft-filter-group';
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}

class AddFeatureButtonControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl bft-add-group';
        this._container.id = 'bft-add-group';
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}

class AddFeatureControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl bft-featureInformations';
        this._container.id = 'bft-featureInformations';
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}