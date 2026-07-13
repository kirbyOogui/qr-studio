import { useCallback, useState, type DragEvent } from "react";

interface UseDragAndDropFileArgs {
  onFile: (file: File) => void;
}

export function useDragAndDropFile({ onFile }: UseDragAndDropFileArgs) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const onDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
      const file = event.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return { isDraggingOver, onDragOver, onDragLeave, onDrop };
}
