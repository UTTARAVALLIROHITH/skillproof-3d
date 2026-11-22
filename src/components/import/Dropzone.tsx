import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { useState } from "react";
import { cn } from "../../utils/helpers";

/** Drag-and-drop or keyboard-accessible file picker. Validation happens in the importer, not here. */
export function Dropzone({
  accept,
  multiple = false,
  disabled = false,
  title,
  hint,
  onFiles,
}: {
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  title: string;
  hint: string;
  onFiles: (files: File[]) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center gap-3 rounded-3xl border border-dashed p-8 text-center transition-all duration-300 focus-within:ring-2 focus-within:ring-accent",
        over ? "scale-[1.01] border-accent bg-accent/5" : "border-line hover:border-accent/60",
        disabled && "pointer-events-none opacity-50"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) onFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <motion.span animate={{ y: over ? -4 : 0 }} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line">
        <Upload size={20} className="text-accent" aria-hidden="true" />
      </motion.span>
      <span className="text-sm font-medium">{title}</span>
      <span className="max-w-sm text-xs leading-relaxed text-mute">{hint}</span>
      <input
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
    </label>
  );
}
