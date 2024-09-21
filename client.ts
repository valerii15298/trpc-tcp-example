import { createTRPCClient, TRPCLink, httpLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import net from "node:net";
import { AppRouter } from "./server";
import { RequestMessageTCP, schemaResponseMessageTCP } from "./schemas";

let buffer = "";

const tcpClient = net.createConnection({ port: 3000 }, () => {
  console.log("Connected");
});

tcpClient.on("data", (data) => {
  const packet = data.toString();
  // We detect end of the message by the newline character `\n`
  if (packet.includes("\n")) {
    const [lastPart, ...rest] = packet.split("\n");
    const reminder = rest.at(-1) ?? "";
    const message = buffer + lastPart;
    const messages = [message, ...rest.slice(0, -1)];
    handleResponses(messages);
    buffer = reminder;
  }
});

const runningRequests = new Map<string, (data: unknown) => void>();

function handleResponses(messages: string[]) {
  messages.forEach((message) => {
    const { id, output } = schemaResponseMessageTCP.parse(JSON.parse(message));
    const resolver = runningRequests.get(id);
    resolver?.(output);
    runningRequests.delete(id);
  });
}

tcpClient.on("end", () => {
  console.log("Disconnected");
});

tcpClient.on("error", (err) => {
  console.error(`Error: ${err}`);
});

async function send(msg: RequestMessageTCP) {
  const id = msg.id;
  const serializedMsg = JSON.stringify(msg);

  const promise = new Promise((resolve) => {
    runningRequests.set(id, resolve);
  });
  tcpClient.write(serializedMsg + "\n");
  return promise;
}

const tcpLink: TRPCLink<AppRouter> = () => {
  return ({ op }) => {
    return observable((observer) => {
      send({
        id: op.id.toString(),
        type: op.type,
        path: op.path,
        input: op.input,
      }).then((data) => observer.next({ result: { data } }));
    });
  };
};

const trpcClient = createTRPCClient<AppRouter>({
  links: [tcpLink],
});

// Example usage

const respFromHello1 = await trpcClient.hello1.query();
console.log(respFromHello1);

const respFromHello2 = await trpcClient.hello2.query();
console.log(respFromHello2);
