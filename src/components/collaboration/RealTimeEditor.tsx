"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Editor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

interface RealTimeEditorProps {
  documentId: string;
  initialContent?: string;
}

const RealTimeEditor: React.FC<RealTimeEditorProps> = ({
  documentId,
  initialContent = "",
}) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [editor, setEditor] = useState<Editor | null>(null);
  const [collaborators, setCollaborators] = useState<string[]>([]);

  useEffect(() => {
    // Initialize Yjs document
    const ydoc = new Y.Doc();

    // Initialize the Hocuspocus provider
    const provider = new HocuspocusProvider({
      url: "ws://localhost:1234", // You'll need to set up a Hocuspocus server
      name: documentId, // Using the document ID as the room name
      document: ydoc,
    });

    const newEditor = new Editor({
      extensions: [
        StarterKit,
        Collaboration.configure({
          document: ydoc,
        }),
      ],
      content: initialContent,
      onUpdate: ({ editor }) => {
        // Save content to Supabase
        supabase.from("documents").upsert({
          id: documentId,
          content: editor.getHTML(),
          last_modified: new Date().toISOString(),
        });
      },
    });

    setEditor(newEditor);

    // Track collaborators
    if (provider.awareness) {
      provider.awareness.on("change", () => {
        const users = Array.from(provider.awareness.getStates().values())
          .map((state: any) => state.user?.name)
          .filter(Boolean);
        setCollaborators([...new Set(users)]);
      });
    }

    return () => {
      provider.destroy();
      newEditor.destroy();
    };
  }, [documentId, initialContent, supabase]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="real-time-editor">
      <div className="collaborators">
        {collaborators.map((user, index) => (
          <span key={index} className="collaborator-badge">
            {user}
          </span>
        ))}
      </div>
      <EditorContent editor={editor} />
      <style jsx>{`
        .real-time-editor {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 20px;
        }
        .collaborators {
          margin-bottom: 10px;
        }
        .collaborator-badge {
          background: #e2e8f0;
          padding: 2px 8px;
          border-radius: 12px;
          margin-right: 5px;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default RealTimeEditor;
