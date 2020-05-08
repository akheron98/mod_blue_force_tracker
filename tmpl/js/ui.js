const featureForm = `
    <div class="bft-feature-form-with-image">               
        <div id="bft-result"></div>               
        <div class="bft-feature-form">                   
            <div class="bft-formContent">                       
                <form id="bft-featureForm" action="">                           
                    <div class="bft-tab" id="bft-basicInformations">                               
                        <h6>Votre point d'intérêt</h6>                               
                        <select id="bft-featureType" onchange="setFeatureDetails()"></select>
                        <br />                               
                        <label for="bft-label">Titre</label>
                        <span id="bft-error-label"></span>                               
                        <input required autofocus id="bft-label" name="bft-label" placeholder="Titre de votre point d'intérêt" value="" type="text" maxlength="50" />
                        <br />                               
                        <label for="bft-description">Description</label>
                        <span id="bft-error-description"></span>                               
                        <textarea rows="2" required id="bft-description" name="bft-description" placeholder="Courte description" maxlength="140"></textarea>
                        <br />                               
                        <label for="bft-url">Adresse site web</label>
                        <span id="bft-error-url"></span>                               
                        <input id="bft-url" name="bft-url" placeholder="http://www.example.com" value="" type="url" width="100px;" >
                        <br />                           
                    </div>                           
                    <div class="bft-tab" id="bft-detailInformations">                               
                        <div id="bft-details"></div>                           
                    </div>                           
                    <div class="bft-tab" id="bft-imageInformations">                               
                        <h6 id="bft-labelImportPhoto">Importez une photo de votre choix</h6>                               
                        <div id="bft-showImage">                                   
                            <img id="bft-cropper" src="" alt="Prévisualisation" style="display:none;" />                               
                        </div>                              
                    </div>                       
                </form>                   
            </div>                   
            <div>                       
                <div class="bft-stepButtons">                           
                    <div>                               
                        <button type="button" id="bft-prevBtn" onclick="nextPrev(-1)" class="bft-stepButton">&#xf060</button>                           
                    </div>
                    <div id="bft-importCal" style="display:none"> 
                        <input id="bft-cal" type="file" onchange="loadCal()">
                        <label for="bft-cal">&#xf574</label>
                    </div>                       
                    <div id="bft-importImageButton" style="display:none">                               
                        <input id="bft-image" type="file" accept="image/*" onchange="loadImage()">                               
                        <label for="bft-image">&#xf574</label>                           
                    </div>                           
                    <div>                               
                        <button type="button" id="bft-nextBtn" onclick="nextPrev(1)" class="bft-stepButton"><span id="bft-saveIcon">&#xf061</span></button>                           
                    </div>                       
                </div>                       
                <div class="bft-stepBullets">                           
                    <span class="bft-step"></span>                           
                    <span class="bft-step"></span>                           
                    <span class="bft-step"></span>                       
                </div>                   
            </div>               
        </div>           
    </div>
`;

const activityTypeSelectForm = `
    <label for "details_activity">Type d'activité</label>
    <span id="bft-error-details_activity"></span>
    <select id="bft-details_activity" class="bft-featureDetailsSelector">   
        <option value="airsoft">Airsoft</option>   
        <option value="paintball">Paintball</option>
    </select>
`;

const fieldDetails = `<h6>Caractéristiques du terrain</h6>
    ${activityTypeSelectForm}
    <label for "details_fieldRules">Règles</label>
    <span id="bft-error-details_fieldRules"></span>
    <textarea id="bft-details_fieldRules" class="bft-featureDetailsSelector"></textarea>
    <br />
    <div class="bft-spread">   
        <label class="bft-detailSwitchLabel" for="bft-details_fieldUrban">Village(s)</label>   
        <div class="custom-control custom-switch">       
            <input type="checkbox" class="custom-control-input bft-featureDetailsSelector" id="bft-details_fieldUrban">       
            <label class="custom-control-label" for="bft-details_fieldUrban"></label>   
        </div>
    </div>
    <div class="bft-spread">   
        <label class="bft-detailSwitchLabel" for="bft-fieldMeal">Nourriture vendue sur place</label>   
        <div class="custom-control custom-switch spread">       
            <input type="checkbox" class="custom-control-input bft-featureDetailsSelector" id="bft-details_fieldMeal">       
            <label class="custom-control-label" for="bft-details_fieldMeal"></label>   
        </div>
    </div>
`;

const featureCardDetails_field = `
    <label for="bft-card_details_activity">Type d'activité</label>
    <p id="bft-card_details_activity"></p>
    <label for="bft-card_details_fieldRules">Règles du terrain</label>
    <p id="bft-card_details_fieldRules"></p>
    <label for="bft-card_details_fieldUrban">Environnement urbain</label>
    <p id="bft-card_details_fieldUrban"></p>
    <label for="bft-card_details_fieldMeal">Nourriture vendue sur place</label>
    <p id="bft-card_details_fieldMeal"></p>
`;

const eventDetails = `
    <div class="container-fluid">
        <div class="row">
            <div class="col-12">
                <h6>Caractéristiques de l'événement</h6>
            </div>
        </div>
        <div class="row">
            <div class="col-6">
                ${activityTypeSelectForm}
            </div>
            <div class="col-6">
                <label for "details_eventStyle">Style de jeu</label>
                <span id="bft-error-details_eventStyle"></span>
                <select id="bft-details_eventStyle" class="bft-featureDetailsSelector">   
                    <option value="milsim">Milsim</option>   
                    <option value="skirmish">Skirmish / Recball</option>
                    <option value="speedsoft">Speedsoft / Speedball</option>
                    <option value="magfed">Magfed</option>
                    <option value="cqb">Centre intérieur</option>
                    <option value="training">Formation</option>
                </select>
            </div>    
        </div>
        <div class="row">
            <div class="col-12">
                <label for "details_eventDate">Date de l'événement</label>
                <span id="bft-error-details_eventDate"></span>
                <input required type="date" id="bft-details_eventDate" class="bft-featureDetailsSelector" value="" />
            </div>
        </div>
         <div class="row">
            <div class="col-6">
                <label for "details_eventDebut">Début</label>
                <span id="bft-error-details_eventDebut"></span>
                <input required type="time" id="bft-details_eventDebut" class="bft-featureDetailsSelector" value="" />
            </div>
            <div class="col-6">
                <label for "details_eventFin">Fin</label>
                <span id="bft-error-details_eventFin"></span>
                <input required type="time" id="bft-details_eventFin" class="bft-featureDetailsSelector" value="" />
            </div>    
        </div>
    </div>
`;

const featureCardDetails_event = `
    <label for="bft-card_details_activity">Type d'activité</label>
    <p id="bft-card_details_activity"></p>
    <label for="bft-card_details_eventDate">Date de l'événement</label>
    <p id="bft-card_details_eventDate"></p>
    <label for="bft-card_details_eventDebut">Heure de début</label>
    <p id="bft-card_details_eventDebut"></p>
    <label for="bft-card_details_eventFin">Heure de fin</label>
    <p id="bft-card_details_eventFin"></p>
`;


const teamDetails = `
    <h6>Caractéristiques de l'équipe</h6>
    ${activityTypeSelectForm}
    <div class="bft-spread">   
        <label class="bft-detailSwitchLabel" for="bft-details_teamTraining">Entrainement d'équipe</label>   
        <div class="custom-control custom-switch">       
            <input type="checkbox" class="custom-control-input bft-featureDetailsSelector" id="bft-details_teamTraining">       
            <label class="custom-control-label" for="bft-details_teamTraining"></label>   
        </div>
    </div>
`;

const featureCardDetails_team = `
    <label for="bft-card_details_activity">Type d'activité</label>
    <p id="bft-card_details_activity"></p>
    <label for="bft-card_details_teamTraining">Entrainement d'équipe</label>
    <p id="bft-card_details_teamTraining"></p>
`;

const shopDetails = `<h6>Caractéristiques de la boutique</h6>
    ${activityTypeSelectForm}
    <label for "details_shopHours">Heures d'ouvertures</label>
    <span id="bft-error-details_shopHours"></span>
    <textarea id="bft-details_shopHours" class="bft-featureDetailsSelector"></textarea>
`;

const featureCardDetails_shop = `
    <label for="bft-card_details_activity">Type d'activité</label>
    <p id="bft-card_details_activity"></p>
    <label for="bft-card_details_shopHours">Heures d'ouvertures</label>
    <p id="bft-card_details_shopHours"></p>
`;

const featureCardDetails = `
    <div class="bft-cardDetails" id="bft-featureCardDetailInformations"></div>
`;

const featureCardInformations = `
    <div id="bft-cardAvatar">
        <img id="bft-cardImage" class="bft-cardImage" src="" alt="">
    </div>
    <div id="bft-cardContainer" class="container bft-container">
        <a id="bft-featureUrl" href="" target="_blank"><h4 id="bft-featureLabel"></h4></a>
        <p class="bft-description" id="bft-featureDescription"></p>
    </div>
`;

const featureCard = `
        <div id="bft-card" class="bft-featureCard">
            <div id="bft-result"></div>
            <div id="bft-cardContent">
            ${featureCardInformations}
            <div id="bft-cardLoading" class="spinner-border"></div>
            </div>
            <div class="bft-spread">
                <span style="padding-left:10px;color:lightslategray;"><span id="bft-userName"></span></span>
                <a id="bft-showMoreInfo" class="bft-showMoreFeatureInfoButton" href="#"><i id="bft-flipArrow" class="fas fa-chevron-circle-right" style="padding:0;"></i></a>
            </div>
            <div class="bft-spread">
                <button onclick="return editFeature();" id="bft-updateFeature" class="bft-updateFeature"><i class="fas fa-edit" style="padding:0;"></i></button>
                <button onclick="return deleteFeature();" id="bft-supprimerFeature" class="bft-supprimerFeature"><i class="fas fa-trash" style="padding:0;"></i></button>
            </div>
        </div>
`;