CREATE TABLE IF NOT EXISTS `#__blueforcetracker` (
	`id` int(10) NOT NULL AUTO_INCREMENT,
	`type` varchar(20) NOT NULL,
	`title` varchar(25) NOT NULL,
	`info` text NOT NULL,
	`url` text NOT NULL,
	`image` text NOT NULL,
	`lat` varchar(10),
	`lon` varchar(10),
  PRIMARY KEY (`id`)
) ENGINE=INNODB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

INSERT INTO `#__blueforcetracker` (`type`, `title`, `info`, `url`, `image`, `lat`, `lon`)
    VALUES ('ranger-station', 'Les Vignes des Bacchantes', '653 Chemin Brownlee, Hemmingford, QC J0L 1H0.','http://www.vignesdesbacchantes.com', 'http://www.faqmilsim.ca/images/hemmingford.jpg', '45.066445', '-73.545832');
INSERT INTO `#__blueforcetracker` (`type`, `title`, `info`, `url`, `image`, `lat`, `lon`)
    VALUES ('embassy', 'Bootcamp FAQ Milsim', 'Entrainement de Airsoft. 9e édition.','http://www.faqmilsim.ca', 'http://www.faqmilsim.ca/img/faqmilsim_transparent.png', '45.066445', '-73.545832');
INSERT INTO `#__blueforcetracker` (`type`, `title`, `info`, `url`, `image`, `lat`, `lon`)
    VALUES ('toilet', 'FAQ Milsim', 'Organisation sans but lucratif de formation militaire récréative.','http://www.faqmilsim.ca', 'http://www.faqmilsim.ca/img/faqmilsim_transparent.png', '45.597621','-73.336571');
