<?php
/**
 * Helper class for Hello World! module
 *
 * @package    Joomla.Tutorials
 * @subpackage Modules
 * @link http://docs.joomla.org/J3.x:Creating_a_simple_module/Developing_a_Basic_Module
 * @license        GNU/GPL, see LICENSE.php
 * mod_helloworld is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
class ModBlueForceTrackerHelper
{
    /**
     * Retrieves the hello message
     *
     * @param   array  $params An object containing the module parameters
     *
     * @access public
     */
    public static function getEventList()
    {
        $db = JFactory::getDbo();
        $query = $db->getQuery(true)
                    ->select($db->quoteName(array('type', 'title', 'info', 'url', 'image', 'lat', 'lon')))
                    ->from($db->quoteName('#__blueforcetracker'));
                 $db->setQuery($query);

        return (array) $db->loadObjectList();
    }

    public static function getPlaces() {
        $response = file_get_contents('http://www.faqmilsim.ca/akheron/json/mod_blue_force_tracker-places.json');

        return json_decode($response);;
    }
}
