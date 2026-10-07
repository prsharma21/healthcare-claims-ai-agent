import { useState } from "react";

import { InfoGrid, InfoItem } from "@/components/common/InfoItem";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RAGSource } from "@/types/rag";

import { RAGEvidenceCard, documentTypeLabels } from "./RAGEvidenceCard";

export function RAGSourceList({ sources }: { sources: RAGSource[] }) {
  const [selected, setSelected] = useState<RAGSource | null>(null);

  return (
    <>
      <div className="flex flex-col gap-3">
        {sources.map((source, index) => (
          <RAGEvidenceCard key={source.id} source={source} rank={index + 1} onViewSource={setSelected} />
        ))}
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Source document</DialogTitle>
            <DialogDescription>
              The PDF viewer is not available yet. It will open documents from Amazon S3 once the backend is connected.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <InfoGrid>
              <InfoItem label="Document" value={selected.documentName} mono className="sm:col-span-2" />
              <InfoItem label="Type" value={documentTypeLabels[selected.documentType]} />
              <InfoItem label="Page" value={selected.page} />
              <InfoItem label="Section" value={selected.section} className="sm:col-span-2" />
              <InfoItem label="Excerpt" value={<span className="font-normal">&ldquo;{selected.excerpt}&rdquo;</span>} className="sm:col-span-2" />
            </InfoGrid>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
