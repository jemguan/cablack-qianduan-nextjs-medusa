import { Button, Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="bg-muted/30 p-6 rounded-lg flex items-center justify-between border border-border">
      <div>
        <Heading level="h2" className="txt-xlarge text-foreground font-bold">
          Already have an account?
        </Heading>
        <Text className="txt-medium text-muted-foreground mt-2">
          Sign in for a better experience.
        </Text>
      </div>
      <div>
        <LocalizedClientLink href="/account">
          <Button variant="secondary" className="h-10 border-border bg-card text-foreground hover:bg-muted" data-testid="sign-in-button">
            Sign in
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
