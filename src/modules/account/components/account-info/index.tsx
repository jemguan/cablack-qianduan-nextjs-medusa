import { Disclosure } from "@headlessui/react"
import { Badge, Button, clx } from "@medusajs/ui"
import { useEffect } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import { useFormStatus } from "react-dom"

type AccountInfoProps = {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  'data-testid'?: string
}

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage = "An error occurred, please try again",
  children,
  'data-testid': dataTestid
}: AccountInfoProps) => {
  const { state, close, toggle } = useToggleState()

  const { pending } = useFormStatus()

  const handleToggle = () => {
    clearState()
    setTimeout(() => toggle(), 100)
  }

  useEffect(() => {
    if (isSuccess) {
      close()
    }
  }, [isSuccess, close])

  return (
    <div className="text-small-regular text-foreground" data-testid={dataTestid}>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-y-1">
          <span className="uppercase text-xs text-muted-foreground font-medium">{label}</span>
          <div className="flex items-center flex-1 basis-0 justify-end gap-x-4">
            {typeof currentInfo === "string" ? (
              <span className="font-semibold text-foreground text-base" data-testid="current-info">{currentInfo}</span>
            ) : (
              currentInfo
            )}
          </div>
        </div>
        <div>
          <Button
            variant="secondary"
            className="w-[100px] min-h-[44px] py-1.5 bg-muted hover:bg-muted/80 text-foreground border-border hover:border-primary/50 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={handleToggle}
            type={state ? "reset" : "button"}
            data-testid="edit-button"
            data-active={state}
            aria-label={state ? `Cancel editing ${label.toLowerCase()}` : `Edit ${label.toLowerCase()}`}
          >
            {state ? "Cancel" : "Edit"}
          </Button>
        </div>
      </div>

      {/* Success state */}
      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": isSuccess,
              "max-h-0 opacity-0": !isSuccess,
            }
          )}
          data-testid="success-message"
        >
          <Badge className="p-2 my-4" color="green" role="status" aria-live="polite">
            <span>{label} updated succesfully</span>
          </Badge>
        </Disclosure.Panel>
      </Disclosure>

      {/* Error state  */}
      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": isError,
              "max-h-0 opacity-0": !isError,
            }
          )}
          data-testid="error-message"
        >
          <Badge className="p-2 my-4" color="red" role="alert" aria-live="assertive">
            <span>{errorMessage}</span>
          </Badge>
        </Disclosure.Panel>
      </Disclosure>

      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-all duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100 mt-4": state,
              "max-h-0 opacity-0 mt-0": !state,
            }
          )}
        >
          <div className="flex flex-col gap-y-4 py-4 border-t border-border/50 pt-4">
            <div>{children}</div>
            <div className="flex items-center justify-end gap-x-3">
              <Button
                variant="secondary"
                onClick={handleToggle}
                className="bg-muted hover:bg-muted/80 text-foreground border-border hover:border-primary/50 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
                type="button"
                aria-label={`Cancel editing ${label.toLowerCase()}`}
              >
                Cancel
              </Button>
              <Button
                isLoading={pending}
                className="min-w-[140px] min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                type="submit"
                data-testid="save-button"
                aria-label={`Save ${label.toLowerCase()} changes`}
              >
                Save changes
              </Button>
            </div>
          </div>
        </Disclosure.Panel>
      </Disclosure>
    </div>
  )
}

export default AccountInfo
