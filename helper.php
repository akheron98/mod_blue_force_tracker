<?php
/**
 * Helper class for Hello World! module
 *
 * @package    ajpaq
 * @subpackage Modules
 * @link http://docs.joomla.org/J3.x:Creating_a_simple_module/Developing_a_Basic_Module
 * @license        GNU/GPL, see LICENSE.php
 * mod_blue_force_tracker is free software. This version may have been modified pursuant
 * to the GNU General Public License, and as distributed it includes or
 * is derivative of works licensed under the GNU General Public License or
 * other free or open source software licenses.
 */
class ModBlueForceTrackerHelper
{
    public static function getUserId() {
        $user = JFactory::getUser();

        return $user->get('id');
    }
}
