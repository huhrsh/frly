// Mirrors the existing backend policy. Unknown roles never enable writes.
export function getSectionPermissions(role) {
    return {
        canEditContent: ['OWNER', 'ADMIN', 'MEMBER'].includes(role),
        canManageSection: ['OWNER', 'ADMIN'].includes(role),
        canDeleteSection: role === 'OWNER',
    };
}
