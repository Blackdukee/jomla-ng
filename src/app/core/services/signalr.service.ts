import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BatchUpdatedDto, GroupRequestDetailDto, OfferDto } from '../models';

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
 */
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignalRService implements OnDestroy {
  private connection: signalR.HubConnection | null = null;
  private readonly hubUrl = environment.hubUrl;

  /** Observable signals for components to react to */
  readonly lastNotification = signal<NotificationDto | null>(null);
  readonly lastBatchUpdate = signal<BatchUpdatedDto | null>(null);
  readonly lastGroupRequestUpdate = signal<GroupRequestDetailDto | null>(null);
  readonly lastOfferStatusChange = signal<OfferDto | null>(null);
  readonly lastUserBatchStatusChange = signal<{ batchId: string; newStatus: string } | null>(null);
  readonly lastFlaggedItemCreated = signal<{ entityType: string; entityId: string } | null>(null);
  readonly lastFlaggedItemResolved = signal<string | null>(null);
  readonly isConnected = signal(false);

  /** Callbacks registered by components */
  private notificationCallbacks: ((n: NotificationDto) => void)[] = [];
  private batchUpdateCallbacks: ((u: BatchUpdatedDto) => void)[] = [];
  private groupRequestUpdateCallbacks: ((u: GroupRequestDetailDto) => void)[] = [];
  private offerStatusChangeCallbacks: ((o: OfferDto) => void)[] = [];
  private userBatchStatusChangeCallbacks: ((b: { batchId: string; newStatus: string }) => void)[] = [];
  private flaggedItemCreatedCallbacks: ((item: { entityType: string; entityId: string }) => void)[] = [];
  private flaggedItemResolvedCallbacks: ((entityId: string) => void)[] = [];

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

    this.connection.on('GroupRequestUpdated', (update: GroupRequestDetailDto) => {
      this.lastGroupRequestUpdate.set(update);
      this.groupRequestUpdateCallbacks.forEach(cb => cb(update));
    });

    this.connection.on('OfferStatusChanged', (offer: OfferDto) => {
      this.lastOfferStatusChange.set(offer);
      this.offerStatusChangeCallbacks.forEach(cb => cb(offer));
    });

    this.connection.on('UserBatchStatusChanged', (batchId: string, newStatus: string) => {
      const update = { batchId, newStatus };
      this.lastUserBatchStatusChange.set(update);
      this.userBatchStatusChangeCallbacks.forEach(cb => cb(update));
    });

    this.connection.on('FlaggedItemCreated', (entityType: string, entityId: string) => {
      const item = { entityType, entityId };
      this.lastFlaggedItemCreated.set(item);
      this.flaggedItemCreatedCallbacks.forEach(cb => cb(item));
    });

    this.connection.on('FlaggedItemResolved', (entityId: string) => {
      this.lastFlaggedItemResolved.set(entityId);
      this.flaggedItemResolvedCallbacks.forEach(cb => cb(entityId));
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

  private async ensureConnected(): Promise<void> {
    if (!this.connection) {
      await this.connect();
    }
    // Wait for connection to settle if it is connecting or reconnecting
    for (let i = 0; i < 50; i++) { // Max 5 seconds
      if (this.connection?.state === signalR.HubConnectionState.Connected) {
        break;
      }
      if (this.connection?.state === signalR.HubConnectionState.Disconnected) {
        try {
          await this.connection.start();
          this.isConnected.set(true);
          break;
        } catch (err) {
          console.error('SignalR start failed:', err);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /** Join a SignalR group for a specific offer to receive BatchUpdated events. */
  async joinOfferGroup(offerId: string): Promise<void> {
    await this.ensureConnected();
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinOfferGroup', offerId);
    }
  }

  /** Leave a SignalR group for a specific offer. */
  async leaveOfferGroup(offerId: string): Promise<void> {
    await this.ensureConnected();
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveOfferGroup', offerId);
    }
  }

  /** Join a SignalR group for a specific group request to receive GroupRequestUpdated events. */
  async joinGroupRequestGroup(groupRequestId: string): Promise<void> {
    await this.ensureConnected();
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinGroupRequestGroup', groupRequestId);
    }
  }

  /** Leave a SignalR group for a specific group request. */
  async leaveGroupRequestGroup(groupRequestId: string): Promise<void> {
    await this.ensureConnected();
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveGroupRequestGroup', groupRequestId);
    }
  }

  /** Join the Admin group to receive FlaggedItemCreated and FlaggedItemResolved events. */
  async joinAdminGroup(): Promise<void> {
    await this.ensureConnected();
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinAdminGroup');
    }
  }

  /** Leave the Admin group. */
  async leaveAdminGroup(): Promise<void> {
    await this.ensureConnected();
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveAdminGroup');
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

  /** Register a callback for group request update events. Returns an unsubscribe function. */
  onGroupRequestUpdate(callback: (u: GroupRequestDetailDto) => void): () => void {
    this.groupRequestUpdateCallbacks.push(callback);
    return () => {
      this.groupRequestUpdateCallbacks = this.groupRequestUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  /** Register a callback for offer status change events. Returns an unsubscribe function. */
  onOfferStatusChange(callback: (o: OfferDto) => void): () => void {
    this.offerStatusChangeCallbacks.push(callback);
    return () => {
      this.offerStatusChangeCallbacks = this.offerStatusChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  /** Register a callback for user batch status change events. Returns an unsubscribe function. */
  onUserBatchStatusChange(callback: (b: { batchId: string; newStatus: string }) => void): () => void {
    this.userBatchStatusChangeCallbacks.push(callback);
    return () => {
      this.userBatchStatusChangeCallbacks = this.userBatchStatusChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  /** Register a callback for flagged item created events. Returns an unsubscribe function. */
  onFlaggedItemCreated(callback: (item: { entityType: string; entityId: string }) => void): () => void {
    this.flaggedItemCreatedCallbacks.push(callback);
    return () => {
      this.flaggedItemCreatedCallbacks = this.flaggedItemCreatedCallbacks.filter(cb => cb !== callback);
    };
  }

  /** Register a callback for flagged item resolved events. Returns an unsubscribe function. */
  onFlaggedItemResolved(callback: (entityId: string) => void): () => void {
    this.flaggedItemResolvedCallbacks.push(callback);
    return () => {
      this.flaggedItemResolvedCallbacks = this.flaggedItemResolvedCallbacks.filter(cb => cb !== callback);
    };
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
