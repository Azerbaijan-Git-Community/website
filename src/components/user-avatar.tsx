"use client";

import { Avatar, Dropdown } from "@heroui/react";
import { useRouter } from "next/navigation";
import { PiSignOutBold } from "react-icons/pi";
import { authClient } from "@/lib/auth-client";

type UserAvatarProps = {
  name: string | null;
  image: string | null;
};

export function UserAvatar({ name, image }: UserAvatarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return (
    <Dropdown>
      <Dropdown.Trigger aria-label="User menu">
        <Avatar
          size="lg"
          className="size-14 cursor-pointer rounded-full ring-2 ring-line transition-all hover:ring-blue"
        >
          <Avatar.Image className="rounded-full" src={image ?? undefined} alt={name ?? "User"} />
          <Avatar.Fallback delayMs={300}>{name?.[0]?.toUpperCase() ?? "U"}</Avatar.Fallback>
        </Avatar>
      </Dropdown.Trigger>

      <Dropdown.Popover placement="bottom">
        <Dropdown.Menu
          onAction={(key) => {
            if (key === "signout") handleSignOut();
          }}
        >
          {/*
           * No variant="danger" — that makes text permanently red which feels alarming.
           * Instead: muted (lo) text normally, red text + subtle red tint on hover.
           * Matches GitHub's own sign-out dropdown pattern.
           */}
          <Dropdown.Item
            id="signout"
            textValue="Sign out"
            className="text-lo data-[hovered=true]:bg-[rgba(248,81,73,0.08)] data-[hovered=true]:text-danger"
          >
            <PiSignOutBold />
            Sign out
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
