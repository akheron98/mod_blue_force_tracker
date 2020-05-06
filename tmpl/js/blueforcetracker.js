let features = [];
let stats = {};
const NEW_FEATURE_ID = "0";
const EMPTY_STRING_SHARP = "#";
const HTTP_SUCCESS_CODE = "200";
const INVALID_FIELD_BG = "bft-invalid";
let cardSide = "RECTO";
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
    },
    shop : {
        icon : 'grocery',
        string : "shop"
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

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

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
    let el = document.getElementById("bft-cropper");
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
        case  featureType.shop.string :
            return language === "FR-ca" ? "Boutique" : "Shop";
        default:
            return language === "FR-ca" ? "Type introuvable!" : "Type not found";
    }
}

function showStats() {
    let stats = document.getElementById('bft-featuresStats');
    Object.keys(featureType).forEach(function (featureProperties) {
        if (featureType.hasOwnProperty(featureProperties)) {
            let statContainer = document.createElement("div");
            statContainer.className = "bft-statContainer col-xl";
            let statTitle = document.createElement("h2");
            statTitle.innerText = getTypeLabel(featureProperties, "FR-ca") + "s";
            let statValue = document.createElement("h2");
            statValue.id = "bft-stat_" + featureProperties;
            statValue.innerText = "0";
            statContainer.appendChild(statTitle);
            statContainer.appendChild(statValue);
            stats.appendChild(statContainer);
        }
    });
}

function showFeaturesOnMap() {
    Object.keys(featureType).forEach(function (featureProperties) {
        if (featureType.hasOwnProperty(featureProperties)) {
            const symbol = featureType[featureProperties].icon;
            const layerID = "bft-poi-" + symbol;
            if (!map.getLayer(layerID)) {
                map.addLayer({
                    'id': layerID,
                    'type': 'symbol',
                    'source': 'places',
                    'layout': {
                        'icon-image': symbol + '-15',
                        'icon-allow-overlap': true,
                    },
                    'filter': ['==', 'icon', symbol]
                });
                let filterGroup = document.getElementById('bft-filter-group');
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

                map.on('click', layerID, function (e) {
                    popup.remove();
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
                    document.getElementById('bft-showMoreInfo').addEventListener('click', e => {
                        e.preventDefault();
                        let cardContent = document.getElementById("bft-cardContent");
                        if (cardSide === "VERSO") {
                            cardContent.innerHTML = featureCardInformations;
                            setFeatureCardInformation(feature);
                            document.getElementById('bft-flipArrow').className = "fas fa-chevron-circle-right";
                            cardSide = "RECTO";
                        } else {
                            cardContent.innerHTML = featureCardDetails;
                            setFeatureCardDetailsInformations();
                            document.getElementById('bft-flipArrow').className = "fas fa-chevron-circle-left";
                            cardSide = "VERSO";
                        }
                        return false;
                    });
                    setFeatureCardInformation(feature);
                    let userNameSpace = document.getElementById("bft-userName");
                    if (userNameSpace) {
                        fetch(urlGetUser+"?uid="+feature.properties.owner).then(response => {
                            response.text().then(username => {
                                if (username) {
                                    userNameSpace.innerText = "Créé par " + username;
                                }
                            });
                        })
                    }
                    const userID = feature.properties.owner;
                    if (userID === joomlaUserId || isAdmin) {
                        document.getElementById("bft-updateFeature").style.display = "block";
                        document.getElementById("bft-supprimerFeature").style.display = "block";
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
    let toggleFilterGroup = document.getElementById('bft-toggle-filter-group');
    let container = document.createElement("div");
    container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
    let button = document.createElement("button");
    button.className = "mapboxgl-ctrl-icon bft-toggle-filter-group-button";
    button.setAttribute("type", "button");
    button.addEventListener('click', function (e) {
        e.preventDefault();
        let filterGroup = document.getElementById('bft-filter-group');
        let buttonIcon = document.getElementById('bft-toggle-filter-group-button-icon');
        if (!filterGroup.style.width || filterGroup.style.width === "0" || filterGroup.style.width === "0px") {
            filterGroup.style.width = "130px";
            buttonIcon.className = "fas fa-angle-double-right bft-toggle-icon";
        } else {
            filterGroup.style.width = "0";
            buttonIcon.className = "fas fa-angle-double-left bft-toggle-icon";
        }
    });
    let label = document.createElement("i");
    label.id = "bft-toggle-filter-group-button-icon";
    label.className = "fas fa-angle-double-left bft-toggle-icon";
    button.appendChild(label);
    container.appendChild(button);
    toggleFilterGroup.appendChild(container);

}

function loadImage() {
    let image = document.getElementById("bft-image");
    if (image) {
        let oFReader = new FileReader();
        oFReader.readAsDataURL(image.files[0]);
        oFReader.onload = function () {
            feature.properties.image = oFReader.result;
            showImage();
        };
    }
}

function setFeatureCardDetailsInformations() {
    let details = document.getElementById("bft-featureCardDetailInformations");

    switch (feature.properties.type) {
        case featureType.field.string :
            details.innerHTML = featureCardDetails_field;
            setInputDetailValue("bft-card_details_fieldRules");
            setCheckboxDetailValue('bft-card_details_fieldUrban');
            setCheckboxDetailValue('bft-card_details_fieldMeal');
            break;
        case featureType.event.string :
            details.innerHTML = featureCardDetails_event;
            setInputDetailValue("bft-card_details_eventDate");
            setInputDetailValue("bft-card_details_eventDebut");
            setInputDetailValue("bft-card_details_eventFin");
            setInputDetailValue("bft-card_details_eventCout");
            break;
        case featureType.team.string :
            details.innerHTML = featureCardDetails_team;
            setCheckboxDetailValue('bft-card_details_teamTraining');
            break;
        case featureType.shop.string :
            details.innerHTML = featureCardDetails_shop;
            setInputDetailValue("bft-card_details_shopHours");
            break;
        default:
            details.innerHTML = "Type invalide";
    }
    setMultipleInputDetailValue("bft-card_details_activity");
}

function setCheckboxDetailValue(elementId) {
    let id = elementId.replace("bft-card_","");
    if (feature.properties[id]) {
        document.getElementById(elementId).innerText = 'Oui';
    } else {
        document.getElementById(elementId).innerText = 'Non';
    }
}

function setInputDetailValue(elementId) {
    let id = elementId.replace("bft-card_","");
    document.getElementById(elementId).innerText = feature.properties[id] ? feature.properties[id] : "";
}

function setMultipleInputDetailValue(elementId) {
    const property = elementId.replace("bft-card_","");
    const elementValues = feature.properties[property];
    let items = elementValues;
    if (elementValues && elementValues.includes("[") && elementValues.includes("]")) {
        items = JSON.parse(elementValues);
    }
    let text = "";
    if (items && Array.isArray(items)) {
        items.map((item, index) => {
            text = text + item.capitalize() + separator(items.length, index);
        });
    } else if (items) {
        text = items.capitalize() + " seulement.";
    } else {
        text = "Non défini";
    }
    document.getElementById(elementId).innerText = text;
}

function separator(size, index) {
    if (size === 1) {
        return " seulement.";
    }
    if (size - 1 === index) {
        return "";
    }
    if (size - 2 === index) {
        return " et ";
    }
    return ", ";
}

function setFeatureDetails() {
    let details = document.getElementById("bft-details");
    switch (document.getElementById("bft-featureType").value) {
        case featureType.field.string :
            details.innerHTML = fieldDetails;
            setInputValue("bft-details_fieldRules");
            setCheckboxValue('bft-details_fieldUrban');
            setCheckboxValue('bft-details_fieldMeal');
            break;
        case featureType.event.string :
            details.innerHTML = eventDetails;
            setInputValue("bft-details_eventDate");
            setInputValue("bft-details_eventDebut");
            setInputValue("bft-details_eventFin");
            setInputValue("bft-details_eventCout");
            break;
        case featureType.team.string :
            details.innerHTML = teamDetails;
            setCheckboxValue('bft-details_teamTraining');
            break;
        case featureType.shop.string :
            details.innerHTML = shopDetails;
            setInputValue("bft-details_shopHours");
            break;
        default:
            details.innerHTML = "Type invalide";
    }
    setMultipleInputValue("bft-details_activity");
}

function setInputValue(elementId) {
    let property = elementId.replace("bft-","");
    document.getElementById(elementId).value = feature.properties[property] ? feature.properties[property] : "";
}

function setCheckboxValue(elementId) {
    let property = elementId.replace("bft-","");
    if (feature.properties[property]) {
        document.getElementById(elementId).setAttribute('checked', 'true');
    } else {
        document.getElementById(elementId).removeAttribute('checked');
    }
}

function setMultipleInputValue(elementId) {
    let options = Array.from(document.querySelectorAll('#'+elementId+' option'));
    let property = elementId.replace("bft-","");
    let elementValues = feature.properties[property];
    if (elementValues && elementValues.includes("[") && elementValues.includes("]")) {
        let items = JSON.parse(elementValues);
        items.forEach(function(v) {
            options.find(c => c.value === v).selected = true;
        });
    } else if (elementValues) {
        options.find(c => c.value === elementValues).selected = true;
    }
}

function setFeatureDetailsFromForm() {
    let details = feature.properties;
    let featureDetails = document.getElementsByClassName("bft-featureDetailsSelector");
    for (let i = 0; i < featureDetails.length; i++) {
        let uniqueFeatureDetails = document.getElementById(featureDetails[i].id);
        let itemId = featureDetails[i].id.replace("bft-","");
        if (uniqueFeatureDetails.type === "checkbox") {
            details[itemId] = uniqueFeatureDetails.checked;
        } else if (uniqueFeatureDetails.type === "select-multiple") {
            const selected = document.querySelectorAll('#'+featureDetails[i].id+' option:checked');
            details[itemId] = Array.from(selected).map(el => el.value);
        } else {
            details[itemId] = uniqueFeatureDetails.value;
        }
    }
}

async function setFeaturePropertiesFromForm() {
    feature.properties.type = document.getElementById("bft-featureType").value;
    feature.properties.icon = featureType[feature.properties.type].icon;
    feature.properties.label = document.getElementById("bft-label").value;
    feature.properties.description = document.getElementById("bft-description").value;
    let url = document.getElementById("bft-url").value;
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
    clearError('bft-error-label');
    clearError('bft-error-description');
    clearError('bft-error-url');

    clearError('bft-error-details_fieldRules');

    clearError('bft-error-details_activity');

    clearError('bft-error-details_eventDate');
    clearError('bft-error-details_eventDebut');
    clearError('bft-error-details_eventFin');
    clearError('bft-error-details_eventCout');

    clearError('bft-error-image');
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

    if (tab.id === "bft-basicInformations") {
        return validateBasicInformation();
    } else if (tab.id === "bft-detailInformations") {
        return validateDetailInformation();
    } else if (tab.id === "bft-imageInformations") {
        return validateImageInformation();
    }
    return true;
}

function validateImageInformation() {
    return true;
}

function validateDetailInformation() {
    let success = true;

    switch (document.getElementById("bft-featureType").value) {
        case featureType.field.string :
            success = validateFieldNotEmpty("bft-details_fieldRules");
            break;
        case featureType.event.string :
            success = validateFieldNotEmpty("bft-details_activity");
            success = validateFieldNotEmpty("bft-details_eventDate") && success;
            success = validateFieldNotEmpty("bft-details_eventDebut") && success;
            success = validateFieldNotEmpty("bft-details_eventFin") && success;
            success = validateFieldNotEmpty("bft-details_eventCout") && success;

            break;
        case featureType.team.string :
            success = validateFieldNotEmpty("bft-details_activity");
            break;
        case featureType.shop.string :
            success = validateFieldNotEmpty("bft-details_shopHours");
            break;
    }
    return success;
}

function validateFieldNotEmpty(id) {
    if (!document.getElementById(id).value) {
        document.getElementById('bft-error-'+id).innerHTML = " Requis! *";
        document.getElementById(id).classList.add(INVALID_FIELD_BG);
        return false;
    }
    return true;
}


function validateBasicInformation() {
    let success = true;
    if (!document.getElementById("bft-label").value) {
        document.getElementById('bft-error-label').innerHTML = " Requis! *";
        document.getElementById('bft-label').classList.add(INVALID_FIELD_BG);
        success = false;
    }

    if (!document.getElementById("bft-description").value) {
        document.getElementById('bft-error-description').innerHTML = " Requis! *";
        document.getElementById('bft-description').classList.add(INVALID_FIELD_BG);
        success = false;
    }

    let url = document.getElementById("bft-url").value;
    if (url && !isUrlValid(url)) {
        document.getElementById('bft-error-url').innerHTML = " Invalide *";
        document.getElementById('bft-url').classList.add(INVALID_FIELD_BG);
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
    document.getElementById("bft-nextBtn").innerHTML = "<div class=\"bft-loader\"></div>";
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
    if (connectedUser && hasAddAccess) {
        let filterGroup = document.getElementById('bft-filter-group');
        let addGroup = document.createElement('div');
        addGroup.className = 'bft-add-group';
        addGroup.id = 'bft-add-group';
        let input = document.createElement('input');
        input.type = 'checkbox';
        input.id = 'bft-addFeatureInput';
        input.checked = false;
        addGroup.appendChild(input);

        let label = document.createElement('label');
        label.setAttribute('for', 'bft-addFeatureInput');
        label.setAttribute('id', 'bft-addFeatureLabel');
        label.textContent = 'Ajouter';
        addGroup.appendChild(label);
        filterGroup.appendChild(addGroup);

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
    document.getElementById('bft-addFeatureLabel').textContent =  'Annuler';
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
    const addFeatureLabel = document.getElementById('bft-addFeatureLabel');
    if (addFeatureLabel) { addFeatureLabel.textContent = 'Ajouter'; }
    const addFeatureInput = document.getElementById('bft-addFeatureInput');
    if (addFeatureInput) { addFeatureInput.checked = false; }
}

function resetFeature() {
    destroyCroppie();
    removeMarker();
    cardSide = "RECTO";
    feature = jQuery.extend(true, {}, defaultFeature);
    document.getElementById("bft-featureInformations").style.display = "none";
    document.getElementById('bft-featureForm').reset();
    resetTabs();
}

function removeMarker() {
    marker.remove();
    markerOriginalPos = null;
}

function addMapControls() {
    map.addControl(new GroupFilterControl(), 'top-right');
    map.addControl(new ToggleGroupFilterControl(), 'top-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');
    map.addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        }), 'bottom-right'
    );
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
    let url = document.getElementById("bft-featureUrl" + id);
    let imageElement = document.getElementById("bft-cardImage" + id);

    if (feature.properties.url === EMPTY_STRING_SHARP) {
        let avatar = document.getElementById("bft-cardAvatar" + id);
        if (avatar) {
            avatar.replaceChild(imageElement, url);
        }
    } else {
        url.setAttribute("href", feature.properties.url);
    }
    if (feature.properties.image && feature.properties.image !== EMPTY_STRING_SHARP) {
        imageElement.setAttribute("src", feature.properties.image);
    } else {
        imageElement.setAttribute("src","/modules/mod_blue_force_tracker/tmpl/assets/image_non_trouvee.png");
    }
    imageElement.setAttribute("alt", feature.properties.label);
    let featureLabel = document.getElementById("bft-featureLabel" + id);
    if (featureLabel) {
        featureLabel.innerHTML = feature.properties.label;
        document.getElementById("bft-featureDescription" + id).innerHTML = feature.properties.description;
    }
    const cardLoading = document.getElementById('bft-cardLoading' + id);
    if (cardLoading) {
        cardLoading.style.display = 'none';
    }
}

function getUniqueFeatureCardInformations(id) {
    let uniqueCard = featureCardInformations.replace("bft-featureUrl", "bft-featureUrl" + id);
    uniqueCard = uniqueCard.replace("bft-cardAvatar", "bft-cardAvatar" + id);
    uniqueCard = uniqueCard.replace("bft-cardImage", "bft-cardImage" + id);
    uniqueCard = uniqueCard.replace("bft-cardContainer", "bft-cardContainer" + id);
    uniqueCard = uniqueCard.replace("bft-featureLabel", "bft-featureLabel" + id);
    uniqueCard = uniqueCard.replace("bft-cardLoading", "bft-cardLoading" + id);
    return uniqueCard.replace("bft-featureDescription", "bft-featureDescription" + id);
}

function renderListings(features) {
    const filterEl = document.getElementById('bft-feature-filter');
    const listingEl = document.getElementById('bft-feature-listing');
    const empty = document.createElement('p');
    listingEl.innerHTML = '';
    resetStats();
    if (features.length) {
        for (const feature of features) {
            statCount(feature);
            let prop = feature.properties;
            let html =
                '<button class="bft-listingHeader">' +
                prop.label +
                '</button>' +
                '<div class="bft-listingDetail" id="bft-listing'+prop.id+'">' +
                '    <input type="hidden" id="bft-lngbft-listing'+prop.id+'" value="'+feature.geometry.coordinates[0]+'" />' +
                '    <input type="hidden" id="bft-latbft-listing'+prop.id+'" value="'+feature.geometry.coordinates[1]+'" />' +
                getUniqueFeatureCardInformations(prop.id) +
                '</div>';
            listingEl.innerHTML += html;
            setFeatureCardInformation(feature, prop.id);
        }
        resetCount();

        let acc = document.getElementsByClassName("bft-listingHeader");
        let i;
        for (i = 0; i < acc.length; i++) {
            acc[i].addEventListener("click", function() {
                /* Toggle between adding and removing the "active" class,
                to highlight the button that controls the panel */
                this.classList.toggle("bft-listingActive");

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
                let lng = document.getElementById("bft-lng"+ panel.id).value;
                let lat = document.getElementById("bft-lat"+ panel.id).value;
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

function getActiveLayers() {
    let layers = {
        layers: []
    }
    Object.keys(featureType).forEach(function (featureProperties) {
        if (featureType.hasOwnProperty(featureProperties)) {
            const symbol = featureType[featureProperties].icon;
            if (map.getLayer('bft-poi-'+symbol)) {
                layers.layers.push('bft-poi-'+symbol);
            }
        }
    });
    return layers;
}

function refreshStats() {
    let renderedFeatures = map.queryRenderedFeatures(getActiveLayers());
    resetStats();
    if (renderedFeatures.length) {
        renderedFeatures.forEach(function(feature) {
            statCount(feature);
        });
        resetCount();
    }
}

function statCount(feature) {
    if (!stats[feature.properties.type]) {
        stats[feature.properties.type] = 0;
    }
    stats[feature.properties.type] = stats[feature.properties.type] + 1;
    document.getElementById("bft-stat_" + feature.properties.type).innerText = stats[feature.properties.type];
}

function resetStats() {
    Object.keys(featureType).forEach(function (featureProperties) {
        if (featureType.hasOwnProperty(featureProperties)) {
            document.getElementById("bft-stat_" + featureProperties).innerText = 0;
        }
    });
}

function resetCount() {
    stats = {};
}

function refreshListing() {
    const filterEl = document.getElementById('bft-feature-filter');
    let renderedFeatures = map.queryRenderedFeatures({layers: ['bft-poi-toilet', 'bft-poi-embassy', 'bft-poi-ranger-station', 'bft-poi-grocery']});

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
    document.getElementById("bft-labelImportPhoto").style.display = "none";
    resetCroppie();
    cropper.bind({
        url : feature.properties.image,
        zoom: 1
    });
}

function showfeatureInformationsPanel() {
    const featureInformations = document.getElementById("bft-featureInformations");
    featureInformations.style.display = 'block';
}

function setFeatureTypeList() {
    Object.keys(featureType).forEach(function (featureProperties) {
        const bft_featureType = document.getElementById("bft-featureType");
        if (featureType.hasOwnProperty(featureProperties) && bft_featureType) {
            let type = featureType[featureProperties];
            bft_featureType.appendChild(new Option(getTypeLabel(type.string, "FR-ca"), type.string));
        }
    });
}

function setSelectedFeatureType() {
    document.getElementById("bft-featureType").value = feature.properties.type;
}

function showfeatureInformations() {
    clearErrorMessage();
    setSelectedFeatureType();
    showfeatureInformationsPanel();

    setInputValue("bft-label");
    setInputValue("bft-description");
    if (feature.properties.url === EMPTY_STRING_SHARP) {
        feature.properties.url = "";
    }
    setInputValue("bft-url");

    setFeatureDetails();

    markerOriginalPos = marker.getLngLat();
    resetTabs();
    showTab(currentTab);
}

function resetTabs() {
    currentTab = 0;
    let i, x = document.getElementsByClassName("bft-tab");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = 'none';
    }
}

let currentTab = 0;

function showTab(n) {
    let x = document.getElementsByClassName("bft-tab");
    x[n].style.display = "block";

    if (n === 0) {
        document.getElementById("bft-prevBtn").style.display = "none";
    } else {
        document.getElementById("bft-prevBtn").style.display = "inline";
    }
    if (n === (x.length - 1)) {
        document.getElementById("bft-importImageButton").style.display = 'block'
        showImage();
        document.getElementById("bft-nextBtn").innerHTML = "&#xf0c7"; // save
    } else {
        document.getElementById("bft-importImageButton").style.display = 'none';
        document.getElementById("bft-nextBtn").innerHTML = "&#xf061"; // next
    }
    fixStepIndicator(n)
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function nextPrev(n) {
    let x = document.getElementsByClassName("bft-tab");
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
            if (x[currentTab-n]) {
                x[currentTab-n].style.display = "none";
            }
            return false;
        }
    } else {
        x[currentTab-n].style.display = "none";
        showTab(currentTab);
    }
    return false;
}

function fixStepIndicator(n) {
    let i, x = document.getElementsByClassName("bft-step");
    for (i = 0; i < x.length; i++) {
        x[i].className = x[i].className.replace(" active", "");
    }
    x[n].className += " active";
}

function activateFeatureList() {
    const filterEl = document.getElementById('bft-feature-filter');

    map.on('moveend', async function () {
        refreshListing();
    });
    filterEl.addEventListener('keyup', async function (e) {
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
                    map.setFilter('bft-poi-' + icon, [
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
            map.on('mousemove', 'bft-poi-' + icon, function () {
                map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', 'bft-poi-' + icon, function () {
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
pin.id = 'bft-marker';
const marker = new mapboxgl.Marker({
    element: pin,
    draggable: true,
    offset: [0,-13]
});

function executeBlueForceTracker() {
    showStats();
    map.on('load', async function () {
        addMapControls();
        setOnClosePopup();
        map.addSource('places', {type: 'geojson', data: urlFeature});
        showFeaturesOnMap();
        addAddButton();
        document.getElementById("bft-featureInformations").innerHTML = featureForm;
        setFeatureTypeList();
        marker.on('dragend', showfeatureInformations);
        generateFeatureMouseOver();
        await activateFeatureList();
    });
    map.on('render', function() {
        refreshStats();
    });
}