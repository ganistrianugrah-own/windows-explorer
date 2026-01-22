import { Request, Response } from "express";
import { db } from "../db";

export const getAllFolders = async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query("SELECT * FROM folder");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const getChildrenFolders = async (req: Request, res: Response) => {
  try {
    const parentId = req.params.id;
    const [rows] = await db.query("SELECT * FROM folder WHERE parent_id = ?", [parentId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
