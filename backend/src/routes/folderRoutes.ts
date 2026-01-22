import { Router } from "express";
import { getAllFolders, getChildrenFolders } from "../controllers/folderController";

const router = Router();

router.get("/", getAllFolders); // Ambil semua folder
router.get("/:id/children", getChildrenFolders); // Ambil subfolder

export default router;
