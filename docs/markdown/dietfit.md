# DietFit — AI Nutrition Coaching

DietFit combines meal scanning and logging, personalized goals, conversational coaching, health-aware check-ins, behavioral insights, and generated weekly meal plans.

![DietFit architecture schematic](/img/projects/arch-dietfit.svg)

*Simplified architecture schematic.*

## Contributions

- Built the weekly meal-plan data model and persistence workflow.
- Added batched onboarding validation and structured LLM classification.
- Introduced prompt-injection guardrails around AI-assisted plan flows.
- Delivered plan history, quick logging, and generated alternatives for meal swaps.
- Worked with multi-provider LLM failover and retrieval-backed coaching workflows.

## Stack

Kotlin, Micronaut, PostgreSQL, Exposed, Redis, object storage, durable asynchronous activities, LangChain4j, OpenAI, Gemini, Anthropic, DeepSeek, and pgvector.
