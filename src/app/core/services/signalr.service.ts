import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BatchUpdatedDto } from '../models';

/**
 * Notification DTO matching backend NotificationDto.
 * Backend: Jomla.Application.Features.Notifications.DTOs.NotificationDto
 */
export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string;
  entityId?: string;
  entityType?: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * SignalR service for real-time communication with the Jomla hub.
 * Hub path: /hubs/jomla
 *
 * Server-to-client methods:
 *   - NotificationReceived(NotificationDto)
 *   - BatchUpdated(BatchUpdatedDto)
 *
 * Client-to-server methods:
 *   - JoinOfferGroup(offerId: string)
 *   - LeaveOfferGroup(offerId: string)
 */
@Injectable({ providedIn: 'root' })
export class SignalRService implements OnDestroy {
  private connection: signalR.HubConnection | null = null;
  private readonly hubUrl = 'http://localhost:5174/hubs/jomla';

  /** Observable signals for components to react to */
  readonly lastNotification = signal<NotificationDto | null>(null);
  readonly lastBatchUpdate = signal<BatchUpdatedDto | null>(null);
  readonly isConnected = signal(false);

  /** Callbacks registered by components */
  private notificationCallbacks: ((n: NotificationDto) => void)[] = [];
  private batchUpdateCallbacks: ((u: BatchUpdatedDto) => void)[] = [];

  /**
   * Connect to the SignalR hub using the JWT access token.
   * Should be called after successful login/refresh.
   */
  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => localStorage.getItem('jomla_token') ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Register server-to-client handlers
    this.connection.on('NotificationReceived', (notification: NotificationDto) => {
      this.lastNotification.set(notification);
      this.notificationCallbacks.forEach(cb => cb(notification));
    });

    this.connection.on('BatchUpdated', (update: BatchUpdatedDto) => {
      this.lastBatchUpdate.set(update);
      this.batchUpdateCallbacks.forEach(cb => cb(update));
    });

    this.connection.onclose(() => this.isConnected.set(false));
    this.connection.onreconnected(() => this.isConnected.set(true));

    try {
      await this.connection.start();
      this.isConnected.set(true);
    } catch (err) {
      console.error('SignalR connection failed:', err);
      this.isConnected.set(false);
    }
  }

  /** Disconnect from the hub. Called on logout. */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.isConnected.set(false);
    }
  }

  /** Join a SignalR group for a specific offer to receive BatchUpdated events. */
  async joinOfferGroup(offerId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinOfferGroup', offerId);
    }
  }

  /** Leave a SignalR group for a specific offer. */
  async leaveOfferGroup(offerId: string): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveOfferGroup', offerId);
    }
  }

  /** Register a callback for notification events. Returns an unsubscribe function. */
  onNotification(callback: (n: NotificationDto) => void): () => void {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  /** Register a callback for batch update events. Returns an unsubscribe function. */
  onBatchUpdate(callback: (u: BatchUpdatedDto) => void): () => void {
    this.batchUpdateCallbacks.push(callback);
    return () => {
      this.batchUpdateCallbacks = this.batchUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
