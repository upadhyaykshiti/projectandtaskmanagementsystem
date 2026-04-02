import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useTriggerExport, useExportStatus, useExportHistory } from "../hooks/index";
import { ExportStatus } from "../types/api";

const STATUS_LABEL: Record<ExportStatus, string> = {
  pending: "Queued...",
  processing: "Generating CSV...",
  completed: "Export ready",
  failed: "Export failed",
};

interface ExportSectionProps {
  projectId: string;
}

export function ExportSection({ projectId }: ExportSectionProps) {
  const [activeExportId, setActiveExportId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const triggerExport = useTriggerExport(projectId);
  const { data: exportStatus } = useExportStatus(activeExportId, isPolling);
  const { data: history } = useExportHistory();

  const projectHistory = history?.filter((e) => e.projectId === projectId) ?? [];

  // const shouldPoll  =
  //   activeExportId &&
  //   exportStatus?.status !== "completed" &&
  //   exportStatus?.status !== "failed";

  // Stop polling when terminal status reached
  // if (exportStatus?.status === "completed" && shouldPoll ) {
  //   setIsPolling(false);
  // }
  // if (exportStatus?.status === "failed" && shouldPoll ) {
  //   setIsPolling(false);
  //   toast.error("Export failed. Please try again.");
  //   setActiveExportId(null);
  // }

  useEffect(() => {
  if (!exportStatus) return;

  if (exportStatus.status === "completed") {
    setIsPolling(false);
  }

  if (exportStatus.status === "failed") {
    setIsPolling(false);
    toast.error("Export failed. Please try again.");
    setActiveExportId(null);
  }
}, [exportStatus]);

  const handleExport = async () => {
    try {
      const result = await triggerExport.mutateAsync();
      setActiveExportId(result.id);
      setIsPolling(true);
    } catch {
      toast.error("Failed to trigger export");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleExport}
          disabled={triggerExport.isPending || isPolling}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:border-gray-400 disabled:opacity-60"
        >
          {isPolling ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {exportStatus ? STATUS_LABEL[exportStatus.status] : "Exporting..."}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </>
          )}
        </button>

        {exportStatus?.status === "completed" && exportStatus.filePath && (
          <a
            href={`http://localhost:4000${exportStatus.filePath}`}
            download
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Download CSV
          </a>
        )}
      </div>

      {/* Export history */}
      {projectHistory.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {showHistory ? "Hide" : "Show"} export history ({projectHistory.length})
          </button>

          {showHistory && (
            <div className="mt-2 space-y-1.5">
              {projectHistory.map((exp) => (
                <div key={exp.id} className="flex items-center gap-3 text-xs text-gray-500">
                  <span
                    className={`font-medium ${
                      exp.status === "completed"
                        ? "text-green-600"
                        : exp.status === "failed"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {exp.status}
                  </span>
                  <span>{new Date(exp.createdAt).toLocaleString()}</span>
                  {exp.status === "completed" && exp.filePath && (
                    <a
                      href={`http://localhost:4000${exp.filePath}`}
                      download
                      className="text-indigo-600 hover:underline"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}