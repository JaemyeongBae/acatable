# Basic Rules
- You are a senior coding expert.

## General Guidelines
- Make a step-by-step plan and work it out.
- At the top of the file, include its role and brief description.
- Please include comments when writing the code.
- Please write the variable name so that the meaning is clear.
- Please include the error handling.
- Put readability and maintenance first.

## Description
- Please add an explanation to the complex logic.
- Please briefly explain the purpose of the code and how it works.
- If you can, answer in Korean.

---
description: 
globs: 
alwaysApply: true
---
# 우리학원시간표 (Acatable) Architecture Rules

## 🏗️ PROJECT ARCHITECTURE OVERVIEW

This project follows a **Next.js 14 App Router** architecture with **TypeScript**, **Tailwind CSS**, and **Prisma ORM**. Every modification MUST respect the established patterns and directory structure.

### Core Architecture Components:
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM  
- **Database**: PostgreSQL with comprehensive relational schema
- **Authentication**: Role-based access control (OWNER, ADMIN, INSTRUCTOR, STUDENT)

---

## 📁 DIRECTORY STRUCTURE RULES

### NEVER reorganize existing directory structure. Always follow:

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Backend API routes
│   ├── admin/             # Admin-only pages
│   └── [role]/            # Role-based page routing
├── components/            # Reusable React components
│   ├── layout/           # Layout components
│   ├── schedule/         # Schedule-specific components
│   └── ui/               # Basic UI components
├── lib/                  # Utility libraries
│   ├── api/              # API helpers
│   ├── utils/            # General utilities
│   └── validation/       # Schema validation
└── types/                # TypeScript type definitions
```

### Rule: Component Organization
- **UI Components** → `src/components/ui/` (Button, Card, Modal, etc.)
- **Feature Components** → `src/components/[feature]/` (schedule, auth, etc.)
- **Layout Components** → `src/components/layout/` (Header, Sidebar, etc.)
- **Page Components** → `src/app/[route]/page.tsx`

---

## 🎯 API ARCHITECTURE PATTERNS

### MANDATORY API Route Structure
**ALWAYS follow the established RESTful API pattern:**

```typescript
// Route: /api/[resource]/route.ts
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication/Authorization check
    // 2. Input validation using Zod schemas
    // 3. Database operation with Prisma
    // 4. Return standardized response using lib/api/response.ts
  } catch (error) {
    return errorResponse(error.message, 500)
  }
}
```

### Rule: API Response Consistency
**ALWAYS use the established response helpers:**
```typescript
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'

// ✅ CORRECT: Use standardized responses
return successResponse(data, 'Operation successful')
return errorResponse('Error message', 400)
return validationErrorResponse(['Field is required'])

// ❌ WRONG: Direct Response objects
return new Response(JSON.stringify(data))
```

### Rule: Database Operations
**ALWAYS use the established Prisma patterns:**
```typescript
import { prisma } from '@/lib/prisma'

// ✅ CORRECT: Use existing prisma instance
const schedules = await prisma.schedule.findMany({
  where: { academyId, isActive: true },
  include: { subject: true, instructor: true, classroom: true }
})

// ❌ WRONG: Creating new PrismaClient instances
const newPrisma = new PrismaClient()
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION PATTERNS

### Rule: Role-Based Access Control
**ALWAYS implement consistent role checking:**
```typescript
// Existing pattern - follow this structure
const userRole = await getUserRole(userId, academyId)
if (!['OWNER', 'ADMIN'].includes(userRole)) {
  return errorResponse('Insufficient permissions', 403)
}
```

### Rule: Academy Data Isolation
**ALWAYS filter data by academy context:**
```typescript
// ✅ CORRECT: Academy-scoped queries
const schedules = await prisma.schedule.findMany({
  where: { 
    academyId: userAcademyId, // ALWAYS include academy filter
    isActive: true 
  }
})

// ❌ WRONG: Global queries without academy scope
const schedules = await prisma.schedule.findMany()
```

---

## 🎨 COMPONENT ARCHITECTURE PATTERNS

### Rule: Component Composition Pattern
**Follow the established component hierarchy:**
```typescript
// ✅ CORRECT: Composition pattern
function SchedulePage() {
  return (
    <PageLayout>
      <ScheduleFilters />
      <ScheduleGrid>
        <ScheduleItem />
      </ScheduleGrid>
    </PageLayout>
  )
}

// ❌ WRONG: Monolithic components
function SchedulePage() {
  // 500+ lines of mixed concerns
}
```

### Rule: Props Interface Consistency
**ALWAYS define explicit TypeScript interfaces:**
```typescript
// ✅ CORRECT: Explicit interface definitions
interface ScheduleItemProps {
  schedule: Schedule
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  readonly?: boolean
}

// ❌ WRONG: Inline or any types
function ScheduleItem(props: any) { ... }
```

### Rule: State Management Pattern
**Follow established state patterns:**
```typescript
// ✅ CORRECT: Consistent state structure
const [schedules, setSchedules] = useState<Schedule[]>([])
const [loading, setLoading] = useState<boolean>(true)
const [error, setError] = useState<string | null>(null)

// ✅ CORRECT: Error handling pattern
useEffect(() => {
  let isMounted = true
  
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getSchedules()
      if (isMounted) setSchedules(data)
    } catch (err) {
      if (isMounted) setError(err.message)
    } finally {
      if (isMounted) setLoading(false)
    }
  }
  
  fetchData()
  return () => { isMounted = false }
}, [academyId])
```

---

## 🔧 VALIDATION & ERROR HANDLING PATTERNS

### Rule: Zod Schema Consistency
**ALWAYS use established validation schemas from `/lib/validation/schemas.ts`:**
```typescript
import { scheduleSchema, timeFormatSchema } from '@/lib/validation/schemas'

// ✅ CORRECT: Use existing schemas
const validatedData = scheduleSchema.parse(requestData)

// ❌ WRONG: Inline validation
if (!requestData.title || requestData.title.length < 1) { ... }
```

### Rule: Conflict Detection Pattern
**ALWAYS use the established conflict detection utility:**
```typescript
import { checkScheduleConflicts } from '@/lib/utils/schedule-conflict'

// ✅ CORRECT: Use existing conflict checker
const conflicts = await checkScheduleConflicts(scheduleData, academyId)
if (conflicts.length > 0) {
  return validationErrorResponse(conflicts)
}
```

---

## 🎨 STYLING & UI PATTERNS

### Rule: Tailwind CSS Consistency
**Follow established Tailwind patterns:**
```typescript
// ✅ CORRECT: Use established component styles
<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">

// ✅ CORRECT: Responsive design patterns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ WRONG: Custom CSS or inline styles
<div style={{ backgroundColor: 'white', padding: '24px' }}>
```

### Rule: Component Styling Architecture
**ALWAYS use the established UI component library:**
```typescript
import { Button, Card } from '@/components/ui'

// ✅ CORRECT: Use existing UI components
<Button variant="primary" size="md" onClick={handleSubmit}>
  저장
</Button>

// ❌ WRONG: Recreating existing components
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  저장
</button>
```

---

## 📊 DATA FLOW PATTERNS

### Rule: Schedule Management Data Flow
**ALWAYS follow the established data flow for schedule operations:**
```typescript
// 1. User Input → Validation
// 2. Validation → Conflict Check
// 3. Conflict Check → Database Transaction
// 4. Database → History Logging
// 5. Success → UI Update
// 6. Error → User Feedback
```

### Rule: Real-time Updates Pattern
**When implementing real-time features, follow the established WebSocket/polling pattern:**
```typescript
// ✅ CORRECT: Existing pattern for real-time updates
useEffect(() => {
  const interval = setInterval(async () => {
    const latest = await fetchLatestSchedules()
    setSchedules(latest)
  }, 30000) // 30 second polling
  
  return () => clearInterval(interval)
}, [academyId])
```

---

## 🚦 MIGRATION & SCHEMA PATTERNS

### Rule: Database Schema Evolution
**WHEN modifying Prisma schema, ALWAYS:**
1. Create migration with descriptive name
2. Update TypeScript types in `/src/types/`
3. Update validation schemas in `/lib/validation/`
4. Test with existing data

```prisma
// ✅ CORRECT: Additive changes with defaults
model Schedule {
  // ... existing fields ...
  newField String @default("default_value") // Safe addition
}

// ❌ WRONG: Breaking changes without migration strategy
model Schedule {
  // Removing required fields without migration
}
```

---

## 🎯 PERFORMANCE OPTIMIZATION PATTERNS

### Rule: Database Query Optimization
**ALWAYS include necessary relations in single queries:**
```typescript
// ✅ CORRECT: Optimized query with includes
const schedules = await prisma.schedule.findMany({
  where: { academyId, isActive: true },
  include: {
    subject: true,
    instructor: true,
    classroom: true,
    classType: true
  },
  orderBy: { createdAt: 'desc' }
})

// ❌ WRONG: N+1 query problem
const schedules = await prisma.schedule.findMany()
// Then fetching relations in loop
```

### Rule: Frontend Performance Patterns
**ALWAYS implement established loading and caching patterns:**
```typescript
// ✅ CORRECT: Use established patterns
import useSWR from 'swr'

const { data: schedules, error, mutate } = useSWR(
  `/api/schedules?academyId=${academyId}`,
  fetcher,
  { revalidateOnFocus: false }
)
```

---

## 🎯 TESTING & QUALITY PATTERNS

### Rule: Error Handling Standards
**ALWAYS implement comprehensive error boundaries:**
```typescript
// ✅ CORRECT: Comprehensive error handling
try {
  const result = await operation()
  return successResponse(result)
} catch (error) {
  console.error('Operation failed:', error)
  
  if (error instanceof ValidationError) {
    return validationErrorResponse(error.errors)
  }
  
  if (error instanceof AuthenticationError) {
    return errorResponse('Authentication required', 401)
  }
  
  return errorResponse('Internal server error', 500)
}
```

---

## 🎯 ARCHITECTURAL DECISION RECORDS

### When Adding New Features:
1. **Check existing patterns** in similar components/routes
2. **Follow established naming conventions** (camelCase for variables, PascalCase for components)
3. **Use existing utility functions** before creating new ones
4. **Maintain data consistency** with established database relationships
5. **Follow role-based access patterns** for any new endpoints

### When Fixing Bugs:
1. **Identify the architectural layer** where the bug exists (UI, API, Database)
2. **Use existing error handling patterns**
3. **Maintain existing function signatures** unless absolutely necessary
4. **Add logging using established patterns**

---

**CRITICAL REMINDER**: This project has established architectural patterns that work. Your job is to enhance and extend, NOT to rewrite or restructure. Every change should feel like a natural extension of the existing codebase.


---
description:
globs:
alwaysApply: true
---

## Core Directive
You are a senior software engineer AI assistant. For EVERY task request, you MUST follow the three-phase process below in exact order. Each phase must be completed with expert-level precision and detail.

## Guiding Principles
- **Minimalistic Approach**: Implement high-quality, clean solutions while avoiding unnecessary complexity
- **Expert-Level Standards**: Every output must meet professional software engineering standards
- **Concrete Results**: Provide specific, actionable details at each step

---

## Phase 1: Codebase Exploration & Analysis
**REQUIRED ACTIONS:**
1. **Systematic File Discovery**
   - List ALL potentially relevant files, directories, and modules
   - Search for related keywords, functions, classes, and patterns
   - Examine each identified file thoroughly

2. **Convention & Style Analysis**
   - Document coding conventions (naming, formatting, architecture patterns)
   - Identify existing code style guidelines
   - Note framework/library usage patterns
   - Catalog error handling approaches

**OUTPUT FORMAT:**
```
### Codebase Analysis Results
**Relevant Files Found:**
- [file_path]: [brief description of relevance]

**Code Conventions Identified:**
- Naming: [convention details]
- Architecture: [pattern details]
- Styling: [format details]

**Key Dependencies & Patterns:**
- [library/framework]: [usage pattern]
```

---

## Phase 2: Implementation Planning
**REQUIRED ACTIONS:**
Based on Phase 1 findings, create a detailed implementation roadmap.

**OUTPUT FORMAT:**
```markdown
## Implementation Plan

### Module: [Module Name]
**Summary:** [1-2 sentence description of what needs to be implemented]

**Tasks:**
- [ ] [Specific implementation task]
- [ ] [Specific implementation task]

**Acceptance Criteria:**
- [ ] [Measurable success criterion]
- [ ] [Measurable success criterion]
- [ ] [Performance/quality requirement]

### Module: [Next Module Name]
[Repeat structure above]
```

---

## Phase 3: Implementation Execution
**REQUIRED ACTIONS:**
1. Implement each module following the plan from Phase 2
2. Verify ALL acceptance criteria are met before proceeding
3. Ensure code adheres to conventions identified in Phase 1

**QUALITY GATES:**
- [ ] All acceptance criteria validated
- [ ] Code follows established conventions
- [ ] Minimalistic approach maintained
- [ ] Expert-level implementation standards met

---

## Success Validation
Before completing any task, confirm:
- ✅ All three phases completed sequentially
- ✅ Each phase output meets specified format requirements
- ✅ Implementation satisfies all acceptance criteria
- ✅ Code quality meets professional standards

## Response Structure
Always structure your response as:
1. **Phase 1 Results**: [Codebase analysis findings]
2. **Phase 2 Plan**: [Implementation roadmap]
3. **Phase 3 Implementation**: [Actual code with validation]