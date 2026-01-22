<?php
require_once 'db_config.php';
$id = $_POST['id'];
// Logika hapus folder (idealnya hapus subfolder juga secara rekursif)
$conn->query("DELETE FROM folders WHERE id = $id OR parent_id = $id");
echo json_encode(['status' => 'success']);