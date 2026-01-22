<?php
header('Content-Type: application/json');
require_once 'db_config.php';

if (!isset($_POST['id']) || !isset($_POST['name'])) {
    echo json_encode(['status' => 'error', 'message' => 'Data tidak lengkap']);
    exit;
}

$id = $_POST['id'];
$newName = $_POST['name'];

// Gunakan prepared statement agar aman dari SQL Injection
$stmt = $conn->prepare("UPDATE files SET name = ? WHERE id = ?");
$stmt->bind_param("si", $newName, $id);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => $conn->error]);
}

$stmt->close();
$conn->close();
?>