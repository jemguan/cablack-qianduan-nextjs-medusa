import React from "react"
import { IconProps } from "types/icon"

const ChevronLeft: React.FC<IconProps> = ({
  size = "20",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...attributes}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export default ChevronLeft

