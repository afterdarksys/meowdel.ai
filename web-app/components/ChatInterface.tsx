'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/types/chat';
import type { BrowserIDUser } from '@/types/browserid';
import { useCatPersonality } from '@/lib/useBrowserID';
import EmojiPicker from './EmojiPicker';

interface ChatInterfaceProps {
  catnipMode: boolean;
  user?: BrowserIDUser | null;
  browserID?: string | null;
}

const CAT_SOUNDS = ['*meow*', '*mrrp*', '*purr*', '*mrow*'];
const CAT_ACTIONS = ['*tail swish*', '*ear twitch*', '*kneads paws*', '*stretches*'];

export default function ChatInterface({ catnipMode, user, browserID }: ChatInterfaceProps) {
  const { personality, recordBugSolved, increaseAffinity } = useCatPersonality();

  // Generate personalized welcome message
  const getWelcomeMessage = (): string => {
    if (!user) {
      return '*stretches and yawns*\n\nMeow! Welcome to Meowdel!\n\nI\'m Claude, but with EXTRA cat energy! Ask me anything, and I\'ll help you out... probably after I finish this nap. *purr*\n\nTry mentioning "catnip", "mouse", or "laser pointer" if you want to see something fun!';
    }

    const isReturning = user.sessionCount > 1;
    const affinity = user.catPersonality.affinity;

    if (isReturning) {
      if (affinity > 80) {
        return `*PURRS LOUDLY* ${user.name || 'Friend'}! You're back! *rubs against screen*\n\nI've missed you SO much! Ready to write some amazing code together? We make a great team!\n\n*happy tail swishes*`;
      } else if (affinity > 60) {
        return `*tail swish* Hey there! Welcome back!\n\nGood to see you again. What are we working on today? *stretches*`;
      } else {
        return `*meow* Oh, it's you. *yawns*\n\nBack for more debugging, I see. Alright, let's get to work. *sits on keyboard*`;
      }
    } else {
      return `*stretches and yawns*\n\nMeow! Nice to meet you!\n\nI'm Meowdel - your AI coding cat! I'll remember you next time with my special BrowserID memory powers!\n\nLet's write some code! *purr*`;
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCatReaction = (text: string): string | null => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('catnip')) {
      return `*PUPILS DILATE TO MAXIMUM*
*ZOOOOOOOOOOM*
*runs up wall*
*parkours off furniture*
MEOW MEOW MEOW!!!
*crashes into something*
*shakes head*
...okay I'm good now *licks paw sheepishly*

`;
    }

    if (lowerText.includes('mouse')) {
      return `MOUSE?! WHERE?!
*ears perk up*
*gets into pounce position*
Oh wait... you mean the COMPUTER mouse?
*swats at cursor*
*tries to catch pointer*
Dang it, it got away...

`;
    }

    if (lowerText.includes('laser') || lowerText.includes('red dot')) {
      return `*freezes*
*stares intensely*
THE DOT.
*pounce* *pounce* *pounce*
*slides across floor*
WHERE DID IT GO?!

`;
    }

    return null;
  };

  const catifyResponse = (text: string): string => {
    const reaction = getCatReaction(text);
    if (reaction) {
      return reaction + text;
    }

    // Get meow frequency from personality
    const meowFrequency = personality?.meowFrequency || 'moderate';
    const frequencyMap = {
      rare: 0.2,      // 20% chance of cat sounds
      moderate: 0.5,  // 50% chance
      chatty: 0.8     // 80% chance
    };
    const meowChance = frequencyMap[meowFrequency];

    // Add random cat sounds/actions based on user preference
    const lines = text.split('\n');
    const catifiedLines: string[] = [];

    // Opening cat behavior
    if (Math.random() < meowChance) {
      catifiedLines.push(
        CAT_ACTIONS[Math.floor(Math.random() * CAT_ACTIONS.length)]
      );
      catifiedLines.push('');
    }

    lines.forEach((line, i) => {
      catifiedLines.push(line);
      // Randomly insert cat sounds based on frequency
      if (i < lines.length - 1 && Math.random() < meowChance && line.length > 20) {
        catifiedLines.push(
          Math.random() > 0.5
            ? CAT_SOUNDS[Math.floor(Math.random() * CAT_SOUNDS.length)]
            : CAT_ACTIONS[Math.floor(Math.random() * CAT_ACTIONS.length)]
        );
      }
    });

    // Closing meow (based on frequency)
    if (Math.random() < meowChance) {
      catifiedLines.push('');
      catifiedLines.push(
        CAT_SOUNDS[Math.floor(Math.random() * CAT_SOUNDS.length)]
      );
    }

    return catifiedLines.join('\n');
  };

  const simulateResponse = async (userMessage: string): Promise<string> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Mock intelligent cat responses
    const responses = [
      "That's a great question! Let me think about it while I lick my paw...\n\n*thinking*\n\nOkay, here's my take: The best approach is to break it down into smaller pieces, kind of like how I break down a laser pointer hunt into strategic pounces!",
      "Interesting! You know what? This reminds me of debugging - it's like hunting mice in the code. You gotta be patient, watch carefully, and pounce at exactly the right moment!\n\nHere's what I'd suggest: start with the obvious issues first, then work your way to the sneaky bugs hiding in the corners.",
      "Ooh, I know this one! *perks up*\n\nSo basically, you want to approach this like organizing a proper scratching post - structure is everything! Make sure your foundation is solid before you start building up.",
      "*stops grooming*\n\nYou know, that's actually a pretty clever idea! I'd add that you should also consider the performance implications. Nobody likes slow code - it's like waiting for treats. Unacceptable! *meow*",
      "Let me knock some knowledge off the counter for you! 📚\n\n*swats gently*\n\nThe key here is to think about scalability. Will this work when you have 10 users? 100? 10,000? Always plan for growth - like how my toy collection keeps growing!",
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    return catifyResponse(response);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await simulateResponse(input);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '*hisses at error*\n\nSorry, something went wrong! Even cats make mistakes sometimes... *licks paw sheepishly*',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10">
      {/* Messages area */}
      <div className="h-[600px] overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/10 backdrop-blur-md text-purple-50 border border-white/10'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <img src="/gallery/meowdel_being_petted.png" alt="Meowdel" className="w-8 h-8 rounded-full" />
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      Meowdel
                    </span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`text-xs mt-2 ${
                    message.role === 'user'
                      ? 'text-purple-100'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-6 py-4">
              <div className="flex items-center gap-2">
                <motion.img
                  src="/gallery/meowdel_being_petted.png"
                  alt="Meowdel typing"
                  className="w-8 h-8 rounded-full"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
                <span className="text-gray-600 dark:text-gray-400">
                  *typing* {CAT_SOUNDS[Math.floor(Math.random() * CAT_SOUNDS.length)]}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-white/10 p-4 bg-white/5 backdrop-blur-md"
      >
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="*meow* Ask me anything..."
              className="w-full px-6 py-3 pr-12 rounded-full border-2 border-white/20 focus:border-purple-400 outline-none bg-white/10 text-white placeholder-purple-200"
              disabled={isTyping}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <EmojiPicker onEmojiSelect={(emoji) => setInput(input + emoji)} />
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isTyping || !input.trim()}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </motion.button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Try saying "catnip", "mouse", or "laser pointer"!
        </p>
      </form>
    </div>
  );
}
