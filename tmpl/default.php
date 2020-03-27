<?php
// No direct access
defined('_JEXEC') or die; ?>
<script src="/config-aws.js"></script>
<script src="/modules/mod_blue_force_tracker/tmpl/js/customMapControl.js"></script>
<script src="/modules/mod_blue_force_tracker/tmpl/js/mapbox-gl-1.8.1.js"></script>
<link href="/modules/mod_blue_force_tracker/tmpl/css/mapbox-gl-1.8.1.css" rel="stylesheet"/>
<link href="/modules/mod_blue_force_tracker/tmpl/css/blue-force-tracker.css" rel="stylesheet"/>

<link rel="stylesheet" href="/modules/mod_blue_force_tracker/tmpl/css/croppie.css" />
<script src="/modules/mod_blue_force_tracker/tmpl/js/croppie.min.js"></script>

<div style="height:<?php echo $height; ?>px" id="map"></div>
<script>
    const EMPTY_STRING = "#";
    const URL_REGEX = /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
    const joomlaUserId = "<?php echo $userID;?>";
    const NEW_MARKER = "newMarker";
    const UPDATE_MARKER = "updateMarker";
    const markerType = {
        team : {
            icon : 'toilet',
            string : "team"
        },
        field : {
            icon : 'ranger-station',
            string : "field"
        },
        event : {
            icon : 'embassy',
            string : "event"
        }
    };

    const defaultMarker = {
        type: "Feature",
        properties: {
            id: "0",
            type: "field",
            icon: "ranger-station",
            label: "Nom",
            description: "Description",
            url: "Lien site internet",
            image: "Lien image",
            owner:"",
        },
        geometry: {
            type: "Point",
            coordinates: [
                -72.937107, 46.286173
            ]
        }
    };
    let cropper;

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getTypeLabel(type, language) {
        switch (type) {
            case markerType.team.string :
                return language === "FR-ca" ? "Équipe" : "Team";
            case  markerType.field.string :
                return language === "FR-ca" ? "Terrain" : "Field";
            case  markerType.event.string :
                return language === "FR-ca" ? "Événement" : "Event";
            default:
                return language === "FR-ca" ? "Type introuvable!" : "Type not found";
        }
    }

    function editMarker(markerToEdit) {
        document.getElementById("card").innerHTML = getMarkerFormHTML(markerToEdit, UPDATE_MARKER);

        if (document.getElementById("previewImage" + UPDATE_MARKER) && document.getElementById("previewImage" + UPDATE_MARKER).src) {
            cropper = jQuery('#previewImage' + UPDATE_MARKER).croppie({
                viewport: {
                    width: 200,
                    height: 200,
                }
            });
            cropper.croppie('bind', {
                url: document.getElementById("previewImage" + UPDATE_MARKER).src,
                zoom: 0
            });

            document.getElementById("showImage" + UPDATE_MARKER).style.display = 'block';
        }
    }

    function showMarker() {
        Object.keys(markerType).forEach(function (markerProperties) {
            if (markerType.hasOwnProperty(markerProperties)) {
                const symbol = markerType[markerProperties].icon;
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
                    label.textContent = getTypeLabel(markerProperties, "FR-ca");
                    filterGroup.appendChild(label);

                    input.addEventListener('change', function (e) {
                        map.setLayoutProperty(
                            layerID,
                            'visibility',
                            e.target['checked'] ? 'visible' : 'none'
                        );
                    });

                    map.on('click', layerID, async function (e) {
                        let markerToShow = new Object();
                        markerToShow['geometry'] = e.features[0].geometry;
                        markerToShow['type'] = e.features[0].type;
                        markerToShow['properties'] = e.features[0].properties;
                        const coordinates = markerToShow.geometry.coordinates.slice();
                        const label = markerToShow.properties.label;
                        const description = markerToShow.properties.description;
                        const url = markerToShow.properties.url === EMPTY_STRING ? "#" : markerToShow.properties.url;
                        const userID = markerToShow.properties.owner;
                        let buttonMAJHtml = "";
                        let buttonSupprimerHTml = "";
                        let labelHtml = '<h4><b>' + label + '</b></h4>';
                        let descriptionHtml = '<p>' + description + '</p>';
                        if (userID === joomlaUserId) {
                            buttonMAJHtml = '<button onclick=\'return editMarker(' + JSON.stringify(markerToShow) + ');\' id=\'updateMarker' + userID + '\' class=\'updateMarker\'><i class=\'fas fa-edit\' style=\'padding:0\'></i></button>';
                            buttonSupprimerHTml = '<button onclick="return deleteMarker(\'' + markerToShow.properties.id + '\');" id="supprimerMarker' + userID + '" class="supprimerMarker"><i class="fas fa-trash" style="padding:0"></i></button>';
                        }
                        let image = markerToShow.properties.image;

                        if (!image || image === "#") {
                            image = "./images/image_non_trouvee.png";
                        }
                        const container = '<div id="result"></div>' +
                            '<a href="' + url + '" target="_blank">' +
                            '<img class="cardImage" src="' + image + '" alt="' + label + '">' +
                            '</a>' +
                            '<div id="cardContainer" class="container">' +
                            labelHtml +
                            descriptionHtml +
                            buttonMAJHtml +
                            buttonSupprimerHTml +
                            '</div>';
                        const html = '<div id="card" class="card"></div>';

                        // Ensure that if the map is zoomed out such that multiple
                        // copies of the feature are visible, the popup appears
                        // over the copy being pointed to.
                        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                        }

                        popup.setLngLat(coordinates)
                            .setHTML(html)
                            .addTo(map);
                        document.getElementById("card").innerHTML = container;
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
        });
    }

    function getMarkerFormHTML(marker, id) {
        const lngLat = marker.geometry.coordinates;
        let teamSelected = '';
        let eventSelected = '';
        let fieldSelected = '';
        if (marker.properties.type === 'team') {
            teamSelected = 'selected';
        } else if (marker.properties.type === 'field') {
            fieldSelected = 'selected';
        } else if (marker.properties.type === 'event') {
            eventSelected = 'selected';
        }
        let label = id === NEW_MARKER ? "" : marker.properties.label;
        let description = id === NEW_MARKER ? "" : marker.properties.description;
        let url = id === NEW_MARKER || marker.properties.url === "#" ? "" : marker.properties.url;
        let image = id === NEW_MARKER ? "" : marker.properties.image;
        let showCancel = "hidden"; //id === NEW_MARKER ? "hidden" : "submit";
        let closeButton = id === NEW_MARKER ? "" : '<button class="mapboxgl-popup-close-button" type="button" aria-label="Close popup">×</button>';

        return '<form id="markerForm' + id + '" action="">' +
            closeButton +
            '<div class="marker-form-with-image">' +
                '<div class="marker-form">' +
                    '<div id="app"></div>'+
                    '<div id="result' + id + '"></div>' +
                    '<h6>Votre point d&#39;int&eacute;r&ecirc;t</h6>' +
                    '<select id="type' + id + '" name="type">' +
                        '<option value="team" ' + teamSelected + '>&Eacute;quipe</option>' +
                        '<option value="event" ' + eventSelected + '>&Eacute;v&eacute;nement</option>' +
                        '<option value="field" ' + fieldSelected + '>Terrain</option>' +
                    '</select><br />' +
                    '<label for="label' + id + '">Titre</label><span id="error-label' + id + '"></span>' +
                    '<input required autofocus id="label' + id + '" name="label' + id + '" placeholder="Titre de votre point d\'intérêt" value="'+label+'" type="text" width="100px;" maxlength="50"><br />' +
                    '<label for="description' + id + '">Description</label><span id="error-description' + id + '"></span>' +
                    '<input required id="description' + id + '" name="description' + id + '" placeholder="Courte description" value="'+description+'" type="text" width="100px;" maxlength="140"><br />' +
                    '<label for="url' + id + '">Adresse site web</label><span id="error-url' + id + '"></span>' +
                    '<input id="url' + id + '" name="url' + id + '" placeholder="http://www.example.com" value="'+url+'" type="url" width="100px;" ><br />' +
                    '<input id="image' + id + '" type="file" accept="image/*" onchange="previewImage(\''+id+'\');">' +
                    '<label for="image' + id + '">Choissisez une image...</label><span id="error-image' + id + '"></span>' +
                    '<input id="lng' + id + '" type="hidden" value="'+lngLat[0]+'" />'+
                    '<input id="lat' + id + '" type="hidden" value="'+lngLat[1]+'" />'+
                    '<input id="id' + id + '" type="hidden" value="'+marker.properties.id+'" />'+
                    'Lng: ' + lngLat[0].toFixed(5) + '<br />Lat: ' + lngLat[1].toFixed(5) +
                    '<br />' +
                    '<p>' +
                        '<input type="'+ showCancel +'" id="cancelSave' + id + '" name="cancelSave" onclick="return cancelEditing(\'' + id + '\');" value="&#xf060" />' +
                        '<input type="submit" id="markerSave' + id + '" name="markerSave" onclick="return saveMarker(\'' + id + '\');" value="&#xf0c7" />' +
                    '</p>' +
                '</div>' +
                '<div id="showImage'+id+'" class="marker-form-image">' +
                    '<img id="previewImage'+id+'" src="'+image+'" alt="Prévisualisation"/>' +
                '</div>' +
            '</div>' +
        '</form>';
    }

    function previewImage(id) {
        if (document.getElementById("image" + id)) {
            let oFReader = new FileReader();
            oFReader.readAsDataURL(document.getElementById("image" + id).files[0]);

            oFReader.onload = function () {
                document.getElementById("previewImage" + id).src = oFReader.result;

                if (!document.getElementById("previewImage" + UPDATE_MARKER) || !document.getElementById("previewImage" + UPDATE_MARKER).src) {
                    cropper = jQuery('#previewImage' + id).croppie({
                        viewport: {
                            width: 200,
                            height: 200
                        }
                    });
                }
                cropper.croppie('bind', {
                    url: document.getElementById("previewImage" + id).src,
                });
            };
            document.getElementById("showImage" + id).style.display = 'block';
        }
    }

    function cancelEditing(id) {
        document.getElementById('markerForm' + id).style.display='none';
        document.getElementById('card').style.display='block';
        return false;
    }

    function getMarkerToSaveFromForm(id) {
        return new Promise(resolve => {
            let markerToSave = jQuery.extend({}, defaultMarker);
            let markerId = jQuery("#id" + id).val();
            markerToSave.properties.id = id === NEW_MARKER ? uuidv4() : markerId;
            markerToSave.properties.type = jQuery("#type" + id).val();
            markerToSave.properties.icon = markerType[markerToSave.properties.type].icon;
            markerToSave.properties.label = jQuery("#label" + id).val();
            markerToSave.properties.description = jQuery("#description" + id).val();
            let url = jQuery("#url" + id).val();
            markerToSave.properties.url = url === "" ? EMPTY_STRING : url;
            markerToSave.properties.owner = "<?php echo $userID; ?>";
            markerToSave.geometry.coordinates = [jQuery("#lng" + id).val(), jQuery("#lat" + id).val()];

            markerToSave.properties.image = EMPTY_STRING;
            let imageBlob = document.getElementById("previewImage" + id).src;
            if (imageBlob) {
                cropper.croppie('result', {
                    type: 'canvas',
                    size: 'viewport',
                    resultSize: {
                        width: 200,
                        height: 200
                    }
                }).then(function (resp) {
                    markerToSave.properties.image = resp;
                    resolve(markerToSave);
                });
            } else {
                resolve(markerToSave);
            }
        });
    }

    function deleteMarker(idToDelete) {
        if (confirm("Êtes-vous sur de vouloir supprimer votre point d'intérêt ?")) {
            persistMarker({id:idToDelete}, 'DELETE',UPDATE_MARKER, function(){popup.remove();});
        }
        return false;
    }

    function saveNewMarker(markerToSave, id) {
        persistMarker(markerToSave, 'POST',id, function(){marker.remove();});
        document.getElementById('addMarkerLabel').textContent = 'Ajouter';
        document.getElementById('addMarkerInput').checked = false;
        new Promise(r => setTimeout(r, 2000)).then(function () {
            document.getElementById("coordinates").style.display = 'none';
            document.getElementById("markerForm" + id).reset();
            marker.setLngLat([-73.61027, 45.49917]);
        });
        return false;
    }

    function isUrlValid(url) {
        return URL_REGEX.test(url);
    }

    function clearErrorMessage(id) {
        document.getElementById('error-label'+id).innerHTML = "";
        document.getElementById('error-description'+id).innerHTML = "";
        document.getElementById('error-url'+id).innerHTML = "";
        document.getElementById('error-image'+id).innerHTML = "";
    }

    function validerMarkerForm(id) {
        let success = true;
        clearErrorMessage(id);

        if (!jQuery("#label" + id).val()) {
            document.getElementById('error-label'+id).innerHTML = " Requis! *";
            success = false;
        }

        if (!jQuery("#description" + id).val()) {
            document.getElementById('error-description'+id).innerHTML = " Requis! *";
            success = false;
        }

        let url = jQuery("#url" + id).val();
        if (url && !isUrlValid(url)) {
            document.getElementById('error-url'+id).innerHTML = " Invalide *";
            success = false;
        }

        return success;
    }


    function saveMarker(id) {
        if (!validerMarkerForm(id)) {
            console.log("should end here");
            return false;
        }
        let saveButton = jQuery("#markerSave" + id);
        saveButton[0].disabled = true;
        getMarkerToSaveFromForm(id).then(function(markerToSave) {
            if (id === NEW_MARKER) {
                saveNewMarker(markerToSave,id);
            } else {
                persistMarker(markerToSave, 'PUT',id, function(){popup.remove();});
            }
        });
        return false;
    }

    async function persistMarker(markerToSave, method, id, callback) {
        const ajaxRequest = jQuery.ajax({
            method: method,
            url: url,
            headers: {
                "Accept": "*/*",
                "Authorization": "eyJraWQiOiJLTzRVMWZs",
                "content-type": "application/json; charset=UTF-8",
                "x-api-key": AWS_API_KEY
            },
            contentType: 'application/json',
            crossDomain: true,
            data: JSON.stringify(markerToSave),
            dataType: 'json'
        });
        ajaxRequest.done(function () {
            jQuery("#result" + id).html('Opération réussie!');
            callback();
            map.getSource('places').setData(url);
        });
        /* On failure of request this function will be called  */
        ajaxRequest.fail(function (request) {
            jQuery("#result" + id).html('There is error while submit:' + request.responseText);
        });
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
                document.getElementById('coordinates').style.display = 'none';
            }
        });
    }

    function addMapControls() {
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
                    showZoom: true
                }
            }), 'top-left');
        map.addControl(new AddMarkerControl(), 'bottom-left');
    }

    mapboxgl.accessToken = 'pk.eyJ1IjoiYWtoZXJvbiIsImEiOiJjazduNHBvOXIwOHl6M3Bqd2x2ODJqbjE4In0.Jx6amOk7NKh8qcm91Ba8vg';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/akheron/ck7rh7pw12b5c1is1hbldygdh',
        center: [-72.937107, 46.286173],
        zoom: 6.5
    });
    const popup = new mapboxgl.Popup();
    const url = "https://m05rcnja4m.execute-api.us-east-2.amazonaws.com/prod/marker";
    const marker = new mapboxgl.Marker({draggable: true});
    addMapControls();

    map.on('load', function () {
        map.addSource('places', { type: 'geojson', data: url });
        showMarker();
        marker.setLngLat([-73.61027, 45.49917]);
        showAddButton(marker);

        function onDragEnd() {
            const coordinates = document.getElementById("coordinates");
            coordinates.style.display = 'block';
            let markerToSave = jQuery.extend({}, defaultMarker);
            let lngLat = marker.getLngLat();
            markerToSave.geometry.coordinates = [lngLat.lng, lngLat.lat];
            coordinates.innerHTML = getMarkerFormHTML(markerToSave, NEW_MARKER);
        }
        marker.on('dragend', onDragEnd);
    });
</script>