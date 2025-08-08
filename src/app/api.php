<?php
// === cPanel API Credentials ===
$cpanelHost  = "server.dnspark.in"; // Your cPanel domain or IP
$cpanelUser  = "rcptpozk";          // Your cPanel username
$cpanelToken = "AQHV4QCH5Q8X46UGHDUD485IJ0FWRVO2"; // Your cPanel API token

// === Input Parameters ===
$subdomain   = $_POST['subdomain'] ?? 'test';
$rootdomain  = $_POST['rootdomain'] ?? 'inlinks.site';
$targetDir   = $_POST['dir'] ?? 'test.inlinks.com'; // No "public_html/" prefix

// === Validation (optional but recommended) ===
if (!$subdomain || !$rootdomain || !$targetDir) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required parameters"]);
    exit;
}

// === Build API Request ===
$apiUrl = "https://$cpanelHost:2083/execute/SubDomain/addsubdomain";

// Prepare POST fields
$postFields = http_build_query([
    "domain"     => $subdomain,
    "rootdomain" => $rootdomain,
    "dir"        => $targetDir            // ⬅️ This puts subdomain dir outside public_html
]);

// === Make the cURL Request ===
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: cpanel $cpanelUser:$cpanelToken"
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Disable in dev only

$response = curl_exec($ch);
$httpStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// === Return JSON Response ===
header('Content-Type: application/json');
http_response_code($httpStatus);
echo $response;
?>
