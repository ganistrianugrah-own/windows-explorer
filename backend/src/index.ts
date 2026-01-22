import express from "express";
import dotenv from "dotenv";
import folderRoutes from "./routes/folderRoutes";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/folders", folderRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
