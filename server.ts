import { initTRPC } from "@trpc/server";
import net from "node:net";
import { z } from "zod";
import { schemaRequestMessageTCP } from "./schemas";

const t = initTRPC.create();

const appRouter = t.router({
  hello1: t.procedure.query(() => {
    return "Hi 1";
  }),
  hello2: t.procedure.query(() => {
    return "Hi 2";
  }),
});
export type AppRouter = typeof appRouter;

const tcpServer = net.createServer((socket) => {
  console.log("Connected");
  let buffer = "";

  socket.on("data", (data) => {
    const packet = data.toString();
    // We detect end of the message by the newline character `\n`
    if (packet.includes("\n")) {
      const [lastPart, ...rest] = packet.split("\n");
      const reminder = rest.at(-1) ?? "";
      const message = buffer + lastPart;
      const messages = [message, ...rest.slice(0, -1)];
      handleMessages(messages, socket);
      buffer = reminder;
    }
  });

  socket.on("end", () => {
    console.log("Disconnected");
  });
});

tcpServer.listen(3000, "localhost");

async function handleMessages(messages: string[], socket: net.Socket) {
  // TODO Change to Promise.all() for parallel processing
  for await (const message of messages) {
    console.log("Handle message:", message);
    const { id, input, path, type } = schemaRequestMessageTCP.parse(
      JSON.parse(message)
    );
    console.log("Done Handling message:", message);

    const output = await appRouter._def.procedures[path]({
      ctx: {},
      getRawInput: () => message,
      input,
      path,
      type,
    });
    socket.write(JSON.stringify({ id, path, type, output }) + "\n");
  }
}
