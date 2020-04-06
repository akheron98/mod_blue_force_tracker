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
<link rel="stylesheet" href="/modules/mod_blue_force_tracker/tmpl/css/bootstrap.min.css">

<div class="container-fluid" style="padding:0;">
    <div class="row no-gutters" style="margin-left:0;">
        <div class="col-lg-10">
            <div style="height:<?php echo $height; ?>px" id="map"></div>
        </div>
        <div class="col-lg-2">
             <div class="infoMap" id="infoMap">
                <fieldset>
                    <input
                            id="feature-filter"
                            type="text"
                            placeholder="Recherche"
                    />
                </fieldset>
                <div id="feature-listing"></div>  <!-- listing list-group -->
             </div>
        </div>
    </div>
</div>

<script>
    let features = [];
    const filterEl = document.getElementById('feature-filter');
    const listingEl = document.getElementById('feature-listing');
    const EMPTY_STRING = "#";
    const URL_REGEX = /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
    const joomlaUserId = "<?php echo $userID;?>";
    const connectedUser = joomlaUserId > 0;
    let markerOriginalPos = null;
    const featureType = {
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
    let feature = {}; 
    const defaultFeature = {
        type: "Feature",
        properties: {
            id: "0",
            type: "field",
            icon: "ranger-station",
            label: "",
            description: "",
            url: "",
            image: "",
            owner:"",
        },
        geometry: {
            type: "Point",
            coordinates: [
                -73.61027, 45.49917
            ]
        }
    };
    let cropper;
    let cropperOptions = {
        viewport: {
            width: 200,
            height: 200
        },
        boundary: {width: 290, height: 200},
    };

    function resetCroppie() { destroyCroppie(); initCroppie(); }

    function destroyCroppie() {
        if (cropper) {
            cropper.croppie('destroy');
        }
    }

    function initCroppie() { cropper = jQuery('#cropper').croppie(cropperOptions); }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getTypeLabel(type, language) {
        switch (type) {
            case featureType.team.string :
                return language === "FR-ca" ? "Équipe" : "Team";
            case  featureType.field.string :
                return language === "FR-ca" ? "Terrain" : "Field";
            case  featureType.event.string :
                return language === "FR-ca" ? "Événement" : "Event";
            default:
                return language === "FR-ca" ? "Type introuvable!" : "Type not found";
        }
    }

    function showFeaturesOnMap() {
        Object.keys(featureType).forEach(function (featureProperties) {
            if (featureType.hasOwnProperty(featureProperties)) {
                const symbol = featureType[featureProperties].icon;
                const layerID = "poi-" + symbol; //feature['featureId'];
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
                    label.textContent = getTypeLabel(featureProperties, "FR-ca");
                    filterGroup.appendChild(label);

                    input.addEventListener('change', function (e) {
                        map.setLayoutProperty(
                            layerID,
                            'visibility',
                            e.target['checked'] ? 'visible' : 'none'
                        );
                    });

                    map.on('click', layerID, async function (e) {
                        cancelAddFeature();
                        feature = {};
                        feature['geometry'] = e.features[0].geometry;
                        feature['type'] = e.features[0].type;
                        feature['properties'] = e.features[0].properties;
                        const coordinates = feature.geometry.coordinates.slice();
                        const userID = feature.properties.owner;
                        let buttonMAJHtml = "";
                        let buttonSupprimerHTml = "";
                        if (userID === joomlaUserId) {
                            buttonMAJHtml = '<button onclick=\'return editFeature();\' id=\'updateFeature' + userID + '\' class=\'updateFeature\'><i class=\'fas fa-edit\' style=\'padding:0\'></i></button>';
                            buttonSupprimerHTml = '<button onclick="return deleteFeature();" id="supprimerFeature' + userID + '" class="supprimerFeature"><i class="fas fa-trash" style="padding:0"></i></button>';
                        }
                        const container = '<div id="result"></div>' +
                            getFeatureCard(feature) +
                            buttonMAJHtml +
                            buttonSupprimerHTml +
                            '</div>';
                        const html = '<div id="card" class="featureCard"></div>';

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

    function loadImage() {
        let image = document.getElementById("image");
        if (image) {
            let oFReader = new FileReader();
            oFReader.readAsDataURL(image.files[0]);
            oFReader.onload = function () {
                feature.properties.image = oFReader.result;
                showImage();
            };
        }
    }

    const activityTypeSelectForm =
        '<label for "activity">Type d\'activité</label>' +
        '<select id="activity" >' +
        '   <option value="airsoft">Airsoft</option>' +
        '   <option value="paintball">Paintball</option>' +
        '</select>';

    const fieldDetails =
        '<h6>Caractéristiques du terrain</h6>' +
        '<label for "fieldRules">Règles</label>' +
        '<textarea id="fieldRules"></textarea>'+
        '<br />' +
        '<div class="spread">' +
        '   <label class="detailSwitchLabel" for="fieldUrban">Village(s)</label>'+
        '   <div class="custom-control custom-switch">' +
        '       <input type="checkbox" class="custom-control-input" id="fieldUrban">' +
        '       <label class="custom-control-label" for="fieldUrban"></label>' +
        '   </div>' +
        '</div>' +
        '<div class="spread">' +
        '   <label class="detailSwitchLabel" for="fieldMeal">Nourriture vendue sur place</label>'+
        '   <div class="custom-control custom-switch spread">' +
        '       <input type="checkbox" class="custom-control-input" id="fieldMeal">' +
        '       <label class="custom-control-label" for="fieldMeal"></label>' +
        '   </div>' +
        '</div>' +
        '';

    const eventDetails =
        '<h6>Caractéristiques de l\'événement</h6>' +
        activityTypeSelectForm +
        '<label for "eventDate">Date de l\'événement</label>' +
        '<input required type="date" id="eventDate" value="" />'+
        '<label for "eventDebut">Début</label>' +
        '<input required type="time" id="eventDebut" value="" />'+
        '<label for "eventFin">Fin</label>' +
        '<input required type="time" id="eventFin" value="" />' +
        '<label for "eventCout">Coût</label>' +
        '<input required type="number" id="eventCout" value="" />';

    const teamDetails =
        '<h6>Caractéristiques de l\'équipe</h6>' +
        activityTypeSelectForm +
        '<div class="spread">' +
        '   <label class="detailSwitchLabel" for="teamTraining">Entrainement d\'équipe</label>'+
        '   <div class="custom-control custom-switch">' +
        '       <input type="checkbox" class="custom-control-input" id="teamTraining">' +
        '       <label class="custom-control-label" for="teamTraining"></label>' +
        '   </div>' +
        '</div>';

    function setFeatureDetails() {
        switch (jQuery('#featureType').val()) {
            case featureType.field.string :
                jQuery("#details").html(fieldDetails);
                jQuery("#eventDate").val(feature.properties['eventDate']);
                jQuery("#eventDebut").val(feature.properties['eventDebut']);
                jQuery("#eventFin").val(feature.properties['eventFin']);
                jQuery("#eventCout").val(feature.properties['eventCout']);
                break;
            case featureType.event.string :
                jQuery("#details").html(eventDetails);
                jQuery("#eventDate").val(feature.properties['eventDate']);
                jQuery("#eventDebut").val(feature.properties['eventDebut']);
                jQuery("#eventFin").val(feature.properties['eventFin']);
                jQuery("#eventCout").val(feature.properties['eventCout']);
                break;
            case featureType.team.string :
                jQuery("#details").html(teamDetails);
                jQuery("#eventDate").val(feature.properties['eventDate']);
                jQuery("#eventDebut").val(feature.properties['eventDebut']);
                jQuery("#eventFin").val(feature.properties['eventFin']);
                jQuery("#eventCout").val(feature.properties['eventCout']);
                break;
            default:
                jQuery("#details").html("Type invalide");
        }
    }

    function setFeaturePropertiesFromForm() {
        return new Promise(resolve => {
            feature.properties.type = jQuery("#type").val();
            feature.properties.icon = featureType[feature.properties.type].icon;
            feature.properties.label = jQuery("#label").val();
            feature.properties.description = jQuery("#description").val();
            let url = jQuery("#url").val();
            feature.properties.url = url === "" ? EMPTY_STRING : url;
            feature.properties.owner = "<?php echo $userID; ?>";
            let lngLat = marker.getLngLat();
            feature.geometry.coordinates = [lngLat.lng, lngLat.lat];
            feature.properties.image = EMPTY_STRING;

            if (cropper && cropper[0].src) {
                cropper.croppie('result', cropperOptions).then(function (resp) {
                    feature.properties.image = resp;
                    resolve();
                });
            } else {
                resolve();
            }
        })
    }

    function isUrlValid(url) {
        return URL_REGEX.test(url);
    }

    function clearErrorMessage() {
        document.getElementById('error-label').innerHTML = "";
        document.getElementById('error-description').innerHTML = "";
        document.getElementById('error-url').innerHTML = "";
        document.getElementById('error-image').innerHTML = "";
    }

    function validerFeatureForm() {
        return true;
        let success = true;
        clearErrorMessage();

        if (!jQuery("#label").val()) {
            document.getElementById('error-label').innerHTML = " Requis! *";
            document.getElementById('label').className += ' invalid';
            success = false;
        }

        if (!jQuery("#description").val()) {
            document.getElementById('error-description').innerHTML = " Requis! *";
            document.getElementById('description').className += ' invalid';
            success = false;
        }

        let url = jQuery("#url").val();
        if (url && !isUrlValid(url)) {
            document.getElementById('error-url').innerHTML = " Invalide *";
            document.getElementById('url').className += ' invalid';
            success = false;
        }

        return success;
    }


    function saveFeature() {
        if (!validerFeatureForm()) {
            return false;
        }
        setFeaturePropertiesFromForm().then(function() {
            if (feature.properties.id === "0") {
                insertFeature();
            } else {
                updateFeature();
            }
        });
        return false;
    }

    function insertFeature() {
        feature.properties.id = uuidv4();
        persistFeature('POST', function() {
            popup.remove();
            marker.remove();
            markerOriginalPos = null;
        });
    }

    function updateFeature() {
        persistFeature('PUT', function() {
            popup.remove();
        });
    }

    function deleteFeature() {
        if (confirm("Êtes-vous sur de vouloir supprimer votre point d'intérêt ?")) {
            persistFeature('DELETE', function(){popup.remove();});
        }
        return false;
    }

    async function persistFeature(method, callback) {
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
            data: JSON.stringify(method === "DELETE" ? {id:feature.properties.id} : feature),
            dataType: 'json'
        });
        ajaxRequest.done(function () {
            callback();
            map.getSource('places').setData(url);
            renderListings([]);
        });
        /* On failure of request this function will be called  */
        ajaxRequest.fail(function (request) {
            jQuery("#result").html('There is error while submit:' + request.responseText);
        });
    }

    function addAddButton() {
        if (connectedUser) {
            let addGroup = document.getElementById('add-group');
            let input = document.createElement('input');
            input.type = 'checkbox';
            input.id = 'addFeatureInput';
            input.checked = false;
            addGroup.appendChild(input);

            let label = document.createElement('label');
            label.setAttribute('for', 'addFeatureInput');
            label.setAttribute('id', 'addFeatureLabel');
            label.textContent = 'Ajouter';
            addGroup.appendChild(label);
            //When the checkbox changes, update the visibility of the layer.
            input.addEventListener('change', function () {
                if (input.checked) {
                    addNewFeature();
                } else {
                    cancelAddFeature();
                }
            });
        }
    }

    function addNewFeature() {
        feature = jQuery.extend({}, defaultFeature);
        feature.properties.id = "0";
        let centerScreenCoordinates = map.getBounds().getCenter();
        marker.setLngLat(centerScreenCoordinates);
        marker.addTo(map);
        markerOriginalPos = centerScreenCoordinates;
        document.getElementById('addFeatureLabel').textContent =  'Annuler';
    }

    function cancelAddFeature() {
        marker.remove();
        markerOriginalPos = null;
        document.getElementById('addFeatureLabel').textContent = 'Ajouter';
        document.getElementById('addFeatureInput').checked = false;
        destroyCroppie();
        jQuery("#featureInformations").hide();
        jQuery("#featureForm")[0].reset();
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
        if (connectedUser) {
            map.addControl(new AddFeatureButtonControl(), 'top-right');
        }
        map.addControl(
            new mapboxgl.NavigationControl({
                options: {
                    showZoom: true
                }
            }), 'top-left');
        map.addControl(new AddFeatureControl(), 'bottom-left');
    }

    function getFeatureCard(feature) {
        const url = feature.properties.url === EMPTY_STRING ? "#" : feature.properties.url;
        let image = feature.properties.image;

        if (!image || image === "#") {
            image = "./images/image_non_trouvee.png";
        }
        return '<a href="' + url + '" target="_blank">' +
            '<img id="cardImage" class="cardImage" src="' + image + '" alt="' + feature.properties.label + '">' +
            '</a>' +
            '<div id="cardContainer" class="container">' +
            '<h4><b>' + feature.properties.label + '</b></h4>' +
            '<p>' + feature.properties.description + '</p>';
    }

    function renderListings(features) {
        let empty = document.createElement('p');
// Clear any existing listings
        listingEl.innerHTML = '';
        if (features.length) {
            features.forEach(function(feature) {
                let prop = feature.properties;
                let html =
                    '<button class="listingHeader">' +
                        prop.label +
                    '</button>' +
                    '<div class="listingDetail" id="listing'+prop.id+'">' +
                    '    <input type="hidden" id="lnglisting'+prop.id+'" value="'+feature.geometry.coordinates[0]+'" />' +
                    '    <input type="hidden" id="latlisting'+prop.id+'" value="'+feature.geometry.coordinates[1]+'" />' +
                         getFeatureCard(feature) +
                    '</div>';
                listingEl.innerHTML += html;
            });

            let acc = document.getElementsByClassName("listingHeader");
            let i;
            for (i = 0; i < acc.length; i++) {
                acc[i].addEventListener("click", function() {
                    /* Toggle between adding and removing the "active" class,
                    to highlight the button that controls the panel */
                    this.classList.toggle("listingActive");

                    /* Toggle between hiding and showing the active panel */
                    let panel = this.nextElementSibling;
                    if (panel.style.display === "block") {
                        panel.style.display = "none";
                    } else {
                        panel.style.display = "block";
                    }
                });
                acc[i].addEventListener("mouseover", function() {
                    let panel = this.nextElementSibling;
                    let lng = jQuery("#lng"+ panel.id).val();
                    let lat = jQuery("#lat"+ panel.id).val();
                    marker.setLngLat([lng, lat]);
                    marker.setOffset([0,-13]);
                    marker.addTo(map);
                });
                acc[i].addEventListener("mouseout", function() {
                    if (!markerOriginalPos) {
                        marker.remove();
                    } else {
                        marker.setLngLat(markerOriginalPos);
                    }
                });
            }
            filterEl.parentNode.style.display = 'block';
        } else if (features.length === 0 && filterEl.value !== '') {
            empty.textContent = 'Aucun résultat';
            listingEl.appendChild(empty);
        } else {
            empty.textContent = 'Déplacer la carte pour obtenir des éléments.';
            listingEl.appendChild(empty);
            filterEl.parentNode.style.display = 'none';
        }
    }

    function normalize(string) {
        return string.trim().toLowerCase();
    }

    function getUniqueFeatures(array, comparatorProperty) {
        let existingFeatureKeys = {};

        return array.filter(function (el) {
            if (existingFeatureKeys[el.properties[comparatorProperty]]) {
                return false;
            } else {
                existingFeatureKeys[el.properties[comparatorProperty]] = true;
                return true;
            }
        });
    }

    function refreshListing() {
        let features = map.queryRenderedFeatures({layers: ['poi-toilet', 'poi-embassy', 'poi-ranger-station']});

        if (features) {
            let uniqueFeatures = getUniqueFeatures(features, 'id');
            renderListings(uniqueFeatures);
            filterEl.value = '';
            features = uniqueFeatures;
        }
    }

    function editFeature() {
        showfeatureInformations();
        return false;
    }

    function showImage() {
        if (feature.properties.image) {
            resetCroppie();
            bindImageToCropper(feature.properties.image);
        }
    }

    function bindImageToCropper(image) {
        jQuery("#labelImportPhoto").hide();
        cropper.croppie('bind', {
            url : image,
            zoom: 1
        });
    }

    function showfeatureInformationsPanel() {
        const featureInformations = document.getElementById("featureInformations");
        featureInformations.style.display = 'block';
    }

    function setFeatureTypeList() {
        Object.keys(featureType).forEach(function (featureProperties) {
            if (featureType.hasOwnProperty(featureProperties)) {
                let type = featureType[featureProperties];
                jQuery("#featureType").append(new Option(getTypeLabel(type.string, "FR-ca"), type.string));
            }
        });
    }

    function setSelectedFeatureType() {
        jQuery("#featureType").val(feature.properties.type);
    }

    function showfeatureInformations() {
        setFeatureTypeList();
        setSelectedFeatureType();
        showfeatureInformationsPanel();

        jQuery("#label").val(feature.properties.label);
        jQuery("#description").val(feature.properties.description);
        jQuery("#url").val(feature.properties.url === "#" ? "" : feature.properties.url);

        setFeatureDetails();

        let lngLat = marker.getLngLat();
        markerOriginalPos = lngLat;
        resetTabs();
        showTab(currentTab); // Display the current tab
    }

    mapboxgl.accessToken = 'pk.eyJ1IjoiYWtoZXJvbiIsImEiOiJjazduNHBvOXIwOHl6M3Bqd2x2ODJqbjE4In0.Jx6amOk7NKh8qcm91Ba8vg';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/akheron/ck7rh7pw12b5c1is1hbldygdh',
        center: [-72.937107, 46.286173],
        zoom: 6.5
    });
    const popup = new mapboxgl.Popup({
        closeButton: false
    });
    popup.on('close', cancelAddFeature);
    const url = "https://m05rcnja4m.execute-api.us-east-2.amazonaws.com/prod/marker";

    const pin = document.createElement('div');
    pin.id = 'marker';

    const marker = new mapboxgl.Marker({
        element: pin,
        draggable: true,
        offset: [0,-13]
    });
    addMapControls();

    map.on('load', function () {
        map.addSource('places', { type: 'geojson', data: url });
        showFeaturesOnMap();
        addAddButton();
        jQuery("#featureInformations").html(featureForm);
        marker.on('dragend', showfeatureInformations);

        map.on('moveend', function() {
            refreshListing();
        });

        Object.keys(featureType).forEach(function (featureProperties) {
            if (featureType.hasOwnProperty(featureProperties)) {
                let icon = featureType[featureProperties].icon;
                map.on('mousemove', 'poi-'+icon, function() {
                    map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', 'poi-'+icon, function() {
                    map.getCanvas().style.cursor = '';
                });
            }
        });

        filterEl.addEventListener('keyup', function(e) {
            let value = normalize(e.target.value);

// Filter visible features that don't match the input value.
            let filtered = features.filter(function(feature) {
                let name = normalize(feature.properties.label);
                return name.indexOf(value) > -1;
            });

// Populate the sidebar with filtered results
            renderListings(filtered);
// Set the filter to populate features into the layer.
            if (filtered.length) {
                Object.keys(featureType).forEach(function (featureProperties) {
                    if (featureType.hasOwnProperty(featureProperties)) {
                        let icon = featureType[featureProperties].icon;
                        map.setFilter('poi-'+icon, [
                            'match',
                            ['get', 'label'],
                            filtered.map(function (feature) {
                                return feature.properties.label;
                            }),
                            true,
                            false
                        ]);
                    }
                });
            }
        });

// Call this function on initialization
// passing an empty array to render an empty state
        renderListings([]);
    });

    function resetTabs() {
        currentTab = 0;
        let i, x = document.getElementsByClassName("tab");
        for (i = 0; i < x.length; i++) {
            x[i].style.display = 'none';
        }
    }

    let currentTab = 0; // Current tab is set to be the first tab (0)

    function showTab(n) {
        // This function will display the specified tab of the form ...
        let x = document.getElementsByClassName("tab");
        x[n].style.display = "block";
        // ... and fix the Previous/Next buttons:
        if (n === 0) {
            document.getElementById("prevBtn").style.display = "none";
        } else {
            document.getElementById("prevBtn").style.display = "inline";
        }
        if (n === (x.length - 1)) {
            jQuery("#importImageButton").show();
            showImage();
            document.getElementById("nextBtn").innerHTML = "&#xf0c7"; // save
        } else {
            jQuery("#importImageButton").hide();
            document.getElementById("nextBtn").innerHTML = "&#xf061"; // next
        }
        // ... and run a function that displays the correct step indicator:
        fixStepIndicator(n)
    }

    function nextPrev(n) {
        // This function will figure out which tab to display
        let x = document.getElementsByClassName("tab");
        // Exit the function if any field in the current tab is invalid:
        if (n === 1 && !validerFeatureForm()) return false;
        // Hide the current tab:
        x[currentTab].style.display = "none";
        // Increase or decrease the current tab by 1:
        currentTab = currentTab + n;
        // if you have reached the end of the form... :
        if (currentTab >= x.length) {
            //...the form gets submitted:
            if (saveFeature()) {
                document.getElementById("nextBtn").innerHTML = "<div class=\"loader\"></div>";
                new Promise(r => setTimeout(r, 2000)).then(function () {
                    cancelAddFeature();
                    resetTabs();
                    return false;
                });
            } else {
                currentTab = currentTab - 1;
                return false;
            }
        } else {
            showTab(currentTab);
        }
    }

    // function validateForm() {
    //     // This function deals with validation of the form fields
    //     let x, y, i, valid = true;
    //     x = document.getElementsByClassName("tab");
    //     y = x[currentTab].getElementsByTagName("input");
    //     // A loop that checks every input field in the current tab:
    //     for (i = 0; i < y.length; i++) {
    //         // If a field is empty...
    //         if (y[i].value === "") {
    //             // add an "invalid" class to the field:
    //             y[i].className += " invalid";
    //             // and set the current valid status to false:
    //             valid = false;
    //         }
    //     }
    //     // If the valid status is true, mark the step as finished and valid:
    //     if (valid) {
    //         document.getElementsByClassName("step")[currentTab].className += " finish";
    //     }
    //     return valid; // return the valid status
    // }

    function fixStepIndicator(n) {
        // This function removes the "active" class of all steps...
        let i, x = document.getElementsByClassName("step");
        for (i = 0; i < x.length; i++) {
            x[i].className = x[i].className.replace(" active", "");
        }
        //... and adds the "active" class to the current step:
        x[n].className += " active";
    }




    const featureForm ='<div class="feature-form-with-image">' +
            '               <div id="result"></div>' +
            '               <div class="feature-form">' +
            '                   <div class="formContent">' +
            '                       <form id="featureForm" action="">' +
            '                           <div class="tab">' +
            '                               <h6>Votre point d\'intérêt</h6>' +
            '                               <select id="featureType" onchange="setFeatureDetails()"></select><br />' +
            '                               <label for="label">Titre</label><span id="error-label"></span>' +
            '                               <input required autofocus id="label" name="label" placeholder="Titre de votre point d\'intérêt" value="" type="text" maxlength="50" /><br />' +
            '                               <label for="description">Description</label><span id="error-description"></span>' +
            '                               <textarea rows="2" required id="description" name="description" placeholder="Courte description" maxlength="140"></textarea><br />' +
            '                               <label for="url">Adresse site web</label><span id="error-url"></span>' +
            '                               <input id="url" name="url" placeholder="http://www.example.com" value="" type="url" width="100px;" ><br />' +
            '                           </div>' +
            '                           <div class="tab">' +
            '                               <div id="details"></div>' +
            '                           </div>' +
            '                           <div class="tab">' +
            '                               <h6 id="labelImportPhoto">Importez une photo de votre choix</h6>' +
            '                               <div id="showImage">' +
            '                                   <img id="cropper" src="" alt="Prévisualisation" style="display:none;" />' +
            '                               </div>' +
            '                           </div>' +
            '                       </form>' +
            '                   </div>' +
            '                   <div>' +
            '                       <div class="stepButtons">' +
            '                           <div>' +
            '                               <button type="button" id="prevBtn" onclick="nextPrev(-1)" class="stepButton">&#xf060</button>' +
            '                           </div>' +
            '                           <div id="importImageButton" style="display:none">' +
            '                               <input id="image" type="file" accept="image/*" onchange="loadImage()">' +
            '                               <label for="image">&#xf574</label>' +
            '                           </div>' +
            '                           <div>' +
            '                               <button type="button" id="nextBtn" onclick="nextPrev(1)" class="stepButton"><span id="saveIcon">&#xf061</span></button>' +
            '                           </div>' +
            '                       </div>' +
            '                       <div class="stepBullets">' +
            '                           <span class="step"></span>' +
            '                           <span class="step"></span>' +
            '                           <span class="step"></span>' +
            '                       </div>' +
            '                   </div>' +
            '               </div>' +
            '           </div>';
</script>