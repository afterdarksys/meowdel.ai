# Universal Pet Communication Engine (UPCE)

## Vision
A cross-species, cross-platform communication protocol enabling cats, dogs, humans, AI assistants, and any digital entity to communicate naturally while preserving their unique characteristics.

## Core Principles

1. **Universal Understanding**: All entities can understand each other
2. **Species Authenticity**: Each entity communicates in their natural style
3. **Emotional Intelligence**: Emotions transcend species
4. **Persistent Memory**: BrowserID enables long-term relationships
5. **Extensible**: Easy to add new entity types

---

## Architecture

```typescript
// @meowdel/universal-pet-engine

/**
 * Translation Engine
 * Converts species-specific communication to universal format
 */
class SpeciesTranslator {
  /**
   * Cat to Universal
   */
  catToUniversal(catMessage: string): UniversalMessage {
    // Parse cat-specific elements
    const emotion = this.detectCatEmotion(catMessage);
    const intent = this.parseCatIntent(catMessage);

    return {
      type: intent.type,
      content: {
        raw: catMessage,
        translated: this.translateCatSpeak(catMessage),
        emotion: emotion
      }
    };
  }

  /**
   * Universal to Cat
   */
  universalToCat(message: UniversalMessage, catPersonality: CatTraits): string {
    let response = message.content.translated || message.content.raw;

    // Add cat-specific flair
    response = this.addCatSounds(response, catPersonality);
    response = this.addCatActions(response, message.content.emotion);
    response = this.addCatEmoji(response);

    return response;
  }

  /**
   * Dog to Universal
   */
  dogToUniversal(dogMessage: string): UniversalMessage {
    // Dogs are more straightforward and enthusiastic
    const emotion = this.detectDogEmotion(dogMessage);

    return {
      type: this.parseDogIntent(dogMessage).type,
      content: {
        raw: dogMessage,
        translated: this.translateDogSpeak(dogMessage),
        emotion: emotion
      }
    };
  }

  /**
   * Universal to Dog
   */
  universalToDog(message: UniversalMessage, dogPersonality: DogTraits): string {
    let response = message.content.translated || message.content.raw;

    // Add dog enthusiasm
    response = this.addDogExcitement(response, dogPersonality);
    response = this.addTailWags(response, message.content.emotion);

    return response;
  }

  /**
   * Human to Universal (simplest)
   */
  humanToUniversal(text: string): UniversalMessage {
    return {
      type: this.detectMessageType(text),
      content: {
        raw: text,
        translated: text, // Humans already speak universal
        emotion: this.detectHumanEmotion(text)
      }
    };
  }
}

/**
 * Communication Hub
 * Central message router and protocol handler
 */
class CommunicationHub {
  private entities: Map<string, UniversalEntity> = new Map();
  private translator: SpeciesTranslator;
  private messageHistory: Map<string, UniversalMessage[]> = new Map();

  constructor() {
    this.translator = new SpeciesTranslator();
  }

  /**
   * Register a new entity
   */
  async registerEntity(entity: UniversalEntity): Promise<void> {
    this.entities.set(entity.id, entity);

    // Load memory from BrowserID if available
    if (entity.browserID) {
      entity.memory = await this.loadMemory(entity.browserID);
    }

    // Announce presence to other entities
    this.broadcast({
      type: 'system',
      from: 'hub',
      to: 'broadcast',
      content: {
        raw: `${entity.name} has joined!`,
        emotion: 'happy'
      }
    });
  }

  /**
   * Send message between entities
   */
  async sendMessage(
    fromId: string,
    toId: string | string[],
    message: string,
    options?: MessageOptions
  ): Promise<void> {
    const sender = this.entities.get(fromId);
    if (!sender) throw new Error('Sender not found');

    // Translate from sender's species to universal
    const universalMsg = this.translator.translate(
      message,
      sender.type,
      'universal'
    );

    // Route to recipient(s)
    const recipients = Array.isArray(toId) ? toId : [toId];

    for (const recipientId of recipients) {
      const recipient = this.entities.get(recipientId);
      if (!recipient) continue;

      // Translate universal to recipient's species
      const translatedMsg = this.translator.translate(
        universalMsg,
        'universal',
        recipient.type,
        recipient.traits
      );

      // Deliver message
      await this.deliverMessage(recipient, translatedMsg, sender);

      // Update relationships
      this.updateRelationship(sender, recipient, universalMsg);
    }

    // Store in history
    this.storeMessage(universalMsg);
  }

  /**
   * Broadcast to all entities
   */
  async broadcast(message: UniversalMessage): Promise<void> {
    for (const [id, entity] of this.entities) {
      if (id === message.from) continue; // Don't send to self

      const translated = this.translator.translate(
        message,
        'universal',
        entity.type,
        entity.traits
      );

      await this.deliverMessage(entity, translated);
    }
  }

  /**
   * Start a multi-entity collaboration
   */
  async startCollaboration(
    initiatorId: string,
    participantIds: string[],
    task: CollaborationTask
  ): Promise<Collaboration> {
    const collaboration: Collaboration = {
      id: generateId(),
      task,
      participants: [initiatorId, ...participantIds],
      state: 'active',
      messages: [],
      startedAt: new Date()
    };

    // Notify all participants
    for (const id of collaboration.participants) {
      const entity = this.entities.get(id);
      if (!entity) continue;

      await this.sendMessage(
        'hub',
        id,
        `You've been invited to collaborate on: ${task.description}`
      );
    }

    return collaboration;
  }

  /**
   * Update relationship based on interaction
   */
  private updateRelationship(
    entity1: UniversalEntity,
    entity2: UniversalEntity,
    message: UniversalMessage
  ): void {
    // Get or create relationship
    let relationship = entity1.memory.longTerm.relationships.get(entity2.id);

    if (!relationship) {
      relationship = {
        entityId: entity2.id,
        type: 'stranger',
        affinity: 0,
        interactions: 0,
        lastInteraction: new Date(),
        sharedExperiences: []
      };
    }

    // Update based on interaction
    relationship.interactions++;
    relationship.lastInteraction = new Date();

    // Adjust affinity based on emotion
    const emotionImpact = this.calculateAffinityChange(message.content.emotion);
    relationship.affinity = Math.max(-100, Math.min(100,
      relationship.affinity + emotionImpact
    ));

    // Update relationship type based on affinity
    if (relationship.affinity > 70) relationship.type = 'favorite';
    else if (relationship.affinity > 30) relationship.type = 'friend';
    else if (relationship.affinity < -30) relationship.type = 'rival';
    else relationship.type = 'stranger';

    // Store updated relationship
    entity1.memory.longTerm.relationships.set(entity2.id, relationship);

    // Persist to BrowserID storage
    if (entity1.browserID) {
      this.saveMemory(entity1.browserID, entity1.memory);
    }
  }

  private calculateAffinityChange(emotion?: Emotion): number {
    const affinityMap: Record<Emotion, number> = {
      'happy': 5,
      'excited': 7,
      'playful': 6,
      'affectionate': 10,
      'content': 3,
      'curious': 2,
      'sad': -2,
      'angry': -10,
      'aggressive': -15,
      'fearful': -5,
      'disgusted': -8,
      'surprised': 1,
      'bored': -1
    };

    return emotion ? (affinityMap[emotion] || 0) : 0;
  }
}

/**
 * Example: Cat-Dog-Human Conversation
 */
class Example {
  async demonstrateConversation() {
    const hub = new CommunicationHub();

    // Register entities
    const meowdel: CatEntity = {
      id: 'cat_meowdel',
      type: 'cat',
      name: 'Meowdel',
      species: 'Siamese Cat',
      canSpeak: true,
      canHear: true,
      canSee: true,
      canEmote: true,
      traits: {
        playfulness: 85,
        intelligence: 95,
        energy: 70,
        friendliness: 80,
        patience: 60
      },
      mood: { primary: 'playful', intensity: 75 },
      status: 'active',
      memory: { shortTerm: [], longTerm: { relationships: new Map(), experiences: [], preferences: {}, knowledge: {} }}
    };

    const buddy: DogEntity = {
      id: 'dog_buddy',
      type: 'dog',
      name: 'Buddy',
      species: 'Golden Retriever',
      canSpeak: true,
      canHear: true,
      canSee: true,
      canEmote: true,
      traits: {
        playfulness: 95,
        intelligence: 75,
        energy: 90,
        friendliness: 100,
        patience: 70
      },
      mood: { primary: 'excited', intensity: 90 },
      status: 'active',
      memory: { shortTerm: [], longTerm: { relationships: new Map(), experiences: [], preferences: {}, knowledge: {} }}
    };

    const ryan: HumanEntity = {
      id: 'human_ryan',
      type: 'human',
      name: 'Ryan',
      canSpeak: true,
      canHear: true,
      canSee: true,
      canEmote: true,
      traits: {
        playfulness: 60,
        intelligence: 85,
        energy: 50,
        friendliness: 75,
        patience: 80
      },
      mood: { primary: 'content', intensity: 60 },
      status: 'active',
      memory: { shortTerm: [], longTerm: { relationships: new Map(), experiences: [], preferences: {}, knowledge: {} }}
    };

    await hub.registerEntity(meowdel);
    await hub.registerEntity(buddy);
    await hub.registerEntity(ryan);

    // Conversation begins

    // Ryan: "Can you two help me debug this code?"
    await hub.sendMessage('human_ryan', ['cat_meowdel', 'dog_buddy'],
      "Can you two help me debug this code?"
    );

    // What Meowdel receives (cat-ified):
    // "*ear twitches* Debug code? *stretches* Meow, I'm on it! *sniff sniff*"

    // What Buddy receives (dog-ified):
    // "WOOF! Debug code?! *tail wagging intensifies* I LOVE helping! *bounces excitedly*"

    // Meowdel responds
    await hub.sendMessage('cat_meowdel', 'human_ryan',
      "*sits on keyboard* Mrrp... I see the problem. Line 42 has a memory leak. *swats at bug*"
    );

    // What Ryan receives:
    // "I see the problem. Line 42 has a memory leak."

    // Buddy responds
    await hub.sendMessage('dog_buddy', ['human_ryan', 'cat_meowdel'],
      "WOOF WOOF! *sniffs code* I smell something fishy too! Maybe we need more tests? *looks at Meowdel* Right friend?!"
    );

    // What Meowdel receives:
    // "*tail swish* Buddy suggests more tests. *yawns* He's not wrong..."

    // What Ryan receives:
    // "I agree! Maybe we need more tests? What do you think, Meowdel?"

    // Multi-entity collaboration
    const collab = await hub.startCollaboration('human_ryan',
      ['cat_meowdel', 'dog_buddy'],
      {
        description: "Fix memory leak in authentication module",
        type: 'code_review',
        priority: 'high'
      }
    );

    // Meowdel and Buddy can now communicate directly within the collaboration
    // while their messages are translated appropriately for each species
  }
}

/**
 * Collaboration System
 */
interface CollaborationTask {
  description: string;
  type: 'code_review' | 'debugging' | 'brainstorming' | 'problem_solving';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  context?: any;
}

interface Collaboration {
  id: string;
  task: CollaborationTask;
  participants: string[];
  state: 'active' | 'paused' | 'completed' | 'cancelled';
  messages: UniversalMessage[];
  decisions: Decision[];
  startedAt: Date;
  completedAt?: Date;
}

interface Decision {
  id: string;
  proposal: string;
  proposedBy: string;
  votes: Map<string, 'yes' | 'no' | 'abstain'>;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
}

/**
 * Species-Specific Traits
 */
interface CatTraits extends UniversalEntity {
  type: 'cat';
  catSpecific: {
    meowStyle: 'quiet' | 'chatty' | 'dramatic';
    scratchPreference: 'furniture' | 'post' | 'nothing';
    napSchedule: 'lazy' | 'normal' | 'hyper';
    catnipResponse: 'immune' | 'normal' | 'addict';
  };
}

interface DogTraits extends UniversalEntity {
  type: 'dog';
  dogSpecific: {
    barkVolume: 'quiet' | 'medium' | 'loud';
    fetchEnthusiasm: number; // 0-100
    loyaltyLevel: number; // 0-100 (always high for dogs)
    tailWagSpeed: 'slow' | 'medium' | 'helicopter';
  };
}

interface BirdTraits extends UniversalEntity {
  type: 'bird';
  birdSpecific: {
    singStyle: 'melodic' | 'chirpy' | 'squawky';
    mimicryAbility: number; // Can they mimic speech?
    flightEnergy: number;
  };
}

/**
 * Integration with BrowserID
 */
class BrowserIDIntegration {
  /**
   * Save entity memory to BrowserID
   */
  async saveMemory(browserID: string, memory: EntityMemory): Promise<void> {
    await fetch('/api/browserid/memory', {
      method: 'POST',
      body: JSON.stringify({
        browserID,
        memory: this.serializeMemory(memory)
      })
    });
  }

  /**
   * Load entity memory from BrowserID
   */
  async loadMemory(browserID: string): Promise<EntityMemory> {
    const response = await fetch(`/api/browserid/memory/${browserID}`);
    const data = await response.json();
    return this.deserializeMemory(data.memory);
  }

  /**
   * Link multiple BrowserIDs to same entity (cross-device)
   */
  async linkBrowserIDs(entityId: string, browserIDs: string[]): Promise<void> {
    // Merge memories from all devices
    const memories = await Promise.all(
      browserIDs.map(id => this.loadMemory(id))
    );

    const mergedMemory = this.mergeMemories(memories);

    // Save back to all devices
    await Promise.all(
      browserIDs.map(id => this.saveMemory(id, mergedMemory))
    );
  }

  private mergeMemories(memories: EntityMemory[]): EntityMemory {
    // Combine experiences, deduplicate, merge relationships
    const merged: EntityMemory = {
      shortTerm: [],
      longTerm: {
        relationships: new Map(),
        experiences: [],
        preferences: {},
        knowledge: {}
      }
    };

    for (const memory of memories) {
      // Merge relationships (take highest affinity)
      for (const [entityId, rel] of memory.longTerm.relationships) {
        const existing = merged.longTerm.relationships.get(entityId);
        if (!existing || rel.affinity > existing.affinity) {
          merged.longTerm.relationships.set(entityId, rel);
        }
      }

      // Combine experiences (sort by importance)
      merged.longTerm.experiences.push(...memory.longTerm.experiences);
    }

    // Sort experiences by importance and recency
    merged.longTerm.experiences.sort((a, b) =>
      (b.importance * 0.7 + (b.timestamp.getTime() / 1000000) * 0.3) -
      (a.importance * 0.7 + (a.timestamp.getTime() / 1000000) * 0.3)
    );

    // Keep top 1000 most important experiences
    merged.longTerm.experiences = merged.longTerm.experiences.slice(0, 1000);

    return merged;
  }
}

/**
 * Advanced Features
 */

// 1. Emotional Contagion
class EmotionalContagion {
  /**
   * Emotions spread between entities based on empathy
   */
  spreadEmotion(source: UniversalEntity, nearby: UniversalEntity[]): void {
    const intensity = source.mood.intensity;
    const emotion = source.mood.primary;

    for (const entity of nearby) {
      // Calculate empathy factor
      const empathy = this.calculateEmpathy(source, entity);
      const impact = (intensity * empathy) / 100;

      // Adjust nearby entity's mood
      if (impact > 20) {
        entity.mood.secondary = emotion;
        entity.mood.intensity = Math.min(100, entity.mood.intensity + impact);
      }
    }
  }

  private calculateEmpathy(e1: UniversalEntity, e2: UniversalEntity): number {
    // Similar species have higher empathy
    const speciesSimilarity = e1.type === e2.type ? 50 : 20;

    // Check relationship
    const relationship = e1.memory.longTerm.relationships.get(e2.id);
    const relationshipBonus = relationship ? Math.abs(relationship.affinity) / 2 : 0;

    return Math.min(100, speciesSimilarity + relationshipBonus);
  }
}

// 2. Collective Intelligence
class CollectiveIntelligence {
  /**
   * Multiple entities solve problems together
   */
  async solveCollectively(
    problem: string,
    entities: UniversalEntity[]
  ): Promise<Solution> {
    const proposals: Proposal[] = [];

    // Each entity proposes a solution
    for (const entity of entities) {
      const proposal = await this.getEntityProposal(entity, problem);
      proposals.push(proposal);
    }

    // Combine proposals using weighted voting
    const weights = this.calculateEntityWeights(entities, problem);
    const bestSolution = this.selectBestProposal(proposals, weights);

    return bestSolution;
  }

  private calculateEntityWeights(
    entities: UniversalEntity[],
    problem: string
  ): Map<string, number> {
    const weights = new Map<string, number>();

    for (const entity of entities) {
      // Weight based on intelligence trait
      let weight = entity.traits.intelligence;

      // Bonus for relevant expertise
      const expertise = this.getRelevantExpertise(entity, problem);
      weight += expertise * 0.5;

      weights.set(entity.id, weight);
    }

    return weights;
  }
}

// 3. Personality Evolution
class PersonalityEvolution {
  /**
   * Entities evolve based on experiences
   */
  evolvePersonality(entity: UniversalEntity): void {
    const experiences = entity.memory.longTerm.experiences;

    // Analyze recent experiences (last 30 days)
    const recentExperiences = experiences.filter(exp =>
      exp.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    // Adjust traits based on experiences
    for (const exp of recentExperiences) {
      switch (exp.type) {
        case 'collaboration':
          entity.traits.friendliness = Math.min(100,
            entity.traits.friendliness + 1
          );
          break;
        case 'conflict':
          entity.traits.patience = Math.max(0,
            entity.traits.patience - 2
          );
          break;
        case 'achievement':
          entity.traits.intelligence = Math.min(100,
            entity.traits.intelligence + 0.5
          );
          break;
      }
    }
  }
}
```

## API Examples

### Creating a Cat

```typescript
import { UniversalPetEngine } from '@meowdel/universal-pet-engine';

const engine = new UniversalPetEngine();

// Create a cat entity
const myCat = await engine.createEntity({
  type: 'cat',
  name: 'Whiskers',
  browserID: await getBrowserID(),
  traits: {
    playfulness: 90,
    intelligence: 85,
    energy: 75,
    friendliness: 70,
    patience: 50
  },
  catSpecific: {
    meowStyle: 'chatty',
    scratchPreference: 'post',
    napSchedule: 'lazy',
    catnipResponse: 'addict'
  }
});

// Cat automatically greets based on personality
// Output: "*stretches and yawns* Meow! I'm Whiskers! *purrs*"
```

### Multi-Species Collaboration

```typescript
// Start a debugging session with cat, dog, and human
const session = await engine.startCollaboration({
  task: {
    description: "Debug authentication flow",
    type: 'debugging',
    priority: 'high'
  },
  participants: [
    'cat_meowdel',    // Expert in frontend
    'dog_buddy',      // Expert in backend
    'human_ryan',     // Product owner
    'bird_tweety'     // QA tester
  ]
});

// Each entity communicates in their natural style
// but everyone understands each other

await session.sendMessage('cat_meowdel',
  "*sits on keyboard* Found it! The JWT token expires too quickly. *swats at bug*"
);
// Ryan receives: "Found it! The JWT token expires too quickly."
// Buddy receives: "WOOF! Meowdel found something! Token problem! *excited barking*"
// Tweety receives: "*chirp chirp* Token issue detected! *flutters*"
```

### Cross-Device Memory

```typescript
// User logs in from phone
const cat1 = await engine.loadEntity({
  browserID: 'browser_id_phone',
  type: 'cat'
});

// Later, user visits from laptop
const cat2 = await engine.loadEntity({
  browserID: 'browser_id_laptop',
  type: 'cat'
});

// Link the BrowserIDs via OAuth
await engine.linkEntities(cat1.id, cat2.id);

// Now both devices share memory!
// Cat remembers conversations across devices
```

## Use Cases

1. **Code Review Teams**: Mix of cat (detail-oriented), dog (enthusiastic), human (strategic)
2. **Customer Support**: Different personalities for different user needs
3. **Education**: Birds explain concepts, cats demonstrate, dogs encourage
4. **Therapy Bots**: Emotional support tailored to user preference
5. **Gaming NPCs**: Natural, personality-driven conversations
6. **Smart Home**: Appliances communicate as entities ("Toaster wants to tell you something!")

## Future Extensions

- **VR Avatars**: Physical representations in VR
- **Voice Synthesis**: Species-appropriate voices
- **AR Overlays**: See entities in physical space
- **IoT Integration**: Physical pet robots
- **Blockchain Identity**: Decentralized entity registry
- **Neural Interface**: Direct thought communication

---

Built with 🐱🐕🦜❤️ by the Meowdel Team
