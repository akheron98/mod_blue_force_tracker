# Blue Force Tracker
# Joomla Module
# mod_blue_force_tracker

## Source de la liste des markers

### AWS
GET https://m05rcnja4m.execute-api.us-east-2.amazonaws.com/prod/marker

POST https://m05rcnja4m.execute-api.us-east-2.amazonaws.com/prod/marker 

### JSON Format
<code>
{
	"type": "Feature",
	"properties": {
		"icon": "toilet",
		"type": "Équipe",
		"label": "FAQ Milsim",
		"description": "Organisation sans but lucratif de formation militaire récréative.",
		"url": "http://www.faqmilsim.ca",
		"image": "http://www.faqmilsim.ca/img/faqmilsim_transparent.png"
	},
	"geometry": {
		"type": "Point",
		"coordinates": [
			-73.336571,
			45.597621
		]
	}
}</code>