# Admin & Coach Account Management Plan

## Current State

### ✅ What's Already Implemented

1. **Role System**
   - Three roles: `USER`, `COACH`, `ADMIN` (defined in Prisma schema)
   - Role enum in `packages/backend/src/common/types/enums.ts`
   - RolesGuard and @Roles decorator for route protection

2. **Challenge Creation**
   - **Backend**: Only COACH and ADMIN can create challenges
   - Enforced in `challenges.service.ts` (lines 19-21)
   - Currently uses service-level checks, not route guards

3. **Default Accounts** (from seed script)
   - Admin: `admin@fitnessearley.com` / `admin123`
   - Coach: `coach@fitnessearley.com` / `coach123`

4. **Exercise Management**
   - COACH and ADMIN can create/edit/delete exercises
   - Protected with `@Roles(Role.COACH, Role.ADMIN)` decorator

### ❌ What's Missing

1. **Admin User Management**
   - No endpoint to list all users
   - No endpoint to change user roles
   - No endpoint to delete/suspend users
   - No admin dashboard UI

2. **Challenge Creation UI**
   - Backend allows it, but no frontend interface
   - No role-based UI visibility (e.g., "Create Challenge" button only for coaches/admins)

3. **Coach Management Features**
   - No coach-specific dashboard
   - No analytics for challenges they created
   - No way to manage challenge participants

4. **Role Assignment**
   - No way for admins to promote users to coach/admin
   - No way to demote coaches/admins back to users

## Proposed Implementation

### Phase 1: Admin User Management (Backend)

#### 1.1 User Management Endpoints

Add to `packages/backend/src/users/users.controller.ts`:

```typescript
// List all users (admin only)
@Get()
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
async findAll(@Query() query: UserQueryDto) { ... }

// Update any user (admin only)
@Patch(':id')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
async updateUser(@Param('id') id: string, @Body() updateUserDto: AdminUpdateUserDto) { ... }

// Delete user (admin only)
@Delete(':id')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
async deleteUser(@Param('id') id: string) { ... }

// Change user role (admin only)
@Patch(':id/role')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
async changeUserRole(@Param('id') id: string, @Body() roleDto: ChangeRoleDto) { ... }
```

#### 1.2 DTOs to Create

- `packages/backend/src/users/dto/user-query.dto.ts` - Pagination, filtering
- `packages/backend/src/users/dto/admin-update-user.dto.ts` - Includes role field
- `packages/backend/src/users/dto/change-role.dto.ts` - Just role change

#### 1.3 Service Methods

Add to `packages/backend/src/users/users.service.ts`:

- `findAll(query)` - List users with pagination/filters
- `updateUserByAdmin(userId, updateData)` - Admin can update any user
- `changeRole(userId, newRole)` - Change user role (with validation)
- `deleteUser(userId)` - Soft delete user

### Phase 2: Challenge Creation UI

#### 2.1 Backend Updates

Already works! Just needs:
- Add `@Roles(Role.COACH, Role.ADMIN)` decorator to challenge creation endpoint for consistency

#### 2.2 Frontend Updates

- Add role check in ChallengeList page to show "Create Challenge" button
- Add role-based redirect/guard for challenge form

### Phase 3: Admin Dashboard (Frontend)

#### 3.1 Admin Dashboard Page

Create `packages/frontend/src/pages/Admin/AdminDashboard.tsx`:

- User management section
- System stats
- Recent activity
- Quick actions

#### 3.2 User Management Page

Create `packages/frontend/src/pages/Admin/UserManagement.tsx`:

- List all users (table)
- Filter by role
- Search by name/email
- Actions: Edit, Change Role, Delete

#### 3.3 Role Change Modal

Create `packages/frontend/src/components/Admin/RoleChangeModal.tsx`:

- Dropdown to select new role
- Confirmation message
- Success/error feedback

### Phase 4: Coach Dashboard (Frontend)

#### 4.1 Coach Dashboard Page

Create `packages/frontend/src/pages/Coach/CoachDashboard.tsx`:

- My challenges overview
- Challenge analytics
- Recent participant activity
- Quick create challenge button

### Phase 5: Role-Based UI Visibility

#### 5.1 Role Hooks

Create `packages/frontend/src/hooks/useRoles.ts`:

```typescript
export function useRoles() {
  const { user } = useAuth();
  
  return {
    isAdmin: user?.role === 'ADMIN',
    isCoach: user?.role === 'COACH' || user?.role === 'ADMIN',
    isUser: user?.role === 'USER',
  };
}
```

#### 5.2 Protected Routes

- `/admin/*` - Only accessible by ADMIN
- `/coach/*` - Only accessible by COACH or ADMIN

#### 5.3 Conditional UI Elements

- Navigation menu items based on role
- Action buttons (Create Challenge, Manage Users, etc.)
- Dashboard cards showing different content

## Implementation Priority

1. **High Priority** (Core functionality):
   - Admin endpoints for user management
   - Role change functionality
   - Challenge creation UI with role checks

2. **Medium Priority** (Better UX):
   - Admin dashboard
   - Coach dashboard
   - Role-based navigation

3. **Low Priority** (Nice to have):
   - Advanced analytics
   - Bulk user operations
   - User activity logs

## Security Considerations

1. **Role Changes**:
   - Only admins can change roles
   - Prevent removing last admin
   - Log all role changes for audit

2. **User Deletion**:
   - Soft delete only (use `deletedAt` field)
   - Prevent deleting your own account
   - Cascade deletes handled by Prisma

3. **Challenge Creation**:
   - Verify role at both route and service level
   - Allow coaches to edit their own challenges
   - Admins can edit any challenge

## Database Schema

Already supports everything needed:
- `User.role` field (enum: USER, COACH, ADMIN)
- `Challenge.coachId` links challenges to coach
- Soft deletes via `deletedAt` field

## Next Steps

1. **Immediate**: Implement admin user management endpoints
2. **Next**: Add role-based UI for challenge creation
3. **Then**: Build admin dashboard
4. **Finally**: Build coach dashboard

## Questions to Answer

1. Should coaches be able to see all users or just their challenge participants?
2. Can coaches edit challenges created by other coaches?
3. Should there be a "super admin" role or is ADMIN sufficient?
4. How should role changes be logged/audited?

