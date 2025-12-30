export enum AppMode {
  GAME = 'GAME',
  COPILOT = 'COPILOT',
  STUDIO = 'STUDIO',
  STRATEGY = 'STRATEGY',
  ABOUT = 'ABOUT',
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9',
  WIDE = '21:9',
  STANDARD = '4:3',
  ALT_PORTRAIT = '3:4',
  THREE_TWO = '3:2',
  TWO_THREE = '2:3'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  sources?: { uri: string; title: string }[];
}

// Game Types
export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'player' | 'enemy_ship' | 'enemy_heli' | 'enemy_tank' | 'fuel' | 'bullet' | 'enemy_bullet' | 'bridge';
  active: boolean;
  color: string;
}

export interface GameState {
  score: number;
  fuel: number;
  lives: number;
  level: number;
  isPlaying: boolean;
  gameOver: boolean;
  levelComplete: boolean;
  startTime: number;
}