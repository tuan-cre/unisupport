import { Module } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';

export const ticketsCreatedCounter = new Counter({
  name: 'unisupport_tickets_created_total',
  help: 'Total number of tickets created',
  labelNames: ['priority', 'department'] as const,
});

export const commentsAddedCounter = new Counter({
  name: 'unisupport_comments_added_total',
  help: 'Total number of comments added to tickets',
  labelNames: ['ticket_type'] as const,
});

export const ticketResolutionHistogram = new Histogram({
  name: 'unisupport_ticket_resolution_seconds',
  help: 'Time to resolve a ticket in seconds',
  buckets: [60, 300, 900, 1800, 3600, 7200, 14400, 28800],
});

export const authAttemptsCounter = new Counter({
  name: 'unisupport_auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['method', 'success'] as const,
});

export const activeWebsocketsGauge = new Counter({
  name: 'unisupport_websocket_connections_total',
  help: 'Total WebSocket connections opened',
});

@Module({
  providers: [
    { provide: 'PROM_METRIC_TICKETS_CREATED', useValue: ticketsCreatedCounter },
    { provide: 'PROM_METRIC_COMMENTS_ADDED', useValue: commentsAddedCounter },
    { provide: 'PROM_METRIC_TICKET_RESOLUTION', useValue: ticketResolutionHistogram },
    { provide: 'PROM_METRIC_AUTH_ATTEMPTS', useValue: authAttemptsCounter },
    { provide: 'PROM_METRIC_WEBSOCKET_CONNECTIONS', useValue: activeWebsocketsGauge },
  ],
  exports: [
    'PROM_METRIC_TICKETS_CREATED',
    'PROM_METRIC_COMMENTS_ADDED',
    'PROM_METRIC_TICKET_RESOLUTION',
    'PROM_METRIC_AUTH_ATTEMPTS',
    'PROM_METRIC_WEBSOCKET_CONNECTIONS',
  ],
})
export class MetricsModule {}
