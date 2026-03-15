"use client";

import { Avatar, Dropdown, Label } from "@heroui/react";
import { useRouter } from "next/navigation";
import { PiSignOutBold } from "react-icons/pi";
import { authClient } from "@/lib/auth-client";

interface UserAvatarProps {
  name: string | null;
  image: string | null;
}

export function UserAvatar({ name, image }: UserAvatarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };
  return (
    <Dropdown>
      <Dropdown.Trigger className="rounded-full">
        <Avatar size="lg" className="cursor-pointer ring-2 ring-line transition-all hover:ring-blue">
          <Avatar.Image src={image ?? undefined} alt={name ?? "User"} />
          <Avatar.Fallback delayMs={300}>{name?.[0]?.toUpperCase() ?? "U"}</Avatar.Fallback>
        </Avatar>
      </Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu
          onAction={(key) => {
            console.log("Action key:", key);
            if (key === "signout") {
              handleSignOut();
            }
          }}
        >
          <Dropdown.Item id="signout" textValue="Sign out" variant="danger">
            <PiSignOutBold />
            <Label>Sign out</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
