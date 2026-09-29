"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type Props = {
  id?: string;
  content?: string;
  placeholder?: string;
  onChange: (html: string) => void;
};

export default function RichTextEditor({ id, content = "", onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // empty editor returns "<p></p>", so send "" instead
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
    editorProps: {
      attributes: {
        id: id ?? "",
        class:
          "rich-text-content prose max-w-none min-h-[200px] rounded-b-md border border-border bg-background px-3 py-2 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  const btn = (active: boolean) =>
    `rounded px-2.5 py-1 text-sm font-medium ${
      active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
    }`;

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-md border border-b-0 border-border bg-muted/50 p-2">
        <button
          type="button"
          className={btn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </button>
        <button
          type="button"
          className={btn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </button>
        <button
          type="button"
          className={btn(editor.isActive("heading", { level: 2 }))}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </button>
        <button
          type="button"
          className={btn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </button>
        <button
          type="button"
          className={btn(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </button>
        <button
          type="button"
          className={btn(editor.isActive("blockquote"))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
