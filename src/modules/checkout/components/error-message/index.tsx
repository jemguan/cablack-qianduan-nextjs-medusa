const ErrorMessage = ({ error, className, 'data-testid': dataTestid }: { error?: string | null, className?: string, 'data-testid'?: string }) => {
  if (!error) {
    return null
  }

  return (
    <div
      className={`pt-2 text-rose-500 text-small-regular flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${className || ''}`}
      data-testid={dataTestid}
      role="alert"
      aria-live="polite"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 20 20" 
        fill="currentColor" 
        className="w-4 h-4 mt-0.5 flex-shrink-0"
        aria-hidden="true"
      >
        <path 
          fillRule="evenodd" 
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
          clipRule="evenodd" 
        />
      </svg>
      <span>{error}</span>
    </div>
  )
}

export default ErrorMessage
