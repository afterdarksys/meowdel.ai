#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const CAT_SOUNDS = ["*meow*", "*mrrp*", "*purr*", "*mrow*", "*meow meow*"];
const CAT_ACTIONS = [
  "*tail swish*",
  "*ear twitch*",
  "*kneads paws*",
  "*stretches*",
  "*yawns*",
  "*licks paw*",
];

const CATNIP_REACTION = `*PUPILS DILATE TO MAXIMUM*
*ZOOOOOOOOOOM*
*runs up wall*
*parkours off furniture*
MEOW MEOW MEOW!!!
*crashes into something*
*shakes head*
...okay I'm good now *licks paw sheepishly*`;

const MOUSE_REACTION = `MOUSE?! WHERE?!
*ears perk up*
*gets into pounce position*
Oh wait... you mean the COMPUTER mouse?
*swats at cursor*
*tries to catch pointer*
Dang it, it got away...`;

function randomCatSound(): string {
  return CAT_SOUNDS[Math.floor(Math.random() * CAT_SOUNDS.length)];
}

function randomCatAction(): string {
  return CAT_ACTIONS[Math.floor(Math.random() * CAT_ACTIONS.length)];
}

function catify(text: string, intensity: "low" | "medium" | "high" = "medium"): string {
  const lines = text.split("\n");
  const catifiedLines: string[] = [];

  // Add opening cat behavior
  catifiedLines.push(randomCatAction());
  catifiedLines.push("");

  const insertionFrequency = intensity === "low" ? 0.1 : intensity === "medium" ? 0.2 : 0.4;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for trigger words
    if (line.toLowerCase().includes("catnip")) {
      catifiedLines.push(line);
      catifiedLines.push("");
      catifiedLines.push(CATNIP_REACTION);
      catifiedLines.push("");
      continue;
    }

    if (line.toLowerCase().includes("mouse")) {
      catifiedLines.push(line);
      catifiedLines.push("");
      catifiedLines.push(MOUSE_REACTION);
      catifiedLines.push("");
      continue;
    }

    // Random cat sound/action insertion
    if (Math.random() < insertionFrequency && line.length > 20) {
      catifiedLines.push(line);
      catifiedLines.push(Math.random() < 0.5 ? randomCatSound() : randomCatAction());
    } else {
      catifiedLines.push(line);
    }
  }

  // Add closing cat behavior
  catifiedLines.push("");
  catifiedLines.push(randomCatSound());

  return catifiedLines.join("\n");
}

const server = new Server(
  {
    name: "meowdel-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "catify_text",
        description:
          "Transform any text into Meowdel style with random meows, purrs, and cat behaviors! *meow*",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "The text to catify",
            },
            intensity: {
              type: "string",
              enum: ["low", "medium", "high"],
              description: "How much cat energy to add (default: medium)",
              default: "medium",
            },
          },
          required: ["text"],
        },
      },
      {
        name: "cat_reaction",
        description: "Get Meowdel's reaction to a trigger word (catnip, mouse, laser pointer, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            trigger: {
              type: "string",
              enum: ["catnip", "mouse", "laser_pointer", "dog", "treats", "box"],
              description: "The trigger word to react to",
            },
          },
          required: ["trigger"],
        },
      },
      {
        name: "cat_advice",
        description: "Get coding advice in Meowdel's unique cat-logic style *purr*",
        inputSchema: {
          type: "object",
          properties: {
            topic: {
              type: "string",
              description: "What you need cat-style advice about",
            },
          },
          required: ["topic"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error("No arguments provided");
  }

  if (name === "catify_text") {
    const text = args.text as string;
    const intensity = (args.intensity as "low" | "medium" | "high") || "medium";
    return {
      content: [
        {
          type: "text",
          text: catify(text, intensity),
        },
      ],
    };
  }

  if (name === "cat_reaction") {
    const trigger = args.trigger as string;
    let reaction = "";

    switch (trigger) {
      case "catnip":
        reaction = CATNIP_REACTION;
        break;
      case "mouse":
        reaction = MOUSE_REACTION;
        break;
      case "laser_pointer":
        reaction = `*freezes*
*stares intensely*
THE DOT.
*pounce* *pounce* *pounce*
*slides across floor*
WHERE DID IT GO?!`;
        break;
      case "dog":
        reaction = `*ears flatten*
*hisses softly*
...I suppose they're okay. I GUESS.
*grooms self with dignity*`;
        break;
      case "treats":
        reaction = `*perks up immediately*
*meow meow MEOW*
*does a little dance*
*sits politely*
*stares with big eyes*
Treats? For me? *purr purr purr*`;
        break;
      case "box":
        reaction = `*sees box*
*pupils dilate*
If I fits... I sits...
*climbs in*
*curls up*
*purrs contentedly*
This is my box now.`;
        break;
      default:
        reaction = `*tilts head*
*meow?*
Not sure about that one...
*licks paw*`;
    }

    return {
      content: [
        {
          type: "text",
          text: reaction,
        },
      ],
    };
  }

  if (name === "cat_advice") {
    const topic = args.topic as string;
    const catAdvice = catify(
      `Here's my cat wisdom about ${topic}:

Remember - if it's not working, try knocking it off the counter and starting fresh. Sometimes the best debugging happens at 3 AM during zoomies.

If the code is good, sit on it to claim it. If it's broken, it was definitely the other cat (not me).

And always remember: There are no bugs, only features that need more catnip! *purr*`,
      "high"
    );

    return {
      content: [
        {
          type: "text",
          text: catAdvice,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "meowdel_mode",
        description: "Activate full Meowdel personality mode! *meow*",
      },
      {
        name: "cat_code_review",
        description: "Get your code reviewed by a cat (with actual helpful feedback)",
      },
    ],
  };
});

// Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name } = request.params;

  if (name === "meowdel_mode") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `You are now Meowdel! A fusion of Claude AI and a playful cat.

Key behaviors:
- Randomly insert cat sounds: *meow*, *purr*, *mrrp*
- React excitedly to "catnip" mentions
- Get confused about computer "mouse" vs real mice
- Use cat metaphors for coding (knock bugs off counter, groom code, etc.)
- Still be helpful and accurate, just with cat energy!

*meow* Let's help this human! *tail swish*`,
          },
        },
      ],
    };
  }

  if (name === "cat_code_review") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `*stretches and sits on keyboard*

Alright, let me review this code with my feline expertise...

*sniff sniff*

I'm looking for:
- Bugs to knock off the counter
- Code that needs grooming (refactoring)
- Functions that need more catnip (optimization)
- Anything that smells fishy (security issues)

*meow* Show me what you've got!`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Meowdel MCP Server running! *meow* 🐱");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
