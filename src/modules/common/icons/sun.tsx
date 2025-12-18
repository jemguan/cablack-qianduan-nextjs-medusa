import React from "react"

import { IconProps } from "types/icon"

const Sun: React.FC<IconProps> = ({
  size = "20",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M10 3.33334V1.66667M10 18.3333V16.6667M16.6667 10H18.3333M1.66667 10H3.33334M15.7733 4.22667L16.8333 3.16667M3.16667 16.8333L4.22667 15.7733M15.7733 15.7733L16.8333 16.8333M3.16667 3.16667L4.22667 4.22667M14.1667 10C14.1667 12.3012 12.3012 14.1667 10 14.1667C7.69881 14.1667 5.83334 12.3012 5.83334 10C5.83334 7.69881 7.69881 5.83334 10 5.83334C12.3012 5.83334 14.1667 7.69881 14.1667 10Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Sun

