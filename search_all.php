<?php
require_once 'db_config.php';
header('Content-Type: application/json');

$keyword = isset($_GET['keyword']) ? $_GET['keyword'] : '';
$term = "%$keyword%";

$response = ['folders' => [], 'files' => []];

if ($keyword !== '') {
    // Cari Folder
    $sqlFolder = "SELECT id, name FROM folders WHERE name LIKE ?";
    $stmtF = $conn->prepare($sqlFolder);
    $stmtF->bind_param("s", $term);
    $stmtF->execute();
    $response['folders'] = $stmtF->get_result()->fetch_all(MYSQLI_ASSOC);

    // Cari File
    $sqlFile = "SELECT id, name, path FROM files WHERE name LIKE ?";
    $stmtFile = $conn->prepare($sqlFile);
    $stmtFile->bind_param("s", $term);
    $stmtFile->execute();
    $response['files'] = $stmtFile->get_result()->fetch_all(MYSQLI_ASSOC);
}

echo json_encode($response);
?>