"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useEditor, EditorContent, ReactRenderer, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { Bold, Italic, Code, List, ListOrdered } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Member = { id: string; name: string };

interface MentionListProps {
  items: Member[];
  command: (item: { id: string; label: string }) => void;
}

const MentionList = forwardRef<
  { onKeyDown: (p: { event: KeyboardEvent }) => boolean },
  MentionListProps
>(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);
  useEffect(() => setSelected(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowDown") {
        setSelected((s) => (s + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelected((s) => (s - 1 + items.length) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === "Enter") {
        const item = items[selected];
        if (item) command({ id: item.id, label: item.name });
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="min-w-40 rounded-md border bg-popover p-1 shadow-md">
      {items.length === 0 && (
        <div className="px-2 py-1 text-xs text-muted-foreground">Sem resultados</div>
      )}
      {items.map((m, i) => (
        <button
          key={m.id}
          type="button"
          onClick={() => command({ id: m.id, label: m.name })}
          className={cn(
            "block w-full rounded px-2 py-1 text-left text-sm",
            i === selected && "bg-accent"
          )}
        >
          {m.name}
        </button>
      ))}
    </div>
  );
});
MentionList.displayName = "MentionList";

function ToolbarBtn({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "rounded p-1 text-muted-foreground hover:bg-accent",
        active && "bg-accent text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function buildMention(members: Member[]) {
  return Mention.configure({
    HTMLAttributes: { class: "rounded bg-primary/10 px-1 text-primary" },
    suggestion: {
      items: ({ query }) =>
        members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5),
      render: () => {
        let component: ReactRenderer<{
          onKeyDown: (p: { event: KeyboardEvent }) => boolean;
        }> | null = null;
        let popup: HTMLDivElement | null = null;

        const updatePos = (props: { clientRect?: (() => DOMRect | null) | null }) => {
          const rect = props.clientRect?.();
          if (rect && popup) {
            popup.style.left = `${rect.left + window.scrollX}px`;
            popup.style.top = `${rect.bottom + window.scrollY + 4}px`;
          }
        };

        return {
          onStart: (props) => {
            component = new ReactRenderer(MentionList, { props, editor: props.editor });
            popup = document.createElement("div");
            popup.style.position = "absolute";
            popup.style.zIndex = "9999";
            document.body.appendChild(popup);
            popup.appendChild(component.element);
            updatePos(props);
          },
          onUpdate: (props) => {
            component?.updateProps(props);
            updatePos(props);
          },
          onKeyDown: (props) => {
            if (props.event.key === "Escape") {
              popup?.remove();
              return true;
            }
            return component?.ref?.onKeyDown(props) ?? false;
          },
          onExit: () => {
            popup?.remove();
            component?.destroy();
          },
        };
      },
    },
  });
}

export function CommentEditor({
  members,
  onSubmit,
  submitLabel = "Comentar",
  initialHTML = "",
  onCancel,
  autoFocus,
}: {
  members: Member[];
  onSubmit: (html: string) => void;
  submitLabel?: string;
  initialHTML?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const editor = useEditor({
    extensions: [StarterKit, buildMention(members)],
    content: initialHTML,
    immediatelyRender: false,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class:
          "min-h-16 px-3 py-2 text-sm focus:outline-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1",
      },
    },
  });

  if (!editor) return <div className="rounded-md border" />;

  function submit() {
    const html = editor!.getHTML();
    onSubmit(html);
    editor!.commands.clearContent();
  }

  return (
    <div className="rounded-md border">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="flex items-center justify-end gap-2 border-t p-1.5">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="button" size="sm" onClick={submit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex items-center gap-1 border-b p-1">
      <ToolbarBtn
        label="Negrito"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        label="Itálico"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        label="Código"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        label="Lista"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        label="Lista numerada"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarBtn>
    </div>
  );
}
