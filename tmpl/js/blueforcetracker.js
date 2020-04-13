let features = [];
const NEW_FEATURE_ID = "0";
const EMPTY_STRING_SHARP = "#";
const HTTP_SUCCESS_CODE = "200";
const INVALID_FIELD_BG = "invalid";
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
            const layerID = "poi-" + symbol;
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
                map.on('mouseenter', layerID, function () {
                    map.getCanvas().style.cursor = 'pointer';
                });

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
            setInputValue("details_fieldRules");
            setCheckboxValue('details_fieldUrban');
            setCheckboxValue('details_fieldMeal');
            break;
        case featureType.event.string :
            details.innerHTML = eventDetails;
            setInputValue("details_activity");
            setInputValue("details_eventDate");
            setInputValue("details_eventDebut");
            setInputValue("details_eventFin");
            setInputValue("details_eventCout");
            break;
        case featureType.team.string :
            details.innerHTML = teamDetails;
            setInputValue("details_activity");
            setCheckboxValue('details_teamTraining');
            break;
        default:
            details.innerHTML = "Type invalide";
    }
}

function setInputValue(elementId) {
    document.getElementById(elementId).value = feature.properties[elementId] ? feature.properties[elementId] : "";
}

function setCheckboxValue(elementId) {
    if (feature.properties[elementId]) {
        document.getElementById(elementId).setAttribute('checked', 'true');
    } else {
        document.getElementById(elementId).removeAttribute('checked');
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
    if (cropper && cropper.elements && cropper.elements.preview) {
        feature.properties.image = await cropper.result();
    } else {
        feature.properties.image = EMPTY_STRING_SHARP;
    }
}

function isUrlValid(url) {
    return URL_REGEX.test(url);
}

function clearErrorMessage() {
    clearError('error-label');
    clearError('error-description');
    clearError('error-url');

    clearError('error-details_fieldRules');

    clearError('error-details_activity');

    clearError('error-details_eventDate');
    clearError('error-details_eventDebut');
    clearError('error-details_eventFin');
    clearError('error-details_eventCout');

    clearError('error-image');
}

function clearError(id) {
    let error = document.getElementById(id);
    if (error) {
        document.getElementById(id).innerHTML = ""
        document.getElementById(id).classList.remove(INVALID_FIELD_BG);
    }
}

function validerFeatureForm(tab) {
    clearErrorMessage();

    if (tab.id === "basicInformations") {
        return validateBasicInformation();
    } else if (tab.id === "detailInformations") {
        return validateDetailInformation();
    } else if (tab.id === "imageInformations") {
        return validateImageInformation();
    }
    return true;
}

function validateImageInformation() {
    return true;
}

function validateDetailInformation() {
    let success = true;

    switch (document.getElementById("featureType").value) {
        case featureType.field.string :
            success = validateFieldNotEmpty("details_fieldRules");
            break;
        case featureType.event.string :
            success = validateFieldNotEmpty("details_activity");
            success = validateFieldNotEmpty("details_eventDate") && success;
            success = validateFieldNotEmpty("details_eventDebut") && success;
            success = validateFieldNotEmpty("details_eventFin") && success;
            success = validateFieldNotEmpty("details_eventCout") && success;

            break;
        case featureType.team.string :
            success = validateFieldNotEmpty("details_activity");
            break;
    }
    return success;
}

function validateFieldNotEmpty(id) {
    if (!document.getElementById(id).value) {
        document.getElementById('error-'+id).innerHTML = " Requis! *";
        document.getElementById(id).classList.add(INVALID_FIELD_BG);
        return false;
    }
    return true;
}


function validateBasicInformation() {
    let success = true;
    if (!document.getElementById("label").value) {
        document.getElementById('error-label').innerHTML = " Requis! *";
        document.getElementById('label').classList.add(INVALID_FIELD_BG);
        success = false;
    }

    if (!document.getElementById("description").value) {
        document.getElementById('error-description').innerHTML = " Requis! *";
        document.getElementById('description').classList.add(INVALID_FIELD_BG);
        success = false;
    }

    let url = document.getElementById("url").value;
    if (url && !isUrlValid(url)) {
        document.getElementById('error-url').innerHTML = " Invalide *";
        document.getElementById('url').classList.add(INVALID_FIELD_BG);
        success = false;
    }
    return success;
}

async function saveFeature() {
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
    resetFeature();
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
    let returnedCode = await jQuery.ajax({
        method: "POST",
        url: urlPost,
        data: {
            data:JSON.stringify(method === "DELETE" ? {id:feature.properties.id} : feature),
            method: method,
        },
    });
    if (returnedCode !== HTTP_SUCCESS_CODE) {
        console.log("HTTP REQUEST CODE : " + returnedCode);
    } else {
        map.getSource('places').setData(urlFeature);
        renderListings([]);
    }
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
    feature = jQuery.extend(true, {}, defaultFeature);
    feature.properties.id = NEW_FEATURE_ID;
    addMarkerToMapsCenter();
    document.getElementById('addFeatureLabel').textContent =  'Annuler';
    showfeatureInformations();
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
    feature = jQuery.extend(true, {}, defaultFeature);
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
    let url = document.getElementById("featureUrl" + id);
    let imageElement = document.getElementById("cardImage" + id);

    if (feature.properties.url === EMPTY_STRING_SHARP) {
        let avatar = document.getElementById("cardAvatar" + id);
        avatar.replaceChild(imageElement, url);
    } else {
        url.setAttribute("href", feature.properties.url);
    }
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
    uniqueCard = uniqueCard.replace("cardAvatar", "cardAvatar" + id);
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
    clearErrorMessage();
    setSelectedFeatureType();
    showfeatureInformationsPanel();

    setInputValue("label");
    setInputValue("description");
    if (feature.properties.url === EMPTY_STRING_SHARP) {
        feature.properties.url = "";
    }
    setInputValue("url");

    setFeatureDetails();

    markerOriginalPos = marker.getLngLat();
    resetTabs();
    showTab(currentTab);
}

function resetTabs() {
    currentTab = 0;
    let i, x = document.getElementsByClassName("tab");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = 'none';
    }
}

let currentTab = 0;

function showTab(n) {
    let x = document.getElementsByClassName("tab");
    x[n].style.display = "block";

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
    fixStepIndicator(n)
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function nextPrev(n) {
    let x = document.getElementsByClassName("tab");
    if (n === 1 && !validerFeatureForm(x[currentTab])) return false;
    currentTab = currentTab + n;
    if (currentTab >= x.length) {
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

function fixStepIndicator(n) {
    let i, x = document.getElementsByClassName("step");
    for (i = 0; i < x.length; i++) {
        x[i].className = x[i].className.replace(" active", "");
    }
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

function executeBlueForceTracker() {
    map.on('load', function () {
        addMapControls();
        setOnClosePopup();
        map.addSource('places', {type: 'geojson', data: urlFeature});
        showFeaturesOnMap();
        addAddButton();
        document.getElementById("featureInformations").innerHTML = featureForm;
        setFeatureTypeList();
        marker.on('dragend', showfeatureInformations);
        generateFeatureMouseOver();
        activateFeatureList();
    });
}