<?php

if (isset($_POST['data'])) {
    $url = 'https://discover.search.hereapi.com/v1/discover';
    $API_KEY = file_get_contents($_SERVER['DOCUMENT_ROOT'] . "/.here");
    $parameters = [
        'at' => '-72.937107,46.286173',
        'in' => 'countryCode:CAN',
        'q' => $_POST['data'],
        'apiKey' => $API_KEY
    ];
    $qs = http_build_query($parameters); // query string encode the parameters
    $request = "{$url}?{$qs}"; // create the request URL
    $handle = curl_init();
    curl_setopt($handle, CURLOPT_URL, $request);
    curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($handle); // Send the request, save the response
    $code = curl_getinfo($handle, CURLINFO_HTTP_CODE);
    echo $response;
    curl_error($handle);
    curl_close($handle); // Close request
}