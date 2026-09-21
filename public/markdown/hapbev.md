# B2B Order & Forecasting Platform

At Tiger Tribe / HEINEKEN, I contributed to an enterprise backend for beverage supply-chain planning: orders, demand forecasts, inventory, sell-out capture, partner planning, notifications, and spreadsheet exchange.

![HAPBev architecture schematic](/img/projects/arch-hapbev.svg)

*Simplified architecture schematic.*

## Contributions

- Built and modularized sell-out workflows covering weekly/monthly aggregation, inventory integration, forecast eligibility, and Excel import/export.
- Moved an expensive aggregation path from in-memory materialization to PostgreSQL execution.
- Added a source-location synchronization workflow spanning API, application, persistence, messaging, and integration tests.
- Improved local development with containerized dependencies and development-friendly authentication behavior.

## Engineering context

The system uses .NET 8, ASP.NET Core, EF Core, PostgreSQL, CQRS/MediatR, domain events, Azure storage and queues, enterprise messaging, Hangfire, OpenXML, Application Insights, xUnit, and Testcontainers.

I contributed across a codebase with 17 endpoint modules, 12 domain aggregate areas, and more than 60 integration-test classes.
