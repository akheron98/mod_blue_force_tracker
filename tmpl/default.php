<?php
// No direct access
defined('_JEXEC') or die; ?>
<link href="/modules/mod_blue_force_tracker/tmpl/css/mapbox-gl.css" rel="stylesheet"/>
<link href="/modules/mod_blue_force_tracker/tmpl/css/blueforcetracker.css" rel="stylesheet"/>
<link rel="stylesheet" href="/modules/mod_blue_force_tracker/tmpl/css/croppie.css" />
<link rel="stylesheet" href="/modules/mod_blue_force_tracker/tmpl/css/bootstrap.min.css">

<div class="container-fluid" style="padding:0;">
    <div id="featuresStats" class="row" style="margin-left:0;"></div>
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

<script src="/modules/mod_blue_force_tracker/tmpl/js/customMapControl.js"></script>
<script src="/modules/mod_blue_force_tracker/tmpl/js/mapbox-gl.js"></script>
<script src="/modules/mod_blue_force_tracker/tmpl/js/croppie.min.js"></script>
<script src="/modules/mod_blue_force_tracker/tmpl/js/ui.js"></script>
<script src="/modules/mod_blue_force_tracker/tmpl/js/blueforcetracker.js"></script>
<script>
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/akheron/ck7rh7pw12b5c1is1hbldygdh',
        center: [-72.937107, 46.286173],
        zoom: 6.5
    });
    const urlFeature = "https://m05rcnja4m.execute-api.us-east-2.amazonaws.com/prod/marker";
    const urlPost = "<?php echo JURI::root() . "modules/mod_blue_force_tracker/tmpl/gateway.php"?>";
    const urlGetUser = "<?php echo JURI::root() . "modules/mod_blue_force_tracker/tmpl/userService.php"?>";
    const joomlaUserId = "<?php echo $joomlaUserId;?>";
    const joomlaUserName = "<?php echo $joomlaUserName;?>";
    const hasAddAccess = <?php echo $hasAddAccess;?>;
    const isAdmin = "<?php echo $isAdmin;?>";
    const connectedUser = joomlaUserId > 0;
    executeBlueForceTracker();
</script>