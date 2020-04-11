let features = [];
const NEW_FEATURE_ID = "0";
const EMPTY_STRING_SHARP = "#";
let URL_REGEX;
URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
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

function resetCroppie() {
    destroyCroppie();
    initCroppie();
}

function destroyCroppie() {
    if (cropper && cropper.elements && cropper.elements.boundary) {
        cropper.destroy();
    }
}

function initCroppie() {
    let el = document.getElementById("cropper");
    cropper = new Croppie(el, cropperOptions);
}

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
                        document.getElementById("updateFeature").style.display = "block";
                        document.getElementById("supprimerFeature").style.display = "block";
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
    let details = document.getElementById("details");
    switch (document.getElementById("featureType").value) {
        case featureType.field.string :
            details.innerHTML = fieldDetails;
            let rules = feature.properties['details_fieldRules'];
            document.getElementById("details_fieldRules").value = rules ? rules : "";
            document.getElementById("details_fieldUrban").setAttribute('checked', feature.properties['details_fieldUrban']);
            document.getElementById("details_fieldMeal").setAttribute('checked', feature.properties['details_fieldMeal']);
            break;
        case featureType.event.string :
            details.innerHTML = eventDetails;
            document.getElementById("details_activity").value = feature.properties['details_activity'];
            document.getElementById("details_eventDate").value = feature.properties['details_eventDate'];
            document.getElementById("details_eventDebut").value = feature.properties['details_eventDebut'];
            document.getElementById("details_eventFin").value = feature.properties['details_eventFin'];
            document.getElementById("details_eventCout").value = feature.properties['details_eventCout'];
            break;
        case featureType.team.string :
            details.innerHTML = teamDetails;
            document.getElementById("details_activity").value = feature.properties['details_activity'];
            document.getElementById("details_teamTraining").setAttribute('checked', feature.properties['details_teamTraining']);
            break;
        default:
            details.innerHTML = "Type invalide";
    }
}

function setFeatureDetailsFromForm() {
    let details = feature.properties;
    let featureDetails = document.getElementsByClassName("featureDetailsSelector");
    for (let i = 0; i < featureDetails.length; i++) {
        let uniqueFeatureDetails = document.getElementById(featureDetails[i].id);
        if (uniqueFeatureDetails.type === "checkbox") {
            details[featureDetails[i].id] = uniqueFeatureDetails.checked;
        } else {
            details[featureDetails[i].id] = uniqueFeatureDetails.value;
        }
    }
}

async function setFeaturePropertiesFromForm() {
    feature.properties.type = document.getElementById("featureType").value;
    feature.properties.icon = featureType[feature.properties.type].icon;
    feature.properties.label = document.getElementById("label").value;
    feature.properties.description = document.getElementById("description").value;
    let url = document.getElementById("url").value;
    feature.properties.url = url === "" ? EMPTY_STRING_SHARP : url;
    feature.properties.owner = joomlaUserId;
    setFeatureDetailsFromForm();

    if (!feature.geometry.coordinates) {
        let lngLat = marker.getLngLat();
        feature.geometry.coordinates = [lngLat.lng, lngLat.lat];
    }
    if (cropper) {
        feature.properties.image = await cropper.result();
    } else {
        feature.properties.image = EMPTY_STRING_SHARP;
    }
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

    if (!document.getElementById("label").value) {
        document.getElementById('error-label').innerHTML = " Requis! *";
        document.getElementById('label').className += ' invalid';
        success = false;
    }

    if (!document.getElementById("description").value) {
        document.getElementById('error-description').innerHTML = " Requis! *";
        document.getElementById('description').className += ' invalid';
        success = false;
    }

    let url = document.getElementById("url").value;
    if (url && !isUrlValid(url)) {
        document.getElementById('error-url').innerHTML = " Invalide *";
        document.getElementById('url').className += ' invalid';
        success = false;
    }

    return success;
}

async function saveFeature() {
    if (!validerFeatureForm()) {
        return false;
    }
    await setFeaturePropertiesFromForm();
    if (feature.properties.id === NEW_FEATURE_ID) {
        await insertFeature();
    } else {
        await updateFeature();
    }
    resetFeature();
    return false;
}

async function insertFeature() {
    feature.properties.id = uuidv4();
    await persistFeature('POST');
    popup.remove();
    removeMarker();
}

async function updateFeature() {
    await persistFeature('PUT');
    popup.remove();
}

function deleteFeature() {
    if (confirm("Êtes-vous sur de vouloir supprimer votre point d'intérêt ?")) {
        persistFeature('DELETE').then(function() {
            resetFeature();
            popup.remove();
        });
    }
    return false;
}

function startLoadingSpinner() {
    document.getElementById("nextBtn").innerHTML = "<div class=\"loader\"></div>";
}

async function persistFeature(method) {
    startLoadingSpinner();
    await jQuery.ajax({
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
    map.getSource('places').setData(url);
    renderListings([]);
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
    resetFeature();
    const addFeatureLabel = document.getElementById('addFeatureLabel');
    if (addFeatureLabel) { addFeatureLabel.textContent = 'Ajouter'; }
    const addFeatureInput = document.getElementById('addFeatureInput');
    if (addFeatureInput) { addFeatureInput.checked = false; }
}

function resetFeature() {
    destroyCroppie();
    removeMarker();
    feature = jQuery.extend({}, defaultFeature);
    document.getElementById("featureInformations").style.display = "none";
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
    document.getElementById("featureUrl" + id).setAttribute("href", feature.properties.url);
    let imageElement = document.getElementById("cardImage" + id);
    if (feature.properties.image && feature.properties.image !== EMPTY_STRING_SHARP) {
        imageElement.setAttribute("src", feature.properties.image);
    } else {
        imageElement.setAttribute("src","./images/image_non_trouvee.png");
    }
    imageElement.setAttribute("alt", feature.properties.label);
    document.getElementById("featureLabel" + id).innerHTML = feature.properties.label;
    document.getElementById("featureDescription" + id).innerHTML = feature.properties.description;
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
                let lng = document.getElementById("lng"+ panel.id).value;
                let lat = document.getElementById("lat"+ panel.id).value;
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
    if (feature.properties.image && feature.properties.image !== EMPTY_STRING_SHARP) {
        bindImageToCropper();
    }
}

function bindImageToCropper() {
    document.getElementById("labelImportPhoto").style.display = "none";
    resetCroppie();
    cropper.bind({
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
            document.getElementById("featureType").appendChild(new Option(getTypeLabel(type.string, "FR-ca"), type.string));
        }
    });
}

function setSelectedFeatureType() {
    document.getElementById("featureType").value = feature.properties.type;
}

function showfeatureInformations() {
    setSelectedFeatureType();
    showfeatureInformationsPanel();

    document.getElementById("label").value = feature.properties.label;
    document.getElementById("description").value = feature.properties.description;
    document.getElementById("url").value = feature.properties.url === EMPTY_STRING_SHARP ? "" : feature.properties.url;

    setFeatureDetails();

    markerOriginalPos = marker.getLngLat();
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
        document.getElementById("importImageButton").style.display = 'block'
        showImage();
        document.getElementById("nextBtn").innerHTML = "&#xf0c7"; // save
    } else {
        document.getElementById("importImageButton").style.display = 'none';
        document.getElementById("nextBtn").innerHTML = "&#xf061"; // next
    }
    // ... and run a function that displays the correct step indicator:
    fixStepIndicator(n)
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function nextPrev(n) {
    // This function will figure out which tab to display
    let x = document.getElementsByClassName("tab");
    // Exit the function if any field in the current tab is invalid:
    if (n === 1 && !validerFeatureForm()) return false;
    // Increase or decrease the current tab by 1:
    currentTab = currentTab + n;
    // if you have reached the end of the form... :
    if (currentTab >= x.length) {
        //...the form gets submitted:
        let isSaved = await saveFeature();
        if (isSaved) {
            await timeout(3000);
            cancelAddFeature();
            resetTabs();
            x[currentTab-n].style.display = "none";
            return false;
        } else {
            currentTab = currentTab - 1;
            x[currentTab-n].style.display = "none";
            return false;
        }
    } else {
        x[currentTab-n].style.display = "none";
        showTab(currentTab);
    }
    return false;
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

function executeBlueForceTracker() {
    map.on('load', function () {
        addMapControls();
        setOnClosePopup();
        map.addSource('places', {type: 'geojson', data: url});
        showFeaturesOnMap();
        addAddButton();
        document.getElementById("featureInformations").innerHTML = featureForm;
        setFeatureTypeList();
        marker.on('dragend', showfeatureInformations);
        generateFeatureMouseOver();
        activateFeatureList();
    });
}