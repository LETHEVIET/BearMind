import { useEditor, EditorContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import HardBreak from "@tiptap/extension-hard-break";
import {
  useCallback,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { LucideIcon } from "lucide-react";
import {
  Text as Texticon,
  CheckCheck,
  ArrowDownWideNarrow,
} from "lucide-react";
import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
// You can also use StarterKit instead of individual extensions
// import StarterKit from '@tiptap/starter-kit';

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

interface CommandItem {
  text: string;
  icon: LucideIcon;
  colors: {
    icon: string;
    border: string;
    bg: string;
  };
  prompt?: string;
}

const DEFAULT_COMMAND: CommandItem[] = [
  {
    text: "Summary",
    icon: Texticon,
    colors: {
      icon: "text-orange-600",
      border: "border-orange-500",
      bg: "bg-orange-100",
    },
    prompt: "Generate a concise summary of the text",
  },
  {
    text: "Fix Spelling and Grammar",
    icon: CheckCheck,
    colors: {
      icon: "text-emerald-600",
      border: "border-emerald-500",
      bg: "bg-emerald-100",
    },
    prompt: "Correct spelling and grammar errors",
  },
  {
    text: "Make shorter",
    icon: ArrowDownWideNarrow,
    colors: {
      icon: "text-purple-600",
      border: "border-purple-500",
      bg: "bg-purple-100",
    },
    prompt: "Condense the text to be more concise",
  },
];

// Command suggestion component
const CommandList = forwardRef(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index) => {
    const item = items[index];
    if (item) {
      command({ id: item.text });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        enterHandler();
        return true;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        command(null);
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 p-1 rounded shadow-lg border overflow-hidden max-h-[200px] overflow-y-auto">
      {items.length ? (
        items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              className={`flex items-center gap-2 p-2 rounded ${
                selectedIndex === index ? "bg-primary/20" : "hover:bg-muted"
              }`}
              onClick={() => selectItem(index)}
            >
              <div className={`p-1 rounded ${item.colors.bg}`}>
                <Icon className={`h-4 w-4 ${item.colors.icon}`} />
              </div>
              <span>{item.text}</span>
            </button>
          );
        })
      ) : (
        <div className="p-2 text-muted-foreground">No result</div>
      )}
    </div>
  );
});

export function TipTapEditor({
  value,
  onChange,
  onSubmit,
  placeholder,
}: Readonly<TipTapEditorProps>) {
  // Add state to track if command menu is active
  const [isCommandMenuActive, setIsCommandMenuActive] = useState(false);

  // Initialize editor first
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      HardBreak.configure({
        HTMLAttributes: {
          class: "my-hard-break",
        },
      }),
      // Add the Mention extension for command suggestions
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },   
        suggestion: {
          char: "/",
          items: ({ query }) => {
            return DEFAULT_COMMAND.filter((item) =>
              item.text.toLowerCase().startsWith(query.toLowerCase())
            ).slice(0, 5);
          },
          render: () => {
            let component;
            let popup;

            return {
              onStart: (props) => {
                // Set command menu as active when it opens
                setIsCommandMenuActive(true);

                component = new ReactRenderer(CommandList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },

              onUpdate(props) {
                component.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  popup[0].hide();
                  return true;
                }

                return component.ref?.onKeyDown(props);
              },

              onExit() {
                // Set command menu as inactive when it closes
                setIsCommandMenuActive(false);

                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
      // Or you could use StarterKit instead of individual extensions
      // StarterKit,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
    },
    editorProps: {
      attributes: {
        class:
          "w-full px-1 border-none bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-xs min-h-[24px] max-h-[500px] overflow-y-auto resize-none outline-none",
        style: "min-height: 24px",
      },
    },
    parseOptions: {
      preserveWhitespace: "full",
    },
  });

  // Then use editor in the callback
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // If command menu is active, don't handle the Enter key here
      if (e.key === "Enter" && isCommandMenuActive) {
        return;
      }

      // Custom handler for Enter key
      if (e.key === "Enter") {
        console.log("isCommandMenuActive", isCommandMenuActive);
        e.preventDefault();

        // If Shift+Enter, insert a new line
        if (e.shiftKey) {
          // editor?.commands.insertContent('\n');
        } else {
          // If Ctrl+Enter, submit the content
          if (e.ctrlKey) {
            // If just Enter, clear the content
            onSubmit?.();
            editor?.commands.clearContent();
          }
        }
      }
    },
    [onSubmit, editor, isCommandMenuActive]
  );

  // Handle placeholder text
  const isEmpty = editor?.isEmpty ?? true;

  return (
    <div className="relative w-full">
      <EditorContent
        editor={editor}
        onKeyDown={handleKeyDown}
        className="w-full"
      />
      {isEmpty && placeholder && (
        <div className="absolute top-0 left-1 text-muted-foreground pointer-events-none text-xs">
          {placeholder}
        </div>
      )}
    </div>
  );
}
