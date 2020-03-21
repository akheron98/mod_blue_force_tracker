<?php
// No direct access
defined('_JEXEC') or die; ?>
<script src="/modules/mod_blue_force_tracker/tmpl/js/jquery-3.4.1.min.js"></script>
<script src="/modules/mod_blue_force_tracker/tmpl/js/groupFilter.js"></script>
<script src="/modules/mod_blue_force_tracker/tmpl/js/mapbox-gl-1.8.1.js"></script>
<link href="/modules/mod_blue_force_tracker/tmpl/css/mapbox-gl-1.8.1.css" rel="stylesheet" />
<link href="/modules/mod_blue_force_tracker/tmpl/css/blue-force-tracker.css" rel="stylesheet" />

<div style="height:<?php echo $height;?>px" id="map"></div>
<script>
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

    function fetchAllMakers() {
        return new Promise((resolve => {
            const ajaxRequest = jQuery.ajax({
                method: 'GET',
                url: 'https://m05rcnja4m.execute-api.us-east-2.amazonaws.com/prod/marker?TableName=blue_force_tracker',
                headers: {
                    "Accept": "*/*",
                    "Authorization": "eyJraWQiOiJLTzRVMWZs",
                    "content-type": "application/json; charset=UTF-8"
                },
                contentType: 'application/json',
                crossDomain: true,
                dataType: 'json'
            });
            ajaxRequest.done(function (data) {
                resolve(data);
            });
            ajaxRequest.fail(function (request) {
                jQuery("#result").html('There is error while get:' + request.responseText);
            });
        }));
    }

    function imageExists(url, callback) {
        let img = new Image();
        img.onload = function() { callback(true); };
        img.onerror = function() { callback(false); };
        img.src = url;
    }

    async function IsValidImageUrl(url) {
        return new Promise(resolve => {
            imageExists(url, function(exists) {
                resolve(exists);
            });
        });
    }
    function getTypeLabel(type, language) {
        switch(type) {
            case "team" :
                return language === "FR-ca" ? "Équipe" : "Team";
                break;
            case "field" :
                return language === "FR-ca" ? "Terrain" : "Field";
                break;
            case "event" :
                return language === "FR-ca" ? "Événement" : "Event";
                break;
            default:
                return language === "FR-ca" ? "Type introuvable!" : "Type not found";
        }
    }

    function getMarkerIconByType(type) {
        if (type === "team") {
            return 'toilet';
        } else if (type === "event") {
            return 'embassy';
        } else if (type === "field") {
            return 'ranger-station';
        }
        return 'level-crossing';
    }

    async function showMarker(feature) {
            const symbol = feature.properties['icon'];
            const layerID = "poi-" + symbol; //feature['markerId'];
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
                let filterGroup = document.getElementById('filter-group');
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.id = layerID;
                input.checked = true;
                filterGroup.appendChild(input);

                const label = document.createElement('label');
                label.setAttribute('for', layerID);
                label.textContent = getTypeLabel(feature.properties['type'], "FR-ca");
                filterGroup.appendChild(label);

                input.addEventListener('change', function (e) {
                    map.setLayoutProperty(
                        layerID,
                        'visibility',
                        e.target.checked ? 'visible' : 'none'
                    );
                });

                map.on('click', layerID, async function (e) {
                    const coordinates = e.features[0].geometry.coordinates.slice();
                    const label = e.features[0].properties.label;
                    const description = e.features[0].properties.description;
                    const url = e.features[0].properties.url;
                    let image = e.features[0].properties.image;
                    let isValidImage = await IsValidImageUrl(image);

                    if (!isValidImage) {
                       image = "./images/image_non_trouvee.png";
                    }
                    const html = '<div class="card">' +
                        '<a href="' + url + '" target="_blank">' +
                        '<img src="' + image + '" alt="' + label + '" style="width:100%">' +
                        '</a>' +
                        '<div class="container">' +
                        '<h4><b>' + label + '</b></h4>' +
                        '<p>' + description + '</p>' +
                        '</div>' +
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
                map.on('mouseenter', layerID, function () {
                    map.getCanvas().style.cursor = 'pointer';
                });

                // Change it back to a pointer when it leaves.
                map.on('mouseleave', layerID, function () {
                    map.getCanvas().style.cursor = '';
                });
            }

    }

    function showAddButton(marker) {
        let addGroup = document.getElementById('add-group');
        let input = document.createElement('input');
        input.type = 'checkbox';
        input.id = 'addMarkerInput';
        input.checked = false;
        addGroup.appendChild(input);

        let label = document.createElement('label');
        label.setAttribute('for', 'addMarkerInput');
        label.setAttribute('id', 'addMarkerLabel');
        label.textContent = 'Ajouter';
        addGroup.appendChild(label);
        //When the checkbox changes, update the visibility of the layer.
        input.addEventListener('change', function () {
            if (input.checked) {
                marker.addTo(map);
                label.textContent = 'Retirer';
            } else {
                marker.remove();
                label.textContent = 'Ajouter';
            }
        });
    }
    const markerCanvas = {
        type: "Feature",
        properties: {
            icon: "ranger-station",
            type: "field",
            label: "Nom",
            description: "Description",
            url: "Lien site internet",
            image: "Lien image"
        },
        geometry: {
            type: "Point",
            coordinates: [
                -72.937107, 46.286173
            ]
        }
    };
    let markersP = fetchAllMakers();
    mapboxgl.accessToken = 'pk.eyJ1IjoiYWtoZXJvbiIsImEiOiJjazduNHBvOXIwOHl6M3Bqd2x2ODJqbjE4In0.Jx6amOk7NKh8qcm91Ba8vg';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/akheron/ck7rh7pw12b5c1is1hbldygdh',
        center: [-72.937107, 46.286173],
        zoom: 6.5
    });

    markersP.then(function(markers) {
        const places = {
            'type': 'FeatureCollection',
            'features': markers['Items']
        };
        map.addControl(new mapboxgl.FullscreenControl());
        map.addControl(
                new mapboxgl.GeolocateControl({
                    positionOptions: {
                        enableHighAccuracy: true
                    },
                    trackUserLocation: true
                })
            );
        map.addControl(new GroupFilterControl(), 'top-right');
        map.addControl(new AddMarkerButtonControl(), 'top-right');
        map.addControl(
                new mapboxgl.NavigationControl({
                    options: {
                        showZoom:true
                    }
                }), 'top-left');
        map.addControl(new AddMarkerControl(), 'top-left');
        map.on('load', function() {
            map.addSource('places', {
                'type': 'geojson',
                'data': places
            });
            places.features.forEach(function (feature) {
                showMarker(feature);
            });
            const marker = new mapboxgl.Marker({
                draggable: true
            }).setLngLat([-73.61027, 45.49917]);

            showAddButton(marker);

            function onDragEnd() {
                const coordinates = document.getElementById("coordinates");
                const lngLat = marker.getLngLat();
                coordinates.style.display = 'block';
                const type = markerCanvas.properties.type;
                let teamSelected = '';
                let eventSelected = '';
                let fieldSelected = '';

                if (type === 'team') {
                    teamSelected = 'selected';
                } else if (type === 'field') {
                    fieldSelected = 'selected';
                } else if (type === 'event') {
                    eventSelected = 'selected';
                }
                const label = markerCanvas.properties.label;
                const description = markerCanvas.properties.description;
                const url = markerCanvas.properties.url;
                const image = markerCanvas.properties.image;
                coordinates.innerHTML =
                    '<form id="markerForm" action="">' +
                    '<div class="marker-form">' +
                    '<div id="result"></div>' +
                    '<h4>Nouveau point d&#39;int&eacute;r&ecirc;t</h4>' +
                    '<select id="type" name="type">' +
                    '<option value="team" ' + teamSelected + '>&Eacute;quipe</option>' +
                    '<option value="event" ' + eventSelected + '>&Eacute;v&eacute;nement</option>' +
                    '<option value="field" ' + fieldSelected + '>Terrain</option>' +
                    '</select><br />' +
                    '<input id="label" name="label" placeholder="' + label + '" type="text" width="100px;"><br />' +
                    '<input id="description" name="description" placeholder="' + description + '" type="text" width="100px;"><br />' +
                    '<input id="url" name="url" placeholder="' + url + '" type="text" width="100px;"><br />' +
                    '<input id="image" name="image" placeholder="' + image + '" type="text" width="100px;"><br />' +
                    'Longitude: ' + lngLat.lng + '<br />Latitude: ' + lngLat.lat +
                    '<br /><input type="submit" id="markerSave" name="markerSave" value="SAUVEGARDER" />' +
                    '</div>' +
                    '</form>';
            }
            marker.on('dragend', onDragEnd);

            jQuery(document).ready(function() {
                jQuery(document).on('submit', '#markerForm', function(e) {
                    let saveButton = jQuery("#markerSave");
                    saveButton[0].disabled = true;
                    e.preventDefault();
                    const lngLat = marker.getLngLat();
                    markerCanvas.properties.type = jQuery("#type").val();
                    markerCanvas.properties.icon = getMarkerIconByType(markerCanvas.properties.type);
                    markerCanvas.properties.label = jQuery("#label").val();
                    markerCanvas.properties.description = jQuery("#description").val();
                    markerCanvas.properties.url = jQuery("#url").val();
                    markerCanvas.properties.image = jQuery("#image").val();
                    markerCanvas.geometry.coordinates = [lngLat.lng.toFixed(5), lngLat.lat.toFixed(5)];

                    const ajaxRequest = jQuery.ajax({
                        method: 'POST',
                        url: 'https://m05rcnja4m.execute-api.us-east-2.amazonaws.com/prod/marker',
                        headers: {
                            "Accept": "*/*",
                            "Authorization": "eyJraWQiOiJLTzRVMWZs",
                            "content-type": "application/json; charset=UTF-8",
                        },
                        contentType: 'application/json',
                        crossDomain: true,
                        data: JSON.stringify(markerCanvas),
                        dataType: 'json'
                    });
                    ajaxRequest.done(async function (data){
                        let newMarker = JSON.parse(data);
                        places.features.push(newMarker);
                        let placesSources = map.getSource('places');
                        placesSources.data = places;
                        await showMarker(newMarker);
                        marker.remove();
                         // Show successfully for submit message
                        jQuery("#result").html('Sauvegard&eacute; avec succ&egrave;s');
                        let saveButton = jQuery("#markerSave");
                        saveButton.val("SAUVEGARDÉ!");
                        document.getElementById('addMarkerLabel').textContent = 'Ajouter';
                        document.getElementById('addMarkerInput').checked = false;
                        await new Promise(r => setTimeout(r, 2000));
                        document.getElementById("coordinates").style.display = 'none';
                        marker.remove();
                        markerCanvas.properties.type = "field";
                        markerCanvas.properties.icon = 'ranger-station';
                        markerCanvas.properties.label = "Nom";
                        markerCanvas.properties.description = "Description";
                        markerCanvas.properties.url = "Lien site internet";
                        markerCanvas.properties.image = "Lien image";
                        markerCanvas.geometry.coordinates = [-72.937107, 46.286173];
                    });
                    /* On failure of request this function will be called  */
                    ajaxRequest.fail(function (request){
                        jQuery("#result").html('There is error while submit:' + request.responseText);
                        let saveButton = jQuery("#markerSave");
                        saveButton[0].disabled = false;
                    });
                    return false;
                });
            });
        });
    });
</script>