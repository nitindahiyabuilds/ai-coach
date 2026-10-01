Personal Context & 15-Day Calibration Architecture
Status

Proposed

Purpose

Define the architecture for turning AI Coach from a generic fitness chatbot into a long-term personalized coaching system.

The system must progressively learn about each user without forcing the user through a large static onboarding questionnaire.

The first 15 active coaching days are treated as a calibration period.

During calibration, the coach collects necessary information, observes behavior, evaluates adherence and feedback, tests routines, and progressively builds a reliable model of what works for the user.

The coach should become more personalized through evidence rather than through a large static profile.

1. Product Model

AI Coach is not primarily a question-answering chatbot.

The intended interaction model is:

User joins
↓
Coach learns
↓
Coach creates an initial plan
↓
User acts
↓
System observes
↓
Coach learns from behavior
↓
Coach adapts
↓
Routine becomes more personalized

The first 15 active coaching days form a calibration phase.

The purpose of calibration is not to produce a permanent schedule immediately.

The purpose is to discover a routine that fits the user's:

goals
physical constraints
training experience
preferences
schedule
available equipment
lifestyle
nutrition
recovery
actual behavior
adherence
feedback

The system should avoid presenting the first generated schedule as permanently correct.

2. Core Principle

The coach should never ask a question merely because the system has a field for it.

A question should be asked because its answer will improve:

a current coaching decision
understanding of the user
safety
personalization
or a future coaching interaction

The coach should ask the smallest useful question required for the current decision.

The system should optimize for useful learning rather than maximum information collection.

3. Day 1 Experience

The first interaction should not be a large questionnaire.

The user should provide only the minimum information required to safely begin coaching.

The initial information may include:

primary goal
current training situation
training experience
relevant physical limitations or injuries
training environment
available equipment
realistic training availability
important schedule constraints

The exact questions are not fixed.

The coach should adapt the next question based on previous answers.

For example:

Goal
↓
Training situation
↓
Experience
↓
Physical constraints
↓
Availability
↓
Training environment
↓
First useful workout

The system should not ask questions whose answers are already known.

The system should not ask every possible question before providing value.

4. Profile Onboarding Boundary

The current profile form should not remain the primary mechanism for collecting every coaching input.

The intended product flow is:

Sign up
↓
Minimal required profile
↓
Conversational onboarding
↓
Progressive context collection
↓
Calibration
↓
Personalized coaching

The profile should contain information that is appropriate as current profile state.

Information that is better understood through conversation, history, observation, or behavioral evidence should not be forced into the profile form merely because a database field could be created for it.

The existing profile system may be simplified or adapted as implementation proceeds.

The architecture does not require every current profile field to remain permanently in the profile form.

5. Adaptive Questioning

The coach should determine what information is missing based on the decision it is trying to make.

Conceptually:

What decision am I trying to make?
↓
What information is required?
↓
Do I already know it?
↓
Yes ───────────────→ Continue
│
No
↓
Ask the most useful question
↓
Store the answer
↓
Update personal context
↓
Make the decision

The system should prefer conversational questions over form-like questionnaires.

The coach should also explain why a question is relevant when doing so improves user understanding or reduces friction.

The coach should avoid asking multiple unrelated questions simply because they are available.

6. Personal Context

Personal Context represents what the system currently knows about the user.

It is not a single database table.

It is a composed view of multiple sources of truth.

PERSONAL CONTEXT
│
├── PROFILE STATE
│
├── STRUCTURED HISTORY
│
├── SEMANTIC MEMORY
│
└── RELEVANT CONVERSATION CONTEXT

Conversation history remains a separate source of historical evidence.

Domain intelligence remains a separate source of deterministic information.

The Context Builder combines relevant information from these sources for the current coaching decision.

7. Source-of-Truth Model

Different types of information must have different authoritative sources.

7.1 Profile State

The existing profiles table represents appropriate current profile information.

Current fields include:

full name
age
sex
height
weight
activity level
goal
training experience
equipment
dietary preference
region

The profile should represent current state where appropriate.

The profile should not automatically become the storage location for every new piece of user knowledge.

8. Current State vs Historical State

Some information changes over time and therefore must not be treated as a single permanent value.

Examples include:

body weight
body measurements
goals
training frequency
adherence
recovery patterns
other future measurements

The architecture should distinguish:

Current state
↓
The latest known value used for current decisions

Historical state
↓
Previous values retained for trend and behavioral analysis

For example:

Current weight:
87.4 kg

Weight history:

90.0 kg → 89.1 kg → 88.2 kg → 87.4 kg

The profile may expose the latest value, but historical measurements belong in structured time-series data.

This principle should also apply to other values where change over time is meaningful.

9. Goals and Priorities

Goals should not be treated as a permanently fixed profile field.

The system should eventually distinguish:

current goal
goal history
priority
effective period
changes in priority

For example:

Current goal:
Fat loss

Later:

Current goal:
Muscle gain

The system should retain the historical change rather than silently erasing the previous state.

During calibration, the coach should also understand which goal is the user's current priority.

If the user changes priorities, the new explicit user statement should update the current state through an explicit context update.

10. Structured Domain Data

Structured data should be used when historical values, calculations, or deterministic reasoning matter.

Examples:

workout sessions
workout sets
exercise performance
measurements
progression
adherence
future nutrition records
future recovery records

Workout sessions and workout sets remain the authoritative source for workout performance.

The LLM must not reconstruct workout history from conversation when structured workout data exists.

Structured data should remain queryable without requiring semantic retrieval.

11. Semantic Personal Memory

Semantic memory stores atomic facts that are useful across future conversations.

Examples:

Preference:

"I prefer evening workouts."

Preference:

"I dislike running."

Constraint:

"My work schedule changes frequently."

Goal:

"I want to prioritize muscle gain."

Context:

"I usually have about one hour available for training."

The initial semantic memory model should support:

preference
constraint
goal
context

Each fact should have provenance.

The system should be able to distinguish between:

what the user explicitly said
what the system observed
what was inferred
what is uncertain

The system must not silently convert weak inference into a confirmed user fact.

12. Known vs Testing

The coach must distinguish between:

"I know this about you"

and:

"I am currently testing this about you."

For example:

KNOWN

User explicitly says:

"I prefer evening workouts."

TESTING

The system is testing whether a four-day training schedule fits the user's current life.

OBSERVED

The user completed three of the last four planned sessions.

INFERRED

Four days may be more sustainable than five.

NOT YET KNOWN

Whether the user actually prefers four days.

This distinction is central to the calibration system.

The system should not present an experimental conclusion as an established personal fact.

13. User Statement vs System Observation

User-provided information and system observations must remain distinguishable.

For example:

User states:

"I can train five days per week."

System observes:

The user repeatedly completes approximately three sessions per week.

The system should not silently change the user's stated availability to three days.

Instead, the context should preserve both:

stated availability
observed adherence

The discrepancy can then become a reason for a future coaching question.

User-provided information should not be silently overwritten by system inference.

When explicit user information conflicts with an inference, the coach should clarify rather than silently deciding which interpretation is correct.

14. Context Evidence and Confidence

Evidence belongs to individual facts rather than to the user as a whole.

The system should eventually distinguish states such as:

confirmed
observed
inferred
unknown
contradictory

For example:

Confirmed:

"I prefer evening workouts."

Observed:

The user repeatedly completes evening sessions.

Inferred:

Evening may be a more reliable training window.

Unknown:

Preferred session duration.

Contradictory:

The user says five days are available but repeatedly completes three.

These states should be attached to the relevant piece of context rather than represented as one generic confidence score for the entire user.

Contradictions should lead to clarification rather than silent overwriting.

15. Memory Lifecycle and User Correction

Memory must support change over time.

A stored fact should not be treated as permanently true.

The system should support states such as:

active
superseded
invalidated
contradictory

When the user explicitly changes a previously stored fact, the new statement becomes the current user-stated value and the previous fact should be retained as historical context where useful.

For example:

Previous:

"I prefer evening workouts."

New:

"My schedule changed. I prefer morning workouts now."

The system should:

preserve the previous fact as historical
store the new fact as current
mark the previous fact as superseded
use the new fact for current coaching decisions

User corrections should have higher authority than system inference.

The system should also provide an explicit path for correcting important stored information rather than requiring the user to repeat the correction indefinitely.

Memory should therefore be treated as evolving state with provenance and lifecycle, not as an append-only collection of permanent truths.

16. Conversation History

coach_messages remains the raw conversation record.

Conversation history is useful for conversational continuity but is not itself the personal memory database.

The system should be able to extract durable facts from conversation without treating every conversational statement as permanent memory.

Raw conversation remains available as historical evidence.

The system should not rely on raw conversation as the primary source of structured workout history when structured workout data exists.

17. Deterministic Domain Intelligence

Deterministic application logic remains authoritative for numerical and structured decisions.

Examples include:

BMR
TDEE
calorie targets
protein targets
water targets
workout history analysis
progression decisions
workout plan structure

The LLM may explain and contextualize deterministic results.

The LLM must not replace deterministic calculations with its own calculations.

The LLM must not silently modify deterministic inputs.

If an input changes, the user or an explicit application flow must update the source data.

18. Calibration Phase

The first 15 active coaching days are a dedicated calibration period.

An active coaching day is a day on which the user has meaningful coaching activity, such as:

a meaningful coach interaction
workout activity
feedback about a plan
a relevant context update
another meaningful coaching event

The calibration period is therefore based on active coaching days rather than simply elapsed calendar days.

A user who does not interact for several calendar days should not automatically lose calibration progress because of elapsed time alone.

Conceptually:

CALIBRATION START
↓
Collect minimum viable context
↓
Generate initial experiment
↓
Observe user behavior
↓
Collect feedback
↓
Identify missing information
↓
Ask useful questions
↓
Update context
↓
Adjust experiment
↓
Repeat
↓
Evaluate accumulated evidence

The calibration period should not behave as a rigid questionnaire.

The number of questions asked on each active day may vary.

Some active days may require no explicit questions if sufficient information is already available.

19. Calibration State

Calibration is a coaching process and should be represented separately from semantic memory.

Conceptually, the system needs to know:

when calibration started
number of active coaching days
whether calibration is active
what important information is still missing
what the coach is currently trying to learn
what experiments are active
what observations have been collected
what evidence has been accumulated
what assumptions are currently being tested
whether a stable routine has been proposed
whether the user has confirmed a stable routine

The exact database representation will be defined during implementation design.

20. Current Coaching Objective

The coach should have a clear concept of what it is currently trying to learn or decide.

For example:

Current coaching objective:

Determine realistic weekly training frequency.

Known:

user wants muscle gain
user has gym access
user has intermediate experience

Missing:

realistic weekly frequency

Next question:

"How many days can you realistically train most weeks?"

After the answer:

update context
evaluate whether the decision can now be made
continue to the next relevant objective

This prevents the coach from asking random questions simply because information is missing.

The current coaching objective should be selected based on the highest-impact unresolved decision.

21. Behavioral Learning

The system should learn from behavior, not only explicit answers.

For example:

User says:

"I can train five days per week."

Observed behavior:

3-4 sessions repeatedly completed.

Coach:

"I've noticed four sessions have been more consistent. Is four days actually more realistic for your current schedule?"

The system should not immediately overwrite the user's stated preference with an inference.

Observed behavior should create evidence that can trigger a follow-up question.

This distinction is important:

Explicit fact
≠
Observed behavior
≠
Inference

The coach should preserve those distinctions.

22. Preferences and Exercise Selection

Exercise preferences should become part of semantic personal context when they are sufficiently established.

Examples:

likes barbell bench press
prefers dumbbells
dislikes running
prefers machines
dislikes long cardio sessions

The system should avoid treating a single action as definitive evidence.

For example, skipping an exercise once does not prove that the user dislikes it.

Repeated behavior may trigger a question.

The coach should confirm important inferred preferences before treating them as established facts.

23. Schedule Calibration

The initial schedule is an experiment.

The system should explicitly communicate this to the user.

The intended product behavior is:

Initial schedule
↓
Calibration period
↓
Observe adherence + feedback
↓
Identify what fits
↓
Propose stable routine
↓
User confirms
↓
Stable routine becomes current baseline

The system should not automatically declare a permanent routine solely because 15 active coaching days have passed.

The 15-day period is a calibration window, not an unconditional guarantee of schedule finalization.

24. Adaptive Coaching Loop

After the first useful workout, the coach should continuously operate around this loop:

OBSERVE
↓
UNDERSTAND
↓
IDENTIFY MISSING CONTEXT
↓
ASK OR ACT
↓
RECORD
↓
EVALUATE
↓
ADAPT

The coach should prioritize the highest-impact missing information rather than attempting to complete every possible category immediately.

25. Context Retrieval

Not every piece of context should be sent to the LLM on every request.

The future context system should retrieve information relevant to the current interaction.

For example:

Question:

"What should I do for bench today?"

Relevant:

recent bench performance
workout plan
progression state
bench preferences
relevant physical constraints

Irrelevant:

unrelated dietary preference
region
old conversational details

Context should therefore be assembled based on relevance.

26. RAG Boundary

RAG / vector retrieval should be used primarily for semantic personal memory.

It should not become the source of truth for deterministic workout history.

The intended boundary is:

Semantic facts
↓
Memory retrieval / RAG

Workout history
↓
Structured queries + workout intelligence

Numerical calculations
↓
Deterministic calculation modules

Raw conversation
↓
coach_messages

These sources can then be combined by the Coach Orchestrator.

27. Coach Orchestrator

The current coach API route contains orchestration responsibilities.

The long-term architecture should extract those responsibilities into a dedicated coach orchestration layer.

Conceptually:

User Request
↓
Coach Orchestrator
│
├── Profile State
├── Calibration State
├── Semantic Memory
├── Conversation History
├── Workout Intelligence
└── Other Domain Intelligence
↓
Decision Context
↓
LLM
↓
Coach Response

The orchestrator should determine:

what context is needed
whether information is missing
what the current coaching objective is
whether a question should be asked
whether a domain action should be performed
which deterministic systems must be consulted
what information can be passed to the LLM
what should be persisted afterward

The LLM should not become responsible for orchestration logic that can be expressed deterministically.

28. Coach Responsibilities

The coach should be able to:

Understand the user's current context.
Identify important missing information.
Define and pursue a current coaching objective.
Ask adaptive questions.
Remember useful durable facts.
Use structured domain history.
Explain deterministic results.
Generate useful initial plans.
Observe actual behavior.
Learn from feedback.
Adapt recommendations.
Distinguish facts from assumptions.
Distinguish established knowledge from active experiments.
Avoid pretending to know missing information.
29. What the Coach Must Not Do

The coach must not:

assume missing user information
treat every conversation statement as permanent memory
use conversation as a replacement for structured workout history
calculate authoritative numerical targets independently
silently overwrite user facts
treat a single behavior as a confirmed preference
ask a giant fixed onboarding questionnaire
repeatedly ask questions whose answers are already known
change the user's underlying deterministic data without an explicit update
present an experimental routine as permanently optimized
declare calibration complete solely because 15 active coaching days have elapsed
diagnose medical conditions
prescribe medication
30. Implementation Roadmap

The personal context work should proceed in this order.

Phase A — Architecture

Define and review:

context ownership
source-of-truth boundaries
calibration lifecycle
semantic memory model
structured data boundaries
retrieval boundaries
orchestration responsibilities
Phase B — Personal Context Foundation

Implement:

Personal context model
Profile boundaries
Structured context interfaces
Semantic memory fact model
Context composition
Phase C — Coach Orchestrator

Implement:

Context assembly
Decision context
Deterministic intelligence integration
LLM boundary
Response/persistence orchestration
Phase D — 15-Day Calibration

Implement:

Calibration state
Initial context requirements
Current coaching objective
Missing-context detection
Adaptive question selection
Observation recording
Evidence tracking
Calibration-aware coach behavior
Phase E — Evaluation

Evaluate:

onboarding quality
question relevance
repeated-question prevention
memory correctness
context retrieval relevance
workout-history correctness
deterministic boundary enforcement
behavioral learning
calibration progression
user experience
31. Initial Scope

The first implementation should remain focused.

We will implement:

personal semantic memory
personal context composition
calibration state
adaptive questioning
workout-context integration
coach orchestration

We will not simultaneously implement:

full nutrition intelligence
voice
wearables
notifications
calendar integration
native mobile applications
autonomous agents
unrelated infrastructure

Future domains can plug into the same Personal Context architecture.

32. Architectural North Star

The long-term system should behave like a coach that progressively understands a person.

The goal is not:

Better prompt

The goal is:

Better model of the user
Better domain intelligence
Better observation
Better decision-making
Better conversational interaction

The 15-active-day calibration period is the first mechanism through which the system earns that understanding.

The user should feel that the coach is gradually becoming more personal because it is learning from real interaction and behavior, not because the user filled out a larger form.

The coach should know the difference between:

"What I know about you."

"What I have observed."

"What I am currently testing."

"What I still need to learn."

That distinction is the foundation of the Personal Context architecture.