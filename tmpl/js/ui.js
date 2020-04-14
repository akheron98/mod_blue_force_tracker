const featureForm = `
    <div class="feature-form-with-image">               
        <div id="result"></div>               
        <div class="feature-form">                   
            <div class="formContent">                       
                <form id="featureForm" action="">                           
                    <div class="tab" id="basicInformations">                               
                        <h6>Votre point d'intérêt</h6>                               
                        <select id="featureType" onchange="setFeatureDetails()"></select>
                        <br />                               
                        <label for="label">Titre</label>
                        <span id="error-label"></span>                               
                        <input required autofocus id="label" name="label" placeholder="Titre de votre point d'intérêt" value="" type="text" maxlength="50" />
                        <br />                               
                        <label for="description">Description</label>
                        <span id="error-description"></span>                               
                        <textarea rows="2" required id="description" name="description" placeholder="Courte description" maxlength="140"></textarea>
                        <br />                               
                        <label for="url">Adresse site web</label>
                        <span id="error-url"></span>                               
                        <input id="url" name="url" placeholder="http://www.example.com" value="" type="url" width="100px;" >
                        <br />                           
                    </div>                           
                    <div class="tab" id="detailInformations">                               
                        <div id="details"></div>                           
                    </div>                           
                    <div class="tab" id="imageInformations">                               
                        <h6 id="labelImportPhoto">Importez une photo de votre choix</h6>                               
                        <div id="showImage">                                   
                            <img id="cropper" src="" alt="Prévisualisation" style="display:none;" />                               
                        </div>                              
                    </div>                       
                </form>                   
            </div>                   
            <div>                       
                <div class="stepButtons">                           
                    <div>                               
                        <button type="button" id="prevBtn" onclick="nextPrev(-1)" class="stepButton">&#xf060</button>                           
                    </div>                           
                    <div id="importImageButton" style="display:none">                               
                        <input id="image" type="file" accept="image/*" onchange="loadImage()">                               
                        <label for="image">&#xf574</label>                           
                    </div>                           
                    <div>                               
                        <button type="button" id="nextBtn" onclick="nextPrev(1)" class="stepButton"><span id="saveIcon">&#xf061</span></button>                           
                    </div>                       
                </div>                       
                <div class="stepBullets">                           
                    <span class="step"></span>                           
                    <span class="step"></span>                           
                    <span class="step"></span>                       
                </div>                   
            </div>               
        </div>           
    </div>
`;

const activityTypeSelectForm = `
    <label for "details_activity">Type d'activité</label>
    <span id="error-details_activity"></span>
    <select id="details_activity" class="featureDetailsSelector">   
        <option value="airsoft">Airsoft</option>   
        <option value="paintball">Paintball</option>
    </select>
`;

const fieldDetails = `<h6>Caractéristiques du terrain</h6>
    <label for "details_fieldRules">Règles</label>
    <span id="error-details_fieldRules"></span>
    <textarea id="details_fieldRules" class="featureDetailsSelector"></textarea>
    <br />
    <div class="spread">   
        <label class="detailSwitchLabel" for="details_fieldUrban">Village(s)</label>   
        <div class="custom-control custom-switch">       
            <input type="checkbox" class="custom-control-input featureDetailsSelector" id="details_fieldUrban">       
            <label class="custom-control-label" for="details_fieldUrban"></label>   
        </div>
    </div>
    <div class="spread">   
        <label class="detailSwitchLabel" for="fieldMeal">Nourriture vendue sur place</label>   
        <div class="custom-control custom-switch spread">       
            <input type="checkbox" class="custom-control-input featureDetailsSelector" id="details_fieldMeal">       
            <label class="custom-control-label" for="details_fieldMeal"></label>   
        </div>
    </div>
`;

const featureCardDetails_field = `
    <label for="card_details_fieldRules">Règles du terrain</label>
    <p id="card_details_fieldRules"></p>
    <label for="card_details_fieldUrban">Environnement urbain</label>
    <p id="card_details_fieldUrban"></p>
    <label for="card_details_fieldMeal">Nourriture vendue sur place</label>
    <p id="card_details_fieldMeal"></p>
`;

const eventDetails = `
    <h6>Caractéristiques de l'événement</h6>
    ${activityTypeSelectForm}
    <label for "details_eventDate">Date de l'événement</label>
    <span id="error-details_eventDate"></span>
    <input required type="date" id="details_eventDate" class="featureDetailsSelector" value="" />
    <label for "details_eventDebut">Début</label>
    <span id="error-details_eventDebut"></span>
    <input required type="time" id="details_eventDebut" class="featureDetailsSelector" value="" />
    <label for "details_eventFin">Fin</label>
    <span id="error-details_eventFin"></span>
    <input required type="time" id="details_eventFin" class="featureDetailsSelector" value="" />
    <label for "details_eventCout">Coût</label>
    <span id="error-details_eventCout"></span>
    <input required type="number" id="details_eventCout" class="featureDetailsSelector" value="" />
`;

const featureCardDetails_event = `
    <label for="card_details_activity">Type d'activité</label>
    <p id="card_details_activity"></p>
    <label for="card_details_eventDate">Date de l'événement</label>
    <p id="card_details_eventDate"></p>
    <label for="card_details_eventDebut">Heure de début</label>
    <p id="card_details_eventDebut"></p>
    <label for="card_details_eventFin">Heure de fin</label>
    <p id="card_details_eventFin"></p>
    <label for="card_details_eventCout">Coùt de l'événement</label>
    <p id="card_details_eventCout"></p>
`;


const teamDetails = `
    <h6>Caractéristiques de l'équipe</h6>
    ${activityTypeSelectForm}
    <div class="spread">   
        <label class="detailSwitchLabel" for="details_teamTraining">Entrainement d'équipe</label>   
        <div class="custom-control custom-switch">       
            <input type="checkbox" class="custom-control-input featureDetailsSelector" id="details_teamTraining">       
            <label class="custom-control-label" for="details_teamTraining"></label>   
        </div>
    </div>
`;

const featureCardDetails_team = `
    <label for="card_details_activity">Type d'activité</label>
    <p id="card_details_activity"></p>
    <label for="card_details_teamTraining">Entrainement d'équipe</label>
    <p id="card_details_teamTraining"></p>
`;

const shopDetails = `<h6>Caractéristiques de la boutique</h6>
    <label for "details_shopHours">Heures d'ouvertures</label>
    <span id="error-details_shopHours"></span>
    <textarea id="details_shopHours" class="featureDetailsSelector"></textarea>
`;

const featureCardDetails_shop = `
    <label for="card_details_shopHours">Heures d'ouvertures</label>
    <p id="card_details_shopHours"></p>
`;

const featureCardDetails = `
    <div class="cardDetails" id="featureCardDetailInformations"></div>
`;

const featureCardInformations = `
    <div id="cardAvatar">
        <a id="featureUrl" href="" target="_blank">
            <img id="cardImage" class="cardImage" src="" alt="">
        </a>
    </div>
    <div id="cardContainer" class="container">
        <h4 id="featureLabel"></h4>
        <p id="featureDescription"></p>
    </div>
`;

const featureCard = `
        <div id="card" class="featureCard">
            <div id="result"></div>
            <div id="cardContent">
            ${featureCardInformations}
            </div>
            <div class="showMoreFeatureInfo">
                <a onclick="return flipCard();" id="showMoreInfo" class="showMoreFeatureInfoButton" href="#"><i class="fas fa-chevron-circle-right" style="padding:0;"></i></a>
            </div>
            <div class="spread">
                <button onclick="return editFeature();" id="updateFeature" class="updateFeature"><i class="fas fa-edit" style="padding:0;"></i></button>
                <button onclick="return deleteFeature();" id="supprimerFeature" class="supprimerFeature"><i class="fas fa-trash" style="padding:0;"></i></button>
            </div>
        </div>
`;