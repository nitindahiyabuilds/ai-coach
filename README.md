# AI Coach

AI Coach is an AI-powered lifestyle coaching system built around one core idea:

> Personalized coaching becomes significantly more useful when an AI understands what a user has actually done over time.

The project currently focuses on fitness and training, with the broader vision of eventually supporting nutrition, habits, routines, and other aspects of everyday life.

Rather than treating the LLM as the entire product, AI Coach builds a structured intelligence layer around it.

## How It Works

The system combines a user's profile, goals, preferences, and historical activity with deterministic analysis before sending relevant context to the LLM.

For workout intelligence, the core pipeline is:

`Workout History → Deterministic Analysis → Progression Decision → Workout Plan → LLM Reasoning → Coach UI`

This separation is intentional:

- **Deterministic code** handles calculations, historical comparisons, trends, and workout progression decisions.
- **The LLM** reasons over those computed facts and turns them into personalized explanations and coaching guidance.
- **The Coach UI** presents the resulting recommendations in a structured, usable form.

This means the LLM is not treated as the source of truth for workout history or numerical recommendations. Instead, it acts as the reasoning and communication layer on top of structured data and deterministic logic.

## The Product Idea

A generic fitness chatbot already knows how progressive overload works, what protein is, and how to structure a workout.

The interesting problem is different:

**Can the system understand the individual user?**

AI Coach is designed around longitudinal context such as:

- what the user has trained
- how their performance has changed
- how recently an exercise was performed
- whether performance is improving, stable, or declining
- what the user's goals and preferences are
- how previous outcomes should influence future recommendations

The goal is for coaching decisions to exist **because of the user's history**, rather than simply because the LLM knows general fitness advice.

In other words:

`User History → Understanding → Decision → Outcome → New History → Better Decision`

That feedback loop is the foundation of the system.

## Engineering Philosophy

AI Coach deliberately separates three layers of information:

### Raw Data

The actual events recorded by the user, such as workout sessions, sets, weights, and repetitions.

This is the source of truth.

### Derived Intelligence

Deterministic analysis performed over the raw data, such as:

- performance trends
- load progression
- volume changes
- training recency
- progression or regression signals

These results should always be reproducible from the underlying data.

### LLM Context

A controlled representation of the relevant information provided to the model for a particular coaching request.

The entire database is not blindly placed into a prompt. Relevant historical information is analyzed and narrowed down first.

This architecture keeps the system more predictable, testable, auditable, and easier to evolve.

## Current Technology

AI Coach is built as a web application using:

- Next.js
- TypeScript
- React
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Auth
- Server Actions
- Zod
- Google Gemini

The project is intentionally kept relatively lightweight. It does not rely on agent frameworks, vector databases, multi-agent systems, or custom ML models.

The objective is to demonstrate how a reliable intelligent product can be built **around** an LLM rather than simply calling an LLM.

## Project Direction

The immediate focus is to make workout intelligence reliable enough to support a real beta experience.

Once the core workout intelligence loop is properly validated and hardened, the same architectural principles can be extended to other lifestyle domains such as nutrition and habits.

The long-term vision is a system that gradually develops a structured understanding of the person using it — while keeping raw data, deterministic analysis, and AI reasoning clearly separated.

AI Coach is therefore less about building another chatbot and more about exploring how **memory, structured data, deterministic intelligence, and LLM reasoning can work together to create genuinely personalized software.**
:::

This is the version I'd push today. It describes **what AI Coach is, why it exists, how it thinks, and how it's engineered** without tying the README to today's particular checkpoint.

Then tomorrow we start properly from the repository inspection and continue the workout-intelligence milestone.