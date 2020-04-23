<?php
define( '_JEXEC', 1 );
define( 'JPATH_BASE', $_SERVER['DOCUMENT_ROOT']);
require_once ( JPATH_BASE . '/includes/defines.php' );
require_once ( JPATH_BASE . '/includes/framework.php' );

if (isset($_GET['uid'])) {
    $user = JFactory::getUser($_GET['uid']);
    echo $user->get('username');
} else {
    echo "N/A";
}