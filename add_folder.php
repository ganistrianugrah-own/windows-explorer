<?php
require_once 'db_config.php';

header('Content-Type: application/json');

$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$parent_id = isset($_POST['parent_id']) ? $_POST['parent_id'] : 'NULL';

if (empty($name)) {
    echo json_encode(['status' => 'error', 'message' => 'Nama folder tidak boleh kosong']);
    exit;
}

try {

    if ($parent_id === 'NULL' || $parent_id === '' || $parent_id === null) {
        $sql = "INSERT INTO folders (name, parent_id) VALUES (?, NULL)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $name);
    } else {
        $sql = "INSERT INTO folders (name, parent_id) VALUES (?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $name, $parent_id);
    }

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => $conn->error]);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>