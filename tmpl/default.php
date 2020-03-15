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

    .mapboxgl-popup-content {
        background: #fff;
    }

    .card {
        box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
        transition: 0.3s;
        width: 200px;
        max-height: 350px;
        border-radius: 5px;
        background: #0254FE;
        color: #fff;
    }

    .card:hover {
        box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
    }

    img {
        background: #222;
        border-radius: 5px 5px 0 0;
        object-fit: cover;
        width: 100%;
        height: 112px;
    }

    .container h4 {
        margin-top: 5px;
        margin-bottom: 5px;
    }

    .container {
        padding: 2px 2px;
        width: 180px;
    }
</style>
<div style="height:<?php echo $height;?>px" id="map"></div>
<nav id="filter-group" class="filter-group"></nav>
<script>
    mapboxgl.accessToken = 'pk.eyJ1IjoiYWtoZXJvbiIsImEiOiJjazduNHBvOXIwOHl6M3Bqd2x2ODJqbjE4In0.Jx6amOk7NKh8qcm91Ba8vg';
    var markers = <?php echo $places;?>;
    var places = {
					'type': 'FeatureCollection',
					'features': markers['Items']
    			  };
    var filterGroup = document.getElementById('filter-group');
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/akheron/ck7rh7pw12b5c1is1hbldygdh',
        center: [-72.937107, 46.286173],
        zoom: 6.5
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
                label.textContent = feature.properties['type'];
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
                    var label = e.features[0].properties.label;
                    var description = e.features[0].properties.description;
                    var url = e.features[0].properties.url;
                    var image = e.features[0].properties.image;
                    var html = '<div class="card">'+
                        			'<a href="' + url + '" target="_blank">'+
                        				'<img src="' + image + '" alt="' + label + '" style="width:100%">'+
                        			'</a>'+
                        			'<div class="container">'+
                        				'<h4><b>' + label + '</b></h4>'+
                        				'<p>' + description + '</p>'+
                        			'</div>'+
                        		'</div>';

// Ensure that if the map is zoomed out such that multiple
// copies of the feature are visible, the popup appears
// over the copy being pointed to.
                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }

                    new mapboxgl.Popup()
                        .setLngLat(coordinates)
                        .setHTML(html)
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
