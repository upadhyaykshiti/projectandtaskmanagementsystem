import { Worker, Job } from "bullmq";
import path from "path";
import fs from "fs/promises";
import { stringify } from "csv-stringify/sync";
import { redis } from "../config/redis";
import { prisma } from "../config/db";

interface ExportJobData {
  exportId: string;
  projectId: string;
  userId: string;
}

async function processExport(job: Job<ExportJobData>): Promise<void> {
  const { exportId, projectId } = job.data;

  // Mark as processing
  await prisma.export.update({
    where: { id: exportId },
    data: { status: "processing" },
  });

  // Fetch project + all tasks with assignee names
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        include: {
          assignee: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) throw new Error(`Project ${projectId} not found`);

  // Build CSV rows
  const rows: string[][] = [];

  // Section 1: Project details header
  rows.push(["PROJECT DETAILS"]);
  rows.push(["Name", "Description", "Created At"]);
  rows.push([
    project.name,
    project.description ?? "",
    project.createdAt.toISOString(),
  ]);

  rows.push([]); // blank line

  // Section 2: Tasks
  rows.push(["TASKS"]);
  rows.push(["Title", "Status", "Priority", "Assignee", "Due Date", "Created At"]);

  for (const task of project.tasks) {
    rows.push([
      task.title,
      task.status,
      task.priority,
      task.assignee?.name ?? "Unassigned",
      task.dueDate ? task.dueDate.toISOString().split("T")[0] : "",
      task.createdAt.toISOString(),
    ]);
  }

  rows.push([]); // blank line

  // Section 3: Summary
  const totalTasks = project.tasks.length;
  const byStatus = {
    todo: project.tasks.filter((t) => t.status === "todo").length,
    in_progress: project.tasks.filter((t) => t.status === "in_progress").length,
    done: project.tasks.filter((t) => t.status === "done").length,
  };
  const byPriority = {
    low: project.tasks.filter((t) => t.priority === "low").length,
    medium: project.tasks.filter((t) => t.priority === "medium").length,
    high: project.tasks.filter((t) => t.priority === "high").length,
  };

  rows.push(["SUMMARY"]);
  rows.push(["Total Tasks", String(totalTasks)]);
  rows.push(["Todo", String(byStatus.todo)]);
  rows.push(["In Progress", String(byStatus.in_progress)]);
  rows.push(["Done", String(byStatus.done)]);
  rows.push(["Low Priority", String(byPriority.low)]);
  rows.push(["Medium Priority", String(byPriority.medium)]);
  rows.push(["High Priority", String(byPriority.high)]);

  const csvContent = stringify(rows);

  // Ensure exports directory exists
  const exportsDir = path.resolve(process.cwd(), "exports");
  await fs.mkdir(exportsDir, { recursive: true });

  const filePath = path.join(exportsDir, `${exportId}.csv`);
  await fs.writeFile(filePath, csvContent, "utf-8");

  // Mark as completed
  await prisma.export.update({
    where: { id: exportId },
    data: {
      status: "completed",
      filePath: `/exports/${exportId}.csv`,
      completedAt: new Date(),
    },
  });
}

export function startExportWorker(): void {
  const worker = new Worker<ExportJobData>("exports", processExport, {
    connection: redis,
    concurrency: 5,
  });

  worker.on("failed", async (job, err) => {
    console.error(`Export job ${job?.id} failed:`, err.message);

    // Only mark failed after all retries exhausted
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      await prisma.export.update({
        where: { id: job.data.exportId },
        data: { status: "failed" },
      });
    }
  });

  worker.on("completed", (job) => {
    console.log(`Export job ${job.id} completed`);
  });

  console.log("Export worker started");
}