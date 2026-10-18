"use client";

import { Dropdown } from "@heroui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PiSignOutBold } from "react-icons/pi";
import { authClient } from "@/lib/auth-client";
import { sizedGithubAvatar } from "@/lib/utils.client";

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
        <span className="relative flex size-14 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-surface font-semibold text-hi ring-2 ring-line transition-shadow hover:ring-blue">
          <span aria-hidden={image ? true : undefined}>{name?.[0]?.toUpperCase() ?? "U"}</span>
          {/* Server-rendered so a cached avatar paints before hydration; 2x of the 56px size */}
          {image && (
            <Image
              src={sizedGithubAvatar(image, 112)}
              alt={`${name ?? "User"} avatar`}
              width={56}
              height={56}
              className="absolute inset-0 size-full object-cover"
              unoptimized
              loading="eager"
            />
          )}
        </span>
      </Dropdown.Trigger>

      <Dropdown.Popover placement="bottom">
        <Dropdown.Menu
          onAction={async (key) => {
            if (key === "signout") await handleSignOut();
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
