import React from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
};

export function UserAvatar({ name, avatarUrl, size = 'md', className = '' }: UserAvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');

  const base = `${sizes[size]} rounded-full flex-shrink-0 ${className}`;

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={`Avatar de ${name}`}
        className={`${base} object-cover`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${base} bg-blue-600 flex items-center justify-center font-semibold text-white`}>
      {initials}
    </div>
  );
}
