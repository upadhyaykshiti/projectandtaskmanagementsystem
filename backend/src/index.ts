



import express from "express";
import cors from "cors";
import { authRouter } from "../src/routes/auth.routes";
import { projectsRouter } from "../src/routes/project.routes";
import { tasksRouter } from "../src/routes/task.routes";
import { exportRouter } from "../src/routes/export.routes";
import { errorHandler } from "../src/middleware/error";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());



// Routes
app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/export", exportRouter);
app.use("/api/projects", exportRouter);



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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;