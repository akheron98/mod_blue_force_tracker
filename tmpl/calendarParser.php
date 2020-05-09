<?php

    /* Function is to get all the contents from ics and explode all the datas according to the events and its sections */
    function getIcsEventsAsArray($icalString) {
        $icsDates = array ();
        /* Explode the ICs Data to get datas as array according to string ‘BEGIN:’ */
        $icsData = explode ( "BEGIN:", $icalString );
        /* Iterating the icsData value to make all the start end dates as sub array */
        foreach ( $icsData as $index => $value ) {

            if (isset($value) && substr( $value, 0, 9) !== "VCALENDAR") {

                $subValueArr = preg_split("/^([A-Z]{3,}.*?;*)([:])/m", $value, 0, PREG_SPLIT_DELIM_CAPTURE);
                \array_splice($subValueArr, 0, 1);
                $key = null;
                foreach ($subValueArr as $event) {
                    if ($event !== ":") {
                        if (isset($key)) {
                            $event = str_replace("\r\n ", "", $event);
                            $event = str_replace("\\n\\n", "<br />", $event);
                            $event = str_replace("\\n", "<br />", $event);
                            $event = str_replace("\,", ",", $event);

                            if ($key === "DESCRIPTION") {
                                preg_match_all("/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/im", $event, $urls);
                                $done = [];
                                foreach ($urls[0] as $url) {
                                    if (array_search($url, $done) === false) {
                                        $event = str_replace($url, "<a href='" . $url . "' target='_blank'>" . $url . "</a>", $event);
                                        $done[] = $url;
                                    }
                                }
                            }
                            $icsDates [$index] [$key] = $event;
                            $key = null;
                        } else {
                            $key = $event;
                        }
                    }
                }
            }
        }
        return $icsDates;
    }

    function cleanDate($str) {
        $str = str_ireplace("Z\r","",$str);
        $str = strtotime($str);
        return date(DATE_ATOM,$str);
    }

    function clean($str) {
        return str_ireplace(["\r","\n"],"",$str);
    }

if (isset($_POST['data'])) {
    $cal = $_POST['data'];
    $type = $cal['type'];
    $data = $cal['data'];
    $ical = getIcsEventsAsArray($data);
    $items = array();
    unset($ical [1]);

    foreach ($ical as $icsEvent) {
        $event = new stdClass();
        $event->id = clean(str_ireplace(["@facebook.com","@google.com"], "", $icsEvent['UID']));
        $event->title = clean($icsEvent['SUMMARY']);
        $event->start = cleanDate(isset($icsEvent ['DTSTART;VALUE=DATE']) ? $icsEvent ['DTSTART;VALUE=DATE'] : $icsEvent ['DTSTART']);
        $event->end = cleanDate($icsEvent['DTEND']);
        $style = 'skirmish';
        if (preg_match('/milsim/im',$icsEvent['DESCRIPTION']) >= 1) {
            $style = 'milsim';
        } else if (preg_match('/skirmish|recball/im',$icsEvent['DESCRIPTION']) >= 1) {
            $style = 'skirmish';
        } else if (preg_match('/speed[a-z]{4}/im',$icsEvent['DESCRIPTION']) >= 1) {
            $style = 'speedsoft';
        } else if (preg_match('/magfed/im',$icsEvent['DESCRIPTION']) >= 1) {
            $style = 'magfed';
        } else if (preg_match('/intérieur|cqb/im',$icsEvent['DESCRIPTION']) >= 1) {
            $style = 'cqb';
        }
        $event->classNames = [$type, $style];
        $extendedProps = new stdClass();
        $extendedProps->style = $style;
        $extendedProps->type = $type;
        $extendedProps->description = clean(str_ireplace("@", "(at)", $icsEvent['DESCRIPTION']));
        $extendedProps->location = clean($icsEvent['LOCATION']);
        $event->extendedProps = $extendedProps;
        $event->url = clean($icsEvent['URL']);
        $items[] = $event;
    }
    echo json_encode($items);
}