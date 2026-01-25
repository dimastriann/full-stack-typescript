import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';
import Logger from './logger';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket) return;

    this.socket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      Logger.info('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      Logger.info('Disconnected from socket server');
    });

    this.socket.on('error', (error) => {
      Logger.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }
}

export const socketService = new SocketService();
