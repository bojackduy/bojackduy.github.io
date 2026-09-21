# Retail Price Intelligence Platform

I worked on a full-stack platform that collects retailer prices on schedules or demand, normalizes store and product data, monitors ingestion quality, and exposes competitive pricing analytics.

## Contributions

- Designed durable asynchronous ingestion with persistent jobs, separated workers, Redis, and BullMQ.
- Integrated multiple scraping providers behind common normalization, retry, quota, and risk-classification layers.
- Reworked retailer, market, geography, store, and product ingestion into explicit domain, persistence, and CQRS use-case layers.
- Delivered competitive analysis, data-quality monitoring, export workflows, OIDC access, and restricted operational diagnostics.

## Stack

NestJS, TypeScript, PostgreSQL, TypeORM, Redis, BullMQ, Next.js, React, OpenTelemetry, Application Insights, Docker, Kubernetes, Testcontainers, and Azure delivery pipelines.
