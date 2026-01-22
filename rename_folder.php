<?php
header('Content-Type: application/json');
require_once 'db_config.php';

$id = $_POST['id'];
$name = $_POST['name'];

$sql = "UPDATE folders SET name = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $name, $id);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => $conn->error]);
}
?>