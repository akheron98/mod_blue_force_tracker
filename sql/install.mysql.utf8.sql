CREATE TABLE IF NOT EXISTS `#__blueforcetracker` (
	`id` int(10) NOT NULL AUTO_INCREMENT,
	`type` varchar(20) NOT NULL,
	`title` varchar(25) NOT NULL,
	`info` text NOT NULL,
	`url` text NOT NULL,
	`lat` varchar(10),
	`lon` varchar(10),
  PRIMARY KEY (`id`)
) ENGINE=INNODB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

INSERT INTO `#__blueforcetracker` (`type`, `title`, `info`, `url`, `lat`, `lon`)
    VALUES ('embassy', 'Realcap', 'Terrain de 500 mètres pouvant contenir environ 100 joueurs.<br/>Terrain privé.','', '45.066445', '-73.545832');
INSERT INTO `#__blueforcetracker` (`type`, `title`, `info`, `url`, `lat`, `lon`)
    VALUES ('ranger-station', 'Bootcamp', 'Entrainement militaire.<br/> 9e édition.<br />','http://www.faqmilsim.ca', '45.101403', '-72.940174');
INSERT INTO `#__blueforcetracker` (`type`, `title`, `info`, `url`, `lat`, `lon`)
    VALUES ('toilet', 'FAQ Milsim', 'Organisation sans but lucratif.','http://www.faqmilsim.ca', '45.597621','-73.336571');
