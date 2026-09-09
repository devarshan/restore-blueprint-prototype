interface RestoreLogoProps {
  className?: string;
  variant?: 'dark' | 'light';
}

const LOGO_SOURCES: Record<'dark' | 'light', string> = {
  dark: '/static/images/restore-wordmark-dark.png',
  light: '/static/images/restore-wordmark-light.png',
};

export function RestoreLogo({ className = '', variant = 'dark' }: RestoreLogoProps) {
  const primarySrc = LOGO_SOURCES[variant];
  const alternateSrc = LOGO_SOURCES[variant === 'dark' ? 'light' : 'dark'];
  const hasSize = /(?:^|\s)(?:h-|max-h-|size-|w-|survey-brand|admin-rail-logo|admin-login-logo)/.test(className);

  return (
    <img
      src={primarySrc}
      alt="Restore"
      className={`block object-contain object-left ${hasSize ? '' : 'h-8 max-h-8 w-auto'} ${className}`.trim()}
      onError={(event) => {
        const img = event.currentTarget;
        if (img.src.endsWith(primarySrc)) {
          img.src = alternateSrc;
        }
      }}
    />
  );
}
