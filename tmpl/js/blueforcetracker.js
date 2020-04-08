let features = [];
const NEW_FEATURE_ID = "0";
const EMPTY_STRING_SHARP = "#";
const URL_REGEX = /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
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
        id: NEW_FEATURE_ID,
        type: "field",
        icon: "ranger-station",
        label: "",
        description: "",
        url: "",
        image: "",
        owner:"",
    },
    geometry: {
        type: "Point"
    }
};
let cropper;
const cropperOptions = {
    viewport: {
        width: 200,
        height: 200
    },
    boundary: {width: 290, height: 200},
};

const cropperResultOptions = {
    type: 'base64',
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

                    // Ensure that if the map is zoomed out such that multiple
                    // copies of the feature are visible, the popup appears
                    // over the copy being pointed to.
                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }

                    popup.setLngLat(coordinates)
                        .setHTML(featureCard)
                        .addTo(map);
                    setFeatureCardInformation(feature);
                    const userID = feature.properties.owner;
                    if (userID === joomlaUserId) {
                        jQuery("#updateFeature").show();
                        jQuery("#supprimerFeature").show();
                    }
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

function setFeatureDetails() {
    let details = jQuery("#details");
    switch (jQuery('#featureType').val()) {
        case featureType.field.string :
            details.html(fieldDetails);
            jQuery("#details_fieldRules").val(feature.properties['details_fieldRules']);
            jQuery("#details_fieldUrban").prop('checked', feature.properties['details_fieldUrban']);
            jQuery("#details_fieldMeal").prop('checked', feature.properties['details_fieldMeal']);
            break;
        case featureType.event.string :
            details.html(eventDetails);
            jQuery("#details_activity").val(feature.properties['details_activity']);
            jQuery("#details_eventDate").val(feature.properties['details_eventDate']);
            jQuery("#details_eventDebut").val(feature.properties['details_eventDebut']);
            jQuery("#details_eventFin").val(feature.properties['details_eventFin']);
            jQuery("#details_eventCout").val(feature.properties['details_eventCout']);
            break;
        case featureType.team.string :
            details.html(teamDetails);
            jQuery("#details_activity").val(feature.properties['details_activity']);
            jQuery("#details_teamTraining").prop('checked', feature.properties['details_teamTraining']);
            break;
        default:
            details.html("Type invalide");
    }
}

function setFeatureDetailsFromForm() {
    let details = feature.properties;
    let featureDetails = document.getElementsByClassName("featureDetailsSelector");
    for (let i = 0; i < featureDetails.length; i++) {
        let uniqueFeatureDetails = jQuery("#"+featureDetails[i].id);
        if (uniqueFeatureDetails.is("input[type=checkbox]")) {
            details[featureDetails[i].id] = uniqueFeatureDetails.is(":checked");
        } else {
            details[featureDetails[i].id] = uniqueFeatureDetails.val();
        }
    }
}

function setFeaturePropertiesFromForm() {
    return new Promise(resolve => {
        feature.properties.type = jQuery("#featureType").val();
        feature.properties.icon = featureType[feature.properties.type].icon;
        feature.properties.label = jQuery("#label").val();
        feature.properties.description = jQuery("#description").val();
        let url = jQuery("#url").val();
        feature.properties.url = url === "" ? EMPTY_STRING_SHARP : url;
        feature.properties.owner = joomlaUserId;
        setFeatureDetailsFromForm();

        if (!feature.geometry.coordinates) {
            let lngLat = marker.getLngLat();
            feature.geometry.coordinates = [lngLat.lng, lngLat.lat];
        }
        if (cropper) {
            cropper.croppie('result', {
                type: 'canvas',
                size: 'viewport',
                resultSize: {
                    width: 200,
                    height: 200
                }
            }).then(function (resp) {
                feature.properties.image = resp;
                resolve();
            });
        } else {
            feature.properties.image = EMPTY_STRING_SHARP;
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
    return new Promise(resolve => {
        if (!validerFeatureForm()) {
            resolve(false);
        }
        setFeaturePropertiesFromForm().then(function () {
            if (feature.properties.id === NEW_FEATURE_ID) {
                insertFeature();
            } else {
                updateFeature();
            }
            resolve(false)
        });
    });
}

function insertFeature() {
    feature.properties.id = uuidv4();
    persistFeature('POST', function() {
        popup.remove();
        removeMarker();
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

function startLoadingSpinner() {
    document.getElementById("nextBtn").innerHTML = "<div class=\"loader\"></div>";
}

async function persistFeature(method, callback) {
    startLoadingSpinner();
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
        resetFeature();
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
    feature.properties.id = NEW_FEATURE_ID;
    addMarkerToMapsCenter();
    document.getElementById('addFeatureLabel').textContent =  'Annuler';
}

function addMarkerToMapsCenter() {
    let centerScreenCoordinates = map.getBounds().getCenter();
    marker.setLngLat(centerScreenCoordinates);
    marker.addTo(map);
    markerOriginalPos = centerScreenCoordinates;
}

function cancelAddFeature() {
    const addFeatureLabel = document.getElementById('addFeatureLabel');
    if (addFeatureLabel) { addFeatureLabel.textContent = 'Ajouter'; }
    const addFeatureInput = document.getElementById('addFeatureInput');
    if (addFeatureInput) { addFeatureInput.checked = false; }
    resetFeature();
}

function resetFeature() {
    removeMarker();
    feature = jQuery.extend({}, defaultFeature);
    destroyCroppie();
    jQuery("#featureInformations").hide();
    document.getElementById('featureForm').reset();
}

function removeMarker() {
    marker.remove();
    markerOriginalPos = null;
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

function setFeatureCardInformation(feature, featureId) {
    let id = featureId ? featureId : "";
    jQuery("#featureUrl" + id).prop("href", feature.properties.url);
    console.log(feature.properties.image);
    let imageElement = jQuery("#cardImage" + id);
    if (feature.properties.image && feature.properties.image !== EMPTY_STRING_SHARP && feature.properties.image !== "data:,") {
        imageElement.prop("src", feature.properties.image);
    } else {
        imageElement.prop("src","./images/image_non_trouvee.png");
    }
    imageElement.prop("alt", feature.properties.label);
    jQuery("#featureLabel" + id).html(feature.properties.label);
    jQuery("#featureDescription" + id).html(feature.properties.description);
}

function getUniqueFeatureCardInformations(id) {
    let uniqueCard = featureCardInformations.replace("featureUrl", "featureUrl" + id);
    uniqueCard = uniqueCard.replace("cardImage", "cardImage" + id);
    uniqueCard = uniqueCard.replace("cardContainer", "cardContainer" + id);
    uniqueCard = uniqueCard.replace("featureLabel", "featureLabel" + id);
    return uniqueCard.replace("featureDescription", "featureDescription" + id);
}

function renderListings(features) {
    const filterEl = document.getElementById('feature-filter');
    const listingEl = document.getElementById('feature-listing');
    const empty = document.createElement('p');
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
                getUniqueFeatureCardInformations(prop.id) +
                '</div>';
            listingEl.innerHTML += html;
            setFeatureCardInformation(feature, prop.id);
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
                    removeMarker();
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
    const filterEl = document.getElementById('feature-filter');
    let renderedFeatures = map.queryRenderedFeatures({layers: ['poi-toilet', 'poi-embassy', 'poi-ranger-station']});

    if (features) {
        let uniqueFeatures = getUniqueFeatures(renderedFeatures, 'id');
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
    if (feature.properties.image && feature.properties.image !== EMPTY_STRING_SHARP && feature.properties.image !== "data:,") {
        bindImageToCropper();
    }
}

function bindImageToCropper() {
    jQuery("#labelImportPhoto").hide();
    resetCroppie();
    cropper.croppie('bind', {
        url : feature.properties.image,
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
    setSelectedFeatureType();
    showfeatureInformationsPanel();

    jQuery("#label").val(feature.properties.label);
    jQuery("#description").val(feature.properties.description);
    jQuery("#url").val(feature.properties.url === EMPTY_STRING_SHARP ? "" : feature.properties.url);

    setFeatureDetails();

    let lngLat = marker.getLngLat();
    markerOriginalPos = lngLat;
    resetTabs();
    showTab(currentTab); // Display the current tab
}

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
    // Increase or decrease the current tab by 1:
    currentTab = currentTab + n;
    // if you have reached the end of the form... :
    if (currentTab >= x.length) {
        //...the form gets submitted:
        saveFeature().then(isSaved => {
            if (isSaved) {
                new Promise(r => setTimeout(r, 2000)).then(function () {
                    cancelAddFeature();
                    resetTabs();
                    x[currentTab-n].style.display = "none";
                    return false;
                });
            } else {
                currentTab = currentTab - 1;
                x[currentTab-n].style.display = "none";
                return false;
            }
        });
    } else {
        x[currentTab-n].style.display = "none";
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

function activateFeatureList() {
    const filterEl = document.getElementById('feature-filter');

    map.on('moveend', function () {
        refreshListing();
    });
    filterEl.addEventListener('keyup', function (e) {
        let value = normalize(e.target.value);

        let filtered = features.filter(function (feature) {
            let name = normalize(feature.properties.label);
            return name.indexOf(value) > -1;
        });

        renderListings(filtered);

        if (filtered.length) {
            Object.keys(featureType).forEach(function (featureProperties) {
                if (featureType.hasOwnProperty(featureProperties)) {
                    let icon = featureType[featureProperties].icon;
                    map.setFilter('poi-' + icon, [
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
    renderListings([]);
}

function generateFeatureMouseOver() {
    Object.keys(featureType).forEach(function (featureProperties) {
        if (featureType.hasOwnProperty(featureProperties)) {
            let icon = featureType[featureProperties].icon;
            map.on('mousemove', 'poi-' + icon, function () {
                map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', 'poi-' + icon, function () {
                map.getCanvas().style.cursor = '';
            });
        }
    });
}

mapboxgl.accessToken = 'pk.eyJ1IjoiYWtoZXJvbiIsImEiOiJjazduNHBvOXIwOHl6M3Bqd2x2ODJqbjE4In0.Jx6amOk7NKh8qcm91Ba8vg';
const popup = new mapboxgl.Popup({
    closeButton: false
});
function setOnClosePopup() {
    popup.on('close', cancelAddFeature);
}
const pin = document.createElement('div');
pin.id = 'marker';
const marker = new mapboxgl.Marker({
    element: pin,
    draggable: true,
    offset: [0,-13]
});
const url = "https://m05rcnja4m.execute-api.us-east-2.amazonaws.com/prod/marker";

function activateBlueForceTracker() {
    map.on('load', function () {
        addMapControls();
        setOnClosePopup();
        map.addSource('places', {type: 'geojson', data: url});
        showFeaturesOnMap();
        addAddButton();
        jQuery("#featureInformations").html(featureForm);
        setFeatureTypeList();
        marker.on('dragend', showfeatureInformations);
        generateFeatureMouseOver();
        activateFeatureList();
    });
}