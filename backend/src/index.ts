

import dotenv from "dotenv";
dotenv.config();


import express from "express";
import cors from "cors";
import { authRouter } from "../src/routes/auth.routes";
import { projectsRouter } from "../src/routes/project.routes";
import { tasksRouter } from "../src/routes/task.routes";
// import { exportRouter } from "../src/routes/export.routes";
import { errorHandler } from "../src/middleware/error";
import { startExportWorker } from "./jobs/export.worker";


const app = express();
const PORT = process.env.PORT ?? 5000;

app.use(cors());
app.use(express.json());



// Routes
app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);
// app.use("/api/export", exportRouter);
// app.use("/api/projects", exportRouter);

console.log("environment = ", process.env.NODE_ENV);
if (process.env.NODE_ENV !== "test") {
  const { exportRouter } = require("./routes/export.routes");
  app.use("/api/exports", exportRouter);
  app.use("/api/projects", exportRouter);

}




// Global error handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
});
app.use(errorHandler);


 // Only start server + worker if NOT testing
 
let server: any;

if (process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  startExportWorker();
}

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

export default app;
export { server };