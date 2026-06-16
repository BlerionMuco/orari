import * as React from "react";
import { Button } from "@/components/ui/buttons/button";
import { GoogleIcon } from "@/components/ui/icons/google-icon";
import { AppleIcon } from "@/components/ui/icons/apple-icon";

export interface OAuthButtonsProps {
  onGoogle: () => void;
  onApple: () => void;
  disabled?: boolean;
}

export function OAuthButtons({
  onGoogle,
  onApple,
  disabled = false,
}: OAuthButtonsProps): React.JSX.Element {
  return (
    <div className="mb-[18px]">
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={onGoogle}
          disabled={disabled}
          className="gap-[9px] text-[14.5px]"
        >
          <GoogleIcon className="h-[17px] w-[17px]" />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onApple}
          disabled={disabled}
          className="text-[14.5px]"
        >
          <AppleIcon className="h-4 w-4" />
          Apple
        </Button>
      </div>
      <div className="mt-[18px] flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[12.5px] text-text-disabled">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
