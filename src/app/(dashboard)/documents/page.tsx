import { getUserDocuments } from "@/server/actions/document";
import { UploadModal } from "@/components/features/documents/UploadModal";
import { DocumentPoller } from "@/components/features/documents/DocumentPoller";
import { FileText, Trash2, Calendar, Tag, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const documents = await getUserDocuments();
  const hasProcessing = documents.some((doc) => doc.status !== "READY");

  return (
    <div className="max-w-[900px] mx-auto py-8 w-full">
      <DocumentPoller hasProcessing={hasProcessing} />
      {/* Header & Actions */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <nav className="flex items-center gap-2 text-label-sm text-on-surface-variant/60 mb-2 font-label-sm">
            <span>Library</span>
            <span>›</span>
            <span className="text-primary/80">My Documents</span>
          </nav>
          <h2 className="text-headline-lg font-headline-lg text-on-surface">Document Library</h2>
          <p className="text-on-surface-variant text-body-md mt-1">
            {documents.length === 0
              ? "Upload PDFs or text files to power your AI Doc Chat."
              : `${documents.length} document${documents.length === 1 ? "" : "s"} · All processed and ready for AI search`}
          </p>
        </div>
        <div className="flex gap-4">
          <UploadModal />
        </div>
      </div>

      {/* Document List */}
      <section>
        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="glass-panel p-16 rounded-2xl text-center text-on-surface-variant border border-dashed border-outline-variant/40 flex flex-col items-center gap-4">
              <FileText className="w-14 h-14 opacity-20" />
              <div>
                <p className="font-semibold text-body-lg text-on-surface">No documents yet</p>
                <p className="text-body-md mt-1">
                  Upload a PDF or text file to start using AI Doc Chat, flashcards, and quizzes.
                </p>
              </div>
              <UploadModal />
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="glass-panel p-5 rounded-xl flex items-center gap-5 group hover:border-primary/30 border border-outline-variant/20 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="text-primary w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-label-md text-on-surface text-base truncate pr-4 group-hover:text-primary transition-colors">
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {doc.title}
                    </a>
                  </h5>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(doc.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {doc.type}
                    </span>
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      {doc._count.chunks} chunks indexed
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {doc.status === "READY" ? (
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[11px] font-bold">
                      Ready
                    </span>
                  ) : doc.status === "FAILED" ? (
                    <span className="px-3 py-1 bg-error/10 text-error rounded-full text-[11px] font-bold">
                      Failed
                    </span>
                  ) : doc.status === "UPLOADING" ? (
                    <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full text-[11px]">
                      Uploading...
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[11px] font-bold animate-pulse">
                      Processing...
                    </span>
                  )}
                  <form
                    action={async () => {
                      "use server";
                      const { deleteDocument } = await import("@/server/actions/document");
                      await deleteDocument(doc.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="p-2 text-on-surface-variant hover:text-error transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
