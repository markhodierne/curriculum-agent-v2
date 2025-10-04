import ChatAssistant from "@/components/chat/chat-assistant";
import Image from "next/image";

export default function Home() {
  return (
    <div className="h-screen bg-background flex flex-col max-w-4xl mx-auto overflow-hidden">
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <Image
            src="/oak-logo-transparent.png"
            alt="Oak Logo"
            width={32}
            height={32}
            className="object-contain"
          />
          <h1 className="text-xl font-semibold">Oak Curriculum Agent</h1>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatAssistant api="/api/oak-curriculum-agent" />
      </div>
    </div>
  );
}
