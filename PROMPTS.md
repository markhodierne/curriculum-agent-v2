# Prompts for Claude

## GENERATE SPECS

We're going to discuss the specification for a software project. The project details are contained in `BRIEF.md`.

First start by confirming, and improving where possible, the functional specification so that it is clear, detailed and complete. There should be no ambiguity about what the application should do. Where appropriate, you should also confirm HOW the AI agent application should work. In this respect, we should leverage the full capabilities of the AI orchestration framework that we are using so that code is as simple and abstracted as possible.

Then, ask me one question at a time so we can develop thorough, step-by-step technical specifications. Each question should build on my previous answers, and our end goal is to have a detailed specification I can hand off to a developer. This will be built in only a few hours with Claude Code so try and keep the conversation short, apply KISS principles and use logical inference based on previous answers when possible.

We should cover: language (ask this first), frameworks, libraries, package managers, styling choices, data structure options (SQL/NoSQL/Graph) BEFORE data storage, architecture, project structure, components, interfaces, design patterns, error handling, UI features, user experience, coding standards, naming conventions, agreed principles, version control, commit standards, testing and documentation requirements. Ask the questions that are RELEVANT for the application that we are building. If there is already some degree of technology specification in BRIEF.md, use this as an opportunity to confirm the choices and make recommendations.

Do not wrap up until you have answers from me for each of these topics. There will be three outputs at the end: a functional spec, an architectural spec, and our code standards specification for `CLAUDE.md`, review the template for this file currently in the repo to understand what we must cover. DO NOT CREATE THESE DOCUMENTS YET - focus on gathering all of the information needed.

**Important**: When asking questions about technical choices, present 2-3 specific options with brief explanations rather than leaving it open-ended. Explain the pros and cons of each option, and also make your own recommendation with a justification. This speeds up decision-making. When there are more viable options available, verbalize this and ask if I want to see more options. Only one question at a time, stay within scope, and don't generate anything until requested.


## SPEC WRAP-UP

Now that we've wrapped up the brainstorming process, compile our findings into three comprehensive, developer-ready specifications:

1. **FUNCTIONAL.md** - Complete functional requirements
2. **ARCHITECTURE.md** - Detailed project architecture
3. **CLAUDE.md** - Compact standards and guidelines

For `CLAUDE.md`, follow the existing template but ensure each section includes specific, actionable directives that we can reference explicitly during development. Be very concise, this should be a compact standards document you will refer to each time you write any code.

Make each specification modular and cross-referenced so developers can quickly find relevant information when prompted to check these files. Do not repeat yourself.


## GENERATE TO-DO

Review `CLAUDE.md` first to understand our standards. Then review `FUNCTIONAL.md` and `ARCHITECTURE.md` to understand what we're building.

Break the project down into manageable, atomic to-do tasks that:

- Build on each other logically
- Are small enough to complete in one session

Create `TO-DO.md` with:

1. Clear statements of each task in implementation order
2. Clear dependencies between to-do tasks
3. Explicit prerequisites listed

Each to-do task should be numbered sequentially, and include:

- Brief description
- Specific deliverables
- Dependencies (if any)
- Definition of done

**Important**: Order to-do tasks by dependency, ensuring you can work efficiently and logically through them in order.


## IMPLEMENTATION

> [!NOTE]
> Implement one task at a time. 
> Use HISTORY.md to record progress/status at the conclusion of each task. 
> Always clear context window after updating HISTORY.md.

**First, review `CLAUDE.md` to understand our project standards and workflow.**

Then refresh your memory by checking `HISTORY.md`. Review the `ARCHITECTURE.md` and `FUNCTIONAL.md` to understand what we are building.

We are working through `TO-DO.md` and are on task 5.

**Before implementing anything:**

1. Confirm you understand the current task requirements
2. Ask if you should reference any specific standards from `CLAUDE.md`
3. Only implement what's specified in this task

As you implement, explain:

- How the code works and why it meets our `FUNCTIONAL.md` requirements
- How it aligns with our `ARCHITECTURE.md`
- Why it complies with our standards in `CLAUDE.md`

Now, here is the next task to complete:

## Task 5: Update Main Page Interface

**Description:** Update homepage to use Oak Curriculum Agent.

**File:** `app/page.tsx`

**Dependencies:** Task 4

**Deliverables:**
- Update `<h1>` text to "Oak Curriculum Agent"
- Update `<ChatAssistant>` API prop to `/api/oak-curriculum-agent`
- Maintain existing styling and layout

**Definition of Done:**
- ✅ Page title changed to "Oak Curriculum Agent"
- ✅ ChatAssistant points to correct API route
- ✅ No TypeScript errors
- ✅ UI displays correctly

```

### DEPENDENCY CHECK

Before starting this task [`TASK_NUMBER`], check `TO-DO.md` for dependencies. Then:

1. Verify all prerequisite tasks are complete
2. Confirm our implementation aligns with dependent tasks
3. Check if any shared interfaces or data structures need coordination with your teammate
4. Flag any potential conflicts with work in progress

Only proceed when dependencies are satisfied and coordination is clear.


### CONTEXT RESET

    Now we will reset the context window, before we do so:

    1. Create/update a `HISTORY.md` file summarizing our progress
    2. List completed tasks with key implementation details
    3. Note any important decisions or patterns established
    4. Mention any deviations from original specs and why
    5. Save current state of key variables/configurations
    6. If applicable, update `CLAUDE.md` with any learned standards picked up from the review process
    7. If there have been significant changes, update `FUNCTIONAL.md` or `ARCHITECTURE.md` as required
    8. Update TO-DO.md with any changes to what has been completed and show completed items with ticks
    9. **IMPORTANT**: Be concise, don't repeat yourself, double check and remove duplication/reduce where possible

    DO NOT CREATE ANY NEW .md FILES FOR DOCUMENTATION - UPDATE THE EXISTING .md FILES.
    After creating/updating these files, I'll reset the context window and we'll continue with a fresh session.





LATEST


Reset and start testing again:

confirm agent design of back end is correct and all LangGraph
confirm database structure
get the functional flow through teh agent design
start integrating to the front end 
clean up!!!!