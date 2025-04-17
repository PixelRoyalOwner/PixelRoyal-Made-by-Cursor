export interface Pixel {
  x: number;
  y: number;
  color: string;
}

export interface CanvasState {
  pixels: Pixel[];
  width: number;
  height: number;
}

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface Message {
  user: User;
  content: string;
  timestamp: Date;
} 