<?php
// No direct access
defined('_JEXEC') or die; ?>
<script src="https://api.mapbox.com/mapbox-gl-js/v1.8.1/mapbox-gl.js"></script>
<link href="https://api.mapbox.com/mapbox-gl-js/v1.8.1/mapbox-gl.css" rel="stylesheet" />
<style>
    body { margin: 0; padding: 0; }
    #map { position: relative; top: 0; bottom: 0; width: 100%; }

    .filter-group {
        font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
        font-weight: 600;
        position: absolute;
        top: 50px;
        right: 10px;
        z-index: 1;
        border-radius: 3px;
        width: 120px;
        color: #fff;
    }

    .filter-group input[type='checkbox']:first-child + label {
        border-radius: 3px 3px 0 0;
    }

    .filter-group label:last-child {
        border-radius: 0 0 3px 3px;
        border: none;
    }

    .filter-group input[type='checkbox'] {
        display: none;
    }

    .filter-group input[type='checkbox'] + label {
        background-color: #0254FE;
        display: block;
        cursor: pointer;
        padding: 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.25);
    }

    .filter-group input[type='checkbox'] + label {
        background-color: #0254FE;
        text-transform: capitalize;
    }

    .filter-group input[type='checkbox'] + label:hover,
    .filter-group input[type='checkbox']:checked + label {
        background-color: #0254FE;
    }

    .filter-group input[type='checkbox']:checked + label:before {
        content: '✔';
        margin-right: 5px;
    }

    .mapboxgl-popup {
        max-width: 400px;
        font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
    }
</style>
<div style="height:<?php echo $height;?>px" id="map"></div>
<nav id="filter-group" class="filter-group"></nav>
<script>
    mapboxgl.accessToken = 'pk.eyJ1IjoiYWtoZXJvbiIsImEiOiJjazduNHBvOXIwOHl6M3Bqd2x2ODJqbjE4In0.Jx6amOk7NKh8qcm91Ba8vg';
    var places = {
        'type': 'FeatureCollection',
        'features': [
        <?php foreach ($eventList as $event) :
                echo "{'type': 'Feature','properties': {'description': '<h1>";
                echo $event->title;
                echo "</h1><br />";
                echo "<p>";
                echo $event->info;
                echo "</p>";
                echo "','icon': '";
                echo $event->type;
                echo "'},'geometry': {'type': 'Point','coordinates': [";
                echo $event->lon;
                echo ", ";
                echo $event->lat;
                echo "]}},";
              endforeach;
        ?>
        ]
    };

    var filterGroup = document.getElementById('filter-group');
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/akheron/ck7rh7pw12b5c1is1hbldygdh',
        center: [-72.937107, 46.286173],
        zoom: 3.5
    });
    map.addControl(new mapboxgl.FullscreenControl());
    map.on('load', function() {
// Add a GeoJSON source containing place coordinates and information.
        map.addSource('places', {
            'type': 'geojson',
            'data': places
        });

        places.features.forEach(function(feature) {
            var symbol = feature.properties['icon'];
            var layerID = 'poi-' + symbol;

// Add a layer for this symbol type if it hasn't been added already.
            if (!map.getLayer(layerID)) {
                map.addLayer({
                    'id': layerID,
                    'type': 'symbol',
                    'source': 'places',
                    'layout': {
                        'icon-image': symbol + '-15',
                        'icon-allow-overlap': true
                    },
                    'filter': ['==', 'icon', symbol]
                });

// Add checkbox and label elements for the layer.
                var input = document.createElement('input');
                input.type = 'checkbox';
                input.id = layerID;
                input.checked = true;
                filterGroup.appendChild(input);

                var label = document.createElement('label');
                label.setAttribute('for', layerID);
                let labelString = symbol;
                if (symbol === 'embassy') {
                    labelString = 'Terrain';
                } else (symbol === 'toilet') {
                    labelString = 'Équipe';
                } else {
                    labelString = 'Événement';
                }
                label.textContent = labelString;
                filterGroup.appendChild(label);

// When the checkbox changes, update the visibility of the layer.
                input.addEventListener('change', function(e) {
                    map.setLayoutProperty(
                        layerID,
                        'visibility',
                        e.target.checked ? 'visible' : 'none'
                    );
                });
                map.on('click', layerID, function(e) {
                    var coordinates = e.features[0].geometry.coordinates.slice();
                    var description = e.features[0].properties.description;

// Ensure that if the map is zoomed out such that multiple
// copies of the feature are visible, the popup appears
// over the copy being pointed to.
                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }

                    new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(description)
                        .addTo(map);
                });

                // Change the cursor to a pointer when the mouse is over the places layer.
                map.on('mouseenter', layerID, function() {
                    map.getCanvas().style.cursor = 'pointer';
                });

                // Change it back to a pointer when it leaves.
                map.on('mouseleave', layerID, function() {
                    map.getCanvas().style.cursor = '';
                });
            }
        });
    });
</script>
