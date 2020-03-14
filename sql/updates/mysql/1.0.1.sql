# Placeholder file for database changes for version 1.0.1
UPDATE `#__blueforcetracker` SET `type`='' WHERE `type`='theatre';
UPDATE `#__blueforcetracker` SET `type`='' WHERE `type`='bar';
INSERT INTO `#__blueforcetracker` (`type`, `title`, `info`, `lat`, `lon`) VALUES ('star', '1.0.1', 'BVersion', '45.60','-73.34');
