interface Member {
  email: string;
  role: 'owner' | 'member';
}

interface PlanMembersRowProps {
  members: Member[];
}

function getInitials(email: string): string {
  const local = email.split('@')[0] ?? '';
  return local.slice(0, 2).toUpperCase() || '??';
}

export default function PlanMembersRow({ members }: PlanMembersRowProps) {
  // Only render when there are at least 2 members (owner + at least one member)
  if (members.length < 2) return null;

  return (
    <div className="flex items-center gap-2" data-testid="plan-members-row">
      {members.map((member, index) => (
        <div
          key={`${member.role}-${index}`}
          className="flex flex-col items-center gap-1"
        >
          <div
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0"
            title={`${member.email || 'Unknown'} (${member.role === 'owner' ? 'Owner' : 'Member'})`}
          >
            {member.email ? getInitials(member.email) : '?'}
          </div>
          <span className="text-xs text-muted-foreground leading-none">
            {member.role === 'owner' ? 'Owner' : 'Member'}
          </span>
        </div>
      ))}
    </div>
  );
}
