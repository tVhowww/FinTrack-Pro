import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

export function SocialAuth() {
  return (
    <div className="w-full">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Hoặc tiếp tục với
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" type="button">
          <Icons.google className="mr-2 h-4 w-4" /> Google
        </Button>
        <Button variant="outline" type="button">
          <Icons.facebook className="mr-2 h-4 w-4 text-blue-600" fill="currentColor" /> Facebook
        </Button>
      </div>
    </div>
  );
}