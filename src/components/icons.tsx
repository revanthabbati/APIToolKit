interface IconProps {
  className?: string
}

export function LogoIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" />
    </svg>
  )
}

export function BoltIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11.983 1.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 2.75 12h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 17.25 8h-6.572l1.305-6.093Z" />
    </svg>
  )
}

export function StackIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3.196 12.87 9.469 16.11a1.164 1.164 0 0 0 1.062 0l6.273-3.24.92.475a.75.75 0 0 1 0 1.33l-7.193 3.72a1.164 1.164 0 0 1-1.062 0l-7.193-3.72a.75.75 0 0 1 0-1.33l.92-.476Z" />
      <path d="M3.196 8.87 9.469 12.11a1.164 1.164 0 0 0 1.062 0l6.273-3.24.92.475a.75.75 0 0 1 0 1.33l-7.193 3.72a1.164 1.164 0 0 1-1.062 0l-7.193-3.72a.75.75 0 0 1 0-1.33l.92-.476Z" />
      <path d="M10.531 1.115a1.164 1.164 0 0 0-1.062 0L2.276 4.835a.75.75 0 0 0 0 1.33l7.193 3.72a1.164 1.164 0 0 0 1.062 0l7.193-3.72a.75.75 0 0 0 0-1.33l-7.193-3.72Z" />
    </svg>
  )
}

export function BoxIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
      <path
        fillRule="evenodd"
        d="M2 7.5h16l-.811 7.71a2 2 0 0 1-1.99 1.79H4.802a2 2 0 0 1-1.99-1.79L2 7.5ZM7 11a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function GlobeIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-1.5-2.08A6.502 6.502 0 0 1 3.578 11H6.03c.13 1.78.58 3.4 1.257 4.62.38.68.79 1.12 1.212 1.3Zm1.5.08c-.384 0-.98-.35-1.519-1.32-.53-.95-.927-2.33-1.05-3.68h5.138c-.123 1.35-.52 2.73-1.05 3.68-.54.97-1.135 1.32-1.519 1.32Zm2.713-.38c.677-1.22 1.127-2.84 1.257-4.62h2.452a6.502 6.502 0 0 1-4.922 4.92c.422-.18.832-.62 1.213-1.3ZM13.97 9.5h2.452a6.502 6.502 0 0 0-4.922-4.92c.422.18.832.62 1.213 1.3.676 1.22 1.126 2.84 1.257 4.62Zm-1.501 0H7.53c.123-1.35.52-2.73 1.05-3.68C9.12 4.85 9.616 4.5 10 4.5c.384 0 .98.35 1.519 1.32.53.95.927 2.33 1.05 3.68Zm-6.44 0H3.579a6.502 6.502 0 0 1 4.922-4.92c-.422.18-.832.62-1.213 1.3C6.61 7.1 6.16 8.72 6.03 9.5Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function InfoIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function GitHubIcon({ className = 'size-4' }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}
