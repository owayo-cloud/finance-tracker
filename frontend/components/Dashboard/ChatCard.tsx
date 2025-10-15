import { MessageSquare, Send } from "lucide-react";

interface Message {
  id: number;
  user: string;
  message: string;
  time: string;
  isOwn?: boolean;
}

const messages: Message[] = [
  {
    id: 1,
    user: "Devid Heilo",
    message: "Hello, how are you?",
    time: "10 min ago",
  },
  {
    id: 2,
    user: "Henry Fisher",
    message: "Waiting for your reply!",
    time: "5 min ago",
  },
  {
    id: 3,
    user: "You",
    message: "I'm good, thanks!",
    time: "1 min ago",
    isOwn: true,
  },
];

export default function ChatCard() {
  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Chats
          </h4>
        </div>
        <div>
          <button className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white hover:bg-opacity-90">
            <MessageSquare size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.isOwn ? "justify-end" : ""}`}
          >
            {!message.isOwn && (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">
                  {message.user.charAt(0)}
                </span>
              </div>
            )}
            <div className={`flex-1 ${message.isOwn ? "text-right" : ""}`}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-sm font-medium text-black dark:text-white">
                  {message.user}
                </span>
                <span className="text-xs">{message.time}</span>
              </div>
              <div
                className={`inline-block rounded-md px-4 py-2 ${
                  message.isOwn
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-meta-4"
                }`}
              >
                <p className="text-sm">{message.message}</p>
              </div>
            </div>
            {message.isOwn && (
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-white">
                  {message.user.charAt(0)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="relative">
          <input
            type="text"
            placeholder="Type something here"
            className="w-full rounded-md border border-stroke bg-gray py-3 pl-5 pr-19 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
          />
          <button className="absolute bottom-2 right-4 flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white hover:bg-opacity-90">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}