interface LogoProps {
  className?: string;
  size?: number;
}

export function EmailLogo({ className = '', size = 120 }: LogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 0.75}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        margin: '0 auto',
        display: 'block',
      }}
    >
      <path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        fill="#2E8FFF"
      />
      <path
        d="M2 17L12 22L22 17"
        fill="#2472CC"
      />
      <path
        d="M2 12L12 17L22 12"
        fill="#1D4ED8"
      />
    </svg>
  );
}
