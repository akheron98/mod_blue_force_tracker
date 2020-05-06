<?php

if (isset($_POST['data']) && isset($_POST['method'])) {
    $data = $_POST['data'];
    $method = $_POST['method'];

    if ($method !== "DELETE") {
        $data = json_decode($data);
        $prop = $data->properties;
        $id = $prop->id;
        $image = $prop->image;
        $output = '/images/blueforcetracker/'.$id.'.png';
        $imageData = explode( ',', $image );
        file_put_contents($_SERVER['DOCUMENT_ROOT'] . $output, base64_decode($imageData[1]));
        $prop->image = $output;
        $data = json_encode($data);
    }

    $apiKey = "x-api-key:sBLS9lBAy76rFJ4u41qiU7rYyArA2lNF8bwjkn7g"; // . str_replace("\n", "", getenv('AWS_API_KEY'));
    $url = "https://m05rcnja4m.execute-api.us-east-2.amazonaws.com/prod/marker";

    $headers = array("Accept: */*",
                "Authorization: eyJraWQiOiJLTzRVMWZs",
                "content-type: application/json; charset=UTF-8",
                "x-api-key:sBLS9lBAy76rFJ4u41qiU7rYyArA2lNF8bwjkn7g"
    );

    $handle = curl_init();
    curl_setopt($handle, CURLOPT_URL, $url);
    curl_setopt($handle, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($handle, CURLOPT_CUSTOMREQUEST, $method);

    curl_setopt($handle, CURLOPT_POSTFIELDS, $data);

    $response = curl_exec($handle);
    $code = curl_getinfo($handle, CURLINFO_HTTP_CODE);
    curl_close($handle);
    echo $code;
} else {
     echo '500';
}
